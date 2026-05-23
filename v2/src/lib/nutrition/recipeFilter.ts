import type { Recipe, UserProfile, UserPhase } from '$lib/types';

/**
 * Filtra por fase del usuario:
 *  - Si la receta no tiene `phases` → compatible con todas
 *  - Si tiene `phases` → solo se muestra si incluye la fase actual
 */
export function filterByPhase(recipes: Recipe[], phase: UserPhase | undefined): Recipe[] {
  if (!phase) return recipes;
  return recipes.filter(r => !r.phases || r.phases.length === 0 || r.phases.includes(phase));
}

/**
 * Filtra recetas según dieta del usuario y alergias.
 * Lógica:
 * - Vegano: solo recetas con dietTypes incluyendo 'vegan'
 * - Vegetariano: incluye 'vegetarian' o 'vegan'
 * - Omnívoro: cualquiera
 *
 * - Si el usuario tiene alguna alergia y la receta la contiene → excluir.
 * - Si presupuesto bajo → preferir costLevel low/medium.
 */
export function filterRecipesForUser(recipes: Recipe[], profile: UserProfile): Recipe[] {
  const diet = profile.dietType ?? 'omnivore';
  const allergies = (profile.allergies ?? []).map(a => a.toLowerCase().trim()).filter(Boolean);
  const budget = profile.budget;

  return recipes.filter(r => {
    // Filtro dieta
    if (r.dietTypes && r.dietTypes.length > 0) {
      if (diet === 'vegan' && !r.dietTypes.includes('vegan')) return false;
      if (diet === 'vegetarian' && !r.dietTypes.some(d => d === 'vegan' || d === 'vegetarian')) return false;
      // omnívoro acepta cualquiera
    }
    // Filtro alergias: si alguna alergia coincide con un allergen → fuera
    if (allergies.length > 0 && r.allergens) {
      const recipeAllergens = r.allergens.map(a => a.toLowerCase());
      if (allergies.some(a => recipeAllergens.some(ra => ra.includes(a) || a.includes(ra)))) {
        return false;
      }
    }
    // Filtro presupuesto: si bajo, no recetas caras
    if (budget === 'low' && r.costLevel === 'high') return false;
    // Filtro fase: si el usuario está en una fase y la receta marca fases específicas
    if (profile.userPhase && r.phases && r.phases.length > 0) {
      if (!r.phases.includes(profile.userPhase)) return false;
    }
    return true;
  });
}
