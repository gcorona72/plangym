<script lang="ts">
  import type { Exercise, PlannedExercise } from '$lib/types';
  import MuscleMap from './MuscleMap.svelte';
  import { youtubeSearchLinkUrl, MUSCLE_LABELS } from '$lib/training/exerciseMedia';
  import { openExercise } from '$stores/exerciseModal';

  export let exercise: Exercise;
  export let planned: PlannedExercise | null = null;

  /**
   * URL del iframe de YouTube auto-reproducible y silenciado (estilo GIF).
   * Solo funciona si el ejercicio tiene un videoId curado.
   */
  $: embedUrl = exercise.videoId
    ? `https://www.youtube-nocookie.com/embed/${exercise.videoId}?autoplay=1&mute=1&loop=1&playlist=${exercise.videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`
    : null;

  $: searchUrl = youtubeSearchLinkUrl(exercise);
</script>

<div class="card">
  <!-- Header: nombre + plan -->
  <div class="flex items-start justify-between mb-3">
    <div class="flex-1 min-w-0">
      <div class="font-bold text-base leading-tight">{exercise.name}</div>
      {#if planned}
        <div class="text-xs text-slate-500 font-mono mt-1">
          {planned.sets} × {planned.repsMin}-{planned.repsMax} reps · {planned.restSeconds}s
          {#if planned.targetRIR != null} · RIR {planned.targetRIR}{/if}
        </div>
      {/if}
    </div>
    <button class="text-xs text-primary-600 active:scale-95 px-2 py-1 rounded-lg hover:bg-primary-50" on:click={() => openExercise(exercise)}>
      Detalle ℹ️
    </button>
  </div>

  <!-- Visual: MuscleMap + GIF/Video lado a lado -->
  <div class="grid grid-cols-5 gap-3 mb-3">
    <!-- Anatomía (2/5) -->
    <div class="col-span-2">
      <MuscleMap
        primary={exercise.primaryMuscles}
        secondary={exercise.secondaryMuscles}
        size="small" />
      <div class="flex flex-wrap gap-1 mt-2 justify-center">
        {#each exercise.primaryMuscles as m}
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">{MUSCLE_LABELS[m]}</span>
        {/each}
      </div>
    </div>

    <!-- Vídeo / GIF (3/5) -->
    <div class="col-span-3">
      {#if exercise.gifUrl}
        <!-- GIF nativo: se reproduce automáticamente solo -->
        <img src={exercise.gifUrl} alt={exercise.name}
             class="w-full aspect-video object-cover rounded-lg bg-slate-100" />
      {:else if embedUrl}
        <!-- YouTube embed auto-play muted loop -->
        <div class="aspect-video w-full rounded-lg overflow-hidden bg-slate-900">
          <iframe
            class="w-full h-full"
            src={embedUrl}
            title={exercise.name}
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      {:else}
        <!-- Fallback: enlace a YouTube -->
        <a href={searchUrl} target="_blank" rel="noopener noreferrer"
           class="aspect-video w-full rounded-lg bg-gradient-to-br from-primary-50 to-slate-100 flex flex-col items-center justify-center text-center p-3 border border-slate-200 active:scale-[0.98] transition no-underline">
          <div class="text-3xl mb-1">▶️</div>
          <div class="font-bold text-xs text-slate-700">Ver tutorial</div>
          <div class="text-[9px] text-slate-500 mt-0.5">YouTube ↗</div>
        </a>
      {/if}
    </div>
  </div>

  <!-- Cues (puntos de técnica) -->
  {#if exercise.cues && exercise.cues.length > 0}
    <div class="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
      <span class="font-bold text-slate-700">Técnica:</span>
      {exercise.cues.join(' · ')}
    </div>
  {/if}
</div>
