<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { navigate } from '$stores/navigation';
  import { openExercise } from '$stores/exerciseModal';
  import type { TrainingProgram, Exercise, ExerciseModality } from '$lib/types';
  import { profile } from '$stores/profile';
  import { canPerformExercise } from '$lib/training/exerciseFilter';
  import ExerciseCard from './ExerciseCard.svelte';

  let program: TrainingProgram | null = null;
  let exercisesById = new Map<string, Exercise>();
  /** Objeto plano (no Map) para que Svelte rastree los cambios reactivamente. */
  let modalityByDay: Record<string, ExerciseModality> = {};

  onMount(async () => {
    program = (await db.programs.filter(p => p.active).first()) ?? null;
    const all = await db.exercises.toArray();
    exercisesById = new Map(all.map(e => [e.id, e]));
  });

  function setModality(dayId: string, m: ExerciseModality) {
    modalityByDay = { ...modalityByDay, [dayId]: m };
  }
  function exerciseAvailable(id: string): boolean {
    const ex = exercisesById.get(id);
    if (!ex || !$profile) return true;
    return canPerformExercise(ex, $profile.gymEquipment);
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-2">Entrenamiento 🏋️</h1>
  <p class="text-slate-500 text-sm mb-6">{program?.name ?? 'Sin programa'}</p>

  {#if program}
    <div class="space-y-3">
      {#each program.days as day, i}
        {@const modality = modalityByDay[day.id] ?? 'gym'}
        {@const exercises = modality === 'gym' ? day.gymExercises : day.calisthenicsExercises}
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wide">Día {i + 1}</div>
              <div class="font-bold text-lg">{day.name}</div>
            </div>
            {#if !day.isRestDay}
              <div class="flex bg-slate-100 rounded-lg p-0.5 text-xs">
                <button class="px-2 py-1 rounded transition" class:bg-primary-600={modality === 'gym'} on:click={() => setModality(day.id, 'gym')}>Gym</button>
                <button class="px-2 py-1 rounded transition" class:bg-primary-600={modality === 'calisthenics'} on:click={() => setModality(day.id, 'calisthenics')}>Cal.</button>
              </div>
            {/if}
          </div>

          {#if !day.isRestDay}
            <div class="space-y-2 mt-3">
              {#each exercises as p}
                {@const ex = exercisesById.get(p.exerciseId)}
                {#if ex}
                  <div class:opacity-50={modality === 'gym' && !exerciseAvailable(p.exerciseId)}>
                    <ExerciseCard exercise={ex} planned={p} onTap={() => openExercise(ex)} />
                    {#if modality === 'gym' && !exerciseAvailable(p.exerciseId)}
                      <p class="text-[10px] text-red-400 mt-1 ml-1">⚠️ Falta equipamiento — actualiza Ajustes → Gym</p>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>

            <button class="btn-primary w-full mt-4" on:click={() => navigate('gym_session', { dayId: day.id, modality })}>
              ▶️ Empezar este día
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
