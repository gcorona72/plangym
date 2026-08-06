import { db } from '$db/database';
import type { PlannedExercise, Exercise, WorkoutSessionExercise } from '$lib/types';
import type { WeightSuggestion } from '$lib/training/weightSuggestion';
import type { SuggestionStrategy, SuggestionContext } from './SuggestionStrategy';
import { buildLastSummary } from './SuggestionStrategy';
import { classifyExercise, getCategoryIncrement, categoryLabel } from '$lib/training/exerciseCategory';

/**
 * Estrategia de DOBLE PROGRESIÓN para ejercicios de gimnasio.
 *
 *   1. El ejercicio tiene un rango de reps (ej: 5-7).
 *   2. Si todas las series alcanzaron el TOP del rango con RIR ≥ 1
 *      → subir peso (incremento según categoría del ejercicio).
 *   3. Si se cumplió el mínimo pero no el máximo
 *      → mismo peso, target = +1 rep por serie.
 *   4. Si alguna serie quedó por debajo del mínimo:
 *      - 1ª vez → mismo peso, "casi, intenta otra vez"
 *      - 2ª vez consecutiva → -10% deload del ejercicio + checklist
 *   5. Si RIR=0 en > 50% de las series
 *      → mantener (no es óptimo entrenar al fallo continuo).
 *   6. En semana de deload (6 ó 12 del ciclo)
 *      → mismo peso, mensaje "es semana de descarga, reduce volumen".
 *
 * El incremento se resuelve así (de mayor a menor prioridad):
 *   1º `planned.incrementKg`     (override en el programa)
 *   2º `exercise.incrementKg`    (default del ejercicio)
 *   3º categoría del ejercicio   (clasificador automático)
 */
export class GymSuggestionStrategy implements SuggestionStrategy {
  readonly id = 'gym';

  suggest(
    exercise: Exercise,
    planned: PlannedExercise,
    lastEx: WorkoutSessionExercise,
    lastDate: string,
    ctx?: SuggestionContext
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
    const done = sets.length;
    const RIRs = sets.map(s => s.rir).filter((r): r is number => r != null);
    const hasRIR = RIRs.length > 0;
    const minRIR = hasRIR ? Math.min(...RIRs) : null;

    const allAtTop = done > 0 && sets.every(s => s.reps >= planned.repsMax);
    const completedAllSets = done >= planned.sets;
    const setsBelowMin = sets.filter(s => s.reps < planned.repsMin).length;
    const setsAtFailure = RIRs.filter(r => r === 0).length;
    const allWithMargin = !hasRIR || RIRs.every(r => r >= 1);

    // 1) Semana de descarga programada: no toques peso ni reps; menos volumen.
    if (ctx?.isDeloadWeek) {
      return {
        status: 'maintain',
        weightKg: workingWeight,
        reasoning: '🔻 Semana de descarga. Mismo peso, reduce series ~40% y deja 3+ reps en recámara. Recuperación, no PRs.',
        lastSession: lastSummary
      };
    }

    // 2) No llegó ni al mínimo de reps → el peso te pesa demasiado para el rango.
    //    (Va ANTES que el chequeo de fallo: fallar a 4 reps con objetivo 5-8 no
    //    es "entrenaste al fallo", es que la carga es excesiva.)
    if (setsBelowMin > 0) {
      const fails = ctx?.consecutiveFailures ?? 1;
      if (fails >= 2) {
        return {
          status: 'suggest_down',
          weightKg: roundToHalf(workingWeight * 0.9),
          reasoning: `↓ 2ª sesión sin llegar al mínimo (${planned.repsMin} reps). El peso es demasiado: bajo 10% para consolidar técnica. Revisa sueño y comida.`,
          lastSession: lastSummary
        };
      }
      return {
        status: 'maintain',
        weightKg: workingWeight,
        reasoning: `≈ Te quedaste en ${lastSummary.maxReps} reps (mínimo ${planned.repsMin}). Repite el peso; si vuelve a pasar, lo bajamos.`,
        lastSession: lastSummary
      };
    }

    // 3) DOBLE PROGRESIÓN: todas las series al tope del rango, con margen (RIR≥1)
    //    y completaste las series previstas → subir peso.
    if (allAtTop && completedAllSets && allWithMargin) {
      const inc = resolveIncrement(exercise, planned, workingWeight);
      return {
        status: 'suggest_up',
        weightKg: roundToHalf(workingWeight + inc),
        reasoning: `↑ Tope del rango (${planned.repsMax} reps) en todas las series con reserva. Subo ${inc}kg, vuelves al rango bajo (${planned.repsMin}).`,
        lastSession: lastSummary
      };
    }

    // 4) AUTORREGULACIÓN: aunque no llegaras al tope, si TODAS las series te
    //    dejaron 3+ reps en reserva, el peso te sobra → subir. Esto evita el
    //    "siempre mantener" cuando la carga es claramente fácil.
    if (minRIR != null && minRIR >= 3 && completedAllSets) {
      const inc = resolveIncrement(exercise, planned, workingWeight);
      return {
        status: 'suggest_up',
        weightKg: roundToHalf(workingWeight + inc),
        reasoning: `↑ Dejaste ${minRIR}+ reps en reserva en todas las series: el peso te sobra. Subo ${inc}kg.`,
        lastSession: lastSummary
      };
    }

    // 5) Fallo (RIR 0) en > 50% de las series estando en rango → no subir,
    //    entrenar tan al fallo tan a menudo acumula fatiga sin más estímulo.
    if (hasRIR && setsAtFailure / done > 0.5) {
      return {
        status: 'cns_fatigue',
        weightKg: workingWeight,
        reasoning: `⚠️ Llegaste al fallo en ${setsAtFailure}/${done} series. Mismo peso — deja 1-2 reps en reserva la próxima para progresar mejor.`,
        lastSession: lastSummary
      };
    }

    // 6) En rango, esfuerzo adecuado, pero sin llegar al tope → mismo peso,
    //    suma 1 rep por serie hasta cerrar el rango (así luego toca subir).
    return {
      status: 'maintain',
      weightKg: workingWeight,
      reasoning: `= Buen esfuerzo. Mismo peso: intenta +1 rep por serie hasta llegar a ${planned.repsMax} en todas, y ahí subimos.`,
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
 * Orden de prioridad: override del programa > default del ejercicio > categoría.
 *
 * La heurística por categoría reemplaza a la antigua "por peso bruto", para
 * respetar la tabla de incrementos del proyecto (sentadilla +5, lateral +1...).
 */
function resolveIncrement(exercise: Exercise, planned: PlannedExercise, currentWeight: number): number {
  if (planned.incrementKg != null) return planned.incrementKg;
  if (exercise.incrementKg != null) return exercise.incrementKg;
  const category = classifyExercise(exercise);
  const base = getCategoryIncrement(category);
  // Para compuesto tren inferior arrancamos con +5 kg y bajamos a +2.5 cuando
  // el peso ya es serio (>1.2× peso corporal aprox → usamos 80 kg como umbral).
  if (category === 'compound_lower' && currentWeight >= 80) return 2.5;
  return base;
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

// Re-export para que la UI pueda mostrar la categoría si quiere
export { classifyExercise, getCategoryIncrement, categoryLabel };
