import { db } from '$db/database';
import type { PlannedExercise, Exercise, WorkoutSessionExercise } from '$lib/types';
import type { WeightSuggestion } from '$lib/training/weightSuggestion';
import type { SuggestionStrategy } from './SuggestionStrategy';
import { buildLastSummary } from './SuggestionStrategy';

/**
 * Estrategia de DOBLE PROGRESIÓN para ejercicios de gimnasio.
 *
 *   1. El ejercicio tiene un rango de reps (ej: 5-7).
 *   2. Si todas las series alcanzaron el TOP del rango con RIR ≥ 1
 *      → subir peso (el incremento depende del ejercicio).
 *   3. Si se cumplió el mínimo pero no el máximo
 *      → mismo peso, target = +1 rep por serie.
 *   4. Si alguna serie quedó por debajo del mínimo
 *      → bajar peso (-10 %).
 *   5. Si RIR=0 en > 50 % de las series
 *      → mantener (no es óptimo entrenar al fallo continuo).
 *   6. Si 2 sesiones consecutivas no llegan al mínimo
 *      → mini-deload del ejercicio (gestionado externamente).
 *
 * El incremento por defecto se resuelve así:
 *   1º `planned.incrementKg`     (override en el programa)
 *   2º `exercise.incrementKg`    (default del ejercicio)
 *   3º heurística basada en el peso actual
 */
export class GymSuggestionStrategy implements SuggestionStrategy {
  readonly id = 'gym';

  suggest(
    exercise: Exercise,
    planned: PlannedExercise,
    lastEx: WorkoutSessionExercise,
    lastDate: string
  ): WeightSuggestion {
    const lastSummary = buildLastSummary(lastEx, lastDate);
    const workingWeight = lastSummary.workingWeightKg ?? 0;

    if (workingWeight <= 0) {
      return {
        status: 'no_history',
        weightKg: null,
        reasoning: 'Última sesión sin peso registrado.',
        lastSession: lastSummary
      };
    }

    const sets = lastEx.sets;
    const RIRs = sets.map(s => s.rir).filter((r): r is number => r != null);

    const setsAtTop = sets.filter(s => s.reps >= planned.repsMax).length;
    const setsBelowMin = sets.filter(s => s.reps < planned.repsMin).length;
    const setsAtFailure = RIRs.filter(r => r === 0).length;
    const allWithMargin = RIRs.length === 0 || RIRs.every(r => r >= 1);

    // Detección de fallo en > 50 % de las series
    if (RIRs.length > 0 && setsAtFailure / sets.length > 0.5) {
      return {
        status: 'cns_fatigue',
        weightKg: workingWeight,
        reasoning: `⚠️ Llegaste al fallo en ${setsAtFailure}/${sets.length} series. Mantén peso — apunta a RIR 1-2 la próxima vez.`,
        lastSession: lastSummary
      };
    }

    // Doble progresión: todas en el top con margen → +peso
    if (setsAtTop >= planned.sets && allWithMargin) {
      const inc = resolveIncrement(exercise, planned, workingWeight);
      return {
        status: 'suggest_up',
        weightKg: roundToHalf(workingWeight + inc),
        reasoning: `↑ Top del rango (${planned.repsMax} reps) en todas las series con RIR ≥ 1. Subo ${inc}kg, vuelves al rango bajo (${planned.repsMin}).`,
        lastSession: lastSummary
      };
    }

    // Series por debajo del rango mínimo → -10 %
    if (setsBelowMin > 0) {
      return {
        status: 'suggest_down',
        weightKg: roundToHalf(workingWeight * 0.9),
        reasoning: `↓ ${setsBelowMin}/${sets.length} series por debajo del mínimo (${planned.repsMin}). Bajo 10% para consolidar técnica.`,
        lastSession: lastSummary
      };
    }

    // Resto: mantener peso, target +1 rep por serie
    return {
      status: 'maintain',
      weightKg: workingWeight,
      reasoning: `= Mismo peso. Intenta sumar 1 rep por serie (objetivo: llegar a ${planned.repsMax}).`,
      lastSession: lastSummary
    };
  }
}

/** Redondea al múltiplo de 0.5 más cercano (carga típica de pesas). */
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Resuelve el incremento (kg) que se sumará en la próxima sesión.
 * Orden de prioridad: override del programa > default del ejercicio > heurística.
 */
function resolveIncrement(exercise: Exercise, planned: PlannedExercise, currentWeight: number): number {
  if (planned.incrementKg != null) return planned.incrementKg;
  if (exercise.incrementKg != null) return exercise.incrementKg;
  if (currentWeight < 20) return 1;
  if (currentWeight < 60) return 2.5;
  return roundToHalf(Math.max(currentWeight * 0.025, 2.5));
}

// ─── Detector de fallos consecutivos (para mini-deload) ───────────────────

export interface ConsecutiveFailures {
  count: number;
  message: string;
}

/**
 * Cuenta cuántas sesiones consecutivas (desde la más reciente) el usuario
 * NO alcanzó el rango mínimo. Si ≥ 2 → señal de mini-deload del ejercicio.
 */
export async function detectConsecutiveFailures(
  exerciseId: string,
  planned: PlannedExercise
): Promise<ConsecutiveFailures> {
  const sessions = await db.sessions
    .orderBy('date')
    .reverse()
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0))
    .limit(3)
    .toArray();

  let count = 0;
  for (const session of sessions) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) break;
    const minRepsHit = ex.sets.every(s => s.reps >= planned.repsMin);
    if (!minRepsHit) count++;
    else break;
  }

  const message = count >= 2
    ? `Llevas ${count} sesiones sin alcanzar el mínimo (${planned.repsMin} reps). Revisa sueño, comida y técnica antes de seguir.`
    : '';

  return { count, message };
}
