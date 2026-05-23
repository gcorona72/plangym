import { db } from '$db/database';
import type { UserProfile, DailyGoals, WorkoutSession, WorkoutSet } from './types';
import { toDateKey, startOfWeek, endOfWeek, addDays, dateRange } from './dateUtils';
import { calculateGoals } from './nutrition/macros';

export interface ProgressMetrics {
  /** Racha de días consecutivos cumpliendo el plan (sesión hecha o macros cumplidas). */
  streakDays: number;

  // Entrenamiento
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  totalVolumeKgThisWeek: number;
  totalVolumeKgLastWeek: number;
  /** % de cambio del volumen total esta semana vs anterior. */
  volumeDeltaPct?: number;

  // Nutrición
  daysWithMealsThisWeek: number;
  averageKcalThisWeek: number;
  /** % de días esta semana que cumplieron al menos el 90% del objetivo de kcal. */
  macrosAdherencePct: number;

  // Peso
  weightDeltaThisWeek?: number; // kg
  weightTrendKgPerWeek?: number;

  // Personal records (top 3 más recientes)
  recentPRs: PRRecord[];

  // Hitos motivacionales
  totalSessions: number;
  totalMealsLogged: number;
  totalWeightLifted: number; // tonelaje total acumulado

  // Series temporales para gráficas
  weightHistory: TimePoint[];        // peso corporal últimas 8 semanas
  weeklyVolumeHistory: TimePoint[];  // tonelaje por semana, últimas 6 semanas
  weeklySessionsHistory: TimePoint[]; // nº sesiones por semana, últimas 6 semanas
  dailyKcalThisWeek: TimePoint[];    // kcal de cada día de esta semana (7 puntos)
  /** Tonelaje esta semana por grupo muscular principal. */
  tonnageByMuscleThisWeek: Record<string, number>;
}

export interface TimePoint {
  label: string;  // "Lun 15", "S40", etc.
  value: number;
  /** Etiqueta opcional para tooltip. */
  hint?: string;
}

export interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  date: string;
  /** kg que superan al PR anterior (si los hay). */
  improvement?: number;
  /** 1RM estimado a partir del set (fórmula de Epley). */
  estimated1RM: number;
}

/**
 * 1RM estimado por fórmula de Epley: peso × (1 + reps / 30).
 * Más fiable en rangos 3-10 reps. A más reps, menos precisión.
 */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/**
 * Calcula tonelaje de una sesión: suma de peso × reps de todos los sets.
 * Calistenia sin peso usa peso corporal del perfil como aproximación.
 */
function sessionVolume(session: WorkoutSession, bodyWeightKg: number): number {
  let total = 0;
  for (const ex of session.exercises) {
    if (ex.skipped) continue;
    for (const s of ex.sets) {
      const w = s.weightKg ?? bodyWeightKg;
      total += w * s.reps;
    }
  }
  return total;
}

/**
 * Calcula la racha actual: nº de días consecutivos hacia atrás cumpliendo el plan.
 * Cumplir = (a) había sesión planificada y se hizo, o (b) hubo al menos 1 comida registrada
 * en un día de descanso.
 */
async function computeStreak(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = addDays(today, -i);
    const key = toDateKey(d);
    const [session, log] = await Promise.all([
      db.sessions.where('date').equals(key).first(),
      db.mealLogs.get(`log_${key}`)
    ]);
    const hasSession = session?.finishedAt != null;
    const hasMeals = (log?.meals.length ?? 0) >= 1;
    // Solo cuenta como racha si hay algo de actividad (entreno o comidas)
    if (hasSession || hasMeals) {
      streak++;
    } else if (i === 0) {
      // Hoy no se ha hecho nada todavía → no rompemos racha, pero no sumamos
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Detecta personal records (PRs): para cada ejercicio el set con mayor peso × reps.
 * Marca los más recientes (últimos 14 días) con improvement vs PR previo.
 */
async function computeRecentPRs(): Promise<PRRecord[]> {
  const exercises = await db.exercises.toArray();
  const exerciseName = new Map(exercises.map(e => [e.id, e.name]));

  // Cogemos todas las sesiones ordenadas por fecha
  const sessions = await db.sessions.orderBy('date').toArray();

  // Para cada ejercicio, calculamos el set "PR" (mayor tonelaje set individual)
  // y comparamos con el PR previo (antes de la fecha del PR actual).
  const prsByEx = new Map<string, PRRecord>();
  const recent: PRRecord[] = [];

  const cutoff = addDays(new Date(), -14);
  cutoff.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      for (const set of ex.sets) {
        const weight = set.weightKg ?? 0;
        if (weight <= 0) continue;
        const tonnage = weight * set.reps;
        const current = prsByEx.get(ex.exerciseId);
        if (!current || tonnage > current.weightKg * current.reps) {
          const prev = current;
          const pr: PRRecord = {
            exerciseId: ex.exerciseId,
            exerciseName: exerciseName.get(ex.exerciseId) ?? ex.exerciseId,
            weightKg: weight,
            reps: set.reps,
            date: session.date,
            improvement: prev ? (weight - prev.weightKg) : undefined,
            estimated1RM: epley1RM(weight, set.reps)
          };
          prsByEx.set(ex.exerciseId, pr);
          // Si es reciente, marcarlo
          if (new Date(session.date) >= cutoff && prev) {
            recent.push(pr);
          }
        }
      }
    }
  }

  // Ordenar por fecha desc y limitar
  recent.sort((a, b) => b.date.localeCompare(a.date));
  return recent.slice(0, 3);
}

