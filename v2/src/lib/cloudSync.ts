/**
 * Sincronización con la nube via Netlify Functions + Blobs.
 *
 * Modelo: snapshot completo del IndexedDB se sube al cloud cada vez que cambia.
 *
 *   Cliente A → cambio local → upload (debounced) → cloud
 *   Cliente B → carga app → pull → IF newer → import (replace local)
 *
 * Conflict resolution: last-write-wins (server timestamp). Para 1 usuario en 2
 * dispositivos es suficiente; el riesgo de pérdida sólo existe si haces cambios
 * en ambos sin sincronizar primero.
 *
 * Seguridad: el PIN nunca sale del cliente. Lo usamos para derivar un hash
 * SHA-256 que actúa como "clave" en el almacén de Netlify Blobs. Sin el PIN
 * (y a menos que se brute-force el hash), nadie puede leer los datos.
 */

import { exportAllData, importAllData } from '$db/database';
import { syncState, type SyncStatus } from '$stores/sync';
import { get } from 'svelte/store';

const ENDPOINT = '/.netlify/functions/sync';
const SALT = 'plangym-v2-salt-2026'; // sal fija para dificultar lookup table attacks
const POLL_INTERVAL_MS = 10_000;      // chequeo cada 10s
const DEBOUNCE_MS = 3_000;            // espera 3s sin cambios antes de subir

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastUploadedHash: string | null = null;
let lastSyncedAt: string | null = null;

// ─── HELPERS ───────────────────────────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function pinToKey(pin: string): Promise<string> {
  return sha256Hex(SALT + ':' + pin);
}

function setStatus(status: SyncStatus, details?: { lastSyncAt?: string; error?: string }) {
  syncState.update(s => ({
    ...s,
    status,
    lastSyncAt: details?.lastSyncAt ?? s.lastSyncAt,
    lastError: status === 'error' ? (details?.error ?? null) : null
  }));
}

// ─── PUSH (subir cambios) ──────────────────────────────────────────────────
async function uploadIfChanged(): Promise<void> {
  const state = get(syncState);
  if (!state.enabled || !state.pin) return;

  setStatus('syncing');
  try {
    const json = await exportAllData();
    const hash = await sha256Hex(json);
    if (hash === lastUploadedHash) {
      // Sin cambios desde la última subida
      setStatus('idle');
      return;
    }

    const key = await pinToKey(state.pin);
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: 'POST',
      body: json,
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Upload failed (${res.status}): ${errBody}`);
    }
    const result = await res.json().catch(() => ({} as any));
    lastUploadedHash = hash;
    lastSyncedAt = result.syncedAt ?? new Date().toISOString();
    setStatus('idle', { lastSyncAt: lastSyncedAt ?? undefined });
  } catch (err) {
    console.error('cloudSync upload error', err);
    setStatus('error', { error: (err as Error).message });
  }
}

/** Marca que hay cambios pendientes y dispara una subida debounced. */
export function markDirty(): void {
  const state = get(syncState);
  if (!state.enabled) return;
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(() => {
    uploadIfChanged();
    pushDebounceTimer = null;
  }, DEBOUNCE_MS);
}

// ─── PULL (descargar de la nube) ───────────────────────────────────────────
export interface PullResult {
  status: 'no_cloud_data' | 'pulled' | 'unchanged' | 'error';
  syncedAt?: string;
  message?: string;
}

/**
 * Descarga el snapshot de la nube. Si llamas con `force=true` reemplaza
 * los datos locales. Por defecto, sólo reemplaza si el snapshot remoto es
 * más nuevo que la última versión que conocemos local.
 */
export async function pullFromCloud(force: boolean = false): Promise<PullResult> {
  const state = get(syncState);
  if (!state.enabled || !state.pin) {
    return { status: 'error', message: 'Sync no está activado' };
  }
  setStatus('syncing');
  try {
    const key = await pinToKey(state.pin);
    const res = await fetch(`${ENDPOINT}?key=${key}`);
    if (res.status === 404) {
      setStatus('idle');
      return { status: 'no_cloud_data' };
    }
    if (!res.ok) throw new Error(`Pull failed (${res.status})`);

    const remote = await res.json();
    const remoteSyncedAt: string | undefined = remote._syncedAt;

    // Si no hay timestamp local OR el remoto es más nuevo OR force → importar
    if (force || !lastSyncedAt || (remoteSyncedAt && remoteSyncedAt > lastSyncedAt)) {
      // Quitar campos meta antes de importar
      const { _syncedAt, ...payload } = remote;
      await importAllData(JSON.stringify(payload));
      const json = await exportAllData();
      lastUploadedHash = await sha256Hex(json);
      lastSyncedAt = remoteSyncedAt ?? new Date().toISOString();
      setStatus('idle', { lastSyncAt: lastSyncedAt });
      return { status: 'pulled', syncedAt: lastSyncedAt };
    }

    setStatus('idle');
    return { status: 'unchanged' };
  } catch (err) {
    console.error('cloudSync pull error', err);
    setStatus('error', { error: (err as Error).message });
    return { status: 'error', message: (err as Error).message };
  }
}

// ─── CICLO DE VIDA ─────────────────────────────────────────────────────────
/**
 * Arranca el ciclo de auto-sync: pulling on start + polling para subir cambios.
 */
export async function startAutoSync(): Promise<void> {
  if (pollTimer) return;
  const state = get(syncState);
  if (!state.enabled || !state.pin) return;

  // Pull inicial (no forzado, solo si remoto es más nuevo)
  await pullFromCloud(false);

  // Polling para detectar cambios locales y subirlos
  pollTimer = setInterval(() => {
    uploadIfChanged();
  }, POLL_INTERVAL_MS);
}

export function stopAutoSync(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = null;
  }
}

/**
 * Activa sync por primera vez con un PIN. Si la nube tiene datos para
 * ese PIN, devuelve `cloud_has_data` para pedir confirmación antes de
 * sobrescribir lo local.
 */
export async function checkCloudForPin(pin: string): Promise<'empty' | 'has_data' | 'error'> {
  try {
    const key = await pinToKey(pin);
    const res = await fetch(`${ENDPOINT}?key=${key}`);
    if (res.status === 404) return 'empty';
    if (res.ok) return 'has_data';
    return 'error';
  } catch {
    return 'error';
  }
}

/** Sube datos por primera vez (cuando la nube está vacía con ese PIN). */
export async function initialPush(): Promise<void> {
  lastUploadedHash = null; // forzar upload
  await uploadIfChanged();
}
