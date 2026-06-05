import { writable } from 'svelte/store';

/**
 * Autenticación con cuenta (email + contraseña) contra el backend de
 * Cloudflare Pages Functions. El token se guarda en localStorage.
 *
 * La app sigue siendo local-first: la cuenta es OPCIONAL y sólo sirve para
 * activar la sincronización entre dispositivos. Sin cuenta, todo funciona
 * igual en local.
 */

export interface AuthState {
  token: string | null;
  email: string | null;
  userId: string | null;
}

const STORAGE_KEY = 'plangym_auth';

function load(): AuthState {
  if (typeof localStorage === 'undefined') return { token: null, email: null, userId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, email: null, userId: null };
    const p = JSON.parse(raw);
    return { token: p.token ?? null, email: p.email ?? null, userId: p.userId ?? null };
  } catch {
    return { token: null, email: null, userId: null };
  }
}

function persist(s: AuthState) {
  if (typeof localStorage === 'undefined') return;
  if (s.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

export const auth = writable<AuthState>(load());

export function getToken(): string | null {
  return load().token;
}

interface AuthResponse {
  ok: boolean;
  error?: string;
  message?: string;
}

async function call(path: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error, message: data.message };
    }
    const next: AuthState = { token: data.token, email: data.email, userId: data.userId };
    persist(next);
    auth.set(next);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'network', message: (e as Error).message };
  }
}

export const register = (email: string, password: string) => call('/auth/register', email, password);
export const login = (email: string, password: string) => call('/auth/login', email, password);

export function logout() {
  persist({ token: null, email: null, userId: null });
  auth.set({ token: null, email: null, userId: null });
}
