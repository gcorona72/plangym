import type { Exercise, MuscleGroup } from '$lib/types';

/**
 * Genera URL para incrustar búsqueda de YouTube sin necesitar API key.
 * Usa el modo "search list" del player oficial de YouTube — toma los
 * primeros resultados y los reproduce.
 */
export function youtubeSearchEmbedUrl(exercise: Exercise): string {
  const query = `${exercise.name} técnica correcta tutorial`;
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&modestbranding=1&rel=0`;
}

/** Link directo a la búsqueda en YouTube. */
export function youtubeSearchLinkUrl(exercise: Exercise): string {
  const query = `${exercise.name} técnica`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quads: 'Cuádriceps',
  hamstrings: 'Isquios',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  core: 'Core',
  forearms: 'Antebrazos'
};
