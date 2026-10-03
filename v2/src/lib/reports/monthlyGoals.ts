import { db } from '$db/database';
import type { AppSettings, MonthlyGoals, StrengthGoal, ExperienceLevel, Exercise } from '$lib/types';
import { toDateKey, startOfMonth, endOfMonth, fromDateKey, startOfWeek, addDays } from '$lib/dateUtils';
import { classifyExercise } from '$lib/training/exerciseCategory';
import { TRACKED_MUSCLES, TARGETS, statusFor } from '$lib/training/weeklyVolume';
import {
  getActiveProgram, getExercisesById, plannedDaysBetween, plannedVolume,
  isTrained, latestWorkingWeight, workingWeightIn
} from './planning';

/**
 * OBJETIVOS DEL MES (sólo entrenamiento; la comida queda fuera a propósito).
 *
 * Al empezar cada mes la app propone objetivos derivados de tu programa y tu
 * historial — no números inventados:
 *   - Sesiones: las que tu programa tiene ese mes.
 *   - Cumplimiento semanal: ≥85% de las series programadas.
 *   - Músculos en rango: los que tu programa deja en 10-20 series si lo
 *     cumples entero (es decir, "haz tu programa" traducido a músculos).
 *   - Fuerza: tus 3 básicos principales, desde tu peso actual hasta lo que un
 *     principiante/intermedio/avanzado puede subir razonablemente en un mes.
 * Se pueden editar; al editarlos dejan de ser "auto".
 */

export function monthKeyOf(d: Date = new Date()): string {
  return toDateKey(d).slice(0, 7);
}

export function monthLabel(month: string): string {
  const d = fromDateKey(`${month}-01`);
  const s = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get(1);
}

/** Subida mensual razonable del peso de trabajo, por categoría y nivel. */
function monthlyIncrement(category: ReturnType<typeof classifyExercise>, level: ExperienceLevel | undefined): number {
  const lower = category === 'compound_lower';
  const upper = category === 'compound_upper';
  switch (level) {
    case 'advanced':     return lower ? 2.5 : upper ? 1 : 1;
    case 'intermediate': return lower ? 5 : upper ? 2.5 : 1;
    default:             return lower ? 10 : upper ? 5 : 2.5; // principiante
  }
}

function roundKg(ex: Exercise, kg: number): number {
  const barbell = (ex.requiredEquipment ?? []).includes('barbell');
  return barbell ? Math.round(kg / 2.5) * 2.5 : Math.round(kg * 2) / 2;
}

/** Músculos que quedarían en rango cumpliendo una semana completa del programa. */
export async function programMusclesInRange(): Promise<number> {
  const program = await getActiveProgram();
  if (!program) return 0;
  const byId = await getExercisesById();
  const monday = startOfWeek(new Date());
  const days = plannedDaysBetween(program, toDateKey(monday), toDateKey(addDays(monday, 6)));
  const vol = plannedVolume(days, byId);
  return TRACKED_MUSCLES.filter(m => {
    const st = statusFor(vol[m] ?? 0, TARGETS[m].min, TARGETS[m].max);
    return st === 'optimal' || st === 'high';
  }).length;
}

export async function proposeGoals(month: string): Promise<MonthlyGoals | null> {
  const program = await getActiveProgram();
  if (!program) return null;
  const [byId, profile, sessions] = await Promise.all([
    getExercisesById(), db.profile.get(1), db.sessions.toArray()
  ]);

  const first = fromDateKey(`${month}-01`);
  const days = plannedDaysBetween(program, toDateKey(startOfMonth(first)), toDateKey(endOfMonth(first)));

  // Básicos principales: el primer ejercicio de cada día de entreno, priorizando compuestos
  const mainLifts: string[] = [];
  for (const d of program.days) {
    if (d.isRestDay || d.gymExercises.length === 0) continue;
    const id = d.gymExercises[0].exerciseId;
    if (!mainLifts.includes(id)) mainLifts.push(id);
  }
  mainLifts.sort((a, b) => {
    const ca = byId.get(a), cb = byId.get(b);
    const score = (e?: Exercise) => e && classifyExercise(e).startsWith('compound') ? 0 : 1;
    return score(ca) - score(cb);
  });

  const monthStartKey = `${month}-01`;
  const strength: StrengthGoal[] = [];
  for (const id of mainLifts) {
    if (strength.length >= 3) break;
    const ex = byId.get(id);
    if (!ex) continue;
    // Peso de partida: el último registrado antes del mes (o en él, si es nuevo)
    const last = latestWorkingWeight(sessions, id, monthStartKey) ?? latestWorkingWeight(sessions, id);
    if (!last) continue;
    const inc = monthlyIncrement(classifyExercise(ex), profile?.experienceLevel);
    strength.push({ exerciseId: id, startKg: last.kg, targetKg: roundKg(ex, last.kg + inc) });
  }

  return {
    month,
    sessionsTarget: days.length,
    minCompliancePct: 85,
    musclesInRangeTarget: Math.max(1, await programMusclesInRange()),
    strength,
    createdAt: new Date().toISOString(),
    auto: true
  };
}

export async function getGoals(month: string): Promise<MonthlyGoals | null> {
  return (await getSettings())?.monthlyGoals?.[month] ?? null;
}

