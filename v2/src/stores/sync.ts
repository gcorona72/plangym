import { writable } from 'svelte/store';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'disabled';

export interface SyncState {
  enabled: boolean;
  pin: string;          // vacío si no está activado
  status: SyncStatus;
  lastSyncAt: string | null;
  lastError: string | null;
}

const STORAGE_KEY = 'plangym_sync';

function load(): SyncState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      pin: parsed.pin ?? '',
      status: 'disabled',
      lastSyncAt: parsed.lastSyncAt ?? null,
      lastError: null
    };
  } catch {
    return defaultState();
  }
}

function defaultState(): SyncState {
  return { enabled: false, pin: '', status: 'disabled', lastSyncAt: null, lastError: null };
}

function persist(s: SyncState) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    enabled: s.enabled,
    pin: s.pin,
    lastSyncAt: s.lastSyncAt
  }));
}

function createSyncStore() {
  const { subscribe, set, update } = writable<SyncState>(load());
  return {
    subscribe,
    update: (fn: (s: SyncState) => SyncState) => {
      update(s => {
        const next = fn(s);
        persist(next);
        return next;
      });
    },
    set: (s: SyncState) => {
      persist(s);
      set(s);
    },
    enable: (pin: string) => {
      const next: SyncState = {
        enabled: true,
        pin,
        status: 'idle',
        lastSyncAt: null,
        lastError: null
      };
      persist(next);
      set(next);
    },
    disable: () => {
      const next = defaultState();
      persist(next);
      set(next);
    }
  };
}

export const syncState = createSyncStore();
