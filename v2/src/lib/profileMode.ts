import type { UserProfile } from '$lib/types';

/**
 * Deriva el "modo" nutricional efectivo del usuario a partir de su fase
 * (userPhase) o, si no la tiene, de su objetivo (goal). Centraliza la lógica
 * para que TODO el copy de la app se adapte a cualquier usuario en vez de
 * asumir "ectomorfo en volumen".
 *
 *   surplus      → ganar masa (volume / gain)
 *   maintenance  → recomposición / mantener (recomp / maintain)
 *   deficit      → definir / perder grasa (cut)
 */
export type NutritionMode = 'surplus' | 'maintenance' | 'deficit';

export function getNutritionMode(profile: UserProfile | null | undefined): NutritionMode {
  if (!profile) return 'maintenance';
  const phase = profile.userPhase;
  if (phase === 'volume') return 'surplus';
  if (phase === 'cut') return 'deficit';
  if (phase === 'recomp') return 'maintenance';
  // Sin fase explícita → usar objetivo
  if (profile.goal === 'gain') return 'surplus';
  if (profile.goal === 'cut') return 'deficit';
  return 'maintenance';
}

export interface ModeCopy {
  /** Etiqueta corta del modo. */
  label: string;
  /** Emoji representativo. */
  emoji: string;
  /** Consejo cuando el usuario va corto de calorías al final del día. */
  underTargetTip: string;
  /** Título del consejo anterior. */
  underTargetTitle: string;
}

export function modeCopy(mode: NutritionMode): ModeCopy {
  switch (mode) {
    case 'surplus':
      return {
        label: 'Volumen', emoji: '📈',
        underTargetTitle: 'Vas justo de calorías hoy',
        underTargetTip: 'Te faltan calorías para tu objetivo. Un batido denso (avena + leche + crema de cacahuete + plátano) suma ~800 kcal sin saciar apenas — más fácil que forzar comida sólida.'
      };
    case 'deficit':
      return {
        label: 'Definición', emoji: '📉',
        underTargetTitle: 'Aún te queda margen hoy',
        underTargetTip: 'Te quedan calorías disponibles. Prioriza proteína magra y verduras: sacian mucho con pocas calorías y protegen tu músculo en déficit.'
      };
    case 'maintenance':
    default:
      return {
        label: 'Mantenimiento', emoji: '⚖️',
        underTargetTitle: 'Vas por debajo de tu objetivo',
        underTargetTip: 'Completa con una comida equilibrada (proteína + carbo + verdura). En recomposición la constancia diaria importa más que apurar las calorías hoy.'
      };
  }
}
