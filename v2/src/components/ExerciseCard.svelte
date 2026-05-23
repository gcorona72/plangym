<script lang="ts">
  import type { Exercise, PlannedExercise } from '$lib/types';
  import MuscleMap from './MuscleMap.svelte';
  import TierBadge from './TierBadge.svelte';
  import { MUSCLE_LABELS } from '$lib/training/exerciseMedia';

  export let exercise: Exercise;
  export let planned: PlannedExercise | null = null;
  export let onTap: () => void = () => {};
  /** Mostrar mini-diagrama anatómico al lado del ejercicio. */
  export let showAnatomy: boolean = true;
</script>

<button
  class="card w-full text-left flex gap-3 items-center active:scale-[0.98] transition"
  on:click={onTap}>
  {#if showAnatomy}
    <div class="shrink-0 w-20">
      <MuscleMap
        primary={exercise.primaryMuscles}
        secondary={exercise.secondaryMuscles}
        size="small" />
    </div>
  {/if}
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <div class="font-bold text-sm leading-tight flex-1">{exercise.name}</div>
      <TierBadge tier={exercise.tier} size="sm" />
    </div>
    <div class="flex flex-wrap gap-1 mt-1">
      {#each exercise.primaryMuscles as m}
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-700">{MUSCLE_LABELS[m]}</span>
      {/each}
      {#each exercise.secondaryMuscles.slice(0, 2) as m}
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/15 text-orange-700">{MUSCLE_LABELS[m]}</span>
      {/each}
    </div>
    {#if planned}
      <div class="text-[10px] text-slate-500 mt-1.5 font-mono">
        {planned.sets}×{planned.repsMin}-{planned.repsMax} reps · {planned.restSeconds}s descanso
        {#if planned.targetRIR != null} · RIR {planned.targetRIR}{/if}
      </div>
    {/if}
  </div>
  <div class="shrink-0 text-slate-400 text-xl">▶</div>
</button>
