import { db } from '$db/database';
import type { AppSettings, Exercise } from '$lib/types';

/**
 * SALTOS DE PESO REALES DEL GIMNASIO.
 *
 * Sugerir 52,5 kg en press banca no sirve si el disco más pequeño es de
 * 2,5 kg: con un disco por lado la barra sube de 5 en 5. Cada sugerencia
 * (subidas, bajadas, calentamiento, objetivos) se redondea a un peso que de
 * verdad se puede cargar:
 *   - Barra (y máquinas de discos como prensa o Smith): 2 × disco más pequeño.
 *   - Mancuernas: el salto entre mancuernas del gimnasio.
 *   - Máquinas de placas y poleas: el salto del selector.
 * Se configura en Ajustes → Gym. Por defecto: discos de 2,5 kg (barra de 5
 * en 5), mancuernas de 2 en 2 y máquinas de 2,5 en 2,5.
 */

export interface LoadSteps {
  /** Disco más pequeño (kg). La barra sube de 2× este valor. */
  barbellPlateKg: number;
  /** Salto entre mancuernas (kg). */
  dumbbellStepKg: number;
  /** Salto del selector de máquinas/poleas (kg). */
  machineStepKg: number;
}

export const DEFAULT_LOAD_STEPS: LoadSteps = {
  barbellPlateKg: 2.5,
  dumbbellStepKg: 2,
  machineStepKg: 2.5
};

export function stepsFromSettings(s?: Pick<AppSettings, 'loadSteps'> | null): LoadSteps {
  return { ...DEFAULT_LOAD_STEPS, ...(s?.loadSteps ?? {}) };
}

export async function getLoadSteps(): Promise<LoadSteps> {
  return stepsFromSettings(await db.settings.get(1));
}

type LoadKind = 'plates' | 'dumbbell' | 'machine' | 'bodyweight';

/** Cómo se carga el peso en este ejercicio. */
export function loadKind(ex: Exercise): LoadKind {
  if (ex.modality === 'calisthenics') return 'bodyweight';
  const eq = new Set(ex.requiredEquipment ?? []);
  if (eq.has('barbell') || eq.has('ez_bar') || eq.has('smith_machine') || eq.has('leg_press')) return 'plates';
  if (eq.has('dumbbells') || eq.has('kettlebells')) return 'dumbbell';
  return 'machine';
}

/** Salto mínimo de carga para este ejercicio (kg). */
export function stepFor(ex: Exercise, steps: LoadSteps): number {
  switch (loadKind(ex)) {
    case 'plates':   return steps.barbellPlateKg * 2;
    case 'dumbbell': return steps.dumbbellStepKg;
    case 'machine':  return steps.machineStepKg;
    default:         return 0.5;
  }
}

/**
 * Redondea a un peso cargable.
 *  - 'nearest': al más cercano; en empate, hacia abajo (mejor quedarse corto).
 *  - 'down' / 'up': siempre hacia abajo / arriba.
 */
export function roundLoad(
  ex: Exercise,
  kg: number,
  steps: LoadSteps,
  mode: 'nearest' | 'down' | 'up' = 'nearest'
): number {
  const step = stepFor(ex, steps);
  const q = kg / step;
  const n = mode === 'down' ? Math.floor(q + 1e-9)
          : mode === 'up'   ? Math.ceil(q - 1e-9)
          : Math.ceil(q - 0.5 - 1e-9); // empate → abajo
  let out = Math.round(n * step * 100) / 100;
  // La barra olímpica sola ya pesa 20 kg
  if ((ex.requiredEquipment ?? []).includes('barbell')) out = Math.max(20, out);
  return Math.max(0, out);
}
