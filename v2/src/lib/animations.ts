import { tweened } from 'svelte/motion';
import { cubicOut, expoOut } from 'svelte/easing';
import { writable, type Readable } from 'svelte/store';

/**
 * Devuelve un store que cuenta desde 0 hasta target con animación.
 * Útil para KPIs ("ticker" de números).
 */
export function countUp(target: number, duration: number = 800): Readable<number> {
  const store = tweened(0, { duration, easing: cubicOut });
  // Pequeño delay para que se aprecie la animación tras el primer render
  setTimeout(() => store.set(target), 50);
  return store;
}

/**
 * Variante que devuelve enteros redondeados.
 */
export function countUpInt(target: number, duration: number = 800): Readable<number> {
  const store = tweened(0, { duration, easing: expoOut });
  setTimeout(() => store.set(target), 50);
  return {
    subscribe(fn) {
      return store.subscribe(v => fn(Math.round(v)));
    }
  };
}

/**
 * Stagger: devuelve el delay (ms) en función del índice de la lista.
 * Úsalo como `style="animation-delay: {stagger(i)}ms"`.
 */
export function stagger(index: number, baseMs: number = 60, maxIndex: number = 10): number {
  return Math.min(index, maxIndex) * baseMs;
}
