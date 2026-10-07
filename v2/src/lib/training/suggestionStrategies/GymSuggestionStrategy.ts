import { db } from '$db/database';
import type { PlannedExercise, Exercise, WorkoutSessionExercise } from '$lib/types';
import type { WeightSuggestion } from '$lib/training/weightSuggestion';
import type { SuggestionStrategy, SuggestionContext } from './SuggestionStrategy';
import { buildLastSummary } from './SuggestionStrategy';
import { classifyExercise, getCategoryIncrement, categoryLabel } from '$lib/training/exerciseCategory';
import { computeDetraining } from '$lib/training/detraining';
import { stepsFromSettings, roundLoad, stepFor } from '$lib/training/loadSteps';
import { splitTopSet } from '$lib/training/topSet';

/**
 * Estrategia de DOBLE PROGRESIÓN para ejercicios de gimnasio.
 *
 *   1. Tras un PARÓN largo (enfermedad, viaje, ausencias marcadas) → bajar
 *      carga según los días parado. Manda sobre el resto de reglas.
 *   2. Semana de descarga (6 ó 12 del ciclo) → mismo peso, menos volumen.
 *   3. Alguna serie por debajo del mínimo de reps:
 *      - 1ª vez → mismo peso; 2ª consecutiva → −10%.
 *   4. SERIE FINAL más pesada (pirámide): si con ese peso hiciste al menos
 *      mínimo+1 reps → pasa a ser tu peso de trabajo.
 *   5. Todas las series al TOP del rango con RIR ≥ 1 (salvo la que se apura)
 *      → subir peso.
 *   6. Todas las series con 3+ reps en reserva → el peso sobra, subir.
 *   7. RIR 0 en > 50% de las series → mantener (demasiado fallo).
 *   8. Si no → mismo peso, +1 rep por serie.
 *
 * Todos los pesos se redondean a lo que se puede CARGAR en el gimnasio
 * (ver loadSteps.ts): con discos de 2,5 kg la barra sube de 5 en 5.
 *
 * El incremento se resuelve así (de mayor a menor prioridad) y luego se
 * ajusta al salto mínimo del equipo:
 *   1º `planned.incrementKg` · 2º `exercise.incrementKg` · 3º categoría
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
    const lastWeight = lastSummary.workingWeightKg ?? 0;

    if (lastWeight <= 0) {
      return {
        status: 'no_history',
        weightKg: null,
        reasoning: 'Última sesión sin peso registrado.',
        lastSession: lastSummary
      };
    }

    const steps = ctx?.loadSteps ?? stepsFromSettings(null);
    const step = stepFor(exercise, steps);
    // Peso de trabajo CARGABLE: si la última vez se apuntó un peso que este
    // gimnasio no permite (p. ej. 52,5 kg con discos de 2,5), se ajusta.
    const W = roundLoad(exercise, lastWeight, steps);
    const adjusted = W !== lastWeight ? ` (${W} kg: lo que permiten tus discos)` : '';

    /** Sube al menos un salto del equipo, en múltiplos de ese salto. */
    const raise = (inc: number) => W + Math.max(step, Math.ceil(inc / step - 1e-9) * step);
    /** Baja según un factor, siempre por debajo de W y cargable. */
    const lower = (factor: number) => {
      const w = roundLoad(exercise, W * factor, steps);
      return w < W ? w : roundLoad(exercise, W - step, steps);
    };

    // Las series normales se evalúan aparte de una posible serie final más pesada
    const { straight, top } = splitTopSet(lastEx.sets);
    const done = lastEx.sets.length;
    const allRIRs = lastEx.sets.map(s => s.rir).filter((r): r is number => r != null);
    const straightRIRs = straight.map(s => s.rir).filter((r): r is number => r != null);
    const minRIR = straightRIRs.length > 0 ? Math.min(...straightRIRs) : null;

    const allAtTop = straight.length > 0 && straight.every(s => s.reps >= planned.repsMax);
    const completedAllSets = done >= planned.sets;
    const setsBelowMin = straight.filter(s => s.reps < planned.repsMin).length;
    const setsAtFailure = allRIRs.filter(r => r === 0).length;
    // La serie que se apura (la final más pesada o, si no hay, la última) no
    // necesita margen; las demás sí.
    const marginSets = top ? straight : straight.slice(0, -1);
    const allWithMargin = marginSets.every(s => s.rir == null || s.rir >= 1);

    // 1) VUELTA DE UN PARÓN: manda sobre todo lo demás.
    const detrain = computeDetraining(ctx?.daysSinceLast ?? 0, ctx?.missedReason);
    if (detrain.reductionPct > 0) {
      const w = lower(detrain.factor);
      return {
        status: 'suggest_down',
        weightKg: w,
        reasoning: `${detrain.message} Con tus discos, lo más cercano es ${w} kg.`,
        lastSession: lastSummary
      };
    }

    // 2) Semana de descarga programada: no toques peso ni reps; menos volumen.
    if (ctx?.isDeloadWeek) {
      return {
        status: 'maintain',
        weightKg: W,
        reasoning: `🔻 Semana de descarga. Mismo peso${adjusted}, reduce series ~40% y deja 3+ reps en recámara. Recuperación, no PRs.`,
        lastSession: lastSummary
      };
    }

    // 3) No llegó ni al mínimo de reps en las series normales → el peso pesa.
    if (setsBelowMin > 0) {
      const fails = ctx?.consecutiveFailures ?? 1;
      if (fails >= 2) {
        const w = lower(0.9);
        return {
          status: 'suggest_down',
          weightKg: w,
          reasoning: `↓ 2ª sesión sin llegar al mínimo (${planned.repsMin} reps). Bajo a ${w} kg para consolidar técnica. Revisa sueño y comida.`,
          lastSession: lastSummary
        };
      }
      return {
        status: 'maintain',
        weightKg: W,
        reasoning: `≈ No llegaste a ${planned.repsMin} reps en alguna serie. Repite el peso${adjusted}; si vuelve a pasar, lo bajamos.`,
        lastSession: lastSummary
      };
    }

    // 4) SERIE FINAL más pesada: si la hiciste holgada, ese es tu nuevo peso.
    if (top && top.weightKg != null && completedAllSets && top.reps >= planned.repsMin + 1) {
      const w = Math.max(raise(0), roundLoad(exercise, top.weightKg, steps));
      return {
        status: 'suggest_up',
        weightKg: w,
        reasoning: `↑ En la serie final hiciste ${top.reps} reps con ${top.weightKg} kg: ${w} kg pasa a ser tu peso de trabajo.`,
        lastSession: lastSummary
      };
    }

    // 5) DOBLE PROGRESIÓN: todas al tope del rango, con margen → subir.
    if (allAtTop && completedAllSets && allWithMargin) {
      const w = raise(resolveIncrement(exercise, planned, W));
      return {
        status: 'suggest_up',
        weightKg: w,
        reasoning: `↑ Tope del rango (${planned.repsMax} reps) en todas las series. Sube a ${w} kg (+${round2(w - W)}) y vuelve al rango bajo (${planned.repsMin}).`,
        lastSession: lastSummary
      };
    }

    // 6) AUTORREGULACIÓN: 3+ reps en reserva en todas las series → sobra peso.
    if (minRIR != null && minRIR >= 3 && completedAllSets) {
      const w = raise(resolveIncrement(exercise, planned, W));
      return {
        status: 'suggest_up',
        weightKg: w,
        reasoning: `↑ Dejaste ${minRIR}+ reps en reserva en todas las series: el peso te sobra. Sube a ${w} kg.`,
        lastSession: lastSummary
      };
    }

    // 7) Fallo (RIR 0) en > 50% de las series → no subir.
    if (allRIRs.length > 0 && setsAtFailure / done > 0.5) {
      return {
        status: 'cns_fatigue',
        weightKg: W,
        reasoning: `⚠️ Llegaste al fallo en ${setsAtFailure}/${done} series. Mismo peso${adjusted} — deja 1-2 reps en reserva salvo en la serie final.`,
        lastSession: lastSummary
      };
    }

    // 8) En rango sin llegar al tope → mismo peso, +1 rep por serie.
    return {
      status: 'maintain',
      weightKg: W,
      reasoning: `= Mismo peso${adjusted}: intenta +1 rep por serie hasta llegar a ${planned.repsMax} en todas, y ahí subimos.`,
      lastSession: lastSummary
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Incremento base (kg) según programa, ejercicio o categoría. Después se
 * ajusta al salto mínimo del equipo del gimnasio (ver `raise`).
 */
function resolveIncrement(exercise: Exercise, planned: PlannedExercise, currentWeight: number): number {
  if (planned.incrementKg != null) return planned.incrementKg;
  if (exercise.incrementKg != null) return exercise.incrementKg;
  const category = classifyExercise(exercise);
  const base = getCategoryIncrement(category);
  // Compuesto tren inferior: +5 kg al principio, +2,5 cuando el peso ya es serio
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
  planned: PlannedExercise,
  excludeSessionId?: string
): Promise<ConsecutiveFailures> {
  const sessions = await db.sessions
    .orderBy('date')
    .reverse()
    .filter(s => s.id !== excludeSessionId && s.exercises.some(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0))
    .limit(3)
    .toArray();

  let count = 0;
  for (const session of sessions) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) break;
    // La serie final más pesada puede quedarse corta a propósito: no cuenta
    const minRepsHit = splitTopSet(ex.sets).straight.every(s => s.reps >= planned.repsMin);
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
