import { db } from '$db/database';
import type { WorkoutSession, DailyMealLog, SleepEntry, Macros, CardioSession } from './types';
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

/** Sesiones de cardio en un rango. Igual API que las anteriores. */
export async function getCardioBetween(startKey: string, endKey: string): Promise<CardioSession[]> {
  return db.cardioSessions.where('date').between(startKey, endKey, true, true).toArray();
}

/** Snapshot del día (hoy o cualquier fecha). */
export interface DayStatus {
  date: string;
  hasSession: boolean;
  sessionModality?: 'gym' | 'calisthenics';
  mealsLogged: number;
  macros: Macros;
  sleepMinutes?: number;
  /** Nº de sesiones de cardio registradas ese día. */
  cardioCount: number;
  /** Distancia total cardio en metros (suma de todas las sesiones). */
  cardioDistanceMeters: number;
  /** Duración total cardio en segundos. */
  cardioDurationSeconds: number;
  /** Calorías cardio estimadas (suma). */
  cardioKcal: number;
  /** Tipos únicos para mostrar iconos. */
  cardioTypes: string[];
}

export function buildDayStatus(
  dateKey: string,
  sessions: WorkoutSession[],
  mealLogs: DailyMealLog[],
  sleep: SleepEntry[],
  cardio: CardioSession[] = []
): DayStatus {
  const s = sessions.find(x => x.date === dateKey);
  const log = mealLogs.find(x => x.date === dateKey);
  const sl = sleep.find(x => x.date === dateKey);
  const dayCardio = cardio.filter(c => c.date === dateKey);
  return {
    date: dateKey,
    hasSession: !!s && !!s.finishedAt,
    sessionModality: s?.modality,
    mealsLogged: log?.meals.length ?? 0,
    macros: log ? macrosOfLog(log) : { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
    sleepMinutes: sl?.durationMinutes,
    cardioCount: dayCardio.length,
    cardioDistanceMeters: dayCardio.reduce((a, c) => a + c.distanceMeters, 0),
    cardioDurationSeconds: dayCardio.reduce((a, c) => a + c.durationSeconds, 0),
    cardioKcal: dayCardio.reduce((a, c) => a + (c.estimatedKcal ?? 0), 0),
    cardioTypes: Array.from(new Set(dayCardio.map(c => c.type)))
  };
}
