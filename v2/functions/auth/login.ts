import {
  json, hashPassword, timingSafeEqual, newToken, isValidEmail,
  TOKEN_TTL_SECONDS, type PagesContext
} from '../_shared';

/**
 * POST /auth/login   { email, password }
 *   → si las credenciales son correctas devuelve { token, email }.
 *
 * Respuesta genérica en caso de fallo (no revela si el email existe).
 */
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PLANGYM_KV) return json({ error: 'kv_not_bound' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!isValidEmail(email) || password.length < 1) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  const user = await env.PLANGYM_KV.get(`user:${email}`, { type: 'json' });
  if (!user) return json({ error: 'invalid_credentials' }, 401);

  const { hash } = await hashPassword(password, user.pwSalt);
  if (!timingSafeEqual(hash, user.pwHash)) {
    return json({ error: 'invalid_credentials' }, 401);
  }

  const token = newToken();
  await env.PLANGYM_KV.put(`tok:${token}`, user.id, { expirationTtl: TOKEN_TTL_SECONDS });

  return json({ token, email, userId: user.id });
};
