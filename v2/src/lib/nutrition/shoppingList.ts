import type { Recipe, Ingredient, MealType } from '$lib/types';
import { db } from '$db/database';
import { DAILY_MEAL_SLOTS, suggestRecipeForSlot } from './mealPlan';
import { toDateKey, dateRange, addDays } from '$lib/dateUtils';
import { filterRecipesForUser } from './recipeFilter';

export type Period = 'today' | 'week' | 'month' | 'year';

export interface ShoppingItem {
  ingredient: Ingredient;
  /** Cantidad total agregada en la unidad nativa del ingrediente (g, ml, unidades). */
  amount: number;
  /** Cuántas veces aparece en el plan. */
  occurrences: number;
}

export interface ShoppingList {
  period: Period;
  startDate: string;
  endDate: string;
  days: number;
  itemsByCategory: Record<string, ShoppingItem[]>;
  totalItems: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  protein: '🥩 Proteínas',
  carb: '🍚 Hidratos',
  fat: '🥑 Grasas',
  vegetable: '🥬 Verduras',
  fruit: '🍎 Frutas',
  dairy: '🥛 Lácteos',
  other: '🧂 Otros'
};

export const CATEGORY_ORDER = ['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy', 'other'];

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

/**
 * Genera la lista de la compra agregando ingredientes a partir del meal plan
 * del periodo (priorizando comidas ya registradas, fallback a las sugeridas).
 */
export async function buildShoppingList(period: Period, startFrom?: Date): Promise<ShoppingList> {
  const start = startFrom ?? new Date();
  start.setHours(0, 0, 0, 0);

  let end: Date;
  let days: number;
  switch (period) {
    case 'today':
      end = new Date(start);
      days = 1;
      break;
    case 'week':
      end = addDays(start, 6);
      days = 7;
      break;
    case 'month':
      end = addDays(start, 29);
      days = 30;
      break;
    case 'year':
      // Calculamos 1 semana real y extrapolamos × 52 (no genera 365 entradas para no petar)
      end = addDays(start, 6);
      days = 365;
      break;
  }

  // Datos base
  const [allRecipes, ingredients, profile, mealLogs] = await Promise.all([
    db.recipes.toArray(),
    db.ingredients.toArray(),
    db.profile.get(1),
    db.mealLogs.toArray()
  ]);

  // Recetas disponibles para el usuario (filtradas por dieta/alergias)
  const userRecipes = profile ? filterRecipesForUser(allRecipes, profile) : allRecipes;
  const recipeById = new Map(allRecipes.map(r => [r.id, r]));
  const ingredientById = new Map(ingredients.map(i => [i.id, i]));
  const logsByDate = new Map(mealLogs.map(l => [l.date, l]));

  // Para el periodo "year" generamos solo una semana y multiplicamos.
  // Para los demás, iteramos día a día.
  const periodEnd = period === 'year' ? addDays(start, 6) : end;
  const dates = dateRange(start, periodEnd);

  // Agrupamos por ingredientId → cantidad total
  const tallies = new Map<string, { amount: number; occurrences: number }>();

  function addRecipe(recipe: Recipe, multiplier = 1) {
    for (const item of recipe.ingredients) {
      const existing = tallies.get(item.ingredientId);
      const addAmount = item.amount * multiplier;
      if (existing) {
        existing.amount += addAmount;
        existing.occurrences += 1;
      } else {
        tallies.set(item.ingredientId, { amount: addAmount, occurrences: 1 });
      }
    }
  }

  for (const d of dates) {
    const key = toDateKey(d);
    const log = logsByDate.get(`log_${key}`);

    if (log && log.meals.length > 0) {
      // Si ya hay comidas registradas para ese día → usarlas (más fiel)
      for (const meal of log.meals) {
        if (!meal.recipeId) continue;
        const r = recipeById.get(meal.recipeId);
        if (r) addRecipe(r, meal.servings || 1);
      }
    } else {
      // Si no, generar plan recomendado para ese día
      for (const slot of DAILY_MEAL_SLOTS) {
        const recipe = suggestRecipeForSlot(slot.type as MealType, userRecipes, key);
        if (recipe) addRecipe(recipe, 1);
      }
    }
  }

  // Si es anual: multiplicamos por 52 (52 semanas)
  const yearlyMultiplier = period === 'year' ? 52 : 1;

  // Agrupar por categoría
  const itemsByCategory: Record<string, ShoppingItem[]> = {};
  let totalItems = 0;

  for (const [ingredientId, t] of tallies.entries()) {
    const ing = ingredientById.get(ingredientId);
    if (!ing) continue;
    const item: ShoppingItem = {
      ingredient: ing,
      amount: Math.round(t.amount * yearlyMultiplier),
      occurrences: t.occurrences * yearlyMultiplier
    };
    if (!itemsByCategory[ing.category]) itemsByCategory[ing.category] = [];
    itemsByCategory[ing.category].push(item);
    totalItems++;
  }

  // Ordenar cada categoría por cantidad descendente
  for (const cat in itemsByCategory) {
    itemsByCategory[cat].sort((a, b) => b.amount - a.amount);
  }

  return {
    period,
    startDate: toDateKey(start),
    endDate: toDateKey(end),
    days,
    itemsByCategory,
    totalItems
  };
}

/**
 * Convierte cantidades a unidades amigables (kg si >=1000g, L si >=1000ml).
 */
export function formatAmount(amount: number, unit: 'g' | 'ml' | 'unit'): string {
  if (unit === 'unit') {
    return `${amount} ${amount === 1 ? 'unidad' : 'uds'}`;
  }
  if (unit === 'g') {
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)} kg`;
    return `${amount} g`;
  }
  // ml
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)} L`;
  return `${amount} ml`;
}

/**
 * Exporta la lista como CSV.
 */
export function shoppingListToCSV(list: ShoppingList): string {
  const lines: string[] = ['Categoría;Ingrediente;Cantidad;Unidad'];
  for (const cat of CATEGORY_ORDER) {
    const items = list.itemsByCategory[cat] ?? [];
    for (const item of items) {
      const catLabel = (CATEGORY_LABELS[cat] ?? cat).replace(/^[^\w]+/, '').trim();
      lines.push(`${catLabel};${item.ingredient.name};${item.amount};${item.ingredient.unit}`);
    }
  }
  return lines.join('\n');
}

/**
 * Exporta la lista como texto plano (para WhatsApp, notas, etc.)
 */
export function shoppingListToText(list: ShoppingList, title: string): string {
  const out: string[] = [`🛒 ${title}`, ''];
  for (const cat of CATEGORY_ORDER) {
    const items = list.itemsByCategory[cat] ?? [];
    if (items.length === 0) continue;
    out.push(categoryLabel(cat));
    for (const item of items) {
      out.push(`  • ${item.ingredient.name} — ${formatAmount(item.amount, item.ingredient.unit)}`);
    }
    out.push('');
  }
  return out.join('\n');
}
