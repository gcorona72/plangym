/**
 * EventBus — pub/sub global tipado.
 *
 * Patrón Observer formalizado: en vez de tener listeners ad-hoc dispersos
 * (db.onDataChange, syncState updates, …) tenemos UN solo lugar donde
 * suscribirse a eventos del dominio.
 *
 * Uso:
 *   eventBus.on('session.completed', (session) => { ... });
 *   eventBus.emit('session.completed', mySession);
 */

import type { WorkoutSession, WeightLog, MealEntry } from '$lib/types';

/** Tipos de eventos que la app puede emitir. Tipados explícitamente. */
export interface EventMap {
  'data.changed': void;
  'session.completed': { session: WorkoutSession };
  'set.logged': { exerciseId: string; weightKg?: number; reps: number; rir?: number };
  'meal.logged': { meal: MealEntry; date: string };
  'weight.logged': { log: WeightLog };
  'pr.achieved': { exerciseId: string; weightKg: number; reps: number };
  'sync.started': void;
  'sync.completed': { syncedAt: string };
  'sync.error': { message: string };
}

type EventKey = keyof EventMap;
type Listener<K extends EventKey> = (payload: EventMap[K]) => void;

class EventBusImpl {
  private listeners = new Map<EventKey, Set<Listener<any>>>();

  /** Suscribe a un evento. Devuelve función para des-suscribir. */
  on<K extends EventKey>(event: K, fn: Listener<K>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  /** Suscribe una sola vez y se auto-desuscribe. */
  once<K extends EventKey>(event: K, fn: Listener<K>): void {
    const wrapper: Listener<K> = (payload) => {
      this.off(event, wrapper);
      fn(payload);
    };
    this.on(event, wrapper);
  }

  off<K extends EventKey>(event: K, fn: Listener<K>): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit<K extends EventKey>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Copia defensiva por si algún listener se desuscribe durante la iteración
    for (const fn of Array.from(set)) {
      try { fn(payload); } catch (err) {
        console.error(`[EventBus] error in listener for ${String(event)}:`, err);
      }
    }
  }

  /** Solo para tests. */
  clearAll(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBusImpl();
