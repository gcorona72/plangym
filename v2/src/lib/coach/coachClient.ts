import { db } from '$db/database';
import { getToken } from '$stores/auth';
import { calculateGoals } from '$lib/nutrition/macros';
import { calculateAge } from '$lib/nutrition/macros';
import { getNutritionMode, modeCopy } from '$lib/profileMode';
import { isoDayOfWeek } from '$lib/dateUtils';

export interface CoachMessage { role: 'user' | 'assistant'; content: string; }

/**
 * Construye un resumen compacto del usuario para dárselo al coach como
 * contexto. Sin esto el coach respondería genérico; con esto conoce tu plan,
 * tus macros y tus últimas sesiones.
 */
export async function buildCoachContext(): Promise<string> {
  const profile = await db.profile.get(1);
  if (!profile) return 'El usuario aún no ha completado su perfil.';

  const lines: string[] = [];
  const age = (() => { try { return calculateAge(profile.birthDate); } catch { return null; } })();
  lines.push(`Nombre: ${profile.name}. Sexo: ${profile.sex === 'male' ? 'hombre' : 'mujer'}${age ? `, ${age} años` : ''}.`);
  lines.push(`Medidas: ${profile.heightCm} cm, ${profile.weightKg} kg${profile.bodyFatPct ? `, ${profile.bodyFatPct}% grasa` : ''}.`);

  const mode = getNutritionMode(profile);
  lines.push(`Objetivo / fase: ${modeCopy(mode).label} (${mode}).`);
  if (profile.experienceLevel) lines.push(`Experiencia: ${profile.experienceLevel}.`);
  if (profile.trainingDaysPerWeek) lines.push(`Entrena ${profile.trainingDaysPerWeek} días/semana (preferencia: ${profile.trainingPreference ?? 'gym'}).`);

  // Macros objetivo
  try {
    const goals = calculateGoals(profile);
    lines.push(`Macros objetivo/día: ${goals.targetKcal} kcal · ${goals.targetProteinG}g proteína · ${goals.targetCarbsG}g carbos · ${goals.targetFatsG}g grasa (TDEE ${goals.tdee}).`);
  } catch { /* noop */ }

  // Programa activo y día de hoy
  const program = await db.programs.filter(p => p.active).first();
  if (program) {
    lines.push(`Programa activo: "${program.name}".`);
    const todayPlan = program.days[isoDayOfWeek(new Date())];
    if (todayPlan) {
      lines.push(todayPlan.isRestDay
        ? 'Hoy es día de descanso.'
        : `Hoy toca: ${todayPlan.name} (${todayPlan.gymExercises.length} ejercicios).`);
    }
  }

  // Últimas 3 sesiones (resumen)
  const sessions = await db.sessions.orderBy('date').reverse().limit(3).toArray();
  if (sessions.length > 0) {
    const recent = sessions.map(s => `${s.date} (${s.modality})`).join(', ');
    lines.push(`Últimas sesiones: ${recent}.`);
  }

  // Tendencia de peso (últimos 2 registros)
  const weights = await db.weightLogs.orderBy('date').reverse().limit(2).toArray();
  if (weights.length === 2) {
    const delta = (weights[0].weightKg - weights[1].weightKg).toFixed(1);
    lines.push(`Peso: ${weights[0].weightKg} kg (${Number(delta) >= 0 ? '+' : ''}${delta} kg vs registro anterior).`);
  }

  return lines.join('\n');
}

/**
 * Envía la conversación al coach (Gemini vía nuestra function) y devuelve la
 * respuesta. Requiere sesión iniciada (token).
 */
export async function askCoach(messages: CoachMessage[]): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('Inicia sesión (Ajustes → Sync) para usar el coach.');

  const context = await buildCoachContext();
  const res = await fetch('/coach', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}`);
  }
  return data.reply as string;
}
