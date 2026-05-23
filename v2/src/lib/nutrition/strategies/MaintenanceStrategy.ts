import type { UserProfile, DailyGoals } from '$lib/types';
import type { MacroStrategy } from './MacroStrategy';

/**
 * Estrategia de mantenimiento: targetKcal = TDEE.
 * Proteína 1.8 g/kg, grasas 25%, carbs resto.
 */
export class MaintenanceStrategy implements MacroStrategy {
  readonly id = 'maintenance';
  readonly label = 'Mantenimiento';

  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals {
    const targetKcal = tdee;
    const targetProteinG = Math.round(profile.weightKg * 1.8);
    const fatsKcal = targetKcal * 0.25;
    const targetFatsG = Math.round(fatsKcal / 9);
    const remainingKcal = targetKcal - targetProteinG * 4 - fatsKcal;
    const targetCarbsG = Math.max(Math.round(remainingKcal / 4), 0);
    return { bmr, tdee, targetKcal, targetProteinG, targetCarbsG, targetFatsG };
  }
}
