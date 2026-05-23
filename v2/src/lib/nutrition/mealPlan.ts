import type { Recipe, MealType } from '$lib/types';
import { MEAL_RATIOS } from './macros';

/**
 * Slots de comidas para un día.
 * Para un ectomorfo en volumen: 5-6 comidas distribuidas.
 */
export const DAILY_MEAL_SLOTS: { type: MealType; label: string; icon: string; suggestedTime: string }[] = [
  { type: 'breakfast',    label: 'Desayuno',     icon: '🌅', suggestedTime: '08:00' },
  { type: 'lunch',        label: 'Comida',       icon: '🍽️', suggestedTime: '14:00' },
  { type: 'pre_workout',  label: 'Pre-entreno',  icon: '⚡', suggestedTime: '17:30' },
  { type: 'post_workout', label: 'Post-entreno', icon: '💪', suggestedTime: '19:30' },
  { type: 'dinner',       label: 'Cena',         icon: '🌙', suggestedTime: '21:30' },
  { type: 'snack',        label: 'Snack noche',  icon: '🍪', suggestedTime: '23:00' }
];

/**
 * Sugiere una receta para cada slot, basándose en mealTypes.
 * Determinista por fecha → mismo día = misma sugerencia.
 * Próximos días pueden variar la selección dentro de las opciones disponibles.
 */
function seedFromDate(dateKey: string): number {
  // Hash simple
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = ((h << 5) - h) + dateKey.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function suggestRecipeForSlot(
  type: MealType,
  recipes: Recipe[],
  dateKey: string
): Recipe | undefined {
  const matches = recipes.filter(r => r.mealTypes.includes(type));
  if (matches.length === 0) return undefined;

  // 1) Aplicar plantilla semanal si existe para el día de la semana
  const d = new Date(dateKey);
  const dayOfWeek = (d.getDay() + 6) % 7; // L=0 D=6
  const templateRecipeId = WEEKLY_TEMPLATE[dayOfWeek]?.[type];
  if (templateRecipeId) {
    const fromTemplate = matches.find(r => r.id === templateRecipeId);
    if (fromTemplate) return fromTemplate;
  }

  // 2) Fallback: hash determinista de la fecha
  const seed = seedFromDate(dateKey + type);
  return matches[seed % matches.length];
}

/**
 * Plantilla semanal determinista por día de la semana (L-D).
 * Inspirada en el ejemplo del documento del consultor (~2800 kcal/día).
 * Si una receta no está disponible (por dieta/alergias) → la app cae al fallback.
 *
 * Estructura: [dayOfWeek][mealType] = recipeId
 */
const WEEKLY_TEMPLATE: { [dayOfWeek: number]: Partial<Record<MealType, string>> } = {
  // Lunes: día de pierna típico
  0: {
    breakfast: 'r_batido_mutante',
    lunch: 'r_chicken_rice_broccoli',
    post_workout: 'r_yogurt_almonds',
    dinner: 'r_salmon_sweet_potato'
  },
  // Martes
  1: {
    breakfast: 'r_scrambled_eggs_toast',
    lunch: 'r_beef_pasta',
    post_workout: 'r_shake_post',
    dinner: 'r_tuna_rice_avocado'
  },
  // Miércoles
  2: {
    breakfast: 'r_avena_hiper',
    lunch: 'r_chicken_rice_broccoli',
    pre_workout: 'r_banana_pb',
    dinner: 'r_salmon_sweet_potato'
  },
  // Jueves
  3: {
    breakfast: 'r_batido_mutante',
    lunch: 'r_beef_pasta',
    post_workout: 'r_shake_post',
    dinner: 'r_tuna_rice_avocado'
  },
  // Viernes
  4: {
    breakfast: 'r_scrambled_eggs_toast',
    lunch: 'r_chicken_rice_broccoli',
    pre_workout: 'r_banana_pb',
    dinner: 'r_salmon_sweet_potato'
  },
  // Sábado
  5: {
    breakfast: 'r_avena_hiper',
    lunch: 'r_pasta_bolo_carnaza',
    post_workout: 'r_yogurt_almonds',
    dinner: 'r_tuna_rice_avocado'
  },
  // Domingo
  6: {
    breakfast: 'r_avena_vegana',
    lunch: 'r_chicken_rice_broccoli',
    dinner: 'r_salmon_sweet_potato',
    snack: 'r_yogurt_almonds'
  }
};

export function targetKcalForSlot(type: MealType, totalKcal: number): number {
  return Math.round(totalKcal * MEAL_RATIOS[type]);
}
