import type { PlannedExercise, Exercise, WorkoutSessionExercise } from '$lib/types';
import type { WeightSuggestion, LastSessionSummary } from '$lib/training/weightSuggestion';

/**
 * Contrato del patrón Strategy para sugerencia de peso/reps.
 *
 * Cada modalidad (gym, calistenia) tiene su propia lógica. El contexto
 * (`suggestWeight`) elige la estrategia adecuada según `exercise.modality`.
 */
export interface SuggestionStrategy {
  /** Identificador único de la estrategia. */
  readonly id: string;

  /**
   * Construye la sugerencia a partir del último ejercicio realizado.
   * Si no hay historial, devolverá un estado `no_history`.
   */
  suggest(
    exercise: Exercise,
    planned: PlannedExercise,
    lastExercise: WorkoutSessionExercise,
    lastDate: string
  ): WeightSuggestion;
}

/** Helper compartido: construye un resumen de la última sesión. */
export function buildLastSummary(
  lastExercise: WorkoutSessionExercise,
  lastDate: string
): LastSessionSummary {
  const sets = lastExercise.sets;
  const weights = sets.map(s => s.weightKg ?? 0);
  const workingWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const maxReps = sets.length > 0 ? Math.max(...sets.map(s => s.reps)) : 0;
  const RIRs = sets.map(s => s.rir).filter((r): r is number => r != null);
  const minRIR = RIRs.length > 0 ? Math.min(...RIRs) : 0;
  return {
    date: lastDate,
    workingWeightKg: workingWeight > 0 ? workingWeight : null,
    maxReps,
    minRIR,
    setsDone: sets.length
  };
}