export async function saveGoals(goals: MonthlyGoals): Promise<void> {
  const settings = await getSettings();
  if (!settings) return;
  await db.settings.update(1, {
    monthlyGoals: { ...(settings.monthlyGoals ?? {}), [goals.month]: goals }
  });
}

/** Devuelve los objetivos del mes; si no existen, los propone y los guarda. */
export async function getOrCreateGoals(month: string = monthKeyOf()): Promise<MonthlyGoals | null> {
  const existing = await getGoals(month);
  if (existing) return existing;
  const proposed = await proposeGoals(month);
  if (proposed) await saveGoals(proposed);
  return proposed;
}

// ─── Evaluación ─────────────────────────────────────────────────────────────

export interface StrengthGoalProgress extends StrengthGoal {
  name: string;
  currentKg: number;
  /** 0-100 (puede ser 100 si ya se alcanzó). */
  pct: number;
  reached: boolean;
}

export type GoalStatus = 'on_track' | 'at_risk' | 'off_track';

export interface GoalsProgress {
  goals: MonthlyGoals;
  /** Sesiones completadas en el mes hasta hoy. */
  sessionsDone: number;
  /** Sesiones programadas hasta hoy (las que "ya tocaban"). */
  sessionsDueSoFar: number;
  /** Sesiones programadas que quedan en el mes. */
  sessionsRemaining: number;
  /** Proyección a fin de mes manteniendo tu ritmo actual. */
  projectedSessions: number;
  strength: StrengthGoalProgress[];
  status: GoalStatus;
  summary: string;
}

export async function evaluateGoals(goals: MonthlyGoals, today: Date = new Date()): Promise<GoalsProgress> {
  const program = await getActiveProgram();
  const [byId, sessions] = await Promise.all([getExercisesById(), db.sessions.toArray()]);
  const todayKey = toDateKey(today);
  const first = fromDateKey(`${goals.month}-01`);
  const monthStart = toDateKey(startOfMonth(first));
  const monthEnd = toDateKey(endOfMonth(first));

  const inMonth = sessions.filter(s => s.date >= monthStart && s.date <= monthEnd);
  const sessionsDone = inMonth.filter(isTrained).length;

  const doneToday = inMonth.some(s => s.date === todayKey && isTrained(s));
  const dueUntil = todayKey > monthEnd ? monthEnd : todayKey;
  const due = program ? plannedDaysBetween(program, monthStart, dueUntil) : [];
  // El día de hoy sólo "tocaba" si ya se ha hecho (si no, aún hay tiempo)
  const sessionsDueSoFar = due.filter(d => d.date < todayKey || (d.date === todayKey && doneToday)).length;
  const remainingFrom = todayKey > monthEnd ? null : (doneToday ? toDateKey(addDays(today, 1)) : todayKey);
  const sessionsRemaining = program && remainingFrom ? plannedDaysBetween(program, remainingFrom, monthEnd).length : 0;

  const rate = sessionsDueSoFar > 0 ? Math.min(1, sessionsDone / sessionsDueSoFar) : 1;
  const projectedSessions = Math.round(sessionsDone + sessionsRemaining * rate);
  const maxPossible = sessionsDone + sessionsRemaining;

  const strength: StrengthGoalProgress[] = goals.strength.map(g => {
    const best = inMonth
      .map(s => workingWeightIn(s, g.exerciseId))
      .filter((x): x is number => x != null);
    const currentKg = best.length > 0 ? Math.max(...best) : g.startKg;
    const span = g.targetKg - g.startKg;
    const pct = span <= 0 ? 100 : Math.max(0, Math.min(100, Math.round(((currentKg - g.startKg) / span) * 100)));
    return { ...g, name: byId.get(g.exerciseId)?.name ?? g.exerciseId, currentKg, pct, reached: currentKg >= g.targetKg };
  });

  const ratio = goals.sessionsTarget > 0 ? projectedSessions / goals.sessionsTarget : 1;
  const status: GoalStatus = ratio >= 0.9 ? 'on_track' : ratio >= 0.7 ? 'at_risk' : 'off_track';
  const closed = todayKey > monthEnd;
  const pct = Math.round(ratio * 100);
  const summary = closed
    ? status === 'on_track'
      ? `Mes cerrado: ${sessionsDone} de ${goals.sessionsTarget} sesiones (${pct}%). Objetivo cumplido.`
      : `Mes cerrado: ${sessionsDone} de ${goals.sessionsTarget} sesiones (${pct}%). ${status === 'at_risk' ? 'Te quedaste cerca' : 'Muy lejos del objetivo'}: el próximo mes, ni una sesión sin hacer o recuperar.`
    : status === 'on_track'
      ? `Vas en línea: al ritmo actual cerrarás el mes con ~${projectedSessions} de ${goals.sessionsTarget} sesiones.`
      : `${status === 'at_risk' ? 'Vas justo' : 'Vas por detrás'}: llevas ${sessionsDone} de ${sessionsDueSoFar} que tocaban. ` +
        `Al ritmo actual acabarías con ~${projectedSessions}; si no fallas ninguna más, llegas a ${maxPossible} de ${goals.sessionsTarget}.`;

  return { goals, sessionsDone, sessionsDueSoFar, sessionsRemaining, projectedSessions, strength, status, summary };
}
