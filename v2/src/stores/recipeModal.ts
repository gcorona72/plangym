import { writable } from 'svelte/store';
import type { Recipe } from '$lib/types';

export const activeRecipe = writable<Recipe | null>(null);
export function openRecipe(r: Recipe) { activeRecipe.set(r); }
export function closeRecipe() { activeRecipe.set(null); }
