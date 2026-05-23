<script lang="ts">
  import { onMount } from 'svelte';
  import type { Recipe, Ingredient, Macros } from '$lib/types';
  import { db } from '$db/database';
  import { calculateRecipeMacros } from '$lib/nutrition/recipeMacros';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let recipe: Recipe;
  export let onClose: () => void;

  let ingredientsById = new Map<string, Ingredient>();
  let macros: Macros | null = null;
  let showVideo = false;

  onMount(async () => {
    const ings = await db.ingredients.toArray();
    ingredientsById = new Map(ings.map(i => [i.id, i]));
    macros = calculateRecipeMacros(recipe, ingredientsById);
  });

  $: embedUrl = recipe.videoId
    ? `https://www.youtube-nocookie.com/embed/${recipe.videoId}?autoplay=1&mute=1&loop=1&playlist=${recipe.videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`
    : null;

  $: searchUrl = recipe.youtubeQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.youtubeQuery)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' receta fitness')}`;

  function fmtIngredient(amount: number, unit: 'g' | 'ml' | 'unit', name: string): string {
    if (unit === 'unit') return `${amount} ${amount === 1 ? 'unidad' : 'uds'} de ${name}`;
    if (unit === 'ml') return `${amount} ml de ${name}`;
    return `${amount} g de ${name}`;
  }
</script>

<div class="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-sm overflow-y-auto safe-top safe-bottom"
     transition:fade={{ duration: 180 }}>
  <div class="max-w-2xl mx-auto md:max-w-4xl px-5 py-6"
       in:scale={{ duration: 280, start: 0.96, easing: cubicOut }}>
    <button class="text-slate-500 mb-4 active:scale-95" on:click={onClose}>← Cerrar</button>

    <h1 class="text-2xl md:text-3xl font-bold mb-1">{recipe.name}</h1>
    <p class="text-xs text-slate-500 mb-4">
      🕐 {recipe.prepMinutes} min · 🍽 {recipe.servings} ración{recipe.servings === 1 ? '' : 'es'}
      {#if recipe.isComplex} · 👨‍🍳 Receta elaborada{/if}
      {#if recipe.mealPrepFriendly} · 📦 Meal-prep{/if}
    </p>

    <!-- Badge de tamaño calórico -->
    {#if recipe.calorieSize}
      <div class="flex flex-wrap gap-1.5 mb-4">
        <span class="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider"
              class:bg-emerald-100={recipe.calorieSize === 'small'}
              class:text-emerald-700={recipe.calorieSize === 'small'}
              class:bg-blue-100={recipe.calorieSize === 'medium'}
              class:text-blue-700={recipe.calorieSize === 'medium'}
              class:bg-orange-100={recipe.calorieSize === 'large'}
              class:text-orange-700={recipe.calorieSize === 'large'}>
          {#if recipe.calorieSize === 'small'}🥗 Snack · 200-400 kcal
          {:else if recipe.calorieSize === 'medium'}🍽 Comida · 400-700 kcal
          {:else}🍝 Densa · 700+ kcal (día duro){/if}
        </span>
        {#if recipe.tags?.includes('dia-duro')}
          <span class="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
            💪 Día duro / pierna
          </span>
        {/if}
      </div>
    {/if}

    {#if recipe.description}
      <p class="text-sm text-slate-700 mb-4">{recipe.description}</p>
    {/if}

    <!-- Macros -->
    {#if macros}
      <div class="card mb-4">
        <h2 class="section-title mb-2">Macros por ración</h2>
        <div class="grid grid-cols-4 gap-2 text-center">
          <div>
            <div class="text-2xl font-bold text-primary-600">{macros.kcal}</div>
            <div class="text-[10px] text-slate-500 uppercase">kcal</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-accent-600">{macros.proteinG}<span class="text-xs">g</span></div>
            <div class="text-[10px] text-slate-500 uppercase">Proteína</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-600">{macros.carbsG}<span class="text-xs">g</span></div>
            <div class="text-[10px] text-slate-500 uppercase">Carbos</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-500">{macros.fatsG}<span class="text-xs">g</span></div>
            <div class="text-[10px] text-slate-500 uppercase">Grasas</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Vídeo tutorial (solo recetas complejas o si tiene videoId) -->
    {#if recipe.isComplex || recipe.videoId || recipe.youtubeQuery}
      <div class="card mb-4 p-0 overflow-hidden">
        <div class="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <h2 class="section-title text-slate-700">🎬 Tutorial</h2>
        </div>

        {#if embedUrl && showVideo}
          <!-- YouTube embed inline -->
          <div class="aspect-video w-full bg-slate-900">
            <iframe
              class="w-full h-full"
              src={embedUrl}
              title="Tutorial {recipe.name}"
              frameborder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        {:else if embedUrl}
          <!-- Thumbnail click-to-play -->
          <button
            class="aspect-video w-full bg-gradient-to-br from-primary-100 to-slate-100 flex flex-col items-center justify-center active:scale-[0.98] transition"
            on:click={() => showVideo = true}>
            <div class="text-5xl mb-2">▶️</div>
            <div class="font-bold">Reproducir tutorial</div>
            <div class="text-[10px] text-slate-500 mt-1">Pulsa para cargar el vídeo</div>
          </button>
        {:else}
          <!-- Fallback: buscar en YouTube -->
          <a href={searchUrl} target="_blank" rel="noopener noreferrer"
             class="aspect-video w-full bg-gradient-to-br from-primary-100 to-slate-100 flex flex-col items-center justify-center text-center p-4 active:scale-[0.98] transition no-underline">
            <div class="text-5xl mb-2">🎬</div>
            <div class="font-bold">Buscar tutorial en YouTube</div>
            <div class="text-[10px] text-slate-500 mt-1">Se abre en pestaña nueva ↗</div>
          </a>
        {/if}
      </div>
    {/if}

    <!-- Ingredientes -->
    <div class="card mb-4">
      <h2 class="section-title mb-3">Ingredientes</h2>
      <ul class="space-y-1.5 text-sm">
        {#each recipe.ingredients as item}
          {@const ing = ingredientsById.get(item.ingredientId)}
          {#if ing}
            <li class="flex items-start gap-2">
              <span class="text-primary-500 mt-0.5">•</span>
              <span>{fmtIngredient(item.amount, ing.unit, ing.name)}</span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>

    <!-- Pasos -->
    {#if recipe.steps.length > 0}
      <div class="card mb-4">
        <h2 class="section-title mb-3">Preparación</h2>
        <ol class="space-y-2.5 text-sm">
          {#each recipe.steps as step, i}
            <li class="flex gap-3">
              <span class="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span class="flex-1 pt-0.5">{step}</span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}

    <!-- Tags -->
    {#if recipe.tags && recipe.tags.length > 0}
      <div class="flex flex-wrap gap-1.5 mb-4">
        {#each recipe.tags as t}
          <span class="chip text-[10px]">{t}</span>
        {/each}
      </div>
    {/if}

    <button class="btn-secondary w-full" on:click={onClose}>Volver</button>
  </div>
</div>
