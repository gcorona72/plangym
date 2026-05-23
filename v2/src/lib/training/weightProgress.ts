import type { WeightLog, UserProfile } from '$lib/types';

/**
 * Protocolo de estancamiento de peso.
 *
 * Si la media semanal no sube al menos 200g durante 2 semanas consecutivas
 * (en objetivo 'gain'), sugerir +200-300 kcal.
 *
 * Tasa de ganancia segura: 0.25-0.6% del peso/semana.
 * Para 70kg → 175-420g/semana → target sano ~250g/semana.
 */

const STAGNATION_THRESHOLD_G = 200; // gramos de subida mínima esperada
const STAGNATION_WEEKS = 2;

export interface WeeklyAvg {
  weekStart: string; // ISO yyyy-mm-dd (lunes)
  avgKg: number;
  count: number;
}

/** Agrupa los pesos en medias semanales. */
export function computeWeeklyAverages(logs: WeightLog[]): WeeklyAvg[] {
  if (logs.length === 0) return [];

  const byWeek = new Map<string, number[]>();
  for (const log of logs) {
    const d = new Date(log.date);
    // Lunes de la semana
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow);
    const key = monday.toISOString().split('T')[0];
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(log.weightKg);
  }

  const out: WeeklyAvg[] = Array.from(byWeek.entries()).map(([weekStart, kgs]) => ({
    weekStart,
    avgKg: kgs.reduce((a, b) => a + b, 0) / kgs.length,
    count: kgs.length
  }));
  out.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return out;
}

export interface ProgressDiagnosis {
  status: 'progressing' | 'stagnating' | 'losing' | 'insufficient_data';
  /** Subida media semanal en kg (últimas N semanas). */
  trendKgPerWeek?: number;
  /** Tasa porcentual respecto al peso corporal. */
  trendPctPerWeek?: number;
  /** Mensaje legible. */
  message: string;
  /** Si está estancado: sugerencia de kcal a sumar al target. */
  suggestedKcalDelta?: number;
}

/**
 * Diagnostica si el usuario está progresando, estancado o perdiendo peso.
 * Llama también al protocolo de la consultora: si <200g/semana durante 2+ semanas → +200-300 kcal.
 */
export function diagnoseProgress(
  weeklyAvgs: WeeklyAvg[],
  profile: UserProfile
): ProgressDiagnosis {
  if (weeklyAvgs.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'Necesito al menos 2 semanas de datos para diagnosticar tu progreso.'
    };
  }

  // Comparar las últimas N semanas
  const recent = weeklyAvgs.slice(-Math.max(STAGNATION_WEEKS + 1, 2));
  const deltas: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    deltas.push(recent[i].avgKg - recent[i - 1].avgKg);
  }
  const avgDeltaKg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const pctPerWeek = (avgDeltaKg / profile.weightKg) * 100;

  // Diagnóstico
  if (profile.goal === 'gain') {
    const stagnantStreak = deltas.filter(d => d * 1000 < STAGNATION_THRESHOLD_G).length;
    if (stagnantStreak >= STAGNATION_WEEKS) {
      return {
        status: 'stagnating',
        trendKgPerWeek: avgDeltaKg,
        trendPctPerWeek: pctPerWeek,
        message: `Llevas ${stagnantStreak} semanas sin subir ≥200g. Sube las calorías unos 200-300 kcal (mayormente carbohidratos).`,
        suggestedKcalDelta: 250
      };
    }
    if (avgDeltaKg < 0) {
      return {
        status: 'losing',
        trendKgPerWeek: avgDeltaKg,
        trendPctPerWeek: pctPerWeek,
        message: '⚠️ Estás perdiendo peso a pesar de buscar ganancia. Sube 300 kcal y revisa el entreno.',
        suggestedKcalDelta: 300
      };
    }
    if (pctPerWeek > 0.6) {
      return {
        status: 'progressing',
        trendKgPerWeek: avgDeltaKg,
        trendPctPerWeek: pctPerWeek,
        message: `Subes ${(avgDeltaKg * 1000).toFixed(0)}g/semana (${pctPerWeek.toFixed(2)}%) — más rápido que el 0.6% recomendado. Mucha de esa ganancia será grasa. Reduce 200 kcal.`,
        suggestedKcalDelta: -200
      };
    }
    return {
      status: 'progressing',
      trendKgPerWeek: avgDeltaKg,
      trendPctPerWeek: pctPerWeek,
      message: `✓ Subiendo ${(avgDeltaKg * 1000).toFixed(0)}g/semana (${pctPerWeek.toFixed(2)}%). Rango sano de ganancia muscular.`
    };
  }

  // Para 'maintain' / 'cut' (no es prioridad ahora)
  return {
    status: 'progressing',
    trendKgPerWeek: avgDeltaKg,
    trendPctPerWeek: pctPerWeek,
    message: `Variación semanal: ${(avgDeltaKg * 1000).toFixed(0)}g.`
  };
}
