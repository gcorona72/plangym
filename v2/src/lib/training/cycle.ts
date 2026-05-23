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
