import type { UserProfile, MealType, TrainingDay } from './types';

export type ScheduleType = 'wake' | 'cardio' | 'meal' | 'pre_workout_snack' | 'training' | 'post_workout' | 'sleep';

export interface ScheduleEntry {
  /** "HH:MM" en hora local */
  time: string;
  /** minutos desde medianoche (para ordenar) */
  minutes: number;
  type: ScheduleType;
  mealType?: MealType;
  label: string;
  icon: string;
  /** Texto secundario corto (ej: macros, ejercicio). */
  hint?: string;
}

// ─── HELPERS DE TIEMPO ────────────────────────────────────────────────────────
function toMinutes(t: string | null | undefined, fallback = 9 * 60): number {
  if (!t) return fallback;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return fallback;
  return h * 60 + (m || 0);
}

function toTimeStr(minutes: number): string {
  // Soporta minutos > 24h: normaliza
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Genera el cronograma ideal del día basado en:
 *  - Hora de despertar (wakeTarget)
 *  - Hora de dormir (bedtimeTarget)
 *  - Preferencia de gym (morning/afternoon/evening)
 *  - Si el día actual es de entreno o descanso
 *
 * Reparte 5-6 comidas distribuidas entre la hora de despertar y la de dormir
 * dejando ~3h entre comidas principales y colocando pre/post entreno alrededor
 * del gym.
 */
export function buildDailySchedule(profile: UserProfile, trainingDay: TrainingDay | null): ScheduleEntry[] {
  const wake = toMinutes(profile.wakeTarget, 9 * 60);          // por defecto 09:00
  const bed = toMinutes(profile.bedtimeTarget, 23 * 60 + 30);  // por defecto 23:30
  const isRestDay = !trainingDay || trainingDay.isRestDay;
  const gymPref = profile.gymTimePreference ?? 'morning';
  const trainingDayName = trainingDay?.name ?? '';

  const entries: ScheduleEntry[] = [];

  // Hora de despertar
  entries.push({
    time: toTimeStr(wake),
    minutes: wake,
    type: 'wake',
    label: 'Despertar',
    icon: '☀️'
  });

  // Si hay entreno, decidir su hora según preferencia
  let trainingMinutes: number | null = null;
  if (!isRestDay) {
    if (profile.preferredGymTime) {
      trainingMinutes = toMinutes(profile.preferredGymTime, 18 * 60);
    } else {
      // Sugerencias estándar según preferencia (con margen de digestión)
      if (gymPref === 'morning') {
        trainingMinutes = wake + 3 * 60; // ~3h después de despertar (digestión)
      } else if (gymPref === 'afternoon') {
        trainingMinutes = 17 * 60;       // 17:00
      } else {
        trainingMinutes = 18 * 60 + 30;  // 18:30
      }
    }
  }

  // ─── CARDIO EN AYUNAS (si está activado) ────────────────────────────────
  // Solo si el usuario tiene cardio configurado y la fecha es día de cardio.
  // Días de cardio: L-X-V-S por defecto (cuando cardioDaysPerWeek >= 3).
  const cardioMinutes = profile.cardioMinutesPerSession ?? 0;
  const cardioDays = profile.cardioDaysPerWeek ?? 0;
  // Para esta versión: si hay cardio configurado, se muestra cada día.
  // (Lógica más fina por día → se puede afinar después con un schedule semanal.)
  if (cardioMinutes > 0 && cardioDays > 0) {
    const cardioStart = wake + 5; // 5 min después de despertar (en ayunas)
    entries.push({
      time: toTimeStr(cardioStart),
      minutes: cardioStart,
      type: 'cardio',
      label: 'Cardio en ayunas',
      icon: '🚴',
      hint: `${cardioMinutes} min · zona 2 · solo agua + café`
    });
  }

  // ─── DESAYUNO ───────────────────────────────────────────────────────────
  // 30 min después de despertar (o tras el cardio si lo hay)
  const breakfast = cardioMinutes > 0 && cardioDays > 0
    ? wake + 5 + cardioMinutes + 15  // tras cardio + 15 min ducha
    : wake + 30;
  entries.push({
    time: toTimeStr(breakfast),
    minutes: breakfast,
    type: 'meal',
    mealType: 'breakfast',
    label: cardioMinutes > 0 && cardioDays > 0 ? 'Desayuno post-cardio' : 'Desayuno',
    icon: '🌅'
  });

  // ─── BLOQUE DE ENTRENO (si hay) ─────────────────────────────────────────
  if (trainingMinutes != null) {
    // Pre-entreno ~60 min antes
    const preWorkout = trainingMinutes - 60;
    // Solo saltar si cae encima del desayuno (menos de 30 min de margen)
    if (preWorkout - breakfast >= 30) {
      entries.push({
        time: toTimeStr(preWorkout),
        minutes: preWorkout,
        type: 'pre_workout_snack',
        mealType: 'pre_workout',
        label: 'Snack pre-entreno',
        icon: '⚡',
        hint: 'Plátano + crema cacahuete, café opcional'
      });
    }

    entries.push({
      time: toTimeStr(trainingMinutes),
      minutes: trainingMinutes,
      type: 'training',
      label: 'Entrenamiento',
      icon: '🏋️',
      hint: trainingDayName || 'Sesión de gym'
    });

    // Post-entreno 30 min después del fin (sesión ~75 min)
    const postWorkout = trainingMinutes + 75 + 15;
    entries.push({
      time: toTimeStr(postWorkout),
      minutes: postWorkout,
      type: 'post_workout',
      mealType: 'post_workout',
      label: 'Post-entreno',
      icon: '💪',
      hint: 'Batido proteína + carbohidrato rápido'
    });
  }

  // ─── ALMUERZO ───────────────────────────────────────────────────────────
  // Lo colocamos donde tenga sentido según haya o no entreno
  let lunch: number;
  if (trainingMinutes != null && gymPref === 'morning') {
    // Entreno matinal → almuerzo post-post (alrededor de 14:00 si entrenó 12:00)
    lunch = Math.max(14 * 60, trainingMinutes + 75 + 90); // 90 min tras post-workout
  } else if (trainingMinutes != null && gymPref !== 'morning') {
    // Entreno tarde/noche → almuerzo "normal" antes del pre-entreno
    lunch = Math.min(14 * 60, trainingMinutes - 4 * 60);
  } else {
    lunch = 14 * 60; // 14:00 default
  }
  entries.push({
    time: toTimeStr(lunch),
    minutes: lunch,
    type: 'meal',
    mealType: 'lunch',
    label: 'Almuerzo',
    icon: '🍽️'
  });

  // ─── CENA ───────────────────────────────────────────────────────────────
  // 2-2.5h antes de dormir
  const dinner = bed - 150;
  entries.push({
    time: toTimeStr(dinner),
    minutes: dinner,
    type: 'meal',
    mealType: 'dinner',
    label: 'Cena',
    icon: '🌙'
  });

  // ─── SNACK NOCTURNO (caseína / lácteo / yogur) ──────────────────────────
  // 30-45 min antes de dormir, solo si hay >3.5h entre cena e ir a dormir
  if (bed - dinner > 60) {
    const snack = bed - 30;
    entries.push({
      time: toTimeStr(snack),
      minutes: snack,
      type: 'meal',
      mealType: 'snack',
      label: 'Snack noche',
      icon: '🍪',
      hint: 'Yogur griego + almendras (caseína)'
    });
  }

  // ─── DORMIR ─────────────────────────────────────────────────────────────
  entries.push({
    time: toTimeStr(bed),
    minutes: bed,
    type: 'sleep',
    label: 'Dormir',
    icon: '🛌'
  });

  // Ordenar y devolver
  entries.sort((a, b) => a.minutes - b.minutes);
  return entries;
}

/** Minutos actuales desde medianoche (para resaltar el "ahora" en la timeline). */
export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** ¿La entrada está marcada como "ya pasó" según la hora actual? */
export function isPast(entry: ScheduleEntry): boolean {
  return entry.minutes <= nowMinutes();
}

/** Devuelve la próxima entrada futura. */
export function nextEntry(entries: ScheduleEntry[]): ScheduleEntry | null {
  const now = nowMinutes();
  return entries.find(e => e.minutes > now) ?? null;
}
