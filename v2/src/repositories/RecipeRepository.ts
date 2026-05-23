import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { Recipe, MealType, UserProfile } from '$lib/types';
import { filterRecipesForUser } from '$lib/nutrition/recipeFilter';

export class RecipeRepository extends BaseRepository<Recipe> {
  constructor() {
    super(db.recipes);
  }

  async findByMealType(type: MealType): Promise<Recipe[]> {
    const all = await this.getAll();
    return all.filter(r => r.mealTypes.includes(type));
  }

  async findForUser(profile: UserProfile): Promise<Recipe[]> {
    const all = await this.getAll();
    return filterRecipesForUser(all, profile);
  }

  async getMap(): Promise<Map<string, Recipe>> {
    const all = await this.getAll();
    return new Map(all.map(r => [r.id, r]));
  }
}

export const recipeRepository = new RecipeRepository();
