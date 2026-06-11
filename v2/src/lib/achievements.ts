import { db } from '$db/database';
import { computeStreak } from '$lib/progress';

/**
 * Sistema de logros (gamificación).
 *
 * El catálogo vive aquí en código — solo se persiste QUÉ logro se desbloqueó
 * y cuándo (tabla `achievements`, sincronizada entre dispositivos).
 *
 * Diseño: para una app de un solo usuario funcionan los hitos de adherencia
 * y volumen acumulado (la variable clave de un ectomorfo en volumen es la
 * constancia). Nada de XP/niveles/ligas — no hay nadie contra quien competir.
 */

export type AchievementCategory = 'consistency' | 'streak' | 'strength' | 'cardio' | 'nutrition';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** Umbral a alcanzar (en la unidad de su métrica). */
  target: number;
  /** Unidad legible para la barra de progreso ("sesiones", "kg", "km"...). */
  unit: string;
  /** Qué métrica de AchievementStats evalúa. */
  metric: keyof AchievementStats;
}

export interface AchievementStats {
  totalSessions: number;
  streakDays: number;
  prCount: number;
  totalTonnageKg: number;
  cardioSessions: number;
  cardioKm: number;
  mealsLogged: number;
}

export const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  consistency: { label: 'Constancia', icon: '📅' },
  streak:      { label: 'Rachas',     icon: '🔥' },
  strength:    { label: 'Fuerza',     icon: '🏋️' },
  cardio:      { label: 'Cardio',     icon: '🏃' },
  nutrition:   { label: 'Nutrición',  icon: '🍽️' }
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Constancia (sesiones de entreno completadas) ─────────────────────────
  { id: 'first_session', title: 'Primera piedra',   description: 'Completa tu primera sesión de entrenamiento.', icon: '🎬', category: 'consistency', target: 1,   unit: 'sesiones', metric: 'totalSessions' },
  { id: 'sessions_10',   title: 'En marcha',        description: 'Completa 10 sesiones.',                        icon: '💪', category: 'consistency', target: 10,  unit: 'sesiones', metric: 'totalSessions' },
  { id: 'sessions_25',   title: 'Hábito forjado',   description: 'Completa 25 sesiones.',                        icon: '⚒️', category: 'consistency', target: 25,  unit: 'sesiones', metric: 'totalSessions' },
  { id: 'sessions_50',   title: 'Veterano',         description: 'Completa 50 sesiones.',                        icon: '🎖️', category: 'consistency', target: 50,  unit: 'sesiones', metric: 'totalSessions' },
  { id: 'sessions_100',  title: 'Centurión',        description: 'Completa 100 sesiones.',                       icon: '🏛️', category: 'consistency', target: 100, unit: 'sesiones', metric: 'totalSessions' },

  // ── Rachas (días consecutivos cumpliendo el plan) ────────────────────────
  { id: 'streak_3',  title: 'Encadenado',      description: '3 días seguidos cumpliendo el plan.',  icon: '🔗', category: 'streak', target: 3,  unit: 'días', metric: 'streakDays' },
  { id: 'streak_7',  title: 'Semana perfecta', description: '7 días seguidos cumpliendo el plan.',  icon: '🔥', category: 'streak', target: 7,  unit: 'días', metric: 'streakDays' },
  { id: 'streak_14', title: 'Quincena de oro', description: '14 días seguidos cumpliendo el plan.', icon: '⚡', category: 'streak', target: 14, unit: 'días', metric: 'streakDays' },
  { id: 'streak_30', title: 'Imparable',       description: '30 días seguidos cumpliendo el plan.', icon: '🌋', category: 'streak', target: 30, unit: 'días', metric: 'streakDays' },

  // ── Fuerza (PRs y tonelaje acumulado) ────────────────────────────────────
  { id: 'first_pr',     title: 'Primer récord', description: 'Supera tu mejor marca en un ejercicio.',        icon: '🏆', category: 'strength', target: 1,      unit: 'PRs', metric: 'prCount' },
  { id: 'prs_10',       title: 'Rompemarcas',   description: 'Consigue 10 récords personales.',               icon: '📈', category: 'strength', target: 10,     unit: 'PRs', metric: 'prCount' },
  { id: 'tonnage_10k',  title: '10 toneladas',  description: 'Levanta 10.000 kg acumulados (un camión).',     icon: '🚚', category: 'strength', target: 10000,  unit: 'kg',  metric: 'totalTonnageKg' },
  { id: 'tonnage_50k',  title: '50 toneladas',  description: 'Levanta 50.000 kg acumulados (una locomotora).', icon: '🚂', category: 'strength', target: 50000,  unit: 'kg',  metric: 'totalTonnageKg' },
  { id: 'tonnage_100k', title: '100 toneladas', description: 'Levanta 100.000 kg acumulados (una ballena azul no es nada).', icon: '🐋', category: 'strength', target: 100000, unit: 'kg', metric: 'totalTonnageKg' },

  // ── Cardio (sesiones y km acumulados) ────────────────────────────────────
  { id: 'cardio_first', title: 'Primeros pasos', description: 'Registra tu primera sesión de cardio.', icon: '👟', category: 'cardio', target: 1,   unit: 'sesiones', metric: 'cardioSessions' },
  { id: 'cardio_10km',  title: 'Doble dígito',   description: 'Acumula 10 km de cardio.',              icon: '🗺️', category: 'cardio', target: 10,  unit: 'km', metric: 'cardioKm' },
  { id: 'cardio_50km',  title: 'Explorador',     description: 'Acumula 50 km de cardio.',              icon: '🧭', category: 'cardio', target: 50,  unit: 'km', metric: 'cardioKm' },
  { id: 'cardio_100km', title: 'Centenario',     description: 'Acumula 100 km de cardio.',             icon: '🌍', category: 'cardio', target: 100, unit: 'km', metric: 'cardioKm' },

  // ── Nutrición (comidas registradas) ──────────────────────────────────────
  { id: 'meals_50',  title: 'Medio centenar',  description: 'Registra 50 comidas.',  icon: '🍽️', category: 'nutrition', target: 50,  unit: 'comidas', metric: 'mealsLogged' },
  { id: 'meals_250', title: 'Chef de volumen', description: 'Registra 250 comidas.', icon: '👨‍🍳', category: 'nutrition', target: 250, unit: 'comidas', metric: 'mealsLogged' }
];