export async function computeProgressMetrics(): Promise<ProgressMetrics> {
  const profile = await db.profile.get(1);
  const bodyWeight = profile?.weightKg ?? 70;
  const goals = profile ? calculateGoals(profile) : null;

  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = addDays(thisWeekEnd, -7);

  // Sesiones esta semana + pasada
  const allSessionsThisWeek = await db.sessions
    .where('date').between(toDateKey(thisWeekStart), toDateKey(thisWeekEnd), true, true)
    .toArray();
  const allSessionsLastWeek = await db.sessions
    .where('date').between(toDateKey(lastWeekStart), toDateKey(lastWeekEnd), true, true)
    .toArray();

  const sessionsThisWeek = allSessionsThisWeek.filter(s => s.finishedAt).length;
  const sessionsLastWeek = allSessionsLastWeek.filter(s => s.finishedAt).length;
  const totalVolumeKgThisWeek = Math.round(
    allSessionsThisWeek.reduce((a, s) => a + sessionVolume(s, bodyWeight), 0)
  );
  const totalVolumeKgLastWeek = Math.round(
    allSessionsLastWeek.reduce((a, s) => a + sessionVolume(s, bodyWeight), 0)
  );
  const volumeDeltaPct = totalVolumeKgLastWeek > 0
    ? ((totalVolumeKgThisWeek - totalVolumeKgLastWeek) / totalVolumeKgLastWeek) * 100
    : undefined;

  // Comidas
  const mealLogs = await db.mealLogs
    .where('date').between(toDateKey(thisWeekStart), toDateKey(thisWeekEnd), true, true)
    .toArray();
  const daysWithMealsThisWeek = mealLogs.filter(l => l.meals.length > 0).length;
  const kcalByDay = mealLogs.map(l =>
    l.meals.reduce((a, m) => a + m.macros.kcal, 0)
  );
  const averageKcalThisWeek = kcalByDay.length > 0
    ? Math.round(kcalByDay.reduce((a, b) => a + b, 0) / kcalByDay.length)
    : 0;

  // Adherencia macros (días con >= 90% del objetivo)
  let daysAdherent = 0;
  if (goals) {
    for (const kcal of kcalByDay) {
      if (kcal >= goals.targetKcal * 0.9) daysAdherent++;
    }
  }
  const macrosAdherencePct = kcalByDay.length > 0
    ? Math.round((daysAdherent / kcalByDay.length) * 100)
    : 0;

  // Peso semana actual vs anterior
  const weights = await db.weightLogs
    .where('date').between(toDateKey(addDays(thisWeekStart, -14)), toDateKey(thisWeekEnd), true, true)
    .toArray();
  const thisWeekWeights = weights.filter(w => w.date >= toDateKey(thisWeekStart)).map(w => w.weightKg);
  const lastWeekWeights = weights.filter(w =>
    w.date >= toDateKey(lastWeekStart) && w.date <= toDateKey(lastWeekEnd)
  ).map(w => w.weightKg);

  let weightDeltaThisWeek: number | undefined;
  let weightTrendKgPerWeek: number | undefined;
  if (thisWeekWeights.length > 0 && lastWeekWeights.length > 0) {
    const thisAvg = thisWeekWeights.reduce((a, b) => a + b, 0) / thisWeekWeights.length;
    const lastAvg = lastWeekWeights.reduce((a, b) => a + b, 0) / lastWeekWeights.length;
    weightDeltaThisWeek = thisAvg - lastAvg;
    weightTrendKgPerWeek = weightDeltaThisWeek;
  }

  // Tonelaje esta semana por grupo muscular (sumando todos los sets)
  const exercisesMap = new Map((await db.exercises.toArray()).map(e => [e.id, e]));
  const tonnageByMuscleThisWeek: Record<string, number> = {};
  for (const session of allSessionsThisWeek) {
    for (const ex of session.exercises) {
      if (ex.skipped) continue;
      const exercise = exercisesMap.get(ex.exerciseId);
      if (!exercise) continue;
      const setTonnage = ex.sets.reduce((sum, s) => sum + ((s.weightKg ?? bodyWeight) * s.reps), 0);
      // El tonelaje se reparte entre los músculos primarios
      for (const muscle of exercise.primaryMuscles) {
        tonnageByMuscleThisWeek[muscle] = (tonnageByMuscleThisWeek[muscle] ?? 0) + setTonnage;
      }
    }
  }

  // PRs recientes + totales
  const recentPRs = await computeRecentPRs();
  const totalSessions = await db.sessions.filter(s => s.finishedAt != null).count();
  const totalMeals = await db.mealLogs.toArray();
  const totalMealsLogged = totalMeals.reduce((a, l) => a + l.meals.length, 0);
  const allSessions = await db.sessions.toArray();
  const totalWeightLifted = Math.round(
    allSessions.reduce((a, s) => a + sessionVolume(s, bodyWeight), 0)
  );

  const streakDays = await computeStreak();

  // ─── Series temporales para gráficas ──────────────────────────────────
  // Peso corporal últimas 8 semanas (medias semanales)
  const allWeights = await db.weightLogs.orderBy('date').toArray();
  const weightHistory = buildWeightHistory(allWeights, 8);

  // Volumen y sesiones por semana (últimas 6)
  const last6WeeksSessions = await db.sessions
    .where('date').between(toDateKey(addDays(thisWeekStart, -35)), toDateKey(thisWeekEnd), true, true)
    .toArray();
  const weeklyVolumeHistory = buildWeeklyHistory(
    last6WeeksSessions, thisWeekStart, 6,
    (sessions) => Math.round(sessions.reduce((a, s) => a + sessionVolume(s, bodyWeight), 0))
  );
  const weeklySessionsHistory = buildWeeklyHistory(
    last6WeeksSessions, thisWeekStart, 6,
    (sessions) => sessions.filter(s => s.finishedAt).length
  );

  // kcal de cada día de esta semana
  const dailyKcalThisWeek = dateRange(thisWeekStart, thisWeekEnd).map(d => {
    const key = toDateKey(d);
    const log = mealLogs.find(l => l.date === key);
    const kcal = log ? log.meals.reduce((a, m) => a + m.macros.kcal, 0) : 0;
    return {
      label: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 1).toUpperCase(),
      value: kcal,
      hint: `${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}: ${kcal} kcal`
    };
  });

  return {
    streakDays,
    sessionsThisWeek,
    sessionsLastWeek,
    totalVolumeKgThisWeek,
    totalVolumeKgLastWeek,
    volumeDeltaPct,
    daysWithMealsThisWeek,
    averageKcalThisWeek,
    macrosAdherencePct,
    weightDeltaThisWeek,
    weightTrendKgPerWeek,
    recentPRs,
    totalSessions,
    totalMealsLogged,
    totalWeightLifted,
    weightHistory,
    weeklyVolumeHistory,
    weeklySessionsHistory,
    dailyKcalThisWeek,
    tonnageByMuscleThisWeek
  };
}

