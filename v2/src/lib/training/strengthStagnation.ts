import { db } from '$db/database';

/**
 * Detección de estancamiento de fuerza.
 *
 * Regla:
 * - Si en las últimas N sesiones (>=3) de un mismo ejercicio el "volumen tonelaje"
 *   (peso × reps top set) NO ha aumentado → estancamiento de fuerza.
 * - Si simultáneamente el peso corporal está subiendo (>0.25%/sem)
 *   → no faltan calorías; falta recuperación o estímulo.
 *   → Sugerir DELOAD o añadir 1 serie efectiva.
 */

export interface StrengthStagnation {
  exerciseId: string;
  weeksFlat: number;
  lastTonnage: number;
  trend: 'flat' | 'progressing' | 'regressing';
  suggestion: 'add_set' | 'deload' | 'increase_calories' | 'none';
  message: string;
}

/**
 * Analiza si un ejercicio concreto está estancado.
 * Devuelve null si no hay datos suficientes.
 */
export async function detectStagnation(exerciseId: string): Promise<StrengthStagnation | null> {
  const sessions = await db.sessions
    .orderBy('date')
    .reverse()
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0))
    .limit(4)
    .toArray();

  if (sessions.length < 3) return null;

  const tonnages = sessions.map(s => {
    const ex = s.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) return 0;
    // Tonelaje del set más pesado
    return Math.max(...ex.sets.map(set => (set.weightKg ?? 1) * set.reps));
  });

  // Comparar últimas 3 (orden: 0=más reciente)
  const recent = tonnages.slice(0, 3);
  const isFlat = recent.every(t => Math.abs(t - recent[0]) / Math.max(recent[0], 1) < 0.03); // <3% variación
  const isProgressing = recent[0] > recent[1] && recent[1] >= recent[2];

  if (isProgressing) {
    return {
      exerciseId,
      weeksFlat: 0,
      lastTonnage: recent[0],
      trend: 'progressing',
      suggestion: 'none',
      message: '✓ Progresando.'
    };
  }
  if (isFlat) {
    return {
      exerciseId,
      weeksFlat: recent.length - 1,
      lastTonnage: recent[0],
      trend: 'flat',
      suggestion: 'deload',
      message: 'Llevas 2+ sesiones sin progresar en peso/reps. Considera una semana de descarga (deload) o añade 1 serie extra al grupo muscular.'
    };
  }
  return {
    exerciseId,
    weeksFlat: 0,
    lastTonnage: recent[0],
    trend: 'regressing',
    suggestion: 'increase_calories',
    message: 'Has bajado en peso/reps últimamente. Revisa sueño y calorías, considera +200 kcal.'
  };
}

/**
 * Detecta estancamiento en TODOS los ejercicios principales del usuario.
 * Devuelve la lista de los que están estancados.
 */
export async function detectAllStagnations(): Promise<StrengthStagnation[]> {
  // Coger todos los ejercicios únicos del historial de sesiones recientes
  const sessions = await db.sessions.orderBy('date').reverse().limit(20).toArray();
  const uniqueIds = new Set<string>();
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (!e.skipped && e.sets.length > 0) uniqueIds.add(e.exerciseId);
    }
  }
  const results: StrengthStagnation[] = [];
  for (const id of uniqueIds) {
    const stag = await detectStagnation(id);
    if (stag && stag.trend === 'flat') results.push(stag);
  }
  return results;
}
