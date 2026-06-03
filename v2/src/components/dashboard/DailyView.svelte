<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import type { TrainingProgram, TrainingDay, DailyGoals, DailyMealLog, WorkoutSession, SleepEntry, Exercise, ExerciseModality } from '$lib/types';
  import { db } from '$db/database';
  import { toDateKey, isoDayOfWeek } from '$lib/dateUtils';
  import { macrosOfLog, getCardioBetween } from '$lib/dashboardData';
  import { formatDistance, formatDuration } from '$lib/cardio/cardioTracker';
  import type { CardioSession } from '$lib/types';
  const CARDIO_ICONS: Record<string, string> = { walk: '🚶', run: '🏃', bike: '🚴', elliptical: '🤖' };
  import ExerciseCard from '../ExerciseCard.svelte';
  import ProgressCard from './ProgressCard.svelte';
  import DailySchedule from './DailySchedule.svelte';
  import { openExercise } from '$stores/exerciseModal';
  import { profile } from '$stores/profile';

  export let activeProgram: TrainingProgram | null;
  export let goals: DailyGoals | null;

  let todayPlan: TrainingDay | null = null;
  let todayLog: DailyMealLog | null = null;
  let todaySession: WorkoutSession | null = null;
  let lastSleep: SleepEntry | null = null;
  let todayCardio: CardioSession[] = [];
  let exercisesById = new Map<string, Exercise>();
  let preview: ExerciseModality = 'gym';

  const todayKey = toDateKey();

  $: if (activeProgram) {
    const dow = isoDayOfWeek(new Date());
    todayPlan = activeProgram.days[dow] ?? null;
  }

  onMount(async () => {
    todayLog = (await db.mealLogs.get(`log_${todayKey}`)) ?? null;
    todaySession = (await db.sessions.where('date').equals(todayKey).first()) ?? null;
    lastSleep = (await db.sleep.orderBy('date').reverse().first()) ?? null;
    todayCardio = await getCardioBetween(todayKey, todayKey);
    const ex = await db.exercises.toArray();
    exercisesById = new Map(ex.map(e => [e.id, e]));
  });

  $: cardioTotalDist = todayCardio.reduce((a, c) => a + c.distanceMeters, 0);
  $: cardioTotalSecs = todayCardio.reduce((a, c) => a + c.durationSeconds, 0);
  $: cardioTotalKcal = todayCardio.reduce((a, c) => a + (c.estimatedKcal ?? 0), 0);

  $: macrosToday = todayLog ? macrosOfLog(todayLog) : { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 };
  $: todayExercises = todayPlan ? (preview === 'gym' ? todayPlan.gymExercises : todayPlan.calisthenicsExercises) : [];

  function pct(v: number, total: number): number {
    return total > 0 ? Math.min((v / total) * 100, 100) : 0;
  }
  function sleepFmt(min?: number): string {
    if (min == null) return '—';
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }
</script>

