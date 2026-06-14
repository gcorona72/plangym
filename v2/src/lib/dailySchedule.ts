import type { UserProfile, MealType, TrainingDay, BusyBlock } from './types';
import { isoDayOfWeek } from './dateUtils';

export type ScheduleType = 'wake' | 'cardio' | 'meal' | 'pre_workout_snack' | 'training' | 'post_workout' | 'sleep' | 'busy';

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

// ─── BLOQUES OCUPADOS (trabajo/clase) ─────────────────────────────────────────
interface BlockRange { start: number; end: number; label: string; kind: string; }

const BUSY_ICON: Record<string, string> = { work: '💼', class: '📚', other: '📌' };

/** Bloque que solapa con [start,end), o null. */
function overlappingBlock(start: number, end: number, blocks: BlockRange[]): BlockRange | null {
  for (const b of blocks) {
    if (start < b.end && end > b.start) return b;
  }
  return null;
}

/**
 * Desplaza un evento con duración `dur` para que no caiga sobre un bloque:
 * lo coloca justo después del bloque que solapa (con 10 min de margen),
 * iterando por si hay bloques encadenados. Si no solapa, devuelve igual.
 */
function pushAfterBlocks(start: number, dur: number, blocks: BlockRange[]): number {
  let s = start;
  for (let i = 0; i < blocks.length + 1; i++) {
    const b = overlappingBlock(s, s + dur, blocks);
    if (!b) return s;
    s = b.end + 10;
  }
  return s;
}

/**
 * Si un instante cae dentro de un bloque, lo mueve al borde más cercano
 * (justo antes de empezar o justo después de acabar). Si no, lo deja.
 */
function nudgeOutOfBlocks(minutes: number, blocks: BlockRange[]): number {
  for (const b of blocks) {
    if (minutes >= b.start && minutes < b.end) {
      const toBefore = minutes - (b.start - 10);
      const toAfter = (b.end + 10) - minutes;
      return toAfter <= toBefore ? b.end + 10 : b.start - 10;
    }
  }
  return minutes;
}

/**
 * Coloca una comida (evento puntual) en el hueco libre más cercano a su hora
 * ideal. Si la hora ideal ya está libre, la deja. Si cae en un bloque, busca
 * la ventana libre cuyo punto más próximo a la hora ideal sea el más cercano
 * y la coloca ahí. Esto hace que, si el usuario marca su pausa de comida como
 * un hueco entre dos bloques de trabajo, el almuerzo caiga en esa pausa.
 */
