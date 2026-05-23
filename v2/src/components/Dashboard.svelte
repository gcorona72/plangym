<script lang="ts">
  import { onMount } from 'svelte';
  import { profile, goals } from '$stores/profile';
  import { navigate } from '$stores/navigation';
  import { db } from '$db/database';
  import type { TrainingDay, TrainingProgram, WorkoutSession, DailyMealLog, SleepEntry, Macros } from '$lib/types';
  import {
    toDateKey, isoDayOfWeek, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    dateRange, isSameDay, formatLong, WEEKDAYS_SHORT
  } from '$lib/dateUtils';
  import DailyView from './dashboard/DailyView.svelte';
  import WeeklyView from './dashboard/WeeklyView.svelte';
  import MonthlyView from './dashboard/MonthlyView.svelte';

  type ViewMode = 'daily' | 'weekly' | 'monthly';
  let viewMode: ViewMode = 'weekly'; // PREDETERMINADO: semanal

  let activeProgram: TrainingProgram | null = null;

  onMount(async () => {
    activeProgram = (await db.programs.filter(p => p.active).first()) ?? null;
  });

  function greeting(): string {
    const h = new Date().getHours();
    if (h < 6)  return 'Buenas noches';
    if (h < 13) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }
</script>

<div class="px-5 pt-8 max-w-2xl mx-auto md:max-w-4xl">
  <!-- Header -->
  <header class="mb-6">
    <p class="text-slate-500 text-sm">{greeting()},</p>
    <h1 class="text-4xl font-bold tracking-tight">{$profile?.name ?? 'Hola'}</h1>
    <p class="text-slate-500 text-sm mt-1 capitalize">{formatLong(new Date())}</p>
  </header>

  <!-- Selector de vista con indicador deslizante -->
  <div class="relative flex gap-1 mb-5 bg-white/65 backdrop-blur-md p-1 rounded-xl ring-1 ring-white/60 shadow-sm">
    <!-- Pill deslizante de fondo -->
    <div
      class="absolute top-1 bottom-1 rounded-lg bg-primary-600 shadow-md shadow-primary-600/30 transition-all duration-300 ease-out"
      style="
        width: calc((100% - 0.5rem) / 3);
        left: calc({['daily','weekly','monthly'].indexOf(viewMode)} * (100% - 0.5rem) / 3 + 0.25rem);
      "></div>

    <button
      class="relative z-10 flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-200 spring-press"
      class:text-white={viewMode === 'daily'}
      class:text-slate-600={viewMode !== 'daily'}
      on:click={() => viewMode = 'daily'}>📅 Día</button>
    <button
      class="relative z-10 flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-200 spring-press"
      class:text-white={viewMode === 'weekly'}
      class:text-slate-600={viewMode !== 'weekly'}
      on:click={() => viewMode = 'weekly'}>🗓️ Semana</button>
    <button
      class="relative z-10 flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-200 spring-press"
      class:text-white={viewMode === 'monthly'}
      class:text-slate-600={viewMode !== 'monthly'}
      on:click={() => viewMode = 'monthly'}>📆 Mes</button>
  </div>

  {#key viewMode}
    <div class="animate-fade-in-up">
      {#if viewMode === 'daily'}
        <DailyView {activeProgram} goals={$goals} />
      {:else if viewMode === 'weekly'}
        <WeeklyView {activeProgram} goals={$goals} />
      {:else}
        <MonthlyView {activeProgram} goals={$goals} />
      {/if}
    </div>
  {/key}
</div>
