import type { Exercise } from '$lib/types';

/**
 * Helpers para obtener URLs de imágenes de ejercicios desde free-exercise-db.
 * Las imágenes son de dominio público (Unlicense) y se cargan directamente
 * desde el CDN de GitHub. Si en algún momento queremos auto-hospedarlas,
 * basta con cambiar la BASE_URL.
 */

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/**
 * Devuelve las 2 URLs (posición inicial + final) si el ejercicio tiene
 * `imageFolder` definido. Devuelve [] si no hay imagen disponible.
 */
export function getExerciseImageUrls(exercise: Exercise): string[] {
  if (!exercise.imageFolder) return [];
  return [
    `${BASE_URL}/${exercise.imageFolder}/0.jpg`,
    `${BASE_URL}/${exercise.imageFolder}/1.jpg`
  ];
}

/** Devuelve solo la primera imagen (para thumbnails compactos). */
export function getExerciseThumbnailUrl(exercise: Exercise): string | null {
  if (!exercise.imageFolder) return null;
  return `${BASE_URL}/${exercise.imageFolder}/0.jpg`;
}
