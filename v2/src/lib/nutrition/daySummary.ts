import type { DailyGoals, TrainingDay } from '$lib/types';

export interface NutritionDaySummary {
  /** Título corto: "Día alto en carbos", "Carbohidratos altos", "Día de descanso"... */
  title: string;
  emoji: string;
  pitch: string;
  /** Porcentaje aproximado de carbohidratos sobre el total. */
  carbsPct: number;
}

/**
 * Genera un resumen amigable del día nutricional.
 * Si hay entreno: carbs altos (volumen + reposición).
 * Si es descanso: mantener proteína, carbs algo más bajos.
 */
export function summarizeNutritionDay(
  goals: DailyGoals,
  trainingDay: TrainingDay | null
): NutritionDaySummary {
  const carbsKcal = goals.targetCarbsG * 4;
  const carbsPct = Math.round((carbsKcal / goals.targetKcal) * 100);

  const isRest = !trainingDay || trainingDay.isRestDay;
  const hasLeg = trainingDay?.primaryMuscles.some(m => ['quads', 'hamstrings', 'glutes'].includes(m));

  if (isRest) {
    return {
      title: 'Día de descanso',
      emoji: '🥗',
      pitch: `Hoy no entrenas. Mantén la proteína alta (${goals.targetProteinG}g) para recuperar.`,
      carbsPct
    };
  }

  if (hasLeg) {
    return {
      title: 'Día de pierna',
      emoji: '🍝',
      pitch: `Entreno duro de piernas. Carga de carbohidratos (${goals.targetCarbsG}g) para tener energía y recuperar.`,
      carbsPct
    };
  }

  return {
    title: 'Día de entreno',
    emoji: '💪',
    pitch: `Tras entrenar, reparte ${goals.targetProteinG}g de proteína en 4-5 tomas y aprovecha ~${goals.targetCarbsG}g de carbos para reponer glucógeno.`,
    carbsPct
  };
}
