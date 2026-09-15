import { db } from '$db/database';
import type { WorkoutSession, MissedReason, ExerciseModality } from '$lib/types';

/**
 * Estado de asistencia de una sesión planificada.
 *
 * Un día con plan puede acabar de tres formas:
 *   - ENTRENADO   → sesión con series y `finishedAt`.
 *   - A MEDIAS    → sesión con series pero sin cerrar.
 *   - NO ASISTIDO → el usuario marca la ausencia: el día deja de estar
 *                   "pendiente" pero NO cuenta como entreno (no suma volumen).
 *
 * Marcar la ausencia no cierra la puerta a recuperarla: si luego se registra
 * el entreno, la marca se retira automáticamente.
 */

export const MISSED_REASONS: { id: MissedReason; icon: string; label: string }[] = [
  { id: 'illness', icon: '🤒', label: 'Enfermedad' },
  { id: 'injury',  icon: '🩹', label: 'Lesión'     },
  { id: 'travel',  icon: '✈️', label: 'Viaje'      },
  { id: 'busy',    icon: '⏰', label: 'Sin tiempo' },
  { id: 'rest',    icon: '😴', label: 'Descanso'   }
];

export const MISSED_REASON_LABEL: Record<MissedReason, string> =
  Object.fromEntries(MISSED_REASONS.map(r => [r.id, r.label])) as Record<MissedReason, string>;

export const MISSED_REASON_ICON: Record<MissedReason, string> =
  Object.fromEntries(MISSED_REASONS.map(r => [r.id, r.icon])) as Record<MissedReason, string>;

/**
 * Devuelve la sesión de ese día. Un día tiene como mucho una: preferimos la
 * del plan indicado, pero si sólo hay un marcador de ausencia lo devolvemos
 * igual (su dayId puede diferir si el programa cambió entre medias).
 */
export async function getSessionFor(dateKey: string, dayId: string): Promise<WorkoutSession | null> {
  const sameDate = await db.sessions.where('date').equals(dateKey).toArray();
  return sameDate.find(s => s.dayId === dayId)
      ?? sameDate.find(s => s.missed)
      ?? null;
}

/**
 * Marca un día planificado como NO ASISTIDO.
 * Si ya había una sesión con series registradas, no se borra nada: se
 * devuelve null para que la UI avise (ese día sí se entrenó).
 */
export async function markMissed(
  dateKey: string,
  dayId: string,
  modality: ExerciseModality,
  reason: MissedReason,
  programId: string
): Promise<WorkoutSession | null> {
  const existing = await getSessionFor(dateKey, dayId);
  const hasSets = existing?.exercises.some(e => e.sets.length > 0) ?? false;
  if (existing && hasSets) return null; // hay entreno real: no lo pisamos

  const now = new Date().toISOString();
  const session: WorkoutSession = {
    id: existing?.id ?? `miss_${dateKey}_${dayId}`,
    date: dateKey,
    startedAt: existing?.startedAt ?? now,
    finishedAt: null,
    programId: existing?.programId ?? programId,
    dayId,
    modality,
    exercises: [],
    missed: true,
    missedReason: reason
  };
  await db.sessions.put(session);
  return session;
}

/** Deshace la marca de ausencia (el usuario decide recuperar el entreno). */
export async function unmarkMissed(dateKey: string, dayId: string): Promise<void> {
  const existing = await getSessionFor(dateKey, dayId);
  if (!existing || !existing.missed) return;
  // Sólo era un marcador de ausencia (sin series) → se elimina el registro
  await db.sessions.delete(existing.id);
}

/**
 * Motivo dominante de las ausencias registradas en un rango de fechas.
 * Se usa para matizar la reducción de carga al volver: un parón por
 * enfermedad desacondiciona más que uno por agenda.
 */
export async function dominantMissedReason(
  fromKey: string,
  toKey: string
): Promise<MissedReason | null> {
  const rows = await db.sessions.where('date').between(fromKey, toKey, false, true).toArray();
  const missed = rows.filter(s => s.missed && s.missedReason);
  if (missed.length === 0) return null;

  const counts = new Map<MissedReason, number>();
  for (const m of missed) {
    const r = m.missedReason!;
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  // Enfermedad y lesión mandan aunque sean minoría: son las que más pesan.
  for (const priority of ['injury', 'illness'] as MissedReason[]) {
    if (counts.has(priority)) return priority;
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Nº de sesiones marcadas como no asistidas en un rango. */
export async function countMissed(fromKey: string, toKey: string): Promise<number> {
  const rows = await db.sessions.where('date').between(fromKey, toKey, true, true).toArray();
  return rows.filter(s => s.missed).length;
}
