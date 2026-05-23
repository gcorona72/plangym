import type { Exercise, GymEquipmentId } from '$lib/types';

/**
 * ¿Puede el usuario hacer este ejercicio con el equipamiento que tiene en su gym?
 */
export function canPerformExercise(exercise: Exercise, availableEquipment: GymEquipmentId[]): boolean {
  // Si no necesita equipamiento (calistenia básica) → siempre puede
  if (exercise.requiredEquipment.length === 0) return true;

  // Si tiene TODO el equipamiento requerido → puede
  const hasAllRequired = exercise.requiredEquipment.every(eq => availableEquipment.includes(eq));
  if (hasAllRequired) return true;

  // ¿Hay alguna combinación alternativa que cumpla?
  if (exercise.alternativeEquipment) {
    return exercise.alternativeEquipment.some(altCombo =>
      altCombo.every(eq => availableEquipment.includes(eq))
    );
  }

  return false;
}

/**
 * Filtra una lista de ejercicios según equipamiento disponible.
 */
export function filterByEquipment(
  exercises: Exercise[],
  availableEquipment: GymEquipmentId[]
): Exercise[] {
  return exercises.filter(ex => canPerformExercise(ex, availableEquipment));
}
