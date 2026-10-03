import type { PlannedExercise } from '$lib/types';

/**
 * DESCANSO ADAPTATIVO entre series.
 *
 * El programa fija un descanso base por ejercicio (≈3 min en básicos pesados,
 * 60-90 s en aislamiento). Pero no todas las series cansan igual: una serie
 * llevada al fallo deja más fatiga que una con 3 reps en recámara, y la
 * calidad de la serie siguiente depende de haber recuperado lo suficiente.
 *
 * Ajustamos el base según lo que acaba de pasar:
 *   - Esfuerzo (RIR registrado): al fallo → más descanso; serie fácil → menos.
 *   - Rendimiento: si no llegó al mínimo de reps, la carga le costó → más.
 *   - Última serie del ejercicio: lo que sigue es cambiar de ejercicio
 *     (normalmente otro músculo) → transición más corta.
 *
 * Resultado acotado a [45 s, 5 min] y redondeado a 15 s para que sea legible.
 */

export interface RestDecision {
  seconds: number;
  /** Explicación corta para mostrar bajo el contador. */
  reason: string;
}

const MIN_REST = 45;
const MAX_REST = 300;

function roundTo15(s: number): number {
  return Math.round(s / 15) * 15;
}

export function computeRest(
  planned: PlannedExercise,
  set: { reps: number; rir?: number | null },
  setNumber: number
): RestDecision {
  const base = planned.restSeconds;
  const isLastSet = setNumber >= planned.sets;

  if (isLastSet) {
    const seconds = Math.max(60, roundTo15(base * 0.6));
    return { seconds, reason: 'Ejercicio terminado · transición al siguiente' };
  }

  let factor = 1;
  let reason = 'Descanso estándar del ejercicio';

  const rir = set.rir;
  if (rir != null) {
    if (rir <= 0)      { factor = 1.25; reason = 'Serie al fallo · +25% para recuperar'; }
    else if (rir === 1){ factor = 1.1;  reason = 'Serie muy exigente · algo más de descanso'; }
    else if (rir >= 3) { factor = 0.75; reason = 'Te sobraron reps · descanso más corto'; }
  }

  // Quedarse por debajo del mínimo pesa más que el RIR declarado
  if (set.reps < planned.repsMin) {
    factor = Math.max(factor, 1.25);
    reason = `No llegaste a ${planned.repsMin} reps · +25% para la siguiente`;
  }

  const seconds = Math.min(MAX_REST, Math.max(MIN_REST, roundTo15(base * factor)));
  return { seconds, reason };
}
