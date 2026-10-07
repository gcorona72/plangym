/**
 * SERIE FINAL MÁS PESADA ("top set").
 *
 * Esquema de pirámide ascendente corta: las primeras series con el peso de
 * trabajo y la última con un salto más, a todas las reps que se pueda. Los
 * estudios que comparan pirámides con series a peso fijo, igualando volumen,
 * encuentran ganancias musculares parecidas — es una opción válida y además
 * da una señal clara de cuándo subir: si con el peso final haces holgado el
 * mínimo de reps, ese pasa a ser tu peso de trabajo.
 *
 * Para no confundir esa serie con el peso de trabajo, se separa: si la
 * última serie pesa más que todas las anteriores, es la serie final.
 */

interface SetLike {
  setNumber: number;
  weightKg?: number | null;
  reps: number;
  rir?: number | null;
}

export function splitTopSet<T extends SetLike>(sets: T[]): { straight: T[]; top: T | null } {
  const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  if (ordered.length < 2) return { straight: ordered, top: null };
  const last = ordered[ordered.length - 1];
  const others = ordered.slice(0, -1);
  const maxOthers = Math.max(...others.map(s => s.weightKg ?? 0));
  if (maxOthers > 0 && (last.weightKg ?? 0) > maxOthers) return { straight: others, top: last };
  return { straight: ordered, top: null };
}

/** Peso de trabajo: el de las series normales (sin contar la serie final). */
export function workingWeightOf(sets: SetLike[]): number | null {
  const { straight } = splitTopSet(sets);
  const w = Math.max(0, ...straight.map(s => s.weightKg ?? 0));
  return w > 0 ? w : null;
}