/** Construye media semanal de peso para las últimas N semanas. */
function buildWeightHistory(logs: { date: string; weightKg: number }[], weeks: number): TimePoint[] {
  if (logs.length === 0) return [];
  const today = startOfWeek(new Date());
  const points: TimePoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(today, -i * 7);
    const weekEnd = addDays(weekStart, 6);
    const inWeek = logs.filter(l => {
      const d = new Date(l.date);
      return d >= weekStart && d <= weekEnd;
    });
    const avg = inWeek.length > 0
      ? inWeek.reduce((a, l) => a + l.weightKg, 0) / inWeek.length
      : 0;
    points.push({
      label: `S${weekNumber(weekStart)}`,
      value: Math.round(avg * 10) / 10,
      hint: `Semana del ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${avg.toFixed(1)} kg`
    });
  }
  return points;
}

/** Construye serie semanal para una métrica derivada de sesiones. */
function buildWeeklyHistory<S extends { date: string }>(
  sessions: S[],
  currentWeekStart: Date,
  weeks: number,
  computeValue: (sessions: S[]) => number
): TimePoint[] {
  const points: TimePoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -i * 7);
    const weekEnd = addDays(weekStart, 6);
    const inWeek = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });
    points.push({
      label: `S${weekNumber(weekStart)}`,
      value: computeValue(inWeek),
      hint: `Semana del ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    });
  }
  return points;
}

/** Nº de semana del año ISO 8601. */
function weekNumber(d: Date): number {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Mensaje motivacional basado en métricas. */
export function motivationalMessage(m: ProgressMetrics): string {
  if (m.streakDays >= 14) return `🔥 ${m.streakDays} días de racha. Imparable.`;
  if (m.streakDays >= 7) return `🔥 ${m.streakDays} días seguidos. Semana completa.`;
  if (m.recentPRs.length > 0) return `🎯 PR conseguido en ${m.recentPRs[0].exerciseName}.`;
  if (m.volumeDeltaPct != null && m.volumeDeltaPct > 5) return `📈 Subes ${m.volumeDeltaPct.toFixed(0)}% de volumen vs semana pasada.`;
  if (m.sessionsThisWeek >= 3) return `💪 ${m.sessionsThisWeek} sesiones esta semana. Constancia.`;
  if (m.streakDays >= 3) return `💪 ${m.streakDays} días de racha. Vas bien.`;
  if (m.totalSessions === 0) return `🚀 Empieza tu primera sesión para arrancar el progreso.`;
  return `Sigue adelante. Cada día cuenta.`;
}
