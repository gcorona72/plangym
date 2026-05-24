<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { UserProfile, TrainingDay } from '$lib/types';
  import { buildDailySchedule, nowMinutes, type ScheduleEntry } from '$lib/dailySchedule';
  import { navigate } from '$stores/navigation';

  export let profile: UserProfile;
  export let trainingDay: TrainingDay | null;

  $: schedule = buildDailySchedule(profile, trainingDay);

  // Tick cada minuto para refrescar "ahora"
  let nowMin = nowMinutes();
  let timerId: ReturnType<typeof setInterval>;
  onMount(() => {
    timerId = setInterval(() => { nowMin = nowMinutes(); }, 60_000);
  });
  onDestroy(() => clearInterval(timerId));

  $: currentIdx = (() => {
    // El "actual" es la última entrada cuya hora ya pasó (o la primera si nada ha pasado)
    let idx = -1;
    for (let i = 0; i < schedule.length; i++) {
      if (schedule[i].minutes <= nowMin) idx = i;
    }
    return idx;
  })();

  $: next = schedule.find(e => e.minutes > nowMin);
  $: minutesToNext = next ? next.minutes - nowMin : null;

  function fmtCountdown(min: number): string {
    if (min < 60) return `en ${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `en ${h}h${m > 0 ? ` ${m}m` : ''}`;
  }

  function colorFor(type: ScheduleEntry['type']): string {
    if (type === 'training') return 'bg-primary-600 text-white';
    if (type === 'cardio') return 'bg-rose-100 text-rose-800';
    if (type === 'wake') return 'bg-yellow-100 text-yellow-800';
    if (type === 'sleep') return 'bg-slate-200 text-slate-700';
    if (type === 'pre_workout_snack') return 'bg-orange-100 text-orange-800';
    if (type === 'post_workout') return 'bg-emerald-100 text-emerald-800';
    return 'bg-slate-100 text-slate-700';
  }
</script>

<div class="card mb-3">
  <div class="flex items-center justify-between mb-3">
    <h2 class="section-title">🕐 Horario de hoy</h2>
    {#if next && minutesToNext != null}
      <span class="text-[10px] text-primary-600 font-bold">
        Siguiente: {next.icon} {next.label} {fmtCountdown(minutesToNext)}
      </span>
    {/if}
  </div>

  <!-- Timeline vertical -->
  <div class="relative">
    <!-- Línea vertical de fondo -->
    <div class="absolute left-[42px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

    <div class="space-y-2">
      {#each schedule as entry, i}
        {@const isNow = i === currentIdx}
        {@const isPast = entry.minutes < nowMin && !isNow}
        <div class="relative flex items-center gap-3"
             class:opacity-50={isPast}>
          <!-- Hora -->
          <div class="w-9 text-right">
            <span class="text-xs font-mono font-bold tabular-nums"
                  class:text-slate-400={isPast}
                  class:text-primary-600={isNow}
                  class:text-slate-800={!isPast && !isNow}>
              {entry.time}
            </span>
          </div>

          <!-- Punto de la timeline -->
          <div class="relative shrink-0 z-10">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-sm
                        ring-4 ring-white"
                 class:bg-primary-600={isNow}
                 class:scale-110={isNow}
                 class:transition={true}
                 class:bg-emerald-500={isPast}
                 class:bg-slate-200={!isPast && !isNow}>
              <span class:text-white={isNow || isPast}>{entry.icon}</span>
            </div>
            {#if isNow}
              <div class="absolute -inset-1 rounded-full bg-primary-600/30 animate-ping"></div>
            {/if}
          </div>

          <!-- Contenido -->
          <button
            class="flex-1 text-left rounded-lg px-3 py-2 text-sm transition active:scale-[0.98]"
            class:font-bold={isNow}
            class:hover:bg-slate-50={!isNow}
            class:bg-primary-50={isNow}
            class:ring-1={isNow}
            class:ring-primary-200={isNow}
            on:click={() => {
              if (entry.type === 'training') navigate('day_detail', { dayId: trainingDay?.id });
              else if (entry.type === 'meal' || entry.type === 'pre_workout_snack' || entry.type === 'post_workout') navigate('nutrition');
              else if (entry.type === 'sleep') navigate('sleep');
              else if (entry.type === 'cardio') navigate('cardio');
            }}>
            <div class="flex items-center gap-2">
              <span class={isPast ? 'line-through' : ''}>{entry.label}</span>
              {#if isNow}<span class="text-[9px] uppercase font-bold tracking-wider bg-primary-600 text-white px-1.5 py-0.5 rounded">Ahora</span>{/if}
            </div>
            {#if entry.hint}
              <div class="text-[11px] text-slate-500 mt-0.5">{entry.hint}</div>
            {/if}
          </button>
        </div>
      {/each}
    </div>
  </div>

  <p class="text-[10px] text-slate-400 mt-3 text-center">
    Cronograma basado en tu hora de despertar ({profile.wakeTarget ?? '09:00'}) y preferencia de gym.
    Edítalo en <button class="underline" on:click={() => navigate('settings')}>Ajustes → Preferencias</button>.
  </p>
</div>
