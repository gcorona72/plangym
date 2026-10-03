import { db } from '$db/database';
import type { MuscleGroup, MissedReason, WorkoutSession } from '$lib/types';
import { toDateKey, startOfWeek, addDays, fromDateKey } from '$lib/dateUtils';
import {
  computeVolume, TRACKED_MUSCLES, MUSCLE_LABELS, TARGETS, statusFor, type VolumeStatus
} from '$lib/training/weeklyVolume';
import { MISSED_REASON_LABEL } from '$lib/training/sessionStatus';
import {
  getActiveProgram, getExercisesById, plannedDaysBetween, plannedSetsOf, plannedVolume,
  isTrained, setsLogged, latestWorkingWeight, workingWeightIn
} from './planning';
import { getOrCreateGoals, evaluateGoals, monthKeyOf, monthLabel, type GoalsProgress } from './monthlyGoals';

/**
 * INFORME SEMANAL — qué tocaba, qué se hizo y qué consecuencias tiene.
 *
 * Mide el cumplimiento en SERIES (no sólo en días): faltar un día y dejar
 * ejercicios a medias se suman en un único número honesto. Después traduce
 * los huecos a lo que significan para el músculo, con umbrales defendibles:
 *   - < ~4 series/semana → volumen de mantenimiento: no hay estímulo de
 *     crecimiento.
 *   - 4 a 10 → crece, pero más despacio que en el rango 10-20.
 * La comida queda fuera a propósito.
 */

/** Por debajo de esto, el músculo sólo mantiene. */
const MAINTENANCE_SETS = 4;

export type DayOutcome = 'done' | 'partial' | 'draft' | 'missed' | 'skipped' | 'upcoming';

export interface DayReport {
  date: string;
  dayName: string;
  outcome: DayOutcome;
  missedReason?: MissedReason;
  setsPlanned: number;
  setsDone: number;
  muscles: MuscleGroup[];
}

export interface IncompleteExercise {
  date: string;
  exerciseId: string;
  name: string;
  setsDone: number;
  setsPlanned: number;
  /** Estaba entre los dos últimos ejercicios de la sesión. */
  wasAtEnd: boolean;
}

export interface MuscleReport {
  muscle: MuscleGroup;
  label: string;
  sets: number;
  /** Lo que daba el programa en los días que ya tocaban. */
  planned: number;
  target: { min: number; max: number };
  status: VolumeStatus;
}

export interface LiftChange {
  exerciseId: string;
  name: string;
  previousKg: number;
  currentKg: number;
  deltaKg: number;
}

export type ConsequenceLevel = 'critical' | 'warning' | 'info' | 'good';

export interface Consequence {
  level: ConsequenceLevel;
  icon: string;
  title: string;
  detail: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  days: DayReport[];
  /** Días que ya tocaban (excluye los que aún no han llegado). */
  sessionsDue: number;
  sessionsDone: number;
  sessionsMissed: number;
  sessionsSkipped: number;
  setsPlanned: number;
  setsDone: number;
  /** % de series hechas sobre las programadas (null si aún no tocaba nada). */
  compliancePct: number | null;
  grade: { letter: 'A' | 'B' | 'C' | 'D' | 'F' | '–'; label: string; emoji: string };
  muscles: MuscleReport[];
  musclesInRange: number;
  incomplete: IncompleteExercise[];
  lifts: LiftChange[];
  consequences: Consequence[];
  month: GoalsProgress | null;
}

function gradeFor(pct: number | null): WeeklyReport['grade'] {
  if (pct == null) return { letter: '–', label: 'Semana sin empezar', emoji: '⏳' };
  if (pct >= 90) return { letter: 'A', label: 'Semana completa', emoji: '🔥' };
  if (pct >= 75) return { letter: 'B', label: 'Buena semana', emoji: '💪' };
  if (pct >= 50) return { letter: 'C', label: 'Semana a medias', emoji: '😐' };
  if (pct >= 25) return { letter: 'D', label: 'Semana floja', emoji: '⚠️' };
  return { letter: 'F', label: 'Semana perdida', emoji: '🛑' };
}

function fmtDay(key: string): string {
  return fromDateKey(key).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
}

