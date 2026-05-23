<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PlannedExercise } from '$lib/types';

  export let exerciseId: string;
  export let planned: PlannedExercise;
  /** Peso sugerido por el algoritmo de progresión. Solo es una propuesta. */
  export let suggestedWeight: number | undefined = undefined;
  /** Peso de la última sesión (para botón rápido "Anterior"). */
  export let lastSessionWeight: number | undefined = undefined;
  export let isCalisthenics: boolean = false;

  const dispatch = createEventDispatcher<{
    log: { reps: number; weightKg: number | undefined; rir: number | undefined };
  }>();

  let reps: number = planned.repsMin;
  /** Inicializamos con la sugerencia, pero el usuario puede cambiarla libremente. */
  let weight: number | undefined = suggestedWeight ?? lastSessionWeight;
  let rir: number | undefined = planned.targetRIR;

  /** ¿El peso actual coincide con la sugerencia? (para destacar el botón). */
  $: matchesSuggested = suggestedWeight != null && weight === suggestedWeight;
  $: matchesPrevious  = lastSessionWeight != null && weight === lastSessionWeight;

  function applySuggested() {
    if (suggestedWeight != null) weight = suggestedWeight;
  }
  function applyPrevious() {
    if (lastSessionWeight != null) weight = lastSessionWeight;
  }

  function submit() {
    if (reps == null || reps <= 0) return;
    dispatch('log', {
      reps,
      weightKg: isCalisthenics ? undefined : (weight ?? undefined),
      rir
    });
    // Reset reps al mínimo del rango. Mantenemos peso (típicamente se repite entre series).
    reps = planned.repsMin;
  }
</script>

<div class="space-y-2">
  <!-- Chips rápidos para elegir peso (solo gym, y solo si hay valores) -->
  {#if !isCalisthenics && (suggestedWeight != null || lastSessionWeight != null)}
    <div class="flex items-center gap-1.5 flex-wrap text-[11px]">
      {#if suggestedWeight != null}
        <button
          type="button"
          class="px-2.5 py-1 rounded-full font-semibold border transition active:scale-95"
          class:bg-primary-600={matchesSuggested}
          class:text-white={matchesSuggested}
          class:border-primary-600={matchesSuggested}
          class:bg-white={!matchesSuggested}
          class:border-slate-200={!matchesSuggested}
          class:text-slate-700={!matchesSuggested}
          on:click={applySuggested}>
          💡 Sugerido · {suggestedWeight}kg
        </button>
      {/if}
      {#if lastSessionWeight != null && lastSessionWeight !== suggestedWeight}
        <button
          type="button"
          class="px-2.5 py-1 rounded-full font-semibold border transition active:scale-95"
          class:bg-slate-700={matchesPrevious}
          class:text-white={matchesPrevious}
          class:border-slate-700={matchesPrevious}
          class:bg-white={!matchesPrevious}
          class:border-slate-200={!matchesPrevious}
          class:text-slate-700={!matchesPrevious}
          on:click={applyPrevious}>
          ↩ Anterior · {lastSessionWeight}kg
        </button>
      {/if}
      <span class="text-[10px] text-slate-400 ml-auto">o escribe tu propio peso →</span>
    </div>
  {/if}

  <!-- Inputs de peso / reps / RIR -->
  <div class="flex items-end gap-2">
    {#if !isCalisthenics}
      <div class="flex-1">
        <label class="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1" for="w-{exerciseId}">
          Peso (kg)
          {#if matchesSuggested}
            <span class="text-primary-600 text-[9px]">💡</span>
          {:else if matchesPrevious}
            <span class="text-slate-500 text-[9px]">↩</span>
          {:else if weight != null}
            <span class="text-amber-600 text-[9px]">✎ custom</span>
          {/if}
        </label>
        <input
          id="w-{exerciseId}"
          type="number"
          step="0.5"
          bind:value={weight}
          class="input py-2 text-center"
          inputmode="decimal"
        />
      </div>
    {/if}
    <div class="flex-1">
      <label class="text-[10px] uppercase text-slate-500 font-bold" for="r-{exerciseId}">Reps</label>
      <input
        id="r-{exerciseId}"
        type="number"
        bind:value={reps}
        class="input py-2 text-center"
        inputmode="numeric"
      />
    </div>
    <div class="w-16">
      <label class="text-[10px] uppercase text-slate-500 font-bold" for="rir-{exerciseId}">RIR</label>
      <input
        id="rir-{exerciseId}"
        type="number"
        min="0"
        max="5"
        bind:value={rir}
        class="input py-2 text-center"
        inputmode="numeric"
      />
    </div>
    <button class="btn-primary py-2 px-4 text-sm whitespace-nowrap" on:click={submit}>+ Serie</button>
  </div>
</div>
