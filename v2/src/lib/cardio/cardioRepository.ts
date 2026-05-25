import { db } from '$db/database';
import type { CardioSession, CardioType } from '$lib/types';

/**
 * Acceso a la tabla `cardioSessions` de IndexedDB.
 * Mantiene la API plana — Svelte components no tocan Dexie directamente.
 */

export async function saveCardioSession(s: Omit<CardioSession, 'id'>): Promise<string> {
  const id = `cardio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await db.cardioSessions.add({ ...s, id });
  return id;
}

export async function getCardioSession(id: string): Promise<CardioSession | undefined> {
  return db.cardioSessions.get(id);
}

export async function deleteCardioSession(id: string): Promise<void> {
  await db.cardioSessions.delete(id);
}

/** Lista todas las sesiones, más recientes primero. */
export async function listCardioSessions(limit = 100): Promise<CardioSession[]> {
  return db.cardioSessions.orderBy('startedAt').reverse().limit(limit).toArray();
}

/**
 * Última sesión registrada de un tipo concreto. Sirve para mostrar al
 * usuario "Última: X km · Y min" en el lanzador, como referencia a batir.
 */
export async function getLastCardioSessionOfType(type: CardioType): Promise<CardioSession | null> {
  const sessions = await db.cardioSessions
    .orderBy('startedAt')
    .reverse()
    .filter(s => s.type === type)
    .limit(1)
    .toArray();
  return sessions[0] ?? null;
}

/** Sesiones de un rango de fechas (date keys ISO yyyy-mm-dd, inclusive). */
export async function getCardioSessionsBetween(fromDate: string, toDate: string): Promise<CardioSession[]> {
  return db.cardioSessions
    .where('date')
    .between(fromDate, toDate, true, true)
    .toArray();
}

export interface CardioStats {
  totalSessions: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  byType: Partial<Record<CardioType, number>>; // nº sesiones por tipo
}

/** Stats agregadas de la semana / mes (informativo en dashboard). */
export async function computeCardioStats(fromDate: string, toDate: string): Promise<CardioStats> {
  const sessions = await getCardioSessionsBetween(fromDate, toDate);
  const stats: CardioStats = {
    totalSessions: sessions.length,
    totalDistanceMeters: sessions.reduce((a, s) => a + s.distanceMeters, 0),
    totalDurationSeconds: sessions.reduce((a, s) => a + s.durationSeconds, 0),
    byType: {}
  };
  for (const s of sessions) {
    stats.byType[s.type] = (stats.byType[s.type] ?? 0) + 1;
  }
  return stats;
}
