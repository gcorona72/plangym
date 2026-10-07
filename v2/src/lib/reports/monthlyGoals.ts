import { db } from '$db/database';
import type { AppSettings, MonthlyGoals, StrengthGoal, ExperienceLevel, Exercise } from '$lib/types';
import { toDateKey, startOfMonth, endOfMonth, fromDateKey, startOfWeek, addDays } from '$lib/dateUtils';
import { classifyExercise } from '$lib/training/exerciseCategory';
import { getLoadSteps, roundLoad, stepFor } from '$lib/training/loadSteps';
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
 *   - Peso corporal: en volumen, ~+1,5% al mes (≈1 kg a 63 kg). Más rápido
 *     es sobre todo grasa; más lento, poco margen para construir músculo.
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

/** Ritmo mensual de peso corporal según objetivo (fracción del peso). */
const BODYWEIGHT_RATE: Record<string, number> = { gain: 0.015, maintain: 0, cut: -0.01 };

/** Último peso registrado (o el del perfil si no hay registros). */
async function latestBodyweight(beforeKey?: string): Promise<number | null> {
  const logs = await db.weightLogs.toArray();
  const valid = logs
    .filter(l => beforeKey == null || l.date < beforeKey)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (valid.length > 0) return valid[0].weightKg;
  return (await db.profile.get(1))?.weightKg ?? null;
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
  const [byId, profile, sessions, steps] = await Promise.all([
    getExercisesById(), db.profile.get(1), db.sessions.toArray(), getLoadSteps()
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
    // Pesos cargables con el equipo del gimnasio (p. ej. barra de 5 en 5)
    const start = roundLoad(ex, last.kg, steps);
    const target = Math.max(roundLoad(ex, start + inc, steps), start + stepFor(ex, steps));
    strength.push({ exerciseId: id, startKg: start, targetKg: target });
  }

  const bwStart = await latestBodyweight(monthStartKey);
  const rate = BODYWEIGHT_RATE[profile?.goal ?? 'maintain'] ?? 0;
  const bodyweight = bwStart != null
    ? { startKg: bwStart, targetKg: Math.round((bwStart * (1 + rate)) * 2) / 2 }
    : undefined;

  return {
    month,
    sessionsTarget: days.length,
    minCompliancePct: 85,
    musclesInRangeTarget: Math.max(1, await programMusclesInRange()),
    strength,
    bodyweight,
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

export interface BodyweightProgress {
  startKg: number;
  targetKg: number;
  /** Último pesaje del mes (null si no te has pesado este mes). */
  currentKg: number | null;
  /** Pesajes registrados en el mes. */
  weighIns: number;
  /** 0-100 hacia el objetivo. */
  pct: number;
  reached: boolean;
  message: string;
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
  bodyweight: BodyweightProgress | null;
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

  // ── Peso corporal ──
  let bodyweight: BodyweightProgress | null = null;
  if (goals.bodyweight) {
    const { startKg, targetKg } = goals.bodyweight;
    const logs = (await db.weightLogs.toArray())
      .filter(l => l.date >= monthStart && l.date <= monthEnd)
      .sort((a, b) => a.date.localeCompare(b.date));
    // Media de los 3 últimos pesajes: el peso oscila 1-2 kg por agua y comida
    const tail = logs.slice(-3);
    const currentKg = tail.length > 0
      ? Math.round((tail.reduce((a, l) => a + l.weightKg, 0) / tail.length) * 10) / 10
      : null;
    const span = targetKg - startKg;
    const moved = currentKg != null ? currentKg - startKg : 0;
    const pct = span === 0 ? 100 : Math.max(0, Math.min(100, Math.round((moved / span) * 100)));
    const reached = currentKg != null && (span >= 0 ? currentKg >= targetKg : currentKg <= targetKg);
    // La tendencia sólo es fiable con pesajes que abarquen ≥10 días
    const spanDays = logs.length >= 2
      ? Math.round((fromDateKey(logs[logs.length - 1].date).getTime() - fromDateKey(logs[0].date).getTime()) / 86_400_000)
      : 0;
    const message = currentKg == null
      ? 'Sin pesajes este mes. Pésate 2-3 veces por semana, en ayunas y tras ir al baño.'
      : reached
        ? `Objetivo alcanzado (${currentKg} kg). Mantén el ritmo, no lo aceleres.`
        : spanDays < 10
          ? `Vas en ${currentKg} kg. La tendencia se verá con 2 semanas de pesajes (el peso oscila 1-2 kg por agua).`
          : span > 0 && moved <= 0.2
            ? `Sigues en ${currentKg} kg tras ${spanDays} días: sin subir de peso no hay volumen. Toca comer más (un batido casero diario ya suma ~600-800 kcal).`
            : `Vas en ${currentKg} kg (media de tus últimos pesajes) de camino a ${targetKg} kg.`;
    bodyweight = { startKg, targetKg, currentKg, weighIns: logs.length, pct, reached, message };
  }

  const ratio = goals.sessionsTarget > 0 ? projectedSessions / goals.sessionsTarget : 1;
  let status: GoalStatus = ratio >= 0.9 ? 'on_track' : ratio >= 0.7 ? 'at_risk' : 'off_track';
  // Con menos de 3 sesiones de muestra el ritmo no es fiable: como mucho "vas justo"
  // si el objetivo aún es alcanzable.
  if (status === 'off_track' && sessionsDueSoFar < 3 && maxPossible >= goals.sessionsTarget) status = 'at_risk';
  const needed = Math.max(0, goals.sessionsTarget - sessionsDone);
  const closed = todayKey > monthEnd;
  const pct = Math.round(ratio * 100);
  const summary = closed
    ? status === 'on_track'
      ? `Mes cerrado: ${sessionsDone} de ${goals.sessionsTarget} sesiones (${pct}%). Objetivo cumplido.`
      : `Mes cerrado: ${sessionsDone} de ${goals.sessionsTarget} sesiones (${pct}%). ${status === 'at_risk' ? 'Te quedaste cerca' : 'Muy lejos del objetivo'}: el próximo mes, ni una sesión sin hacer o recuperar.`
    : status === 'on_track'
      ? `Vas en línea: al ritmo actual cerrarás el mes con ~${projectedSessions} de ${goals.sessionsTarget} sesiones.`
      : `${status === 'at_risk' ? 'Vas justo' : 'Vas por detrás'}: llevas ${sessionsDone} de ${sessionsDueSoFar} que tocaban. ` +
        (needed <= sessionsRemaining
          ? `Para llegar a ${goals.sessionsTarget} te faltan ${needed} de las ${sessionsRemaining} que quedan: no puedes fallar más de ${sessionsRemaining - needed}.`
          : `Ya no llegas a ${goals.sessionsTarget} (como mucho ${maxPossible}), pero cada sesión que hagas cuenta.`);

  return { goals, sessionsDone, sessionsDueSoFar, sessionsRemaining, projectedSessions, strength, bodyweight, status, summary };
}