function listLabels(muscles: MuscleGroup[]): string {
  const labels = [...new Set(muscles)].filter(m => TRACKED_MUSCLES.includes(m)).map(m => MUSCLE_LABELS[m]);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

function fmtSets(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

export async function buildWeeklyReport(
  reference: Date,
  opts: { includeMonth?: boolean } = {}
): Promise<WeeklyReport | null> {
  const program = await getActiveProgram();
  if (!program) return null;

  const monday = startOfWeek(reference);
  const weekStart = toDateKey(monday);
  const weekEnd = toDateKey(addDays(monday, 6));
  const todayKey = toDateKey(new Date());
  const isCurrentWeek = todayKey >= weekStart && todayKey <= weekEnd;

  const [byId, allSessions] = await Promise.all([getExercisesById(), db.sessions.toArray()]);
  const weekSessions = allSessions.filter(s => s.date >= weekStart && s.date <= weekEnd);
  const sessionOn = (key: string): WorkoutSession | undefined => weekSessions.find(s => s.date === key);

  // ── Día a día ──────────────────────────────────────────────────────────
  const planned = plannedDaysBetween(program, weekStart, weekEnd);
  const days: DayReport[] = planned.map(({ date, plan }) => {
    const s = sessionOn(date);
    const setsPlanned = plannedSetsOf(plan);
    const done = s && !s.missed ? Math.min(setsLogged(s), setsPlanned) : 0;
    let outcome: DayOutcome;
    if (s?.missed) outcome = 'missed';
    else if (s && s.finishedAt) outcome = done >= setsPlanned ? 'done' : 'partial';
    else if (s && done > 0) outcome = date < todayKey ? 'draft' : 'upcoming';
    else if (date >= todayKey) outcome = 'upcoming';
    else outcome = 'skipped';
    return {
      date, dayName: plan.name, outcome, missedReason: s?.missedReason,
      setsPlanned, setsDone: done, muscles: plan.primaryMuscles
    };
  });

  const due = days.filter(d => d.outcome !== 'upcoming');
  const dueKeys = new Set(due.map(d => d.date));
  const setsPlanned = due.reduce((a, d) => a + d.setsPlanned, 0);
  const setsDone = due.reduce((a, d) => a + d.setsDone, 0);
  const compliancePct = setsPlanned > 0 ? Math.round((setsDone / setsPlanned) * 100) : null;

  // ── Volumen por músculo: hecho vs lo que daba el programa ─────────────
  const trained = weekSessions.filter(s => !s.missed);
  const actual = computeVolume(trained, byId);
  const expected = plannedVolume(planned.filter(p => dueKeys.has(p.date)), byId);
  const muscles: MuscleReport[] = TRACKED_MUSCLES.map(m => {
    const sets = Math.round((actual[m] ?? 0) * 10) / 10;
    return {
      muscle: m,
      label: MUSCLE_LABELS[m],
      sets,
      planned: Math.round((expected[m] ?? 0) * 10) / 10,
      target: TARGETS[m],
      status: statusFor(sets, TARGETS[m].min, TARGETS[m].max)
    };
  });
  const musclesInRange = muscles.filter(m => m.status === 'optimal' || m.status === 'high').length;

  // ── Ejercicios a medias ───────────────────────────────────────────────
  const incomplete: IncompleteExercise[] = [];
  for (const { date, plan } of planned) {
    const s = sessionOn(date);
    if (!s || s.missed || !dueKeys.has(date) || setsLogged(s) === 0) continue;
    plan.gymExercises.forEach((p, idx) => {
      const logged = s.exercises.find(e => e.exerciseId === p.exerciseId);
      const doneSets = logged && !logged.skipped ? logged.sets.length : 0;
      if (doneSets < p.sets) {
        incomplete.push({
          date, exerciseId: p.exerciseId, name: byId.get(p.exerciseId)?.name ?? p.exerciseId,
          setsDone: doneSets, setsPlanned: p.sets, wasAtEnd: idx >= plan.gymExercises.length - 2
        });
      }
    });
  }

  // ── Cambios de carga respecto a la vez anterior ───────────────────────
  const lifts: LiftChange[] = [];
  const seen = new Set<string>();
  for (const s of trained.filter(isTrained).sort((a, b) => a.date.localeCompare(b.date))) {
    for (const e of s.exercises) {
      if (seen.has(e.exerciseId)) continue;
      const cur = workingWeightIn(s, e.exerciseId);
      if (cur == null) continue;
      seen.add(e.exerciseId);
      const best = Math.max(...trained.map(t => workingWeightIn(t, e.exerciseId) ?? 0));
      const prev = latestWorkingWeight(allSessions, e.exerciseId, weekStart);
      if (!prev) continue;
      lifts.push({
        exerciseId: e.exerciseId, name: byId.get(e.exerciseId)?.name ?? e.exerciseId,
        previousKg: prev.kg, currentKg: best, deltaKg: Math.round((best - prev.kg) * 10) / 10
      });
    }
  }
  lifts.sort((a, b) => b.deltaKg - a.deltaKg);

  const month = opts.includeMonth === false
    ? null
    : await (async () => {
        const goals = await getOrCreateGoals(monthKeyOf(addDays(monday, 3)));
        return goals ? evaluateGoals(goals) : null;
      })();

  // ── Consecuencias ─────────────────────────────────────────────────────
  const consequences: Consequence[] = [];
  const skipped = due.filter(d => d.outcome === 'skipped');
  const missed = due.filter(d => d.outcome === 'missed');
  const drafts = due.filter(d => d.outcome === 'draft');
  const healthMissed = missed.filter(d => d.missedReason === 'illness' || d.missedReason === 'injury');
  const otherMissed = missed.filter(d => !healthMissed.includes(d));

  const lostVolumePct = (ms: MuscleGroup[]) => {
    const tracked = [...new Set(ms)].filter(m => TRACKED_MUSCLES.includes(m));
    const plannedSum = tracked.reduce((a, m) => a + (expected[m] ?? 0), 0);
    const doneSum = tracked.reduce((a, m) => a + Math.min(actual[m] ?? 0, expected[m] ?? 0), 0);
    return plannedSum > 0 ? Math.round((1 - doneSum / plannedSum) * 100) : 0;
  };

  if (skipped.length > 0) {
    const ms = skipped.flatMap(d => d.muscles);
    consequences.push({
      level: skipped.length >= 2 ? 'critical' : 'warning',
      icon: '🚫',
      title: `${skipped.length} ${skipped.length === 1 ? 'sesión sin hacer ni justificar' : 'sesiones sin hacer ni justificar'}`,
      detail: `${skipped.map(d => `${fmtDay(d.date)} (${d.dayName})`).join(', ')}. ` +
        `Cada día de tu programa es la mitad del estímulo semanal de sus músculos (los entrenas 2 veces por semana): ` +
        `${listLabels(ms)} perdieron un ${lostVolumePct(ms)}% del volumen que tocaba.`
    });
  }
  if (otherMissed.length > 0) {
    const ms = otherMissed.flatMap(d => d.muscles);
    consequences.push({
      level: 'warning',
      icon: '📅',
      title: `${otherMissed.length} ${otherMissed.length === 1 ? 'ausencia' : 'ausencias'} (${[...new Set(otherMissed.map(d => MISSED_REASON_LABEL[d.missedReason!] ?? 'sin motivo'))].join(', ').toLowerCase()})`,
      detail: `Justificadas, pero el músculo no distingue motivos: ${listLabels(ms)} se quedaron con un ${lostVolumePct(ms)}% menos de estímulo. Si ese día no puedes, recupéralo otro día de la semana en lugar de saltarlo.`
    });
  }
  if (healthMissed.length > 0) {
    consequences.push({
      level: 'info',
      icon: '🤒',
      title: `${healthMissed.length} ${healthMissed.length === 1 ? 'día' : 'días'} de baja por salud`,
      detail: 'Prioridad: recuperarte. Al volver, la app te bajará la carga lo justo para no fallar series ni lesionarte.'
    });
  }
  if (drafts.length > 0) {
    consequences.push({
      level: 'warning',
      icon: '⏸',
      title: `${drafts.length} ${drafts.length === 1 ? 'sesión quedó' : 'sesiones quedaron'} sin finalizar`,
      detail: 'Las series registradas cuentan para el volumen, pero la sesión no consta como hecha. Ciérrala para que tu seguimiento sea fiable.'
    });
  }

  const noGrowth = muscles.filter(m => m.planned >= MAINTENANCE_SETS && m.sets < MAINTENANCE_SETS);
  if (noGrowth.length > 0) {
    consequences.push({
      level: 'critical',
      icon: '📉',
      title: `Sin estímulo de crecimiento: ${noGrowth.map(m => m.label).join(', ')}`,
      detail: `${noGrowth.map(m => `${m.label} ${fmtSets(m.sets)} series (tocaban ${fmtSets(m.planned)})`).join(' · ')}. ` +
        `Por debajo de ~${MAINTENANCE_SETS} series semanales un músculo sólo se mantiene: esta semana no ha tenido estímulo para crecer.`
    });
  }
  const slow = muscles.filter(m => m.sets >= MAINTENANCE_SETS && m.status === 'low' && m.planned > m.sets);
  if (slow.length > 0) {
    consequences.push({
      level: 'warning',
      icon: '🐢',
      title: `Crecimiento más lento: ${slow.map(m => m.label).join(', ')}`,
      detail: `Entre 4 y ${slow[0].target.min} series semanales el músculo crece, pero más despacio que en el rango 10-20 que da tu programa completo.`
    });
  }

  if (incomplete.length > 0) {
    const lost = incomplete.reduce((a, i) => a + (i.setsPlanned - i.setsDone), 0);
    const atEnd = incomplete.filter(i => i.wasAtEnd).length;
    consequences.push({
      level: lost >= 6 ? 'warning' : 'info',
      icon: '✂️',
      title: `${incomplete.length} ${incomplete.length === 1 ? 'ejercicio a medias' : 'ejercicios a medias'} (−${lost} series)`,
      detail: `${[...new Set(incomplete.map(i => i.name))].slice(0, 4).join(', ')}.` +
        (atEnd >= Math.ceil(incomplete.length / 2)
          ? ' Casi todos son los últimos de la sesión: si vas justo de tiempo, recorta descanso en los de aislamiento antes que saltártelos.'
          : '')
    });
  }

  const ups = lifts.filter(l => l.deltaKg > 0);
  const downs = lifts.filter(l => l.deltaKg < 0);
  if (ups.length > 0) {
    consequences.push({
      level: 'good',
      icon: '📈',
      title: `Subiste carga en ${ups.length} ${ups.length === 1 ? 'ejercicio' : 'ejercicios'}`,
      detail: ups.slice(0, 4).map(l => `${l.name} +${fmtSets(l.deltaKg)} kg`).join(' · ') + '. La sobrecarga progresiva es la señal de que estás ganando músculo.'
    });
  }
  if (downs.length > 0 && healthMissed.length === 0) {
    consequences.push({
      level: 'info',
      icon: '↘️',
      title: `Bajaste carga en ${downs.length} ${downs.length === 1 ? 'ejercicio' : 'ejercicios'}`,
      detail: downs.slice(0, 3).map(l => `${l.name} ${fmtSets(l.deltaKg)} kg`).join(' · ') + '. Normal tras un parón o un mal día; si se repite dos semanas, revisa sueño y descanso.'
    });
  }

  if (month) {
    consequences.push({
      level: month.status === 'on_track' ? 'good' : month.status === 'at_risk' ? 'warning' : 'critical',
      icon: '🎯',
      title: `Objetivo de ${monthLabel(month.goals.month).split(' ')[0].toLowerCase()}: ${month.sessionsDone} de ${month.goals.sessionsTarget} sesiones`,
      detail: month.summary
    });
  }

  if (compliancePct != null && compliancePct >= 90 && noGrowth.length === 0 && skipped.length === 0) {
    consequences.unshift({
      level: 'good',
      icon: '✅',
      title: 'Semana cumplida',
      detail: 'Hiciste lo que tocaba. Repetir semanas así es exactamente lo que construye músculo.'
    });
  }

  const order: Record<ConsequenceLevel, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  consequences.sort((a, b) => order[a.level] - order[b.level]);

  return {
    weekStart, weekEnd, isCurrentWeek, days,
    sessionsDue: due.length,
    sessionsDone: due.filter(d => d.outcome === 'done' || d.outcome === 'partial').length,
    sessionsMissed: missed.length,
    sessionsSkipped: skipped.length,
    setsPlanned, setsDone, compliancePct,
    grade: gradeFor(compliancePct),
    muscles, musclesInRange, incomplete, lifts, consequences, month
  };
}

// ─── Informe obligatorio de la semana pasada ────────────────────────────────

/** Lunes de la semana anterior a la actual. */
export function previousWeekStart(today: Date = new Date()): string {
  return toDateKey(addDays(startOfWeek(today), -7));
}

/**
 * Devuelve el informe de la semana pasada si el usuario aún no lo ha
 * confirmado. null si ya lo vio, si no hay programa, o si la cuenta es más
 * nueva que esa semana.
 */
export async function pendingWeeklyReport(): Promise<WeeklyReport | null> {
  const weekKey = previousWeekStart();
  const [settings, profile] = await Promise.all([db.settings.get(1), db.profile.get(1)]);
  if (!settings || !profile) return null;
  if (settings.lastWeeklyReportSeen && settings.lastWeeklyReportSeen >= weekKey) return null;

  const weekEndKey = toDateKey(addDays(fromDateKey(weekKey), 6));
  const createdDate = profile.createdAt ? new Date(profile.createdAt) : null;
  const created = createdDate && !isNaN(createdDate.getTime()) ? toDateKey(createdDate) : null;
  if (created && created > weekEndKey) return null; // cuenta posterior a esa semana

  const report = await buildWeeklyReport(fromDateKey(weekKey));
  if (!report || report.sessionsDue === 0) return null;
  return report;
}

export async function markWeeklyReportSeen(weekStart: string): Promise<void> {
  await db.settings.update(1, { lastWeeklyReportSeen: weekStart });
}
