import type { TrainingDay, MuscleGroup, PlannedExercise } from '$lib/types';
import { MUSCLE_LABELS } from './exerciseMedia';

/** Agrupa músculos para detectar si es día de tren superior / inferior / etc. */
const UPPER: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
const LOWER: MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves'];

export interface DaySummary {
  /** Título corto: "Tren superior", "Pierna", "Pecho y espalda"... */
  title: string;
  /** Emoji representativo del grupo principal. */
  emoji: string;
  /** Frase corta para mostrar al usuario. Ej: "Hoy toca pierna con énfasis en fuerza" */
  pitch: string;
  /** Intensidad estimada: 'fuerza' | 'hipertrofia' | 'mixto' */
  intensity: 'fuerza' | 'hipertrofia' | 'mixto' | null;
  /** Lista de músculos principales como texto. */
  musclesLabel: string;
}

/**
 * Genera un resumen amigable de un día de entreno.
 */
export function summarizeDay(day: TrainingDay): DaySummary | null {
  if (day.isRestDay) {
    return {
      title: 'Descanso',
      emoji: '😴',
      pitch: 'Día de descanso. Aprovecha para dormir bien y comer suficiente.',
      intensity: null,
      musclesLabel: 'Ninguno'
    };
  }
  if (day.primaryMuscles.length === 0) return null;

  // Detectar el tipo de día
  const muscles = day.primaryMuscles;
  const hasUpper = muscles.some(m => UPPER.includes(m));
  const hasLower = muscles.some(m => LOWER.includes(m));
  const isFullBody = hasUpper && hasLower;

  let title: string;
  let emoji: string;

  if (isFullBody) {
    title = 'Full body';
    emoji = '💪';
  } else if (hasLower && !hasUpper) {
    title = 'Pierna';
    emoji = '🦵';
  } else if (hasUpper && !hasLower) {
    // Distinguir entre push, pull, full upper
    const hasPush = muscles.includes('chest') || muscles.includes('shoulders') || muscles.includes('triceps');
    const hasPull = muscles.includes('back') || muscles.includes('biceps');
    if (hasPush && hasPull) {
      title = 'Tren superior';
      emoji = '💪';
    } else if (hasPush) {
      title = muscles.includes('chest') ? 'Pecho y empuje' : 'Hombros y empuje';
      emoji = '🏋️';
    } else {
      title = 'Espalda y tracción';
      emoji = '🎯';
    }
  } else {
    title = day.name;
    emoji = '🏋️';
  }

  // Detectar intensidad por rango de reps medio
  const intensity = detectIntensity(day.gymExercises);

  // Mensaje
  let pitch: string;
  if (intensity === 'fuerza') {
    pitch = `Hoy toca ${title.toLowerCase()} con énfasis en fuerza. Pesos altos, reps bajas.`;
  } else if (intensity === 'hipertrofia') {
    pitch = `Hoy toca ${title.toLowerCase()} a alto volumen. Hipertrofia pura.`;
  } else {
    pitch = `Hoy toca ${title.toLowerCase()}, sesión completa.`;
  }

  const musclesLabel = muscles.map(m => MUSCLE_LABELS[m]).join(' · ');

  return { title, emoji, pitch, intensity, musclesLabel };
}

function detectIntensity(exercises: PlannedExercise[]): 'fuerza' | 'hipertrofia' | 'mixto' {
  if (exercises.length === 0) return 'mixto';
  // Promedio del rango máximo de reps
  const avgMax = exercises.reduce((a, e) => a + e.repsMax, 0) / exercises.length;
  if (avgMax <= 8) return 'fuerza';
  if (avgMax >= 12) return 'hipertrofia';
  return 'mixto';
}
