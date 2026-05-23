import type { UserProfile, DailyGoals } from '$lib/types';

/**
 * Interfaz del patrón Strategy para cálculo de macros.
 *
 * Cada estrategia (ectomorfo, mantenimiento, cut, recomp…) implementa
 * `compute()` con sus propias reglas. El cliente (MacroCalculator) elige
 * la estrategia según el perfil del usuario.
 */
export interface MacroStrategy {
  readonly id: string;
  readonly label: string;
  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals;
}

/** Helper compartido: clamp dentro de [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
