import { writable } from 'svelte/store';
import type { Exercise } from '$lib/types';

/**
 * Cuando es no-null, ExerciseDetail se muestra como modal global.
 * Cualquier componente puede abrirlo con openExercise(ex).
 */
export const activeExercise = writable<Exercise | null>(null);

export function openExercise(ex: Exercise) {
  activeExercise.set(ex);
}

export function closeExercise() {
  activeExercise.set(null);
}
