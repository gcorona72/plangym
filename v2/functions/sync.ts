/**
 * Endpoint de sincronización para Cloudflare Pages Functions.
 *
 * Equivalente a la Netlify Function `netlify/functions/sync.mts` pero usando
 * Cloudflare KV para el almacén persistente. Misma API pública:
 *
 *   GET  /sync?key=<hash>   → JSON guardado o 404
 *   POST /sync?key=<hash>   → guarda body como JSON
 *
 * La clave es un hash SHA-256 del PIN del usuario (calculado en el cliente),
 * así el PIN nunca llega al servidor.
 *
 * SETUP en Cloudflare:
 *   1. Crear un KV namespace llamado "PLANGYM_KV" en el dashboard
 *      (Workers & Pages → KV → Create namespace)
 *   2. En la configuración del proyecto Pages → Settings → Functions →
 *      KV namespace bindings → añadir:
 *        Variable name: PLANGYM_KV
 *        KV namespace:  (el creado en el paso 1)
 *   3. Redeploy.
 */

interface Env {
  PLANGYM_KV: KVNamespace;
}

interface EventContext {
  request: Request;
  env: Env;
}

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const onRequest = async ({ request, env }: EventContext): Promise<Response> => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || key.length < 32 || key.length > 128) {
    return json({ error: 'invalid_key' }, 400);
  }
  if (!/^[a-f0-9]+$/i.test(key)) {
    return json({ error: 'invalid_key_format' }, 400);
  }

  if (!env.PLANGYM_KV) {
    return json({ error: 'kv_not_bound', message: 'PLANGYM_KV namespace no bindeado en CF Pages.' }, 500);
  }

  try {
    if (request.method === 'GET') {
      const raw = await env.PLANGYM_KV.get(key, { type: 'json' });
      if (!raw) return json({ error: 'not_found' }, 404);
      return json(raw);
    }

    if (request.method === 'POST') {
      const body = await request.text();
      if (body.length > MAX_PAYLOAD_BYTES) {
        return json({ error: 'too_large' }, 413);
      }
      let parsed: any;
      try {
        parsed = JSON.parse(body);
      } catch {
        return json({ error: 'invalid_json' }, 400);
      }
      const wrapped = { ...parsed, _syncedAt: new Date().toISOString() };
      await env.PLANGYM_KV.put(key, JSON.stringify(wrapped));
      return json({ ok: true, syncedAt: wrapped._syncedAt });
    }

    return json({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    console.error('Sync error', err);
    return json({ error: 'server_error', message: String(err) }, 500);
  }
};

// Tipo mínimo para que TS compile sin @cloudflare/workers-types
interface KVNamespace {
  get(key: string, options?: { type: 'json' | 'text' }): Promise<any>;
  put(key: string, value: string): Promise<void>;
}
