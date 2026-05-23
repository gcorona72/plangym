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
    const RIRs = sets.map(s => s.rir).filter((r): r is number => r != null);

    const setsAtTop = sets.filter(s => s.reps >= planned.repsMax).length;
    const setsBelowMin = sets.filter(s => s.reps < planned.repsMin).length;
    const setsAtFailure = RIRs.filter(r => r === 0).length;
    const allWithMargin = RIRs.length === 0 || RIRs.every(r => r >= 1);

    // Semana de descarga programada: no toques peso ni reps; menos volumen.
    if (ctx?.isDeloadWeek) {
      return {
        status: 'maintain',
        weightKg: workingWeight,
        reasoning: '🔻 Semana de descarga. Mismo peso, reduce series ~40% y deja 3+ reps en recámara. Recuperación, no PRs.',
        lastSession: lastSummary
      };
    }

    // Fallo en > 50% de las series → CNS fatigue, no subir.
    if (RIRs.length > 0 && setsAtFailure / sets.length > 0.5) {
      return {
        status: 'cns_fatigue',
        weightKg: workingWeight,
        reasoning: `⚠️ Llegaste al fallo en ${setsAtFailure}/${sets.length} series. Mantén peso — apunta a RIR 1-2 la próxima vez.`,
        lastSession: lastSummary
      };
    }

    // Doble progresión: todas en el top con margen → +peso (incremento por categoría)
    if (setsAtTop >= planned.sets && allWithMargin) {
      const inc = resolveIncrement(exercise, planned, workingWeight);
      const expHint = experienceHint(ctx?.experienceLevel, ctx?.phase);
      return {
        status: 'suggest_up',
        weightKg: roundToHalf(workingWeight + inc),
        reasoning: `↑ Top del rango (${planned.repsMax} reps) en todas las series con RIR ≥ 1. Subo ${inc}kg, vuelves al rango bajo (${planned.repsMin}).${expHint}`,
        lastSession: lastSummary
      };
    }

    // Por debajo del mínimo: depende de si es la 1ª o 2ª vez seguida
    if (setsBelowMin > 0) {
      const fails = ctx?.consecutiveFailures ?? 1;
      if (fails >= 2) {
        return {
          status: 'suggest_down',
          weightKg: roundToHalf(workingWeight * 0.9),
          reasoning: `↓ 2ª sesión seguida sin alcanzar el mínimo (${planned.repsMin}). Mini-deload: bajo 10%. Revisa sueño, comida y técnica.`,
          lastSession: lastSummary
        };
      }
      return {
        status: 'maintain',
        weightKg: workingWeight,
        reasoning: `≈ Te quedaste corto en ${setsBelowMin}/${sets.length} serie(s). Mismo peso, vuelve a intentarlo antes de bajar.`,
        lastSession: lastSummary
      };
    }

    // Resto: en rango pero no top → mismo peso, +1 rep por serie
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

/**
 * Pequeño hint extra para el reasoning según experiencia y fase.
 * Principiante en volumen → puede subir rápido (cada sesión).
 * Cualquiera en recomp/cut → progresión más lenta esperada.
 */
function experienceHint(level?: string, phase?: string): string {
  if (phase === 'recomp' || phase === 'cut') {
    return ' En recomp/cut puede que tardes 2-3 semanas en cumplir esto otra vez, normal.';
  }
  if (level === 'beginner') {
    return ' Principiante: puedes subir casi cada sesión durante meses.';
  }
  return '';
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