// ─── CÁLCULO DE STATS ────────────────────────────────────────────────────────

/**
 * Cuenta los "eventos PR": para cada ejercicio, cada vez que un set supera
 * el máximo histórico previo de tonelaje (peso × reps), tras el primer registro.
 */
function countPREvents(sessions: { exercises: { exerciseId: string; skipped?: boolean; sets: { weightKg?: number; reps: number }[] }[] }[]): number {
  const maxByExercise = new Map<string, number>();
  let prs = 0;
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        const w = set.weightKg ?? 0;
        if (w <= 0) continue;
        const tonnage = w * set.reps;
        const prev = maxByExercise.get(ex.exerciseId);
        if (prev == null) {
          maxByExercise.set(ex.exerciseId, tonnage);
        } else if (tonnage > prev) {
          maxByExercise.set(ex.exerciseId, tonnage);
          prs++;
        }
      }
    }
  }
  return prs;
}

export async function computeAchievementStats(): Promise<AchievementStats> {
  const [sessions, cardio, mealLogs, profile, streakDays] = await Promise.all([
    db.sessions.orderBy('date').toArray(),
    db.cardioSessions.toArray(),
    db.mealLogs.toArray(),
    db.profile.get(1),
    computeStreak()
  ]);

  const finished = sessions.filter(s => s.finishedAt != null);
  const bodyWeight = profile?.weightKg ?? 70;

  let tonnage = 0;
  for (const s of finished) {
    for (const ex of s.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        tonnage += (set.weightKg ?? bodyWeight) * set.reps;
      }
    }
  }

  return {
    totalSessions: finished.length,
    streakDays,
    prCount: countPREvents(sessions),
    totalTonnageKg: Math.round(tonnage),
    cardioSessions: cardio.length,
    cardioKm: Math.round(cardio.reduce((a, c) => a + c.distanceMeters, 0) / 1000 * 10) / 10,
    mealsLogged: mealLogs.reduce((a, l) => a + l.meals.length, 0)
  };
}

// ─── EVALUACIÓN Y DESBLOQUEO ─────────────────────────────────────────────────

export interface AchievementStatus extends AchievementDef {
  unlocked: boolean;
  unlockedAt: string | null;
  /** Valor actual de la métrica (para la barra de progreso). */
  current: number;
}

/**
 * Evalúa el catálogo contra las stats actuales, persiste los desbloqueos
 * nuevos y devuelve el estado completo (para la galería).
 * Una vez desbloqueado, un logro nunca se re-bloquea (las rachas bajan,
 * el trofeo se queda).
 */
export async function evaluateAchievements(): Promise<{ statuses: AchievementStatus[]; newlyUnlocked: AchievementDef[] }> {
  const [stats, unlockedRows] = await Promise.all([
    computeAchievementStats(),
    db.achievements.toArray()
  ]);
  const unlockedById = new Map(unlockedRows.map(a => [a.id, a.unlockedAt]));
  const newlyUnlocked: AchievementDef[] = [];
  const now = new Date().toISOString();

  for (const def of ACHIEVEMENTS) {
    if (unlockedById.has(def.id)) continue;
    if (stats[def.metric] >= def.target) {
      await db.achievements.put({ id: def.id, unlockedAt: now });
      unlockedById.set(def.id, now);
      newlyUnlocked.push(def);
    }
  }

  const statuses: AchievementStatus[] = ACHIEVEMENTS.map(def => ({
    ...def,
    unlocked: unlockedById.has(def.id),
    unlockedAt: unlockedById.get(def.id) ?? null,
    current: stats[def.metric]
  }));

  return { statuses, newlyUnlocked };
}
