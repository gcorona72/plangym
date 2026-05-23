<script lang="ts">
  import type { Recipe, MealType, Macros } from '$lib/types';
  import { DAILY_MEAL_SLOTS } from '$lib/nutrition/mealPlan';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let slotType: MealType;
  export let recipes: Recipe[];
  export let recipeMacros: Map<string, Macros>;
  export let onSelect: (recipe: Recipe) => void;
  export let onClose: () => void;

  $: slot = DAILY_MEAL_SLOTS.find(s => s.type === slotType);
  $: matches = recipes.filter(r => r.mealTypes.includes(slotType));
</script>

<div class="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur overflow-y-auto safe-top safe-bottom"
     transition:fade={{ duration: 180 }}>
  <div class="max-w-2xl mx-auto md:max-w-4xl px-5 py-6"
       in:fly={{ y: 24, duration: 320, easing: cubicOut }}>
    <button class="text-slate-500 mb-4 active:scale-95" on:click={onClose}>← Cerrar</button>

    <h2 class="text-2xl font-bold mb-1">
      Elegir para {slot?.icon} {slot?.label}
    </h2>
    <p class="text-slate-500 text-sm mb-5">{matches.length} recetas compatibles</p>

    <div class="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
      {#each matches as recipe}
        {@const m = recipeMacros.get(recipe.id)}
        <button class="card text-left w-full active:scale-[0.98]" on:click={() => onSelect(recipe)}>
          <div class="font-bold mb-1">{recipe.name}</div>
          {#if m}
            <div class="text-xs text-slate-500">
              {m.kcal} kcal · {m.proteinG}g prot · {m.carbsG}g carb · {m.fatsG}g grasa
            </div>
          {/if}
          <div class="text-[10px] text-slate-500 mt-1">{recipe.prepMinutes}min de preparación</div>
        </button>
      {:else}
        <p class="text-slate-500 text-sm">No hay recetas compatibles para este tipo de comida.</p>
      {/each}
    </div>
  </div>
</div>
