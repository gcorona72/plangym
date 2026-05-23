import type { ExerciseModality } from '$lib/types';
import type { SuggestionStrategy } from './SuggestionStrategy';
import { GymSuggestionStrategy } from './GymSuggestionStrategy';
import { CalisthenicsSuggestionStrategy } from './CalisthenicsSuggestionStrategy';

/**
 * Registry / context del patrón Strategy.
 * Mapea la modalidad del ejercicio con la estrategia que sabe procesarla.
 */
const STRATEGIES = new Map<ExerciseModality, SuggestionStrategy>([
  ['gym', new GymSuggestionStrategy()],
  ['calisthenics', new CalisthenicsSuggestionStrategy()]
]);

export function getSuggestionStrategy(modality: ExerciseModality): SuggestionStrategy {
  return STRATEGIES.get(modality) ?? new GymSuggestionStrategy();
}
