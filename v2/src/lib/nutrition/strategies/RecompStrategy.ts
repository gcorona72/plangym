import type { UserProfile, DailyGoals } from '$lib/types';
import type { MacroStrategy } from './MacroStrategy';

/**
 * Estrategia de RECOMPOSICIÓN — bajar grasa + ganar músculo a la vez.
 *
 * Indicada para principiantes con % de grasa relativamente alto (>16-18% en
 * hombres) antes de pasar a fase de volumen real.
 *
 * Reglas:
 *  - Calorías: TDEE - 100 (déficit muy leve, casi mantenimiento)
 *  - Proteína: 2.1 g/kg (alta para preservar masa magra en déficit)
 *  - Grasas: ~28 % de las kcal totales
 *  - Carbohidratos: el resto (concentrados pre y post entreno)
 */
export class RecompStrategy implements MacroStrategy {
  readonly id = 'recomp';
  readonly label = 'Recomposición · pierde grasa + gana músculo';

  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals {
    // Déficit muy leve para forzar recomposición
    const targetKcal = Math.max(tdee - 100, Math.round(bmr * 1.2));

    const proteinPerKg = profile.dietType === 'vegan' ? 2.3 : 2.1;
    const targetProteinG = Math.round(profile.weightKg * proteinPerKg);

    const fatsKcal = targetKcal * 0.28;
    const targetFatsG = Math.round(fatsKcal / 9);

    const remainingKcal = targetKcal - targetProteinG * 4 - fatsKcal;
    const targetCarbsG = Math.max(Math.round(remainingKcal / 4), 0);

    return { bmr, tdee, targetKcal, targetProteinG, targetCarbsG, targetFatsG };
  }
}
