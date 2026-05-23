import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

/**
 * Endpoint de sincronización:
 *
 *  GET  /.netlify/functions/sync?key=<hash>
 *    → devuelve el JSON guardado para esa clave, o 404 si no existe.
 *
 *  POST /.netlify/functions/sync?key=<hash>
 *    → guarda el cuerpo de la petición como JSON para esa clave.
 *
 * La clave es un hash SHA-256 del PIN del usuario (calculado en el cliente),
 * así el PIN nunca llega al servidor.
 *
 * Cada PIN diferente → blob diferente. Una persona puede tener varios PINs
 * para tener "espacios" separados.
 */
export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (!key || key.length < 32 || key.length > 128) {
    return new Response(JSON.stringify({ error: 'invalid_key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Solo aceptamos hashes hex
  if (!/^[a-f0-9]+$/i.test(key)) {
    return new Response(JSON.stringify({ error: 'invalid_key_format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const store = getStore({ name: 'plangym-user-data', consistency: 'strong' });

  try {
    if (req.method === 'GET') {
      const data = await store.get(key, { type: 'json' });
      if (!data) {
        return new Response(JSON.stringify({ error: 'not_found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Devolvemos el JSON tal cual con su metadata
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.text();
      // Validamos que sea JSON válido y no demasiado grande
      if (body.length > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'too_large' }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      let parsed: any;
      try {
        parsed = JSON.parse(body);
      } catch {
        return new Response(JSON.stringify({ error: 'invalid_json' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Añadimos timestamp del servidor para conflict resolution
      const wrapped = {
        ...parsed,
        _syncedAt: new Date().toISOString()
      };
      await store.setJSON(key, wrapped);
      return new Response(JSON.stringify({ ok: true, syncedAt: wrapped._syncedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Sync error', err);
    return new Response(JSON.stringify({ error: 'server_error', message: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
