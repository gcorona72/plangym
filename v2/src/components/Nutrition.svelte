<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { goals } from '$stores/profile';
  import { calculateRecipeMacros } from '$lib/nutrition/recipeMacros';
  import { DAILY_MEAL_SLOTS, suggestRecipeForSlot, targetKcalForSlot } from '$lib/nutrition/mealPlan';
  import { summarizeNutritionDay } from '$lib/nutrition/daySummary';
  import { filterRecipesForUser } from '$lib/nutrition/recipeFilter';
  import { profile } from '$stores/profile';
  import { navigate } from '$stores/navigation';
  import { openRecipe } from '$stores/recipeModal';
  import { toDateKey, isoDayOfWeek } from '$lib/dateUtils';
  import type { Recipe, Ingredient, Macros, MealType, DailyMealLog, TrainingDay } from '$lib/types';
  import RecipePicker from './RecipePicker.svelte';

  let activeTab: 'today' | 'recipes' = 'today';
  let allRecipes: Recipe[] = [];
  let ingredientsById = new Map<string, Ingredient>();
  let recipeMacros = new Map<string, Macros>();
  let todayLog: DailyMealLog | null = null;
  let pickerSlot: MealType | null = null;
  const todayKey = toDateKey();
  let todayTrainingDay: TrainingDay | null = null;

  // Filtrado por dieta/alergias/presupuesto del usuario
  $: recipes = $profile ? filterRecipesForUser(allRecipes, $profile) : allRecipes;

  onMount(async () => {
    allRecipes = await db.recipes.toArray();
    const ings = await db.ingredients.toArray();
    ingredientsById = new Map(ings.map(i => [i.id, i]));
    recipeMacros = new Map(allRecipes.map(r => [r.id, calculateRecipeMacros(r, ingredientsById)]));

    todayLog = (await db.mealLogs.get(`log_${todayKey}`)) ?? {
      id: `log_${todayKey}`,
      date: todayKey,
      meals: []
    };

    // Cargar el día de entreno de hoy para personalizar el resumen
    const program = await db.programs.filter(p => p.active).first();
    if (program) {
      todayTrainingDay = program.days[isoDayOfWeek(new Date())] ?? null;
    }
  });

  $: nutritionSummary = $goals ? summarizeNutritionDay($goals, todayTrainingDay) : null;

  /** Receta sugerida para cada slot. Puede sobreescribirse si el usuario picks otra. */
  let manualOverrides: Map<MealType, string> = new Map();

  function suggestedFor(type: MealType): Recipe | undefined {
    const override = manualOverrides.get(type);
    if (override) return recipes.find(r => r.id === override);
    return suggestRecipeForSlot(type, recipes, todayKey);
  }

  function isLogged(type: MealType): boolean {
    return todayLog?.meals.some(m => m.type === type) ?? false;
  }

  function loggedRecipe(type: MealType): { recipeId?: string; macros: Macros } | null {
    const m = todayLog?.meals.find(m => m.type === type);
    return m ? { recipeId: m.recipeId, macros: m.macros } : null;
  }

  async function logSlot(type: MealType, recipe: Recipe) {
    if (!todayLog) return;
    const macros = recipeMacros.get(recipe.id);
    if (!macros) return;
    // Si ya hay una comida para este slot → reemplazar
    todayLog.meals = todayLog.meals.filter(m => m.type !== type);
    todayLog.meals.push({
      type,
      recipeId: recipe.id,
      servings: 1,
      macros,
      consumed: true,
      consumedAt: new Date().toISOString()
    });
    await db.mealLogs.put(todayLog);
    todayLog = todayLog;
  }

  async function unlogSlot(type: MealType) {
    if (!todayLog) return;
    todayLog.meals = todayLog.meals.filter(m => m.type !== type);
    await db.mealLogs.put(todayLog);
    todayLog = todayLog;
  }

  function pickRecipeForSlot(type: MealType) {
    pickerSlot = type;
  }

  async function onPickerSelect(recipe: Recipe) {
    if (pickerSlot != null) {
      manualOverrides.set(pickerSlot, recipe.id);
      manualOverrides = manualOverrides;
      await logSlot(pickerSlot, recipe);
      pickerSlot = null;
    }
  }

  $: totalsToday = todayLog?.meals.reduce((acc, m) => ({
    kcal: acc.kcal + m.macros.kcal,
    proteinG: acc.proteinG + m.macros.proteinG,
    carbsG: acc.carbsG + m.macros.carbsG,
    fatsG: acc.fatsG + m.macros.fatsG
  }), { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }) ?? { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 };

  // Tip de calorías líquidas: si está atardeciendo y queda más del 30% de kcal por consumir
  $: hour = new Date().getHours();
  $: showLiquidTip = $goals && hour >= 19 &&
    (totalsToday.kcal / $goals.targetKcal) < 0.7 &&
    (todayLog?.meals.length ?? 0) > 0;
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-4">Nutrición 🥗</h1>

  <!-- Tabs: Plan de hoy / Catálogo de recetas -->
  <div class="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200">
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
            class:bg-primary-600={activeTab === 'today'}
            class:text-slate-500={activeTab !== 'today'}
            on:click={() => activeTab = 'today'}>📋 Plan de hoy</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
            class:bg-primary-600={activeTab === 'recipes'}
            class:text-slate-500={activeTab !== 'recipes'}
            on:click={() => activeTab = 'recipes'}>📚 Recetas</button>
  </div>

  {#if activeTab === 'today'}
    <!-- 🛒 Acceso rápido a la lista de compra -->
    <button class="w-full text-left card mb-3 flex items-center gap-3 active:scale-[0.99] transition" on:click={() => navigate('shopping')}>
      <span class="text-3xl">🛒</span>
      <div class="flex-1">
        <div class="font-bold">Lista de la compra</div>
        <div class="text-xs text-slate-500">Genera tu lista (día/semana/mes/año) con cantidades agregadas</div>
      </div>
      <span class="text-primary-500">→</span>
    </button>

    <!-- 💧 Tip de calorías líquidas (cuando vas tarde) -->
    {#if showLiquidTip && $goals}
      {@const remaining = $goals.targetKcal - totalsToday.kcal}
      <div class="card-feature mb-3 ring-2 ring-blue-300 bg-blue-50">
        <div class="flex items-start gap-2">
          <span class="text-2xl">💧</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-blue-800">Vas justo de calorías hoy</div>
            <div class="text-sm text-blue-700 mt-1">
              Te quedan {remaining} kcal y queda poco día. Un <b>batido hipercalórico</b>
              (avena + leche entera + crema cacahuete + plátano) son ~800 kcal sin saciedad. Mejor que forzar comida sólida.
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- 📍 Resumen del día (qué toca hoy) -->
    {#if nutritionSummary}
      <div class="card-feature mb-4">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-3xl">{nutritionSummary.emoji}</span>
          <div class="font-bold text-lg">{nutritionSummary.title}</div>
        </div>
        <p class="text-sm text-slate-700 mt-2">{nutritionSummary.pitch}</p>
      </div>
    {/if}

    <!-- Resumen macros del día -->
    {#if $goals}
      <div class="card mb-4">
        <div class="flex justify-between items-baseline mb-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase">Progreso del día</h3>
          <span class="text-xs text-slate-500 font-mono">{totalsToday.kcal}/{$goals.targetKcal} kcal</span>
        </div>
        <div class="space-y-2">
          {#each [
            ['Proteína', totalsToday.proteinG, $goals.targetProteinG, 'bg-accent-600'],
            ['Carbos',   totalsToday.carbsG,   $goals.targetCarbsG,  'bg-yellow-500'],
            ['Grasas',   totalsToday.fatsG,    $goals.targetFatsG,   'bg-orange-500']
          ] as [label, val, target, color]}
            {@const pct = Math.min((Number(val) / Number(target)) * 100, 100)}
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-500">{label}</span>
                <span class="text-slate-700 font-mono">{val}/{target}g</span>
              </div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full {color} transition-all" style="width: {pct}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- SLOTS DE COMIDAS DE HOY -->
    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Comidas de hoy</h3>
    <div class="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
      {#each DAILY_MEAL_SLOTS as slot}
        {@const logged = loggedRecipe(slot.type)}
        {@const suggestion = suggestedFor(slot.type)}
        {@const displayRecipe = logged?.recipeId
                                  ? recipes.find(r => r.id === logged.recipeId)
                                  : suggestion}
        {@const macros = displayRecipe ? recipeMacros.get(displayRecipe.id) : undefined}
        {@const targetK = $goals ? targetKcalForSlot(slot.type, $goals.targetKcal) : 0}

        <div class="card"
             class:border-accent-500={logged}
             class:bg-accent-600-10={logged}>
          <div class="flex items-start gap-2 mb-2">
            <span class="text-2xl">{slot.icon}</span>
            <button
              type="button"
              class="flex-1 min-w-0 text-left active:opacity-70"
              disabled={!displayRecipe}
              on:click={() => displayRecipe && openRecipe(displayRecipe)}>
              <div class="text-xs text-slate-500 uppercase tracking-wide">{slot.label} · ~{targetK} kcal</div>
              <div class="font-bold text-sm leading-tight mt-0.5 flex items-center gap-1.5">
                {displayRecipe?.name ?? 'Sin asignar'}
                {#if displayRecipe?.isComplex}
                  <span class="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">🎬 receta</span>
                {/if}
              </div>
              {#if macros}
                <div class="text-[10px] text-slate-500 mt-1">
                  {macros.kcal} kcal · {macros.proteinG}g prot · {macros.carbsG}g carb · {macros.fatsG}g grasa
                </div>
              {/if}
            </button>
            {#if logged}
              <span class="text-xs bg-accent-600 text-white px-2 py-0.5 rounded-full font-bold">✓</span>
            {/if}
          </div>

          <div class="flex gap-2 mt-2">
            {#if logged}
              <button class="btn-secondary flex-1 py-1.5 text-xs" on:click={() => unlogSlot(slot.type)}>
                Deshacer
              </button>
              <button class="btn-ghost flex-1 py-1.5 text-xs" on:click={() => pickRecipeForSlot(slot.type)}>
                Cambiar
              </button>
            {:else if displayRecipe}
              <button class="btn-primary flex-1 py-1.5 text-xs" on:click={() => logSlot(slot.type, displayRecipe)}>
                ✓ Marcar comido
              </button>
              <button class="btn-secondary py-1.5 text-xs px-3" on:click={() => pickRecipeForSlot(slot.type)}>
                Otra
              </button>
            {:else}
              <button class="btn-secondary flex-1 py-1.5 text-xs" on:click={() => pickRecipeForSlot(slot.type)}>
                Elegir receta
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

  {:else}
    <!-- CATÁLOGO COMPLETO -->
    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Todas las recetas ({recipes.length})</h3>
    <div class="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
      {#each recipes as recipe}
        {@const m = recipeMacros.get(recipe.id)}
        <button type="button" class="card text-left w-full active:scale-[0.98] transition" on:click={() => openRecipe(recipe)}>
          <div class="flex items-center gap-1.5 mb-1">
            <span class="font-bold">{recipe.name}</span>
            {#if recipe.isComplex}
              <span class="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">🎬 tutorial</span>
            {/if}
          </div>
          {#if m}
            <div class="text-xs text-slate-500 mb-2">
              {m.kcal} kcal · {m.proteinG}g prot · {m.carbsG}g carb · {m.fatsG}g grasa · {recipe.prepMinutes}min
            </div>
          {/if}
          <div class="flex flex-wrap gap-1 mt-1">
            {#each recipe.mealTypes as t}
              {@const slot = DAILY_MEAL_SLOTS.find(s => s.type === t)}
              {#if slot}
                <span class="chip text-[10px]">{slot.icon} {slot.label}</span>
              {/if}
            {/each}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal de elección de receta -->
{#if pickerSlot != null}
  <RecipePicker
    slotType={pickerSlot}
    {recipes}
    {recipeMacros}
    onSelect={onPickerSelect}
    onClose={() => pickerSlot = null}
  />
{/if}
