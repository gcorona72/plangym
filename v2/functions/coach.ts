import { json, getUserIdFromRequest, type PagesContext, type Env as BaseEnv } from './_shared';

/**
 * POST /coach  (Bearer token de nuestra cuenta)
 *   body: { messages: [{role:'user'|'assistant', content}], context?: string }
 *   → { reply }
 *
 * Proxy a la API de Gemini (Google AI Studio). La API key vive SÓLO en el
 * servidor (env GEMINI_API_KEY) — nunca llega al navegador. Se exige el token
 * de nuestra cuenta para que nadie ajeno gaste la cuota gratuita.
 *
 * SETUP: definir en Cloudflare Pages → Settings → Variables:
 *   GEMINI_API_KEY = (clave de https://aistudio.google.com/apikey)
 *   GEMINI_MODEL   = gemini-2.0-flash   (opcional)
 */

interface Env extends BaseEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

const SYSTEM_PROMPT = `Eres un entrenador personal y nutricionista deportivo dentro de una app de fitness.
Respondes en español, claro y conciso (máximo ~6 frases salvo que pidan detalle).
Te basas en evidencia (hipertrofia, sobrecarga progresiva, balance energético) y en los DATOS DEL USUARIO que se te dan como contexto.
La app ya calcula sus macros, su programa y su progresión: tu papel es EXPLICAR, motivar y resolver dudas, no inventar planes que contradigan la app.
Si te piden cambiar un ejercicio, propón alternativas que trabajen el mismo músculo.
No das consejo médico; ante dolor, lesión o síntomas, recomienda acudir a un profesional.
Si la pregunta no tiene que ver con entrenamiento, nutrición, descanso o el uso de la app, redirige amablemente.`;

export const onRequestPost = async ({ request, env }: PagesContext & { env: Env }): Promise<Response> => {
  const userId = await getUserIdFromRequest(request, env);
  if (!userId) return json({ error: 'unauthorized', message: 'Inicia sesión para usar el coach.' }, 401);

  if (!env.GEMINI_API_KEY) {
    return json({ error: 'not_configured', message: 'El coach aún no está configurado (falta la API key en el servidor).' }, 503);
  }

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const context = typeof body?.context === 'string' ? body.context.slice(0, 4000) : '';
  if (messages.length === 0) return json({ error: 'no_messages' }, 400);

  // Mapear a formato Gemini (assistant → model)
  const contents = messages.slice(-12).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '').slice(0, 4000) }]
  }));

  const systemText = context ? `${SYSTEM_PROMPT}\n\n--- DATOS DEL USUARIO ---\n${context}` : SYSTEM_PROMPT;
  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 800, topP: 0.95 }
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return json({ error: 'gemini_error', status: res.status, message: errText.slice(0, 300) }, 502);
    }

    const data: any = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
    if (!reply) {
      const blocked = data?.promptFeedback?.blockReason;
      return json({ error: 'empty_reply', message: blocked ? `Bloqueado: ${blocked}` : 'Sin respuesta del modelo.' }, 502);
    }
    return json({ reply });
  } catch (err) {
    return json({ error: 'server_error', message: String(err) }, 500);
  }
};