<!-- 🕐 Cronograma de hoy -->
{#if $profile}
  <DailySchedule profile={$profile} trainingDay={todayPlan} />
{/if}

<!-- Card macros con progreso -->
{#if goals}
  <div class="card mb-3">
    <div class="flex justify-between items-baseline mb-3">
      <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide">Macros de hoy</h2>
      <span class="text-xs text-slate-500">{macrosToday.kcal}/{goals.targetKcal} kcal</span>
    </div>
    <div class="space-y-2">
      {#each [
        ['Proteína', macrosToday.proteinG, goals.targetProteinG, 'g', 'bg-accent-600'],
        ['Carbos',   macrosToday.carbsG,   goals.targetCarbsG,  'g', 'bg-yellow-500'],
        ['Grasas',   macrosToday.fatsG,    goals.targetFatsG,   'g', 'bg-orange-500']
      ] as [label, val, target, unit, color]}
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-500">{label}</span>
            <span class="text-slate-700 font-mono">{val}/{target}{unit}</span>
          </div>
          <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full {color} transition-all" style="width: {pct(Number(val), Number(target))}%"></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Card cardio de hoy -->
<div class="card mb-3">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide">🚴 Cardio de hoy</h2>
    {#if todayCardio.length > 0}
      <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">{todayCardio.length} sesión{todayCardio.length === 1 ? '' : 'es'}</span>
    {/if}
  </div>

  {#if todayCardio.length === 0}
    <div class="text-center py-2">
      <p class="text-xs text-slate-500 mb-3">Sin cardio aún hoy.</p>
      <button class="btn-secondary w-full text-sm" on:click={() => navigate('cardio')}>
        ▶ Empezar cardio
      </button>
    </div>
  {:else}
    <!-- Resumen total -->
    <div class="grid grid-cols-3 gap-2 mb-3">
      <div class="text-center">
        <div class="text-lg font-bold font-mono">{formatDistance(cardioTotalDist)}</div>
        <div class="text-[10px] text-slate-500 uppercase">Distancia</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-bold font-mono">{formatDuration(cardioTotalSecs)}</div>
        <div class="text-[10px] text-slate-500 uppercase">Tiempo</div>
      </div>
      <div class="text-center">
        <div class="text-lg font-bold font-mono">{cardioTotalKcal}</div>
        <div class="text-[10px] text-slate-500 uppercase">kcal</div>
      </div>
    </div>
    <!-- Lista de sesiones individuales -->
    <div class="space-y-1">
      {#each todayCardio as c (c.id)}
        <button class="w-full flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-slate-50 transition"
                on:click={() => navigate('cardio_detail', { id: c.id })}>
          <span class="text-lg">{CARDIO_ICONS[c.type] ?? '🏃'}</span>
          <span class="font-mono font-bold">{formatDistance(c.distanceMeters)}</span>
          <span class="text-slate-400">·</span>
          <span class="font-mono">{formatDuration(c.durationSeconds)}</span>
          <span class="text-slate-400 ml-auto text-[10px]">{new Date(c.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Card entreno de hoy -->
<div class="card mb-3">
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wide">Entreno de hoy</h2>
    {#if todayPlan && !todayPlan.isRestDay}
      <div class="flex bg-slate-100 rounded-lg p-0.5 text-xs">
        <button class="px-2 py-1 rounded transition" class:bg-primary-600={preview === 'gym'} on:click={() => preview = 'gym'}>🏋️ Gym</button>
        <button class="px-2 py-1 rounded transition" class:bg-primary-600={preview === 'calisthenics'} on:click={() => preview = 'calisthenics'}>🤸 Cal</button>
      </div>
    {/if}
  </div>

  {#if todayPlan?.isRestDay}
    <div class="text-center py-3">
      <div class="text-3xl mb-1">😴</div>
      <p class="font-semibold">Día de descanso</p>
      <p class="text-xs text-slate-500 mt-1">Duerme bien y come suficiente</p>
    </div>
  {:else if todayPlan}
    <p class="font-bold text-lg">{todayPlan.name}</p>
    <p class="text-sm text-slate-500 mt-0.5">
      {todayExercises.length} ejercicios
      {#if todaySession?.finishedAt} · <span class="text-accent-400">✓ Completado</span>{/if}
    </p>

    {#if !todaySession?.finishedAt}
      <button
        class="btn-primary w-full mt-3"
        on:click={() => navigate('gym_session', { dayId: todayPlan?.id, modality: preview })}>
        ▶️ Empezar sesión ({preview === 'gym' ? 'gym' : 'calistenia'})
      </button>
    {/if}

    <!-- LISTA VISUAL DE EJERCICIOS DE HOY -->
    <div class="mt-4 space-y-2">
      {#each todayExercises as p}
        {@const ex = exercisesById.get(p.exerciseId)}
        {#if ex}
          <ExerciseCard exercise={ex} planned={p} onTap={() => openExercise(ex)} />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<!-- Card comidas + sueño -->
<div class="grid grid-cols-2 gap-3 mb-3">
  <button class="card text-left active:scale-95 transition" on:click={() => navigate('nutrition')}>
    <div class="text-2xl mb-1">🥗</div>
    <div class="font-bold">{todayLog?.meals.length ?? 0} comidas</div>
    <div class="text-xs text-slate-500">Registrar más</div>
  </button>
  <button class="card text-left active:scale-95 transition" on:click={() => navigate('sleep')}>
    <div class="text-2xl mb-1">🛌</div>
    <div class="font-bold">{sleepFmt(lastSleep?.durationMinutes)}</div>
    <div class="text-xs text-slate-500">Última noche</div>
  </button>
</div>


<!-- 📊 MÉTRICAS Y GRÁFICAS DE PROGRESO (al final) -->
<div class="mt-6">
  <ProgressCard />
</div>
