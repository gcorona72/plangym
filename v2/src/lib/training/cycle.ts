/**
 * Ciclo de 12 semanas con semanas de descarga (deload) en semana 6 y 12.
 *
 * Referencia: Schoenfeld 2010, Helms 2014.
 * - Deload: reducir volumen (series) a la mitad e intensidad un 20%.
 */

const CYCLE_WEEKS = 12;
const DELOAD_WEEKS = [6, 12]; // 1-indexed

export interface CycleStatus {
  /** Semana actual del ciclo (1-12). Si pasó de 12 → reinicia. */
  currentWeek: number;
  /** ¿La semana actual es de descarga? */
  isDeloadWeek: boolean;
  /** Próxima semana de deload (número de semana). */
  nextDeloadWeek: number;
  /** Días que faltan para el próximo deload. */
  daysUntilDeload: number;
  /** ¿Ha terminado el ciclo y toca uno nuevo? */
  cycleFinished: boolean;
}

export function computeCycleStatus(cycleStartDate?: string): CycleStatus {
  const start = cycleStartDate ? new Date(cycleStartDate) : new Date();
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const daysSinceStart = Math.floor(diffMs / 86400000);
  const rawWeek = Math.floor(daysSinceStart / 7) + 1;

  const currentWeek = ((rawWeek - 1) % CYCLE_WEEKS) + 1;
  const cycleFinished = rawWeek > CYCLE_WEEKS;
  const isDeloadWeek = DELOAD_WEEKS.includes(currentWeek);

  const nextDeloadWeek = DELOAD_WEEKS.find(w => w >= currentWeek) ?? DELOAD_WEEKS[0] + CYCLE_WEEKS;
  const daysUntilDeload = Math.max((nextDeloadWeek - currentWeek) * 7, 0);

  return { currentWeek, isDeloadWeek, nextDeloadWeek, daysUntilDeload, cycleFinished };
}

/**
 * Aplica los modificadores de una semana de descarga a un ejercicio planificado.
 *
 * Spec del proyecto: en semana de deload (6 y 12) se reducen las series al
 * 60-70% del volumen normal (ej: 4 → 2-3) y la intensidad ~20% (RIR +2 / peso
 * sugerido ligeramente menor). Devuelve un nuevo objeto, no muta el original.
 */
export function applyDeloadToPlanned<T extends { sets: number; targetRIR?: number }>(planned: T): T {
  return {
    ...planned,
    // 60% del volumen, mínimo 2 series
    sets: Math.max(2, Math.round(planned.sets * 0.6)),
    // Forzar RIR alto (3+) para reducir intensidad efectiva
    targetRIR: Math.max(3, planned.targetRIR ?? 3)
  };
}

/** Multiplicador de peso sugerido en semana de deload. */
export const DELOAD_WEIGHT_MULTIPLIER = 0.8;

/** Texto explicativo del estado del ciclo. */
export function cycleStatusMessage(status: CycleStatus): string {
  if (status.cycleFinished) {
    return 'Ciclo completado. Empieza uno nuevo desde Ajustes.';
  }
  if (status.isDeloadWeek) {
    return `Semana ${status.currentWeek}/12 — DESCARGA. Reduce el volumen a la mitad y baja la intensidad un 20%. Tu cuerpo lo agradecerá.`;
  }
  return `Semana ${status.currentWeek}/12. Próxima descarga en ${status.daysUntilDeload} días.`;
}
