import type { UserProfile, DailyGoals } from '$lib/types';
import type { MacroStrategy } from './MacroStrategy';

/**
 * Estrategia de definición (cut).
 * - Déficit ~300 kcal
 * - Proteína alta: 2.4 g/kg (protege la masa muscular en déficit)
 * - Grasas: 25% kcal
 * - Carbs: el resto (aún suficientes para entrenar)
 */
export class CutStrategy implements MacroStrategy {
  readonly id = 'cut';
  readonly label = 'Definición · perder grasa';

  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals {
    const targetKcal = Math.max(tdee - 300, Math.round(bmr * 1.1)); // suelo de seguridad
    const targetProteinG = Math.round(profile.weightKg * 2.4);
    const fatsKcal = targetKcal * 0.25;
    const targetFatsG = Math.round(fatsKcal / 9);
    const remainingKcal = targetKcal - targetProteinG * 4 - fatsKcal;
    const targetCarbsG = Math.max(Math.round(remainingKcal / 4), 0);
    return { bmr, tdee, targetKcal, targetProteinG, targetCarbsG, targetFatsG };
  }
}
