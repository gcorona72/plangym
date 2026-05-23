import type { UserProfile, DailyGoals } from '$lib/types';
import type { MacroStrategy } from './MacroStrategy';
import { clamp } from './MacroStrategy';

/**
 * Estrategia para ectomorfo en volumen.
 * - Surplus: 400-700 kcal (configurable por el usuario, default 500)
 * - Proteína: 2.0 g/kg (2.2 si vegano)
 * - Grasas: 25% kcal totales
 * - Carbs: el resto
 */
export class EctomorphGainStrategy implements MacroStrategy {
  readonly id = 'ectomorph_gain';
  readonly label = 'Ectomorfo · ganar masa';

  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals {
    const surplus = clamp(profile.surplusKcal ?? 500, 300, 700);
    const targetKcal = Math.max(tdee + surplus, 1500);

    const proteinPerKg = profile.dietType === 'vegan' ? 2.2 : 2.0;
    const targetProteinG = Math.round(profile.weightKg * proteinPerKg);

    const fatsKcal = targetKcal * 0.25;
    const targetFatsG = Math.round(fatsKcal / 9);

    const remainingKcal = targetKcal - targetProteinG * 4 - fatsKcal;
    const targetCarbsG = Math.max(Math.round(remainingKcal / 4), 0);

    return { bmr, tdee, targetKcal, targetProteinG, targetCarbsG, targetFatsG };
  }
}