function placeMealInFreeWindow(nominal: number, blocks: BlockRange[], floor: number, ceiling: number): number {
  if (overlappingBlock(nominal, nominal + 1, blocks) == null) return nominal;
  const windows = freeWindows(floor, ceiling, blocks).filter(w => w.end - w.start >= 20);
  if (windows.length === 0) return nominal;
  let best = nominal, bestDist = Infinity;
  for (const w of windows) {
    const p = Math.min(Math.max(nominal, w.start + 5), w.end - 5);
    const d = Math.abs(p - nominal);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

/** Ventanas de tiempo LIBRES entre [from,to) descontando los bloques. */
function freeWindows(from: number, to: number, blocks: BlockRange[]): { start: number; end: number }[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const windows: { start: number; end: number }[] = [];
  let cursor = from;
  for (const b of sorted) {
    if (b.end <= from || b.start >= to) continue;
    if (b.start > cursor) windows.push({ start: cursor, end: Math.min(b.start, to) });
    cursor = Math.max(cursor, b.end);
    if (cursor >= to) break;
  }
  if (cursor < to) windows.push({ start: cursor, end: to });
  return windows.filter(w => w.end > w.start);
}

/** Minuto-ancla del día según la franja preferida. */
function anchorForPref(pref: string, wake: number): number {
  if (pref === 'morning') return wake + 3 * 60;   // ~3h tras despertar
  if (pref === 'afternoon') return 17 * 60;        // 17:00
  return 18 * 60 + 30;                              // noche → 18:30
}

/**
 * MODO AUTOMÁTICO: busca el inicio de entreno óptimo para un día.
 * Coge la ventana libre (≥ `duration`) cuyo hueco quede más cerca de la franja
 * preferida del usuario, dejando margen para cenar antes de dormir.
 * Devuelve también las alternativas rankeadas (para mostrarlas si se quiere).
 */
export function findTrainingSlots(
  wake: number, bed: number, blocks: BlockRange[], anchor: number, duration = 90
): number[] {
  const from = wake + 30;
  const to = bed - 120; // 2h para cenar/digerir antes de dormir
  let windows = freeWindows(from, to, blocks).filter(w => w.end - w.start >= duration);
  if (windows.length === 0) {
    // Relajar: permitir hasta 1h antes de dormir
    windows = freeWindows(from, bed - 60, blocks).filter(w => w.end - w.start >= duration);
  }
  if (windows.length === 0) return [];
  // Para cada ventana, el inicio más cercano al ancla
  const cands = windows.map(w => Math.min(Math.max(anchor, w.start), w.end - duration));
  // Ordenar por distancia al ancla
  cands.sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor));
  return cands;
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
export function buildDailySchedule(
  profile: UserProfile,
  trainingDay: TrainingDay | null,
  dayOfWeek: number = isoDayOfWeek(new Date())
): ScheduleEntry[] {
  const wake = toMinutes(profile.wakeTarget, 9 * 60);          // por defecto 09:00
  const bed = toMinutes(profile.bedtimeTarget, 23 * 60 + 30);  // por defecto 23:30
  const isRestDay = !trainingDay || trainingDay.isRestDay;
  const gymPref = profile.gymTimePreference ?? 'morning';
  const trainingDayName = trainingDay?.name ?? '';

  // Bloques ocupados de este día de la semana
  const blocks: BlockRange[] = (profile.busyBlocks ?? [])
    .filter(b => b.dayOfWeek === dayOfWeek)
    .map(b => ({ start: toMinutes(b.startTime, 0), end: toMinutes(b.endTime, 0), label: b.label, kind: b.kind }))
    .filter(b => b.end > b.start);

  const entries: ScheduleEntry[] = [];

  // Bloques ocupados como entradas visibles
  for (const b of blocks) {
    entries.push({
      time: toTimeStr(b.start),
      minutes: b.start,
      type: 'busy',
      label: b.label || (b.kind === 'work' ? 'Trabajo' : b.kind === 'class' ? 'Clase' : 'Ocupado'),
      icon: BUSY_ICON[b.kind] ?? '📌',
      hint: `${toTimeStr(b.start)}–${toTimeStr(b.end)}`
    });
  }

  // Hora de despertar
  entries.push({
    time: toTimeStr(wake),
    minutes: wake,
    type: 'wake',
    label: 'Despertar',
    icon: '☀️'
  });

  // Si hay entreno, decidir su hora
  const mode = profile.gymTimeMode ?? 'auto';
  let trainingMinutes: number | null = null;
  let trainingAuto = false;
  if (!isRestDay) {
    if (mode === 'manual' && profile.preferredGymTime) {
      // Manual con hora fija
      trainingMinutes = toMinutes(profile.preferredGymTime, 18 * 60);
    } else if (mode === 'manual') {
      // Manual por franja (horas fijas estándar)
      trainingMinutes = anchorForPref(gymPref, wake);
    } else {
      // AUTOMÁTICO: mejor hueco libre del día según agenda + franja preferida.
      // 105 min = sesión (~90) + margen para el batido post-entreno.
      const anchor = anchorForPref(gymPref, wake);
      const slots = findTrainingSlots(wake, bed, blocks, anchor, 105);
      if (slots.length > 0) {
        trainingMinutes = slots[0];
        trainingAuto = true;
      } else {
        trainingMinutes = anchor; // fallback si no hay hueco claro
      }
    }
    // Red de seguridad: si aún cae sobre un bloque (modo manual), apartarlo
    if (blocks.length > 0 && !trainingAuto) {
      const moved = pushAfterBlocks(trainingMinutes, 90, blocks);
      if (moved + 90 > bed - 120) {
        const firstBlock = blocks.find(b => trainingMinutes! < b.end && trainingMinutes! + 90 > b.start);
        if (firstBlock) trainingMinutes = Math.max(wake + 60, firstBlock.start - 90 - 15);
      } else {
        trainingMinutes = moved;
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
    // Saltar si cae encima del desayuno (<30 min) o dentro de un bloque
    // ocupado (entrenas justo al salir de clase/trabajo → ya comiste antes).
    const preInBlock = overlappingBlock(preWorkout, preWorkout + 1, blocks) != null;
    if (preWorkout - breakfast >= 30 && !preInBlock) {
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
      hint: (trainingDayName || 'Sesión de gym') + (trainingAuto && blocks.length > 0 ? ' · hora propuesta según tu agenda' : '')
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

  // ─── MERIENDA ───────────────────────────────────────────────────────────
  // Si entre almuerzo y cena hay un hueco grande (>4h), metemos una merienda
  // a mitad de camino. Repartir la proteína en más tomas (cada 3-4h) favorece
  // la síntesis muscular y evita llegar con un hambre que descuadra las kcal.
  // Si ya hay post-entreno en esa franja, no hace falta (ya rompe el ayuno).
  const hasPostInGap = trainingMinutes != null && (trainingMinutes + 90) > lunch && (trainingMinutes + 90) < dinner;
  if (dinner - lunch > 240 && !hasPostInGap) {
    const snackPm = Math.round((lunch + dinner) / 2);
    entries.push({
      time: toTimeStr(snackPm),
      minutes: snackPm,
      type: 'meal',
      mealType: 'midafternoon',
      label: 'Merienda',
      icon: '🥪',
      hint: 'Yogur + fruta + frutos secos, o un bocadillo de pavo'
    });
  }
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

  // Colocar las comidas que caigan sobre un bloque (trabajo/clase) en el hueco
  // libre más cercano. Si hay una pausa entre dos bloques (p. ej. descanso de
  // comida 13:00-14:00), el almuerzo cae ahí. El desayuno NO se mueve: va
  // anclado a despertar. Ninguna comida se coloca antes de despertar.
  if (blocks.length > 0) {
    const floor = wake + 5;
    const ceiling = bed - 20;
    for (const e of entries) {
      if (e.type === 'meal' && e.mealType !== 'breakfast') {
        const placed = placeMealInFreeWindow(e.minutes, blocks, floor, ceiling);
        if (placed !== e.minutes) {
          e.minutes = placed;
          e.time = toTimeStr(placed);
        }
      }
    }
  }

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
