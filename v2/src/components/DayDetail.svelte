<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { routeParams, navigate } from '$stores/navigation';
  import { openExercise } from '$stores/exerciseModal';
  import type { TrainingProgram, TrainingDay, Exercise, ExerciseModality } from '$lib/types';
  import { profile } from '$stores/profile';
  import { canPerformExercise } from '$lib/training/exerciseFilter';
  import { summarizeDay } from '$lib/training/daySummary';
  import ExpandedExerciseCard from './ExpandedExerciseCard.svelte';
  import { cardioTracker, formatDistance, formatDuration } from '$lib/cardio/cardioTracker';
  import { getLastCardioSessionOfType } from '$lib/cardio/cardioRepository';
  import type { CardioType, CardioSession } from '$lib/types';

  let cardioType: CardioType = 'walk';
  let lastCardio: CardioSession | null = null;
  const CARDIO_TYPES: { id: CardioType; icon: string; label: string }[] = [
    { id: 'walk',       icon: '🚶', label: 'Caminar'  },
    { id: 'run',        icon: '🏃', label: 'Correr'   },
    { id: 'bike',       icon: '🚴', label: 'Bici'     },
    { id: 'elliptical', icon: '🤖', label: 'Elíptica' }
  ];

  // Recargar la "última sesión" cada vez que el usuario cambia de tipo
  $: loadLastCardio(cardioType);
  async function loadLastCardio(t: CardioType) {
    lastCardio = await getLastCardioSessionOfType(t);
  }

  function fmtRelative(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days}d`;
    if (days < 30) return `hace ${Math.floor(days / 7)}sem`;
    return `hace ${Math.floor(days / 30)}m`;
  }

  function startCardio() {
    cardioTracker.start(cardioType);
    navigate('cardio_live');
  }

  let program: TrainingProgram | null = null;
  let day: TrainingDay | null = null;
  let exercisesById = new Map<string, Exercise>();
  let modality: ExerciseModality = 'gym';

  onMount(async () => {
    program = (await db.programs.filter(p => p.active).first()) ?? null;
    const params = $routeParams;
    if (program) {
      day = program.days.find(d => d.id === params.dayId) ?? null;
    }
    const all = await db.exercises.toArray();
    exercisesById = new Map(all.map(e => [e.id, e]));
  });

  $: exercises = day
    ? (modality === 'gym' ? day.gymExercises : day.calisthenicsExercises)
    : [];

  function available(id: string): boolean {
    const ex = exercisesById.get(id);
    if (!ex || !$profile) return true;
    return canPerformExercise(ex, $profile.gymEquipment);
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <button class="text-slate-500 mb-3 active:scale-95 text-sm" on:click={() => navigate('dashboard')}>← Volver</button>

  {#if day}
    {@const summary = summarizeDay(day)}
    <h1 class="text-2xl md:text-3xl font-bold mb-1">{day.name}</h1>
    <p class="text-slate-500 text-sm mb-4">Tu plan de entrenamiento</p>

    <!-- 🚴 Lanzador de cardio — siempre arriba (gym o descanso) -->
    <div class="card-feature mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="section-title">🚴 Cardio</h3>
        {#if lastCardio}
          <span class="text-[10px] text-slate-500">Última {fmtRelative(lastCardio.startedAt)}</span>
        {/if}
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2">
        {#each CARDIO_TYPES as t}
          <button class="py-2 rounded-lg border text-center transition active:scale-95"
                  class:bg-primary-600={cardioType === t.id}
                  class:text-white={cardioType === t.id}
                  class:border-primary-600={cardioType === t.id}
                  class:bg-white={cardioType !== t.id}
                  class:border-slate-200={cardioType !== t.id}
                  on:click={() => cardioType = t.id}>
            <div class="text-xl">{t.icon}</div>
            <div class="text-[10px] font-semibold mt-0.5">{t.label}</div>
          </button>
        {/each}
      </div>

      <!-- Stats de la última sesión del tipo seleccionado (referencia a batir) -->
      {#if lastCardio}
        <div class="bg-white/70 rounded-lg px-3 py-2 mb-2 text-xs flex items-center gap-3">
          <span class="text-slate-500">Última:</span>
          <span class="font-mono font-bold">{formatDistance(lastCardio.distanceMeters)}</span>
          <span class="text-slate-400">·</span>
          <span class="font-mono font-bold">{formatDuration(lastCardio.durationSeconds)}</span>
          {#if lastCardio.estimatedKcal}
            <span class="text-slate-400">·</span>
            <span class="font-mono">{lastCardio.estimatedKcal} kcal</span>
          {/if}
        </div>
        <p class="text-[10px] text-slate-500 mb-2">
          🎯 Apunta a superar esa marca hoy (+5-10% distancia o más rápido).
        </p>
      {:else}
        <p class="text-[10px] text-slate-500 mb-2">Sin registros previos de este tipo. La primera vez fija tu baseline.</p>
      {/if}

      <button class="btn-accent w-full" on:click={startCardio}>
        ▶ Iniciar {CARDIO_TYPES.find(t => t.id === cardioType)?.label.toLowerCase()}
      </button>
    </div>

    {#if day.isRestDay}
      <div class="card text-center py-8">
        <div class="text-5xl mb-2">😴</div>
        <p class="font-bold text-lg">Día de descanso</p>
        <p class="text-sm text-slate-500 mt-1">Aprovecha para dormir y comer suficiente. El cardio ligero (arriba) acelera la recuperación.</p>
      </div>
    {:else}
      <!-- 📍 Resumen visible del día -->
      {#if summary}
        <div class="card-feature mb-4">
          <div class="flex items-center gap-3 mb-1">
            <span class="text-3xl">{summary.emoji}</span>
            <div>
              <div class="font-bold text-lg">{summary.title}</div>
              {#if summary.intensity}
                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                      class:bg-orange-100={summary.intensity === 'fuerza'}
                      class:text-orange-700={summary.intensity === 'fuerza'}
                      class:bg-emerald-100={summary.intensity === 'hipertrofia'}
                      class:text-emerald-700={summary.intensity === 'hipertrofia'}
                      class:bg-slate-100={summary.intensity === 'mixto'}
                      class:text-slate-600={summary.intensity === 'mixto'}>
                  {summary.intensity}
                </span>
              {/if}
            </div>
          </div>
          <p class="text-sm text-slate-700 mt-2">{summary.pitch}</p>
          <p class="text-[11px] text-slate-500 mt-2">Músculos: {summary.musclesLabel}</p>
        </div>
      {/if}

      <!-- Selector de modalidad -->
      <div class="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200">
        <button
          class="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition active:scale-95"
          class:bg-primary-600={modality === 'gym'}
          class:text-slate-500={modality !== 'gym'}
          on:click={() => modality = 'gym'}>
          🏋️ Versión gym
        </button>
        <button
          class="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition active:scale-95"
          class:bg-primary-600={modality === 'calisthenics'}
          class:text-slate-500={modality !== 'calisthenics'}
          on:click={() => modality = 'calisthenics'}>
          🤸 Alternativa calistenia
        </button>
      </div>

      {#if modality === 'calisthenics'}
        <p class="text-xs text-slate-500 mb-3">
          💡 Estos ejercicios trabajan los mismos músculos sin necesidad de gym.
        </p>
      {/if}

      <!-- Ejercicios del día (vista expandida con MuscleMap + vídeo) -->
      <div class="space-y-3 mb-4 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {#each exercises as p}
          {@const ex = exercisesById.get(p.exerciseId)}
          {#if ex}
            <div class:opacity-50={modality === 'gym' && !available(p.exerciseId)}>
              <ExpandedExerciseCard exercise={ex} planned={p} />
              {#if modality === 'gym' && !available(p.exerciseId)}
                <p class="text-[10px] text-red-500 mt-1 ml-1">⚠️ Falta equipamiento — añádelo en Ajustes → Gym</p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>

      <!-- Stats -->
      <div class="card mb-4">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <div class="text-2xl font-bold text-primary-400">{exercises.length}</div>
            <div class="text-[10px] text-slate-500 uppercase">Ejercicios</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary-400">{exercises.reduce((a, e) => a + e.sets, 0)}</div>
            <div class="text-[10px] text-slate-500 uppercase">Series totales</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary-400">~{Math.round(exercises.reduce((a, e) => a + e.sets * (e.restSeconds + 60), 0) / 60)}'</div>
            <div class="text-[10px] text-slate-500 uppercase">Duración</div>
          </div>
        </div>
      </div>

      <button class="btn-accent w-full" on:click={() => navigate('gym_session', { dayId: day?.id, modality })}>
        ▶️ Empezar sesión ahora
      </button>
    {/if}
  {:else}
    <p class="text-slate-500 text-center py-8">Cargando…</p>
  {/if}
</div>
