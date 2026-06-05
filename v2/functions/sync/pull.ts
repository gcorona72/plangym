import { json, getUserIdFromRequest, type PagesContext } from '../_shared';

/**
 * GET /sync/pull?since=<iso>   (Bearer token)
 *   → { records: [{ store, id, updatedAt, deleted, data }], serverTime }
 *
 * Devuelve sólo los registros con updatedAt > since (filtrado por la metadata
 * KV, sin leer cada valor salvo los que de verdad cambiaron). Si `since` está
 * vacío → devuelve todo (primer sync del dispositivo).
 *
 * El cliente fusiona registro a registro (upsert / borra los deleted),
 * nunca hace clear-all → cero pérdida de datos locales no sincronizados.
 */
export const onRequestGet = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!env.PLANGYM_KV) return json({ error: 'kv_not_bound' }, 500);

  const userId = await getUserIdFromRequest(request, env);
  if (!userId) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const since = url.searchParams.get('since') ?? '';

  const prefix = `rec:${userId}:`;
  const changed: { name: string; u: string; d: number; s: string; i: string }[] = [];

  let cursor: string | undefined;
  do {
    const listed = await env.PLANGYM_KV.list({ prefix, cursor, limit: 1000 });
    for (const k of listed.keys) {
      const u: string | undefined = k.metadata?.u;
      if (!u) continue;
      if (since && u <= since) continue;
      changed.push({ name: k.name, u, d: k.metadata?.d ?? 0, s: k.metadata?.s ?? '', i: k.metadata?.i ?? '' });
    }
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);

  // Traemos los valores sólo de los registros cambiados
  const records = await Promise.all(changed.map(async c => {
    const deleted = c.d === 1;
    let data: any = null;
    if (!deleted) {
      const raw = await env.PLANGYM_KV.get(c.name, { type: 'text' });
      data = raw ? JSON.parse(raw) : null;
    }
    return { store: c.s, id: c.i, updatedAt: c.u, deleted, data };
  }));

  return json({ records, serverTime: new Date().toISOString() });
};
