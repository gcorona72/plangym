import type { Exercise, PlannedExercise } from '$lib/types';
import { classifyExercise, type ExerciseCategory } from './exerciseCategory';
import { roundLoad, stepFor, stepsFromSettings, type LoadSteps } from './loadSteps';

/**
 * PLAN DE SERIES de un ejercicio: con qué peso empezar y con cuál terminar.
 *
 *   1. Calentamiento en rampa (NO se registra): series ligeras subiendo hasta
 *      el peso de trabajo.
 *   2. Series de trabajo: todas con el peso sugerido, dentro del rango de reps.
 *   3. Serie FINAL: un salto de peso más (pirámide ascendente corta), a todas
 *      las reps que se puedan con buena técnica. Si con ese peso se hacen al
 *      menos mínimo+1 reps, pasa a ser el peso de trabajo de la próxima vez.
 *
 * La serie final sólo es más pesada si el salto es razonable (≤12% del peso):
 * en mancuernas pequeñas, pasar de 10 a 12 kg es un +20% y rompe la técnica,
 * así que ahí la última serie se hace con el mismo peso, hasta el fallo.
 * Todos los pesos se redondean a lo que se puede cargar (ver loadSteps.ts).
 */

export interface WarmupSet {
  weightKg: number;
  reps: number;
}

export interface SetPlan {
  /** Rampa de calentamiento — orientativa, no se registra. */
  warmups: WarmupSet[];
  /** Peso de las series de trabajo (null si aún no hay referencia). */
  workingWeightKg: number | null;
  /** Nº de series de trabajo (sin contar la final si es más pesada). */
  workingSets: number;
  repsMin: number;
  repsMax: number;
  /** Peso de la serie final (null si aún no hay referencia). */
  finalWeightKg: number | null;
  /** La serie final lleva más peso que las de trabajo. */
  finalIsHeavier: boolean;
  /** Reps a superar en la serie final para subir el peso de trabajo. */
  finalTargetReps: number;
  /** Indicación para la serie final. */
  finalCue: string;
}

type Step = [pct: number, reps: number];

/** Salto máximo (relativo) para que la serie final lleve más peso. */
const MAX_FINAL_JUMP = 0.12;

function isCompound(c: ExerciseCategory): boolean {
  return c === 'compound_lower' || c === 'compound_upper';
}

/** Rampa según categoría, peso y si es el primer ejercicio del día. */
function rampFor(category: ExerciseCategory, weight: number, isFirst: boolean): Step[] {
  if (isCompound(category)) {
    if (isFirst) {
      if (weight >= 60) return [[0.4, 10], [0.6, 6], [0.8, 3]];
      if (weight >= 30) return [[0.5, 10], [0.75, 5]];
      return [[0.5, 10]];
    }
    if (weight >= 60) return [[0.6, 6], [0.8, 3]];
    return [[0.6, 6]];
  }
  if (weight >= 40 && category !== 'isolation_small_db') return [[0.6, 8]];
  return [];
}

export function buildSetPlan(
  ex: Exercise,
  planned: PlannedExercise,
  workingWeightKg: number | null,
  exerciseIndex: number,
  steps: LoadSteps = stepsFromSettings(null)
): SetPlan {
  const category = classifyExercise(ex);
  const compound = isCompound(category);
  const W = workingWeightKg != null && workingWeightKg > 0 ? roundLoad(ex, workingWeightKg, steps) : null;
  const step = stepFor(ex, steps);
  const finalIsHeavier = W != null && planned.sets >= 2 && step / W <= MAX_FINAL_JUMP;
  const finalWeightKg = W == null ? null : finalIsHeavier ? roundLoad(ex, W + step, steps) : W;
  const finalTargetReps = planned.repsMin + 1;

  let finalCue: string;
  if (W == null) {
    finalCue = 'Última serie: la más exigente, hasta casi el fallo.';
  } else if (finalIsHeavier) {
    finalCue = `${finalWeightKg} kg, todas las reps que puedas con buena técnica` +
      (compound ? ' (con barras de seguridad o alguien que te ayude)' : '') +
      `. Si haces ${finalTargetReps} o más, la próxima vez trabajas con ${finalWeightKg} kg.`;
  } else {
    finalCue = compound
      ? `${W} kg dejando 1 rep en la recámara.`
      : `${W} kg hasta el fallo: hasta que no puedas hacer ni una más.`;
  }

  const warmups: WarmupSet[] = [];
  if (W != null) {
    const seen = new Set<number>();
    for (const [pct, reps] of rampFor(category, W, exerciseIndex === 0)) {
      const w = roundLoad(ex, W * pct, steps);
      if (w >= W || seen.has(w)) continue;
      seen.add(w);
      warmups.push({ weightKg: w, reps });
    }
  }

  return {
    warmups,
    workingWeightKg: W,
    workingSets: finalIsHeavier ? planned.sets - 1 : planned.sets,
    repsMin: planned.repsMin,
    repsMax: planned.repsMax,
    finalWeightKg,
    finalIsHeavier,
    finalTargetReps,
    finalCue
  };
}
