import { json, getUserIdFromRequest, ALLOWED_STORES, type PagesContext } from '../_shared';

/**
 * POST /sync/push   (Bearer token)
 *   body: { changes: [{ store, id, updatedAt, deleted?, data }] }
 *
 * Merge por-registro con last-write-wins POR REGISTRO (no por toda la BBDD):
 * un cambio entrante sólo se aplica si su `updatedAt` es más reciente que el
 * que el servidor ya tiene. Así dos dispositivos no se machacan datos enteros;
 * como mucho "pierde" el registro concreto que se editó más antiguo.
 *
 * Devuelve { applied, skipped, serverTime }.
 */
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PLANGYM_KV) return json({ error: 'kv_not_bound' }, 500);

  const userId = await getUserIdFromRequest(request, env);
  if (!userId) return json({ error: 'unauthorized' }, 401);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const changes = Array.isArray(body?.changes) ? body.changes : null;
  if (!changes) return json({ error: 'invalid_changes' }, 400);
  if (changes.length > 5000) return json({ error: 'too_many_changes' }, 413);

  let applied = 0;
  let skipped = 0;

  for (const ch of changes) {
    const store = String(ch?.store ?? '');
    const id = String(ch?.id ?? '');
    const updatedAt = String(ch?.updatedAt ?? '');
    const deleted = ch?.deleted === true;

    if (!ALLOWED_STORES.has(store) || !id || !updatedAt) { skipped++; continue; }
    if (id.length > 200) { skipped++; continue; }

    const key = `rec:${userId}:${store}:${id}`;
    const existing = await env.PLANGYM_KV.getWithMetadata(key, { type: 'text' });
    const existingU: string | undefined = existing?.metadata?.u;

    // Sólo aplicar si es estrictamente más nuevo que lo guardado
    if (existingU && existingU >= updatedAt) { skipped++; continue; }

    const value = deleted ? '' : JSON.stringify(ch.data ?? null);
    if (value.length > 1024 * 1024) { skipped++; continue; } // 1 MB por registro

    await env.PLANGYM_KV.put(key, value, {
      metadata: { u: updatedAt, d: deleted ? 1 : 0, s: store, i: id }
    });
    applied++;
  }

  return json({ applied, skipped, serverTime: new Date().toISOString() });
};
