import { db } from '$db/database';
import { getToken, logout } from '$stores/auth';
import { writable } from 'svelte/store';
import type { Table } from 'dexie';

/**
 * Motor de sincronización POR REGISTRO.
 *
 * A diferencia del modelo viejo (subía una foto completa y al bajar borraba
 * todo lo local), este:
 *   - Detecta qué registros cambiaron localmente comparando un hash de
 *     contenido contra el último estado sincronizado (guardado en localStorage).
 *   - Sube SOLO los registros cambiados/borrados.
 *   - Baja SOLO los registros que el servidor tiene más nuevos (since=).
 *   - Fusiona registro a registro (upsert/delete), nunca clear-all.
 *
 * Resolución de conflictos: last-write-wins POR REGISTRO usando updatedAt.
 * Para un único usuario en varios dispositivos es más que suficiente y
 * elimina la pérdida de datos del modelo anterior.
 */

// Tablas que se sincronizan (datos del usuario). Excluimos seeds (exercises,
// ingredients) que son iguales en todos los dispositivos.
const SYNC_STORES: { name: string; table: () => Table<any, any> }[] = [
  { name: 'profile',        table: () => db.profile },
  { name: 'settings',       table: () => db.settings },
  { name: 'programs',       table: () => db.programs },
  { name: 'sessions',       table: () => db.sessions },
  { name: 'mealLogs',       table: () => db.mealLogs },
  { name: 'sleep',          table: () => db.sleep },
  { name: 'weightLogs',     table: () => db.weightLogs },
  { name: 'cardioSessions', table: () => db.cardioSessions },
  { name: 'recipes',        table: () => db.recipes },
  { name: 'achievements',   table: () => db.achievements }
];

const META_KEY = 'plangym_syncmeta';
const PULL_KEY = 'plangym_lastpull';

interface MetaEntry { h: string; u: string; } // hash + updatedAt
type MetaMap = Record<string, MetaEntry>;      // clave: `${store}:${id}`

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
export interface SyncEngineState {
  status: SyncStatus;
  lastSyncAt: string | null;
  lastError: string | null;
}
export const syncEngineState = writable<SyncEngineState>({ status: 'idle', lastSyncAt: null, lastError: null });

// ─── PERSISTENCIA META ──────────────────────────────────────────────────────
function loadMeta(): MetaMap {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? '{}'); } catch { return {}; }
}
function saveMeta(m: MetaMap) { localStorage.setItem(META_KEY, JSON.stringify(m)); }
function loadLastPull(): string { return localStorage.getItem(PULL_KEY) ?? ''; }
function saveLastPull(t: string) { localStorage.setItem(PULL_KEY, t); }

/** Resetea el estado de sync (al hacer logout o cambiar de cuenta). */
export function resetSyncMeta() {
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(PULL_KEY);
}

// ─── HASH DE CONTENIDO (djb2) ───────────────────────────────────────────────
function hashRecord(rec: unknown): string {
  const s = JSON.stringify(rec);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + ':' + s.length;
}

function coerceKey(store: string, id: string): string | number {
  return store === 'profile' || store === 'settings' ? Number(id) : id;
}

// ─── PULL ───────────────────────────────────────────────────────────────────
async function pull(token: string): Promise<void> {
  const since = loadLastPull();
  const res = await fetch(`/sync/pull?since=${encodeURIComponent(since)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Sesión expirada'); }
  if (!res.ok) throw new Error(`pull ${res.status}`);

  const { records, serverTime } = await res.json();
  const meta = loadMeta();

  for (const r of records as any[]) {
    const key = `${r.store}:${r.id}`;
    const local = meta[key];
    // Si lo local es más nuevo que lo que baja → no tocar (se subirá luego)
    if (local && local.u > r.updatedAt) continue;

    const tableDef = SYNC_STORES.find(s => s.name === r.store);
    if (!tableDef) continue;
    const table = tableDef.table();

    if (r.deleted) {
      await table.delete(coerceKey(r.store, r.id));
      delete meta[key];
    } else if (r.data != null) {
      await table.put(r.data);
      meta[key] = { h: hashRecord(r.data), u: r.updatedAt };
    }
  }

  saveMeta(meta);
  if (serverTime) saveLastPull(serverTime);
}

// ─── PUSH ───────────────────────────────────────────────────────────────────
async function push(token: string): Promise<void> {
  const meta = loadMeta();
  const now = new Date().toISOString();
  const changes: any[] = [];
  const seen = new Set<string>();

  // Detectar nuevos / modificados
  for (const { name, table } of SYNC_STORES) {
    const rows = await table().toArray();
    for (const rec of rows) {
      const id = String((rec as any).id);
      const key = `${name}:${id}`;
      seen.add(key);
      const h = hashRecord(rec);
      const prev = meta[key];
      if (!prev || prev.h !== h) {
        const updatedAt = now;
        changes.push({ store: name, id, updatedAt, data: rec });
        meta[key] = { h, u: updatedAt };
      }
    }
  }

  // Detectar borrados (estaban en meta y ya no existen)
  for (const key of Object.keys(meta)) {
    if (seen.has(key)) continue;
    const [store, ...rest] = key.split(':');
    const id = rest.join(':');
    changes.push({ store, id, updatedAt: now, deleted: true });
    delete meta[key];
  }

  if (changes.length === 0) return;

  const res = await fetch('/sync/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes })
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error('Sesión expirada'); }
  if (!res.ok) throw new Error(`push ${res.status}`);

  saveMeta(meta);
}

// ─── CICLO COMPLETO ─────────────────────────────────────────────────────────
let syncing = false;

export async function fullSync(): Promise<void> {
  const token = getToken();
  if (!token) return;
  if (syncing) return;
  syncing = true;
  syncEngineState.update(s => ({ ...s, status: 'syncing', lastError: null }));
  try {
    await pull(token);   // primero bajar lo de otros dispositivos
    await push(token);   // luego subir lo nuestro
    const at = new Date().toISOString();
    syncEngineState.set({ status: 'idle', lastSyncAt: at, lastError: null });
  } catch (e) {
    syncEngineState.update(s => ({ ...s, status: 'error', lastError: (e as Error).message }));
  } finally {
    syncing = false;
  }
}

function handleUnauthorized() {
  // Token caducado/ inválido → cerrar sesión local para forzar re-login
  logout();
  stopAutoSync();
}

// ─── AUTO-SYNC ──────────────────────────────────────────────────────────────
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushDebounce: ReturnType<typeof setTimeout> | null = null;
const POLL_MS = 20_000;     // baja cambios de otros dispositivos cada 20s
const DEBOUNCE_MS = 4_000;  // sube cambios locales 4s después del último cambio

export function startAutoSync(): void {
  if (!getToken()) return;
  fullSync();
  if (!pollTimer) pollTimer = setInterval(fullSync, POLL_MS);
}

export function stopAutoSync(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (pushDebounce) { clearTimeout(pushDebounce); pushDebounce = null; }
}

/** Llamar cuando IndexedDB cambia → dispara un push debounced. */
export function markDirty(): void {
  if (!getToken()) return;
  if (pushDebounce) clearTimeout(pushDebounce);
  pushDebounce = setTimeout(() => { fullSync(); pushDebounce = null; }, DEBOUNCE_MS);
}
