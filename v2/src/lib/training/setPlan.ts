import type { Exercise, PlannedExercise } from '$lib/types';
import { classifyExercise, type ExerciseCategory } from './exerciseCategory';

/**
 * PLAN DE SERIES de un ejercicio: de qué peso partir y cómo terminar.
 *
 * La sobrecarga progresiva se produce ENTRE sesiones (más peso o más reps que
 * la vez anterior), no subiendo de peso dentro de la misma sesión. Dentro de
 * una sesión el esquema es:
 *
 *   1. Calentamiento en rampa (NO se registra): series ligeras subiendo hasta
 *      el peso de trabajo. Prepara articulaciones y sistema nervioso sin
 *      generar fatiga.
 *   2. Series efectivas: TODAS con el mismo peso (el sugerido).
 *   3. La última serie es la que se apura: en aislamiento hasta el fallo
 *      (seguro y suma estímulo); en básicos con barra hasta RIR 1, porque el
 *      fallo real con carga pesada cuesta mucha fatiga y compromete la técnica.
 *
 * Por qué no "empezar con 50 y acabar con 60 al fallo": esas series ligeras
 * del principio serían calentamiento contado como trabajo, y la final al
 * fallo con +20% acumula fatiga desproporcionada. Mismo peso en todas + la
 * última apurada da más volumen efectivo con menos riesgo.
 */

export interface WarmupSet {
  weightKg: number;
  reps: number;
}

export interface SetPlan {
  /** Rampa de calentamiento — orientativa, no se registra. */
  warmups: WarmupSet[];
  /** Peso de TODAS las series efectivas (null si no hay referencia aún). */
  workingWeightKg: number | null;
  workingSets: number;
  repsMin: number;
  repsMax: number;
  /** RIR objetivo de la última serie. */
  lastSetRIR: number;
  /** Indicación de cómo apurar la última serie. */
  lastSetCue: string;
}

type Step = [pct: number, reps: number];

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
    // Ya hay calor general: rampa corta
    if (weight >= 60) return [[0.6, 6], [0.8, 3]];
    return [[0.6, 6]];
  }
  // Máquinas/mancuernas con carga seria (prensa, press inclinado…)
  if (weight >= 40 && category !== 'isolation_small_db') return [[0.6, 8]];
  return [];
}

function roundFor(category: ExerciseCategory, ex: Exercise, kg: number): number {
  const barbell = (ex.requiredEquipment ?? []).includes('barbell');
  if (barbell) return Math.max(20, Math.round(kg / 2.5) * 2.5); // la barra pesa 20
  if (category === 'isolation_small_db' || category === 'accessory_unilateral') return Math.max(1, Math.round(kg));
  return Math.max(2.5, Math.round(kg / 2.5) * 2.5);
}

export function buildSetPlan(
  ex: Exercise,
  planned: PlannedExercise,
  workingWeightKg: number | null,
  exerciseIndex: number
): SetPlan {
  const category = classifyExercise(ex);
  const compound = isCompound(category);

  const lastSetRIR = compound ? 1 : 0;
  const lastSetCue = compound
    ? 'Última serie: apúrala hasta RIR 1 (1 rep en recámara). Con barra pesada el fallo real cuesta mucha fatiga y técnica.'
    : 'Última serie: llévala al fallo (RIR 0). En este ejercicio es seguro y es el estímulo extra.';

  const warmups: WarmupSet[] = [];
  if (workingWeightKg != null && workingWeightKg > 0) {
    const seen = new Set<number>();
    for (const [pct, reps] of rampFor(category, workingWeightKg, exerciseIndex === 0)) {
      const w = roundFor(category, ex, workingWeightKg * pct);
      if (w >= workingWeightKg || seen.has(w)) continue;
      seen.add(w);
      warmups.push({ weightKg: w, reps });
    }
  }

  return {
    warmups,
    workingWeightKg,
    workingSets: planned.sets,
    repsMin: planned.repsMin,
    repsMax: planned.repsMax,
    lastSetRIR,
    lastSetCue
  };
}
