import type { UserProfile, DailyGoals, ActivityLevel, Sex } from '$lib/types';
import { macroCalculator } from './strategies/MacroCalculator';

/**
 * Cálculos de macros - ÚNICA FUENTE DE VERDAD para BMR / TDEE / objetivos diarios.
 *
 * Fórmulas usadas:
 * - BMR: Mifflin-St Jeor (más precisa que Harris-Benedict para población general)
 * - Proteína: 2.2 g/kg para ectomorfo en volumen (alto pero seguro)
 * - Grasas: 0.9 g/kg (en rango 0.7-1.0 g/kg recomendado)
 * - Carbohidratos: el resto de calorías
 *
 * Referencias:
 * - Helms et al. 2014 (Nutrición y entrenamiento de fuerza)
 * - Aragon & Schoenfeld 2013 (Pre/post workout)
 * - ISSN Position Stand on Diets & Body Composition 2017
 */

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

/** Rango permitido de surplus (para validar inputs). */
export const SURPLUS_RANGE = { min: 300, max: 700 } as const;

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Mifflin-St Jeor.
 * Hombres: BMR = 10*kg + 6.25*cm - 5*edad + 5
 * Mujeres: BMR = 10*kg + 6.25*cm - 5*edad - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/**
 * Calcula los objetivos diarios delegando en la estrategia adecuada
 * (Strategy pattern). La API pública se mantiene igual.
 */
export function calculateGoals(profile: UserProfile): DailyGoals {
  const age = calculateAge(profile.birthDate);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  return macroCalculator.compute(profile, bmr, tdee);
}

/**
 * Distribución porcentual de calorías por tipo de comida.
 * Suma 100%. Calibrado para ectomorfo en volumen (5 comidas).
 */
export const MEAL_RATIOS = {
  breakfast: 0.22,
  lunch: 0.30,
  pre_workout: 0.06,
  post_workout: 0.12,
  dinner: 0.26,
  snack: 0.04
} as const;
