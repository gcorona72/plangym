/**
 * Utilidades compartidas por las Cloudflare Pages Functions de auth + sync.
 *
 * Todo se apoya en un único KV namespace (PLANGYM_KV) con tres familias de clave:
 *
 *   user:<emailLower>          → { id, pwHash, pwSalt, createdAt }
 *   tok:<token>                → userId            (con expirationTtl)
 *   rec:<userId>:<store>:<id>  → JSON del registro (metadata: { u, d, s, i })
 *
 * Sync por-registro: cada registro lleva su `updatedAt` en la metadata KV,
 * así el pull puede filtrar "dame lo cambiado desde T" sin leer cada valor,
 * y el merge nunca borra de golpe (a diferencia del modelo viejo de snapshot).
 */

export interface KVNamespace {
  get(key: string, options?: { type: 'json' | 'text' }): Promise<any>;
  getWithMetadata(key: string, options?: { type: 'json' | 'text' }): Promise<{ value: any; metadata: any }>;
  put(key: string, value: string, options?: { metadata?: any; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: { name: string; metadata?: any; expiration?: number }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface Env {
  PLANGYM_KV: KVNamespace;
}

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

// ─── RESPUESTAS JSON ────────────────────────────────────────────────────────
export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

// ─── HEX ────────────────────────────────────────────────────────────────────
function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// ─── HASH DE CONTRASEÑA (PBKDF2-SHA256, 100k iteraciones) ────────────────────
const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { hash: toHex(bits), salt: toHex(salt) };
}

/** Comparación en tiempo constante (evita timing attacks). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── TOKENS ─────────────────────────────────────────────────────────────────
export const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 días

export function newToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function newId(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(12)));
}

/** Devuelve el userId del token Bearer, o null si no es válido. */
export async function getUserIdFromRequest(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization') ?? '';
  const m = auth.match(/^Bearer\s+([a-f0-9]{64})$/i);
  if (!m) return null;
  const userId = await env.PLANGYM_KV.get(`tok:${m[1]}`, { type: 'text' });
  return userId || null;
}

// ─── VALIDACIÓN ─────────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Stores permitidos para sync (mismas tablas de IndexedDB). */
export const ALLOWED_STORES = new Set([
  'profile', 'settings', 'programs', 'sessions',
  'mealLogs', 'sleep', 'weightLogs', 'cardioSessions', 'recipes', 'achievements'
]);
