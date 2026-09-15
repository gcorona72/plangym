import type { MissedReason } from '$lib/types';

/**
 * DESENTRENAMIENTO (detraining) tras un parón.
 *
 * Volver de una baja larga con el peso de la última sesión es la receta para
 * fallar series y, peor, para lesionarse: tras una interrupción se pierde
 * fuerza y tolerancia al volumen, y el tejido conectivo se readapta más lento
 * que el músculo. La pérdida es pequeña en la primera semana (a veces nula) y
 * se acelera a partir de las 2-3 semanas de inactividad.
 *
 * Aquí traducimos ese fenómeno a un factor de carga aplicado a la sugerencia:
 * no "castigamos" al usuario, le damos un punto de partida realista desde el
 * que volver a progresar — normalmente se recupera el nivel previo en pocas
 * sesiones gracias a la memoria muscular.
 *
 * Un parón por ENFERMEDAD o LESIÓN pesa más que uno por viaje o agenda: hay
 * desacondicionamiento sistémico (y con fiebre, pérdida de masa magra), así
 * que sube un escalón la reducción.
 */

export interface DetrainingAdjustment {
  /** Factor multiplicador sobre el peso de la última sesión (1 = sin cambio). */
  factor: number;
  /** Reducción en % (0, 5, 10...) — para mostrar al usuario. */
  reductionPct: number;
  /** Días transcurridos desde la última sesión con ese ejercicio. */
  daysOff: number;
  /** Texto explicativo listo para la UI. Vacío si no hay ajuste. */
  message: string;
  /** Etiqueta corta del tramo (para tests y UI compacta). */
  severity: 'none' | 'mild' | 'moderate' | 'high' | 'restart';
}

/** Por debajo de esto un hueco es normal entre sesiones del mismo músculo. */
const NORMAL_GAP_DAYS = 10;

const REASON_LABEL: Record<MissedReason, string> = {
  illness: 'enfermedad',
  injury:  'lesión',
  travel:  'viaje',
  busy:    'falta de tiempo',
  rest:    'descanso'
};

/** Los parones por enfermedad/lesión desacondicionan más. */
function isHealthReason(r?: MissedReason | null): boolean {
  return r === 'illness' || r === 'injury';
}

/**
 * Calcula el ajuste de carga para volver tras un parón.
 *
 * @param daysOff  días desde la última sesión registrada con ese ejercicio
 * @param reason   motivo dominante de las ausencias del periodo (si se marcó)
 */
export function computeDetraining(daysOff: number, reason?: MissedReason | null): DetrainingAdjustment {
  const none: DetrainingAdjustment = {
    factor: 1, reductionPct: 0, daysOff, message: '', severity: 'none'
  };
  if (!Number.isFinite(daysOff) || daysOff < NORMAL_GAP_DAYS) return none;

  // Tramos base por días de parón.
  let reductionPct: number;
  let severity: DetrainingAdjustment['severity'];
  if (daysOff < 18)       { reductionPct = 5;  severity = 'mild'; }
  else if (daysOff < 28)  { reductionPct = 10; severity = 'moderate'; }
  else if (daysOff < 56)  { reductionPct = 15; severity = 'high'; }
  else                    { reductionPct = 25; severity = 'restart'; }

  // Enfermedad/lesión → un escalón más (tope 25%).
  if (isHealthReason(reason) && reductionPct < 25) {
    reductionPct += 5;
    if (severity === 'mild') severity = 'moderate';
    else if (severity === 'moderate') severity = 'high';
  }

  const weeks = Math.floor(daysOff / 7);
  const periodo = weeks >= 1
    ? `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
    : `${daysOff} días`;
  const causa = reason ? ` por ${REASON_LABEL[reason]}` : '';

  const message = severity === 'restart'
    ? `🔄 Vuelves tras ${periodo}${causa}. Empiezo un ${reductionPct}% por debajo: toma estas sesiones como reentrada, sube rápido en cuanto las series salgan limpias.`
    : `🤒 Llevabas ${periodo} sin entrenar esto${causa}. Bajo ${reductionPct}% para volver sin fallar series — recuperarás el nivel en 2-3 sesiones.`;

  return { factor: 1 - reductionPct / 100, reductionPct, daysOff, message, severity };
}

/** Días completos entre dos fechas yyyy-mm-dd (>= 0). */
export function daysBetween(fromKey: string, toKey: string): number {
  const a = new Date(fromKey + 'T00:00:00');
  const b = new Date(toKey + 'T00:00:00');
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}
