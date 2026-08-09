import { db } from '$db/database';
import type { MuscleGroup, WorkoutSession, Exercise } from '$lib/types';
import { toDateKey, startOfWeek, endOfWeek } from '$lib/dateUtils';

/**
 * VOLUMEN SEMANAL POR GRUPO MUSCULAR.
 *
 * La variable que más determina la hipertrofia (con la sobrecarga progresiva)
 * es el número de SERIES EFECTIVAS por músculo y semana. La literatura
 * (Schoenfeld, meta-análisis de volumen) sitúa el rango productivo en
 * ~10-20 series semanales por grupo muscular; por debajo de 10 el estímulo
 * es subóptimo, y por debajo de ~4 es prácticamente mantenimiento.
 *
 * Contamos:
 *  - 1 serie completa al músculo primario del ejercicio.
 *  - 0.5 series a los secundarios (aportan, pero menos que el primario).
 */

/** Rangos de referencia por músculo (series/semana). */
const TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest:      { min: 10, max: 20 },
  back:       { min: 10, max: 20 },
  shoulders:  { min: 10, max: 20 },
  biceps:     { min: 8,  max: 16 },
  triceps:    { min: 8,  max: 16 },
  quads:      { min: 10, max: 20 },
  hamstrings: { min: 8,  max: 16 },
  glutes:     { min: 8,  max: 16 },
  calves:     { min: 8,  max: 16 },
  core:       { min: 6,  max: 16 },
  forearms:   { min: 4,  max: 12 }
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', quads: 'Cuádriceps',
  hamstrings: 'Isquios', glutes: 'Glúteos', calves: 'Gemelos',
  core: 'Core', forearms: 'Antebrazos'
};

/** Músculos que mostramos (forearms suele entrenarse indirecto). */
export const TRACKED_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core'
];

export type VolumeStatus = 'none' | 'low' | 'optimal' | 'high';

export interface MuscleVolume {
  muscle: MuscleGroup;
  label: string;
  /** Series efectivas de la semana (primarias + 0.5 × secundarias). */
  sets: number;
  target: { min: number; max: number };
  status: VolumeStatus;
  /** % respecto al mínimo recomendado (para la barra de progreso). */
  pct: number;
}

export interface WeeklyVolumeReport {
  from: string;
  to: string;
  sessions: number;
  muscles: MuscleVolume[];
  /** Músculos por debajo del mínimo, ordenados por gravedad. */
  lagging: MuscleVolume[];
}

function statusFor(sets: number, min: number, max: number): VolumeStatus {
  if (sets <= 0) return 'none';
  if (sets < min) return 'low';
  if (sets > max) return 'high';
  return 'optimal';
}

/**
 * Calcula el volumen por músculo de las sesiones dadas.
 */
export function computeVolume(
  sessions: WorkoutSession[],
  exercisesById: Map<string, Exercise>
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const s of sessions) {
    for (const se of s.exercises) {
      const doneSets = se.sets?.length ?? 0;
      if (doneSets === 0 || se.skipped) continue;
      const ex = exercisesById.get(se.exerciseId);
      if (!ex) continue;
      for (const m of ex.primaryMuscles ?? []) {
        acc[m] = (acc[m] ?? 0) + doneSets;
      }
      for (const m of ex.secondaryMuscles ?? []) {
        acc[m] = (acc[m] ?? 0) + doneSets * 0.5;
      }
    }
  }
  return acc;
}

/**
 * Informe de volumen de una semana (por defecto, la actual).
 */
export async function getWeeklyVolume(reference: Date = new Date()): Promise<WeeklyVolumeReport> {
  const from = toDateKey(startOfWeek(reference));
  const to = toDateKey(endOfWeek(startOfWeek(reference)));

  const [sessions, allEx] = await Promise.all([
    db.sessions.where('date').between(from, to, true, true).toArray(),
    db.exercises.toArray()
  ]);
  const byId = new Map(allEx.map(e => [e.id, e]));
  const acc = computeVolume(sessions, byId);

  const muscles: MuscleVolume[] = TRACKED_MUSCLES.map(m => {
    const sets = Math.round((acc[m] ?? 0) * 10) / 10;
    const target = TARGETS[m];
    return {
      muscle: m,
      label: MUSCLE_LABELS[m],
      sets,
      target,
      status: statusFor(sets, target.min, target.max),
      pct: Math.min(100, Math.round((sets / target.min) * 100))
    };
  });

  const lagging = muscles
    .filter(v => v.status === 'none' || v.status === 'low')
    .sort((a, b) => a.pct - b.pct);

  return { from, to, sessions: sessions.length, muscles, lagging };
}
