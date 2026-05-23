import type { Recipe, Ingredient, Macros } from '$lib/types';

/**
 * Calcula los macros totales de una receta dado los ingredientes y sus cantidades.
 * Por porción (servings).
 */
export function calculateRecipeMacros(
  recipe: Recipe,
  ingredientsById: Map<string, Ingredient>
): Macros {
  const totals: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 };

  for (const item of recipe.ingredients) {
    const ing = ingredientsById.get(item.ingredientId);
    if (!ing) continue;

    // Si la unidad es 'unit' (huevo, plátano), el amount = nº de unidades
    // Si es 'g' o 'ml', el factor es amount/100
    const factor = ing.unit === 'unit' ? item.amount : item.amount / 100;

    totals.kcal += ing.macrosPer100.kcal * factor;
    totals.proteinG += ing.macrosPer100.proteinG * factor;
    totals.carbsG += ing.macrosPer100.carbsG * factor;
    totals.fatsG += ing.macrosPer100.fatsG * factor;
  }

  // Por porción
  return {
    kcal: Math.round(totals.kcal / recipe.servings),
    proteinG: Math.round(totals.proteinG / recipe.servings),
    carbsG: Math.round(totals.carbsG / recipe.servings),
    fatsG: Math.round(totals.fatsG / recipe.servings)
  };
}
