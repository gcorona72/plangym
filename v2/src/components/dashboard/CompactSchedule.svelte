<script lang="ts">
  import type { UserProfile, TrainingDay } from '$lib/types';
  import { buildDailySchedule, type ScheduleEntry } from '$lib/dailySchedule';

  export let profile: UserProfile;
  export let trainingDay: TrainingDay | null;
  /** Si es true, marca con verde las pasadas (solo tiene sentido para HOY). */
  export let highlightPast: boolean = false;

  $: schedule = buildDailySchedule(profile, trainingDay);

  // Mostramos solo las claves: despertar, comidas, entreno, dormir (sin pre/post)
  // para mantenerlo compacto. Pre/post solo si hay entreno y es muy distinto.
  $: keyEntries = filterCompact(schedule);

  function filterCompact(entries: ScheduleEntry[]): ScheduleEntry[] {
    return entries.filter(e =>
      e.type === 'wake'
      || e.type === 'cardio'
      || e.type === 'sleep'
      || e.type === 'training'
      || e.type === 'pre_workout_snack'
      || e.type === 'post_workout'
      || e.type === 'meal'
    );
  }

  const nowMin = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();
</script>

<div class="bg-slate-50 rounded-lg p-2.5 ring-1 ring-slate-200">
  <div class="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">🕐 Horario</div>
  <div class="space-y-1">
    {#each keyEntries as e}
      {@const past = highlightPast && e.minutes < nowMin}
      <div class="flex items-center gap-2 text-[11px]"
           class:text-slate-400={past}
           class:line-through={past && e.type !== 'training'}>
        <span class="font-mono font-bold tabular-nums w-10">{e.time}</span>
        <span class="text-sm">{e.icon}</span>
        <span class="flex-1 truncate" class:font-semibold={e.type === 'training'}>{e.label}</span>
      </div>
    {/each}
  </div>
</div>
