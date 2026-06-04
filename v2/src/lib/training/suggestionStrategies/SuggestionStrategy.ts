import type { PlannedExercise, Exercise, WorkoutSessionExercise, ExperienceLevel, UserPhase } from '$lib/types';
import type { WeightSuggestion, LastSessionSummary } from '$lib/training/weightSuggestion';

/**
 * Contexto opcional que el flujo principal (`suggestWeight`) calcula antes
 * de invocar a la estrategia. Sirve para que las estrategias puedan tomar
 * decisiones que dependen de cosas externas al "último set":
 *
 *  - `consecutiveFailures`: cuántas sesiones seguidas han quedado bajo el
 *    rango mínimo (para emitir mini-deload del ejercicio en el 2º fallo).
 *  - `isDeloadWeek`: semana de descarga programada (6 ó 12 del ciclo).
 *  - `experienceLevel`: principiante/intermedio/avanzado.
 *  - `phase`: fase del usuario (recomp/volume/cut), afecta la velocidad
 *    esperada de progresión.
 */
export interface SuggestionContext {
  consecutiveFailures?: number;
  isDeloadWeek?: boolean;
  experienceLevel?: ExperienceLevel;
  phase?: UserPhase;
}

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
    lastDate: string,
    ctx?: SuggestionContext
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
    setsDone: sets.length,
    // Detalle real serie por serie, en el orden en que se ejecutaron
    sets: [...sets]
      .sort((a, b) => a.setNumber - b.setNumber)
      .map(s => ({
        weightKg: s.weightKg ?? null,
        reps: s.reps,
        rir: s.rir ?? null
      }))
  };
}
