<script lang="ts">
  import type { Exercise } from '$lib/types';
  import MuscleMap from './MuscleMap.svelte';
  import { youtubeSearchLinkUrl, MUSCLE_LABELS } from '$lib/training/exerciseMedia';
  import { getExerciseImageUrls } from '$lib/training/exerciseImages';
  import TierBadge from './TierBadge.svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let exercise: Exercise;
  export let onClose: () => void;

  $: youtubeUrl = youtubeSearchLinkUrl(exercise);
  /** Thumbnail genérico (placeholder de YouTube). */
  $: thumbnailSearch = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(exercise.name + ' técnica gym')}`;
</script>

<!-- Modal fullscreen con animación de entrada -->
<div class="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-sm overflow-y-auto safe-top safe-bottom"
     transition:fade={{ duration: 180 }}>
  <div class="max-w-2xl mx-auto md:max-w-4xl px-5 py-6"
       in:scale={{ duration: 280, start: 0.96, easing: cubicOut }}>
    <button class="text-slate-500 mb-4 active:scale-95" on:click={onClose}>← Cerrar</button>

    <div class="flex items-start gap-3 mb-1">
      <h1 class="text-2xl md:text-3xl font-bold flex-1">{exercise.name}</h1>
      <TierBadge tier={exercise.tier} size="md" />
    </div>
    <p class="text-xs text-slate-500 uppercase tracking-wide mb-4">
      {exercise.modality === 'gym' ? '🏋️ Gimnasio' : '🤸 Calistenia'}
    </p>

    <!-- Nota del tier (justificación) -->
    {#if exercise.tier && exercise.tierNotes}
      <div class="card mb-4"
           class:bg-violet-50={exercise.tier === 'S'}
           class:bg-emerald-50={exercise.tier === 'A'}
           class:bg-sky-50={exercise.tier === 'B'}
           class:bg-amber-50={exercise.tier === 'C'}
           class:bg-rose-50={exercise.tier === 'D'}>
        <div class="flex gap-3 items-start">
          <TierBadge tier={exercise.tier} size="md" />
          <div class="flex-1">
            <div class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {exercise.tier === 'S' ? 'Tier S · Excelente' :
               exercise.tier === 'A' ? 'Tier A · Muy bueno' :
               exercise.tier === 'B' ? 'Tier B · Bueno' :
               exercise.tier === 'C' ? 'Tier C · Mediocre' :
               'Tier D · Evitar'}
            </div>
            <p class="text-sm text-slate-700">{exercise.tierNotes}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- 📸 Imágenes del ejercicio (inicio + final) — free-exercise-db -->
    {#if exercise.imageFolder}
      {@const imgs = getExerciseImageUrls(exercise)}
      <div class="card mb-4 p-3">
        <h2 class="section-title mb-2">📸 Posiciones (inicio · final)</h2>
        <div class="grid grid-cols-2 gap-2">
          <div class="relative">
            <img src={imgs[0]} alt="{exercise.name} - posición inicial"
                 class="w-full aspect-square object-cover rounded-lg bg-slate-100"
                 loading="lazy" />
            <span class="absolute bottom-1 left-1 text-[9px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">Inicio</span>
          </div>
          <div class="relative">
            <img src={imgs[1]} alt="{exercise.name} - posición final"
                 class="w-full aspect-square object-cover rounded-lg bg-slate-100"
                 loading="lazy" />
            <span class="absolute bottom-1 left-1 text-[9px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">Final</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- En desktop: 2 columnas (vídeo + músculos) | móvil: stack -->
    <div class="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">

      <!-- Tarjeta de tutoriales (YouTube + Google Imágenes) -->
      <div class="card p-0 overflow-hidden">
        <div class="aspect-video w-full bg-gradient-to-br from-primary-100 via-slate-900 to-slate-50 flex flex-col items-center justify-center text-center p-6 relative">
          <div class="text-6xl mb-2">🎬</div>
          <div class="font-bold text-lg mb-3">Ver técnica del ejercicio</div>
          <div class="flex flex-col gap-2 w-full max-w-xs">
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
               class="btn-primary text-sm py-2">
              ▶️ Buscar en YouTube
            </a>
            <a href={thumbnailSearch} target="_blank" rel="noopener noreferrer"
               class="btn-secondary text-sm py-2">
              🖼️ Ver imágenes
            </a>
          </div>
        </div>
        <div class="p-3 bg-white border-t border-slate-200 text-[10px] text-slate-500 text-center">
          Se abre en una pestaña nueva — sin trackers ni cuenta requerida
        </div>
      </div>

      <!-- Mapa muscular -->
      <div class="card">
        <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Músculos trabajados</h2>
        <MuscleMap
          primary={exercise.primaryMuscles}
          secondary={exercise.secondaryMuscles}
          size="medium"
          showLabels={false}
        />
        <div class="flex flex-wrap gap-1.5 mt-3">
          {#each exercise.primaryMuscles as m}
            <span class="chip bg-red-500/20 border-red-500/40 text-red-300 text-xs">
              🎯 {MUSCLE_LABELS[m]}
            </span>
          {/each}
          {#each exercise.secondaryMuscles as m}
            <span class="chip bg-orange-400/10 border-orange-400/30 text-orange-300 text-xs">
              ↳ {MUSCLE_LABELS[m]}
            </span>
          {/each}
        </div>
        <div class="flex gap-3 justify-center mt-3 text-[10px] text-slate-500">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-red-500"></span> Principal</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-orange-400 opacity-70"></span> Secundario</span>
        </div>
      </div>
    </div>

    <!-- Técnica (cues) -->
    {#if exercise.cues && exercise.cues.length > 0}
      <div class="card my-4">
        <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Puntos clave de técnica</h2>
        <ul class="space-y-1.5 text-sm">
          {#each exercise.cues as cue}
            <li class="flex gap-2">
              <span class="text-accent-400">✓</span>
              <span>{cue}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Plan por defecto -->
    <div class="card mb-4">
      <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Plan recomendado</h2>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-2xl font-bold text-primary-400">{exercise.defaultSets}</div>
          <div class="text-[10px] text-slate-500 uppercase">Series</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-primary-400">{exercise.defaultReps.min}-{exercise.defaultReps.max}</div>
          <div class="text-[10px] text-slate-500 uppercase">Reps</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-primary-400">{exercise.defaultRestSeconds}s</div>
          <div class="text-[10px] text-slate-500 uppercase">Descanso</div>
        </div>
      </div>
    </div>

    <button class="btn-secondary w-full" on:click={onClose}>Volver</button>
  </div>
</div>
