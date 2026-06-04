import { db } from '$db/database';
import type { WorkoutSet, PlannedExercise, Exercise } from '$lib/types';
import { getSuggestionStrategy } from './suggestionStrategies/SuggestionRegistry';
import type { SuggestionContext } from './suggestionStrategies/SuggestionStrategy';
import { detectConsecutiveFailures } from './suggestionStrategies/GymSuggestionStrategy';
import { computeCycleStatus } from './cycle';

/**
 * Sobrecarga progresiva para ectomorfos.
 *
 * GIMNASIO:
 * - Si en la última sesión completaste TODAS las series en el top del rango
 *   con RIR≥1 → sugiere +2.5% a +5% de carga.
 * - Si en la última sesión RIR=0 en cualquier serie (fallo CNS) → NO subir.
 *   Mantener peso para evitar fatiga del sistema nervioso central.
 * - Si no completaste el mínimo de reps → -2.5kg.
 * - Si estás en el rango pero sin margen → mantener.
 *
 * CALISTENIA:
 * - La variable es REPS, no peso.
 * - Si dominaste 4 series en el TOP del rango con RIR≥1 y el ejercicio
 *   tiene `progressionNextId` → sugiere pasar al siguiente nivel del
 *   diccionario, reseteado al rango inferior.
 * - Si no hay progresión definida → sugiere subir +1-2 reps.
 */

export type SuggestionStatus =
  | 'no_history'
  | 'suggest_up'
  | 'suggest_down'
  | 'maintain'
  | 'cns_fatigue'        // último RIR=0 → no subir peso
  | 'progress_variant'   // calistenia: pasa a siguiente variante
  | 'add_reps';          // calistenia: +reps sin cambiar variante

/** Detalle de una serie individual de la última sesión. */
export interface LastSetDetail {
  weightKg: number | null;
  reps: number;
  rir: number | null;
}

export interface LastSessionSummary {
  date: string;
  workingWeightKg: number | null;
  maxReps: number;
  minRIR: number; // peor caso (más cerca del fallo)
  setsDone: number;
  /** Detalle serie por serie (peso × reps × RIR), en orden de ejecución. */
  sets: LastSetDetail[];
}

export interface WeightSuggestion {
  status: SuggestionStatus;
  weightKg: number | null;
  /** Para calistenia: id del siguiente ejercicio sugerido. */
  nextVariantId?: string;
  /** Mensaje legible para mostrar al usuario. */
  reasoning: string;
  lastSession?: LastSessionSummary;
}

const NO_HISTORY: WeightSuggestion = {
  status: 'no_history',
  weightKg: null,
  reasoning: 'Sin historial previo. Introduce el peso o las reps manualmente.'
};

/**
 * Punto de entrada — delega en la estrategia correspondiente (Strategy pattern).
 *
 * 1. Carga el ejercicio
 * 2. Busca la última sesión con ese ejercicio
 * 3. Selecciona la estrategia según `exercise.modality`
 * 4. Devuelve la sugerencia
 */
export async function suggestWeight(
  exerciseId: string,
  planned: PlannedExercise,
  exercise?: Exercise
): Promise<WeightSuggestion> {
  const ex = exercise ?? (await db.exercises.get(exerciseId)) ?? undefined;
  if (!ex) return NO_HISTORY;

  // Buscar última sesión con este ejercicio (no skipped, con series registradas)
  const sessions = await db.sessions
    .orderBy('date')
    .reverse()
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0))
    .limit(1)
    .toArray();

  if (sessions.length === 0) return NO_HISTORY;

  const lastSession = sessions[0];
  const lastEx = lastSession.exercises.find(e => e.exerciseId === exerciseId);
  if (!lastEx || lastEx.sets.length === 0) return NO_HISTORY;

  // Construir contexto: failures consecutivos + estado del ciclo + perfil
  const [failures, profile] = await Promise.all([
    ex.modality === 'gym' ? detectConsecutiveFailures(exerciseId, planned) : Promise.resolve({ count: 0, message: '' }),
    db.profile.get(1)
  ]);
  const cycle = computeCycleStatus(profile?.cycleStartDate);
  const ctx: SuggestionContext = {
    consecutiveFailures: failures.count,
    isDeloadWeek: cycle.isDeloadWeek,
    experienceLevel: profile?.experienceLevel,
    phase: profile?.userPhase
  };

  const strategy = getSuggestionStrategy(ex.modality);
  return strategy.suggest(ex, planned, lastEx, lastSession.date, ctx);
}
