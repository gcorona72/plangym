import type { PlannedExercise, Exercise, WorkoutSessionExercise } from '$lib/types';
import type { WeightSuggestion } from '$lib/training/weightSuggestion';
import type { SuggestionStrategy, SuggestionContext } from './SuggestionStrategy';
import { buildLastSummary } from './SuggestionStrategy';

/**
 * Estrategia para ejercicios de calistenia (sin peso adicional).
 *
 * La variable de progresión es el número de reps, no el peso.
 * Si el usuario domina el ejercicio en el top de reps con margen y existe
 * `progressionNextId` en el catálogo → se sugiere pasar a la siguiente variante.
 */
export class CalisthenicsSuggestionStrategy implements SuggestionStrategy {
  readonly id = 'calisthenics';

  suggest(
    exercise: Exercise,
    planned: PlannedExercise,
    lastEx: WorkoutSessionExercise,
    lastDate: string,
    _ctx?: SuggestionContext
  ): WeightSuggestion {
    const lastSummary = buildLastSummary(lastEx, lastDate);
    const sets = lastEx.sets;
    const RIRs = sets.map(s => s.rir).filter((r): r is number => r != null);
    const allTopReps = sets.every(s => s.reps >= planned.repsMax);
    const allWithMargin = RIRs.length === 0 || RIRs.every(r => r >= 1);
    const minReps = sets.length > 0 ? Math.min(...sets.map(s => s.reps)) : 0;

    if (allTopReps && allWithMargin && sets.length >= planned.sets) {
      if (exercise.progressionNextId) {
        return {
          status: 'progress_variant',
          weightKg: null,
          nextVariantId: exercise.progressionNextId,
          reasoning: '🎓 Dominado. Toca subir de nivel: pasa a la siguiente variante con menos reps.',
          lastSession: lastSummary
        };
      }
      return {
        status: 'add_reps',
        weightKg: null,
        reasoning: '🎯 Sube +1-2 reps en cada serie esta vez.',
        lastSession: lastSummary
      };
    }

    if (minReps < planned.repsMin) {
      return {
        status: 'suggest_down',
        weightKg: null,
        reasoning: '↓ No alcanzaste el rango bajo. Repite las mismas reps para consolidar.',
        lastSession: lastSummary
      };
    }

    return {
      status: 'maintain',
      weightKg: null,
      reasoning: '= Mismo rango de reps. Apunta a +1 rep en alguna serie.',
      lastSession: lastSummary
    };
  }
}
