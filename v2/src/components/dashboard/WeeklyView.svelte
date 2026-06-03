<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import type { TrainingProgram, DailyGoals } from '$lib/types';
  import { db } from '$db/database';
  import {
    toDateKey, startOfWeek, endOfWeek, dateRange, isSameDay, isoDayOfWeek, WEEKDAYS_SHORT
  } from '$lib/dateUtils';
  import { getSessionsBetween, getMealLogsBetween, getSleepBetween, getCardioBetween, buildDayStatus, type DayStatus } from '$lib/dashboardData';
  import { formatDistance, formatDuration } from '$lib/cardio/cardioTracker';
  const CARDIO_ICONS: Record<string, string> = { walk: '🚶', run: '🏃', bike: '🚴', elliptical: '🤖' };
  import { summarizeDay } from '$lib/training/daySummary';
  import { detectAllStagnations, type StrengthStagnation } from '$lib/training/strengthStagnation';
  import ProgressCard from './ProgressCard.svelte';
  import CompactSchedule from './CompactSchedule.svelte';
  import { profile } from '$stores/profile';

  let stagnations: StrengthStagnation[] = [];
  let panelsContainer: HTMLDivElement;
  /** Refs a cada panel por índice. */
  let panelRefs: Record<number, HTMLDivElement> = {};
  /** Solo hacemos auto-scroll una vez (al montar). Después el usuario controla. */
  let didInitialScroll = false;

  onMount(async () => {
    stagnations = await detectAllStagnations();
  });

  /**
   * Una vez los paneles estén renderizados y haya datos, hacemos UN solo scroll
   * a hoy. Esta función se llama desde el template con un `{#await}` o similar,
   * pero más simple: la disparamos con un setTimeout una sola vez.
   */
  function tryInitialScroll() {
    if (didInitialScroll) return;
    if (!panelsContainer) return;
    if (weekOffset !== 0) return;
    const todayIdx = days.findIndex(d => isSameDay(d, new Date()));
    if (todayIdx < 0) return;
    const panel = panelRefs[todayIdx];
    if (!panel) return;
    didInitialScroll = true;
    const containerLeft = panelsContainer.getBoundingClientRect().left;
    const panelLeft = panel.getBoundingClientRect().left;
    panelsContainer.scrollLeft += (panelLeft - containerLeft) - 20;
  }

  /** Action: ejecuta un callback cuando un nodo se monta. */
  function onMounted(_node: HTMLElement, cb: () => void) {
    cb();
    return {};
  }

  export let activeProgram: TrainingProgram | null;
  // svelte-ignore unused-export-let
  export let goals: DailyGoals | null = null; // reservado para futuras stats

  /** Offset de semana (0 = semana actual, -1 = pasada, +1 = próxima). */
  let weekOffset = 0;

  let weekStart: Date;
  let weekEnd: Date;
  let days: Date[] = [];
  let statuses: DayStatus[] = [];
  let loading = true;

  $: weekStart = startOfWeek(new Date(Date.now() + weekOffset * 7 * 86400000));
  $: weekEnd = endOfWeek(weekStart);
  $: days = dateRange(weekStart, weekEnd);

  $: loadWeek(weekStart, weekEnd);

  async function loadWeek(start: Date, end: Date) {
    loading = true;
    const sKey = toDateKey(start);
    const eKey = toDateKey(end);
    const [sessions, mealLogs, sleep, cardio] = await Promise.all([
      getSessionsBetween(sKey, eKey),
      getMealLogsBetween(sKey, eKey),
      getSleepBetween(sKey, eKey),
      getCardioBetween(sKey, eKey)
    ]);
    statuses = days.map(d => buildDayStatus(toDateKey(d), sessions, mealLogs, sleep, cardio));
    loading = false;
  }

  $: weekLabel = weekOffset === 0 ? 'Esta semana'
                : weekOffset === -1 ? 'Semana pasada'
                : weekOffset === 1 ? 'Próxima semana'
                : `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

  // Totales semanales
  $: sessionsCompleted = statuses.filter(s => s.hasSession).length;
  $: mealsLogged = statuses.reduce((a, s) => a + s.mealsLogged, 0);
  $: kcalAvg = (() => {
    const withMeals = statuses.filter(s => s.mealsLogged > 0);
    if (withMeals.length === 0) return 0;
    return Math.round(withMeals.reduce((a, s) => a + s.macros.kcal, 0) / withMeals.length);
  })();
  $: sleepAvgMin = (() => {
    const withSleep = statuses.filter(s => s.sleepMinutes != null);
    if (withSleep.length === 0) return 0;
    return Math.round(withSleep.reduce((a, s) => a + (s.sleepMinutes ?? 0), 0) / withSleep.length);
  })();

  function isToday(d: Date): boolean {
    return isSameDay(d, new Date());
  }

  function dayPlanName(d: Date): string {
    if (!activeProgram) return '';
    const dow = isoDayOfWeek(d);
    const plan = activeProgram.days[dow];
    return plan?.name ?? '';
  }

  function daySummaryFor(d: Date) {
    if (!activeProgram) return null;
    const plan = activeProgram.days[isoDayOfWeek(d)];
    return plan ? summarizeDay(plan) : null;
  }

  function isPlannedRest(d: Date): boolean {
    if (!activeProgram) return false;
    const dow = isoDayOfWeek(d);
    return activeProgram.days[dow]?.isRestDay ?? false;
  }

  function goToDayWorkout(d: Date) {
    if (!activeProgram) return;
    const dow = isoDayOfWeek(d);
    const plan = activeProgram.days[dow];
    if (!plan) return;
    // Permitimos navegar también en días de descanso → DayDetail muestra "Día de descanso"
    navigate('day_detail', { dayId: plan.id });
  }

  function goToTodayPlan() {
    if (!activeProgram) return;
    const todayDow = isoDayOfWeek(new Date());
    const todayPlan = activeProgram.days[todayDow];
    if (todayPlan) navigate('day_detail', { dayId: todayPlan.id });
    else navigate('training');
  }

  function sleepFmt(min: number): string {
    if (min === 0) return '—';
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }
</script>

<!-- ⚠️ Alerta de estancamiento de fuerza -->
{#if stagnations.length > 0}
  <div class="card-feature mb-3 ring-2 ring-orange-300 bg-orange-50">
    <div class="flex items-start gap-2">
      <span class="text-2xl">⚠️</span>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-orange-800">Estancamiento de fuerza detectado</div>
        <div class="text-sm text-orange-700 mt-1">
          {stagnations.length} ejercicio{stagnations.length === 1 ? '' : 's'} sin progreso en las últimas sesiones.
          Considera una semana de descarga (deload) o añadir 1 serie extra.
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Selector de semana -->
<div class="flex items-center justify-between mb-3">
  <button class="btn-ghost py-1.5 px-3 text-sm" on:click={() => weekOffset--}>← Ant</button>
  <div class="text-center">
    <div class="text-sm font-semibold capitalize">{weekLabel}</div>
    <div class="text-[10px] text-slate-500">
      {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
      —
      {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
    </div>
  </div>
  <button class="btn-ghost py-1.5 px-3 text-sm" on:click={() => weekOffset++}>Sig →</button>
</div>

<!-- Resumen semanal (KPIs) -->
<div class="grid grid-cols-4 gap-2 mb-4">
  <div class="card-compact text-center">
    <div class="text-xl">🏋️</div>
    <div class="font-bold text-lg">{sessionsCompleted}</div>
    <div class="text-[10px] text-slate-500">Sesiones</div>
  </div>
  <div class="card-compact text-center">
    <div class="text-xl">🥗</div>
    <div class="font-bold text-lg">{mealsLogged}</div>
    <div class="text-[10px] text-slate-500">Comidas</div>
  </div>
  <div class="card-compact text-center">
    <div class="text-xl">🔥</div>
    <div class="font-bold text-lg">{kcalAvg}</div>
    <div class="text-[10px] text-slate-500">kcal media</div>
  </div>
  <div class="card-compact text-center">
    <div class="text-xl">🛌</div>
    <div class="font-bold text-sm leading-tight mt-0.5">{sleepFmt(sleepAvgMin)}</div>
    <div class="text-[10px] text-slate-500">Sueño</div>
  </div>
</div>

<!-- PANELES POR DÍA (7 cards anchos en fila horizontal con scroll lateral) -->
<div class="flex items-center justify-between mb-3">
  <h3 class="section-title">Tu semana</h3>
  <span class="text-[10px] text-slate-400">desliza →</span>
</div>
<div bind:this={panelsContainer}
     class="flex gap-5 overflow-x-auto pt-2 pb-4 -mx-5 px-5 snap-x snap-mandatory scroll-pl-5">
  {#each days as d, i}
    {@const st = statuses[i]}
    {@const summary = daySummaryFor(d)}
    {@const today = isToday(d)}
    {@const restDay = isPlannedRest(d)}
    {@const planExists = activeProgram?.days[isoDayOfWeek(d)] != null}
    <div bind:this={panelRefs[i]}
         use:onMounted={() => i === days.length - 1 && requestAnimationFrame(tryInitialScroll)}
         class="card relative shrink-0 w-[320px] md:w-[360px] snap-start flex flex-col animate-stagger"
         style="animation-delay: {i * 60}ms"
         class:ring-2={today}
         class:ring-primary-500={today}
         class:bg-primary-50={today}
         class:opacity-60={!today && d < new Date(new Date().toDateString())}>
      <!-- Header del panel: fecha + estado -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{WEEKDAYS_SHORT[i]}</div>
          <div class="font-extrabold text-2xl leading-none">{d.getDate()}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            {d.toLocaleDateString('es-ES', { month: 'short' })}
          </div>
        </div>
        <div class="flex flex-col items-end gap-1">
          {#if today}
            <span class="text-[10px] font-bold uppercase tracking-wider bg-primary-600 text-white px-2 py-0.5 rounded-full">Hoy</span>
          {/if}
          {#if st?.hasSession}
            <span class="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Hecho</span>
          {/if}
        </div>
      </div>

      <!-- Resumen del entreno -->
      {#if summary}
        <div class="flex items-start gap-2 mb-3">
          <span class="text-2xl">{summary.emoji}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold leading-tight">{summary.title}</div>
            {#if summary.intensity}
              <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block"
                    class:bg-orange-100={summary.intensity === 'fuerza'}
                    class:text-orange-700={summary.intensity === 'fuerza'}
                    class:bg-emerald-100={summary.intensity === 'hipertrofia'}
                    class:text-emerald-700={summary.intensity === 'hipertrofia'}
                    class:bg-slate-100={summary.intensity === 'mixto'}
                    class:text-slate-600={summary.intensity === 'mixto'}>
                {summary.intensity}
              </span>
            {/if}
            <div class="text-[11px] text-slate-500 mt-1">{summary.musclesLabel}</div>
          </div>
        </div>
      {/if}

      <!-- Stats compactas del día -->
      <div class="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
        <span>🥗 {st?.mealsLogged ?? 0} comidas</span>
        {#if st?.sleepMinutes != null}<span>🛌 {sleepFmt(st.sleepMinutes)}</span>{/if}
      </div>

      <!-- Cardio del día (si hay) -->
      {#if st && st.cardioCount > 0}
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-2 mb-3">
          <div class="flex items-center gap-1 text-xs">
            {#each st.cardioTypes as t}<span>{CARDIO_ICONS[t] ?? '🏃'}</span>{/each}
            <span class="font-bold text-emerald-700 ml-1">
              {formatDistance(st.cardioDistanceMeters)} · {formatDuration(st.cardioDurationSeconds)}
            </span>
            {#if st.cardioKcal > 0}
              <span class="text-[10px] text-emerald-600 ml-auto">~{st.cardioKcal} kcal</span>
            {/if}
          </div>
          {#if st.cardioCount > 1}
            <div class="text-[10px] text-emerald-600 mt-0.5">{st.cardioCount} sesiones</div>
          {/if}
        </div>
      {/if}

      <!-- 🕐 Horario compacto del día -->
      {#if $profile}
        <div class="mb-3">
          <CompactSchedule
            profile={$profile}
            trainingDay={activeProgram?.days[isoDayOfWeek(d)] ?? null}
            highlightPast={today} />
        </div>
      {/if}

      <!-- Botones dentro del panel -->
      <div class="grid grid-cols-2 gap-2 mt-2">
        <button class="btn-primary py-2 text-xs"
                disabled={!planExists}
                on:click={() => goToDayWorkout(d)}>
          {restDay ? '😴 Ver día' : '🏋️ Ver plan'}
        </button>
        <button class="btn-secondary py-2 text-xs"
                on:click={() => navigate('nutrition')}>
          🥗 Comidas
        </button>
      </div>
    </div>
  {/each}
</div>



<!-- 📊 MÉTRICAS Y GRÁFICAS (al final, debajo de los paneles) -->
<div class="mt-6">
  <ProgressCard />
</div>
