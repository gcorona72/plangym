<script lang="ts">
  import { navigate } from '$stores/navigation';
  import type { TrainingProgram, DailyGoals } from '$lib/types';
  import {
    toDateKey, startOfMonth, endOfMonth, dateRange, isSameDay, isoDayOfWeek, WEEKDAYS_SHORT
  } from '$lib/dateUtils';
  import { getSessionsBetween, getMealLogsBetween, getSleepBetween, buildDayStatus, type DayStatus } from '$lib/dashboardData';

  export let activeProgram: TrainingProgram | null;
  // svelte-ignore unused-export-let
  export let goals: DailyGoals | null = null; // reservado para futuras stats

  /** Offset de mes (0 = actual, -1 = anterior...). */
  let monthOffset = 0;

  let monthStart: Date;
  let monthEnd: Date;
  let days: Date[] = [];
  let statuses: DayStatus[] = [];
  /** Días vacíos al inicio para alinear el primer día con su columna (lunes). */
  let leadingBlanks: number = 0;

  $: {
    const ref = new Date();
    ref.setMonth(ref.getMonth() + monthOffset);
    ref.setDate(1);
    monthStart = startOfMonth(ref);
    monthEnd = endOfMonth(ref);
    days = dateRange(monthStart, monthEnd);
    leadingBlanks = isoDayOfWeek(monthStart);
  }

  $: loadMonth(monthStart, monthEnd);

  async function loadMonth(start: Date, end: Date) {
    const sKey = toDateKey(start);
    const eKey = toDateKey(end);
    const [sessions, mealLogs, sleep] = await Promise.all([
      getSessionsBetween(sKey, eKey),
      getMealLogsBetween(sKey, eKey),
      getSleepBetween(sKey, eKey)
    ]);
    statuses = days.map(d => buildDayStatus(toDateKey(d), sessions, mealLogs, sleep));
  }

  $: monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Stats mensuales
  $: sessionsCompleted = statuses.filter(s => s.hasSession).length;
  $: daysWithMeals = statuses.filter(s => s.mealsLogged > 0).length;
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

  function isPlannedRest(d: Date): boolean {
    if (!activeProgram) return false;
    return activeProgram.days[isoDayOfWeek(d)]?.isRestDay ?? false;
  }

  function goToDayWorkout(d: Date) {
    if (!activeProgram) return;
    const plan = activeProgram.days[isoDayOfWeek(d)];
    if (!plan || plan.isRestDay) return;
    navigate('day_detail', { dayId: plan.id });
  }

  function goToTodayPlan() {
    if (!activeProgram) return;
    const todayPlan = activeProgram.days[isoDayOfWeek(new Date())];
    if (todayPlan) navigate('day_detail', { dayId: todayPlan.id });
    else navigate('training');
  }

  function sleepFmt(min: number): string {
    if (min === 0) return '—';
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }
</script>

<!-- Navegador de mes -->
<div class="flex items-center justify-between mb-3">
  <button class="btn-ghost py-1.5 px-3 text-sm" on:click={() => monthOffset--}>← Ant</button>
  <div class="text-sm font-semibold capitalize">{monthLabel}</div>
  <button class="btn-ghost py-1.5 px-3 text-sm" on:click={() => monthOffset++}>Sig →</button>
</div>

<!-- Calendar grid -->
<div class="card mb-3">
  <!-- Cabecera días de semana -->
  <div class="grid grid-cols-7 gap-1 mb-1.5">
    {#each WEEKDAYS_SHORT as wd}
      <div class="text-center text-[10px] font-bold text-slate-500 uppercase">{wd}</div>
    {/each}
  </div>
  <!-- Grid -->
  <div class="grid grid-cols-7 gap-1">
    {#each Array(leadingBlanks) as _}
      <div class="aspect-square"></div>
    {/each}
    {#each days as d, i}
      {@const st = statuses[i]}
      {@const restDay = isPlannedRest(d)}
      {@const today = isToday(d)}
      <button
        class="aspect-square flex flex-col items-center justify-center rounded-md text-[10px] transition active:scale-90"
        class:bg-primary-600={today}
        class:text-white={today || (st?.hasSession && !today)}
        class:bg-accent-600={st?.hasSession && !today}
        class:bg-slate-100={!today && !st?.hasSession && !restDay}
        class:bg-slate-50={restDay && !today && !st?.hasSession}
        class:text-slate-400={restDay && !today && !st?.hasSession}
        class:ring-1={today || (restDay && !today && !st?.hasSession)}
        class:ring-primary-400={today}
        class:ring-slate-200={restDay && !today && !st?.hasSession}
        on:click={() => goToDayWorkout(d)}>
        <span class="font-bold text-sm leading-none">{d.getDate()}</span>
        {#if st?.hasSession}
          <span class="text-[8px] leading-none mt-0.5">✓</span>
        {:else if restDay}
          <span class="text-[8px] leading-none mt-0.5 opacity-70">·</span>
        {/if}
      </button>
    {/each}
  </div>
  <!-- Leyenda -->
  <div class="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500">
    <span><span class="inline-block w-2 h-2 rounded-sm bg-accent-600"></span> Sesión hecha</span>
    <span><span class="inline-block w-2 h-2 rounded-sm bg-primary-600"></span> Hoy</span>
    <span><span class="inline-block w-2 h-2 rounded-sm bg-slate-100"></span> Pendiente</span>
    <span><span class="inline-block w-2 h-2 rounded-sm bg-slate-50 ring-1 ring-slate-200"></span> Descanso</span>
  </div>
</div>

<!-- Stats mensuales -->
<div class="grid grid-cols-2 gap-3 mb-3">
  <div class="card">
    <div class="text-2xl mb-1">🏋️</div>
    <div class="font-bold text-xl">{sessionsCompleted}</div>
    <div class="text-xs text-slate-500">Sesiones del mes</div>
  </div>
  <div class="card">
    <div class="text-2xl mb-1">🥗</div>
    <div class="font-bold text-xl">{daysWithMeals}</div>
    <div class="text-xs text-slate-500">Días con comidas</div>
  </div>
  <div class="card">
    <div class="text-2xl mb-1">🔥</div>
    <div class="font-bold text-xl">{kcalAvg}</div>
    <div class="text-xs text-slate-500">kcal/día media</div>
  </div>
  <div class="card">
    <div class="text-2xl mb-1">🛌</div>
    <div class="font-bold text-xl">{sleepFmt(sleepAvgMin)}</div>
    <div class="text-xs text-slate-500">Sueño medio</div>
  </div>
</div>

<!-- Botones rápidos -->
<div class="grid grid-cols-2 gap-2 mb-3">
  <button class="btn-primary" on:click={goToTodayPlan}>📋 Plan de hoy</button>
  <button class="btn-secondary" on:click={() => navigate('nutrition')}>🥗 Comidas</button>
</div>
