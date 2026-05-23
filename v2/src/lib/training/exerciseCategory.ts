import type { Exercise } from '$lib/types';

/**
 * Categoría que determina cuánto sube un ejercicio en sobrecarga progresiva.
 *
 * No se sube lo mismo en una sentadilla con barra que en una elevación lateral
 * con mancuerna. Esta clasificación se deriva de las propiedades del ejercicio
 * (equipamiento + músculo + nombre) para no tener que rellenar `incrementKg`
 * a mano en cada uno de los 50+ ejercicios del seed.
 */
export type ExerciseCategory =
  | 'compound_lower'        // sentadilla, peso muerto, prensa
  | 'compound_upper'        // press banca, militar, remo con barra, peso lastrado
  | 'accessory_bilateral'   // press inclinado mancuerna, lunges con mancuernas
  | 'accessory_unilateral'  // remo a una mano, curl alterno
  | 'isolation_cable'       // cruces, jalón tríceps, face pull, curl polea
  | 'isolation_small_db'    // elevación lateral, curl martillo, francés con mancuerna
  | 'isolation_machine'     // leg curl, leg extension, máquina gemelos
  | 'calisthenics';

const SMALL_MUSCLES = new Set(['biceps', 'triceps', 'shoulders', 'forearms', 'calves', 'core']);
const LOWER_MUSCLES = new Set(['quads', 'hamstrings', 'glutes', 'calves']);
const UNILATERAL_RE = /one_arm|single|_alt_|bulgarian|pistol|lunge/;
const ISOLATION_NAME_RE = /lateral|fly|crossover|curl|extension|pushdown|raise|face_pull|french|katana/;

export function classifyExercise(ex: Exercise): ExerciseCategory {
  if (ex.modality === 'calisthenics') return 'calisthenics';

  const eq = new Set(ex.requiredEquipment ?? []);
  const muscles = ex.primaryMuscles ?? [];
  const id = ex.id.toLowerCase();

  const hasBarbell = eq.has('barbell');
  const hasDumbbells = eq.has('dumbbells');
  const hasCable = eq.has('cable_machine');
  const hasEzBar = eq.has('ez_bar');
  const hasPreacher = eq.has('preacher_curl');

  const isLowerBody = muscles.some(m => LOWER_MUSCLES.has(m));
  const isUnilateral = UNILATERAL_RE.test(id);
  const isIsolationName = ISOLATION_NAME_RE.test(id);
  const isAllSmallMuscle = muscles.length > 0 && muscles.every(m => SMALL_MUSCLES.has(m));

  // Cable → siempre aislamiento polea (incluso si toca pecho/espalda)
  if (hasCable) return 'isolation_cable';

  // Compuestos con barra
  if (hasBarbell && !isIsolationName) {
    if (isLowerBody) return 'compound_lower';
    return 'compound_upper';
  }

  // Pullup/dip lastrados → compuesto tren superior (peso clavija)
  if (id.includes('weighted') || id.includes('lastrado')) return 'compound_upper';

  // Mancuerna unilateral (remo 1 mano, alt curl)
  if (hasDumbbells && isUnilateral) return 'accessory_unilateral';

  // Mancuerna pequeño músculo (lateral, hammer, francés db)
  if (hasDumbbells && isAllSmallMuscle && isIsolationName) return 'isolation_small_db';

  // Mancuerna bilateral grande (incline db press, db lunges, db shoulder press)
  if (hasDumbbells || hasEzBar || hasPreacher) return 'accessory_bilateral';

  // Resto: máquinas aisladas (leg curl, leg ext, calf raise machine)
  return 'isolation_machine';
}

/**
 * Incremento (kg) sugerido al subir peso en esta categoría.
 *
 * Fuente: tabla de progresión del usuario (especificación del proyecto).
 *  - Compuesto tren inferior: +5 kg al inicio, baja a +2.5 cuando se estanca
 *  - Compuesto tren superior: +2.5 kg
 *  - Accesorio bilateral mancuerna: +2 kg (≈ +1 kg por mancuerna)
 *  - Accesorio unilateral mancuerna: +1 kg
 *  - Aislamiento polea: +2.5 kg
 *  - Aislamiento pequeño mancuerna: +1 kg (rango 0.5-1)
 *  - Aislamiento máquina: +2.5 kg
 */
export function getCategoryIncrement(category: ExerciseCategory): number {
  switch (category) {
    case 'compound_lower':       return 5;
    case 'compound_upper':       return 2.5;
    case 'accessory_bilateral':  return 2;
    case 'accessory_unilateral': return 1;
    case 'isolation_cable':      return 2.5;
    case 'isolation_small_db':   return 1;
    case 'isolation_machine':    return 2.5;
    case 'calisthenics':         return 0;
  }
}

/**
 * Etiqueta corta legible para mostrar en UI / mensajes de sugerencia.
 */
export function categoryLabel(category: ExerciseCategory): string {
  switch (category) {
    case 'compound_lower':       return 'compuesto tren inferior';
    case 'compound_upper':       return 'compuesto tren superior';
    case 'accessory_bilateral':  return 'accesorio bilateral';
    case 'accessory_unilateral': return 'accesorio unilateral';
    case 'isolation_cable':      return 'aislamiento en polea';
    case 'isolation_small_db':   return 'aislamiento pequeño';
    case 'isolation_machine':    return 'máquina aislada';
    case 'calisthenics':         return 'calistenia';
  }
}
