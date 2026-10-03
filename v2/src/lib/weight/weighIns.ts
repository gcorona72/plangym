import { get } from 'svelte/store';
import { db } from '$db/database';
import { profile, saveProfile } from '$stores/profile';
import { toDateKey, fromDateKey } from '$lib/dateUtils';
import type { WeightLog } from '$lib/types';

/**
 * PESAJES — registrar el peso y saber cuándo toca volver a pesarse.
 *
 * El peso oscila 1-2 kg de un día a otro (agua, sal, comida), así que un
 * pesaje suelto no dice nada; lo que vale es la media de 2-3 por semana.
 * Por eso la app lo pide si llevas 3 días o más sin pesarte: lo justo para
 * tener una tendencia fiable sin agobiar con un pesaje diario.
 */

export const WEIGH_IN_EVERY_DAYS = 3;
const SNOOZE_KEY = 'plangym_weighin_snooze';

export interface WeighInStatus {
  lastKg: number | null;
  lastDate: string | null;
  /** Días desde el último pesaje (null si nunca). */
  daysSince: number | null;
  /** Pesajes en los últimos 7 días. */
  weighInsLast7: number;
  /** Toca pesarse (y el usuario no lo ha pospuesto hoy). */
  due: boolean;
}

function daysBetweenKeys(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

export function isSnoozedToday(): boolean {
  try { return localStorage.getItem(SNOOZE_KEY) === toDateKey(); } catch { return false; }
}

/** "Hoy no": deja de pedirlo hasta mañana. */
export function snoozeWeighInToday(): void {
  try { localStorage.setItem(SNOOZE_KEY, toDateKey()); } catch { /* sin almacenamiento: no pasa nada */ }
}

export async function getWeighInStatus(today: Date = new Date()): Promise<WeighInStatus> {
  const todayKey = toDateKey(today);
  const logs = (await db.weightLogs.toArray()).sort((a, b) => b.date.localeCompare(a.date));
  const last = logs[0] ?? null;
  const daysSince = last ? daysBetweenKeys(last.date, todayKey) : null;
  const weighInsLast7 = logs.filter(l => daysBetweenKeys(l.date, todayKey) < 7).length;
  const due = !isSnoozedToday() && (daysSince == null || daysSince >= WEIGH_IN_EVERY_DAYS);
  return { lastKg: last?.weightKg ?? null, lastDate: last?.date ?? null, daysSince, weighInsLast7, due };
}

/**
 * Registra un pesaje. Si es el más reciente, actualiza también el peso del
 * perfil (que es el que usan los cálculos de calorías y macros).
 */
export async function logWeight(weightKg: number, dateKey: string = toDateKey()): Promise<WeightLog> {
  const latest = (await db.weightLogs.toArray()).reduce<string>((m, l) => (l.date > m ? l.date : m), '0');
  const log: WeightLog = {
    id: `w_${dateKey}_${Date.now().toString(36)}`,
    date: dateKey,
    weightKg: Math.round(weightKg * 10) / 10,
    createdAt: new Date().toISOString()
  };
  await db.weightLogs.put(log);
  const p = get(profile);
  if (p && dateKey >= latest) {
    await saveProfile({ ...p, weightKg: log.weightKg });
  }
  return log;
}
