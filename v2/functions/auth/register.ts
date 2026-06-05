import {
  json, hashPassword, newToken, newId, isValidEmail,
  TOKEN_TTL_SECONDS, type PagesContext
} from '../_shared';

/**
 * POST /auth/register   { email, password }
 *   → crea el usuario si el email no existe, devuelve { token, email }.
 */
export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  try {
    return await register(ctx);
  } catch (err) {
    return json({ error: 'server_error', message: String(err), stack: (err as Error)?.stack }, 500);
  }
};

const register = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PLANGYM_KV) return json({ error: 'kv_not_bound' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');

  if (!isValidEmail(email)) return json({ error: 'invalid_email' }, 400);
  if (password.length < 8) return json({ error: 'weak_password', message: 'Mínimo 8 caracteres.' }, 400);

  const existing = await env.PLANGYM_KV.get(`user:${email}`, { type: 'json' });
  if (existing) return json({ error: 'email_taken', message: 'Ese email ya está registrado. Inicia sesión.' }, 409);

  const { hash, salt } = await hashPassword(password);
  const userId = newId();
  await env.PLANGYM_KV.put(`user:${email}`, JSON.stringify({
    id: userId, email, pwHash: hash, pwSalt: salt, createdAt: new Date().toISOString()
  }));

  const token = newToken();
  await env.PLANGYM_KV.put(`tok:${token}`, userId, { expirationTtl: TOKEN_TTL_SECONDS });

  return json({ token, email, userId });
};
