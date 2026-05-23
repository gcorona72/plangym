import { db } from '$db/database';
import type { WorkoutSession, DailyMealLog, SleepEntry, Macros } from './types';
import { toDateKey } from './dateUtils';

/** Suma macros de un array. */
export function sumMacros(list: Macros[]): Macros {
  return list.reduce((a, m) => ({
    kcal: a.kcal + m.kcal,
    proteinG: a.proteinG + m.proteinG,
    carbsG: a.carbsG + m.carbsG,
    fatsG: a.fatsG + m.fatsG
  }), { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
}

export function macrosOfLog(log: DailyMealLog): Macros {
  return sumMacros(log.meals.map(m => m.macros));
}

/** Sesiones en un rango de fechas (inclusive). */
export async function getSessionsBetween(startKey: string, endKey: string): Promise<WorkoutSession[]> {
  return db.sessions.where('date').between(startKey, endKey, true, true).toArray();
}

export async function getMealLogsBetween(startKey: string, endKey: string): Promise<DailyMealLog[]> {
  return db.mealLogs.where('date').between(startKey, endKey, true, true).toArray();
}

export async function getSleepBetween(startKey: string, endKey: string): Promise<SleepEntry[]> {
  return db.sleep.where('date').between(startKey, endKey, true, true).toArray();
}

/** Snapshot del día (hoy o cualquier fecha). */
export interface DayStatus {
  date: string;
  hasSession: boolean;
  sessionModality?: 'gym' | 'calisthenics';
  mealsLogged: number;
  macros: Macros;
  sleepMinutes?: number;
}

export function buildDayStatus(
  dateKey: string,
  sessions: WorkoutSession[],
  mealLogs: DailyMealLog[],
  sleep: SleepEntry[]
): DayStatus {
  const s = sessions.find(x => x.date === dateKey);
  const log = mealLogs.find(x => x.date === dateKey);
  const sl = sleep.find(x => x.date === dateKey);
  return {
    date: dateKey,
    hasSession: !!s && !!s.finishedAt,
    sessionModality: s?.modality,
    mealsLogged: log?.meals.length ?? 0,
    macros: log ? macrosOfLog(log) : { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
    sleepMinutes: sl?.durationMinutes
  };
}
