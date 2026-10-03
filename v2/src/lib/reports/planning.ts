import { db } from '$db/database';
import type { TrainingProgram, TrainingDay, WorkoutSession, Exercise } from '$lib/types';
import { toDateKey, fromDateKey, dateRange, isoDayOfWeek } from '$lib/dateUtils';
import { computeVolume } from '$lib/training/weeklyVolume';

/**
 * Helpers compartidos por el informe semanal y los objetivos del mes:
 * qué estaba programado, qué volumen daría cumplirlo y qué pesos se movieron.
 */

export async function getActiveProgram(): Promise<TrainingProgram | null> {
  return (await db.programs.filter(p => p.active).first()) ?? null;
}

export async function getExercisesById(): Promise<Map<string, Exercise>> {
  const all = await db.exercises.toArray();
  return new Map(all.map(e => [e.id, e]));
}

export interface PlannedDay {
  date: string;
  plan: TrainingDay;
}

/** Días con entreno programado entre dos fechas (ambas inclusive). */
export function plannedDaysBetween(program: TrainingProgram, fromKey: string, toKey: string): PlannedDay[] {
  if (toKey < fromKey) return [];
  return dateRange(fromDateKey(fromKey), fromDateKey(toKey))
    .map(d => ({ date: toDateKey(d), plan: program.days[isoDayOfWeek(d)] }))
    .filter(x => x.plan && !x.plan.isRestDay);
}

export function plannedSetsOf(plan: TrainingDay): number {
  return plan.gymExercises.reduce((a, p) => a + p.sets, 0);
}

/** Volumen por músculo que daría cumplir esos días al 100%. */
export function plannedVolume(days: PlannedDay[], exercisesById: Map<string, Exercise>): Record<string, number> {
  const asSessions: WorkoutSession[] = days.map(d => ({
    id: `plan_${d.date}`,
    date: d.date,
    startedAt: '',
    finishedAt: d.date,
    programId: '',
    dayId: d.plan.id,
    modality: 'gym',
    exercises: d.plan.gymExercises.map(p => ({
      exerciseId: p.exerciseId,
      skipped: false,
      sets: Array.from({ length: p.sets }, (_, i) => ({ setNumber: i + 1, reps: p.repsMin, completedAt: '' }))
    }))
  }));
  return computeVolume(asSessions, exercisesById);
}

/** Sesión que cuenta como entreno hecho (cerrada y no marcada como ausencia). */
export function isTrained(s: WorkoutSession): boolean {
  return !!s.finishedAt && !s.missed;
}

export function setsLogged(s: WorkoutSession): number {
  return s.exercises.reduce((a, e) => a + (e.skipped ? 0 : e.sets.length), 0);
}

/** Mayor peso registrado para un ejercicio en una sesión (null si no lo hizo). */
export function workingWeightIn(s: WorkoutSession, exerciseId: string): number | null {
  const ex = s.exercises.find(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0);
  if (!ex) return null;
  const w = Math.max(...ex.sets.map(x => x.weightKg ?? 0));
  return w > 0 ? w : null;
}

/** Último peso de trabajo de un ejercicio en sesiones ANTERIORES a una fecha. */
export function latestWorkingWeight(
  sessions: WorkoutSession[],
  exerciseId: string,
  beforeKey?: string
): { kg: number; date: string } | null {
  const sorted = sessions
    .filter(s => !s.missed && (beforeKey == null || s.date < beforeKey))
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sorted) {
    const kg = workingWeightIn(s, exerciseId);
    if (kg != null) return { kg, date: s.date };
  }
  return null;
}
