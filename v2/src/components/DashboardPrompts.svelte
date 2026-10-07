<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { navigate } from '$stores/navigation';
  import { toDateKey, addDays } from '$lib/dateUtils';
  import type { WorkoutSession } from '$lib/types';
  import WeighInPrompt from './WeighInPrompt.svelte';

  /**
   * Avisos de la pantalla principal, de uno en uno para no amontonarse:
   *   1. Entreno sin terminar (p. ej. el iPhone cerró la app a mitad de
   *      sesión): se ofrece continuarlo donde se quedó.
   *   2. Si no hay ninguno, el aviso de pesaje (cuando toca).
   */

  let draft: WorkoutSession | null = null;
  let dayName = '';
  let checked = false;
  let dismissed = false;

  onMount(async () => {
    const since = toDateKey(addDays(new Date(), -2));
    const recent = await db.sessions.where('date').aboveOrEqual(since).toArray();
    draft = recent
      .filter(s => !s.finishedAt && !s.missed && s.exercises.some(e => e.sets.length > 0))
      .sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0] ?? null;
    if (draft) {
      const program = await db.programs.filter(p => p.active).first();
      dayName = program?.days.find(d => d.id === draft!.dayId)?.name ?? 'Entreno';
    }
    checked = true;
  });

  $: setsLogged = draft ? draft.exercises.reduce((a, e) => a + e.sets.length, 0) : 0;

  function resume() {
    if (!draft) return;
    navigate('gym_session', { dayId: draft.dayId, modality: draft.modality, date: draft.date });
  }
</script>

{#if checked}
  {#if draft && !dismissed}
    <div class="fixed inset-x-0 bottom-20 md:bottom-6 z-40 px-4 animate-fade-in-up">
      <div class="max-w-xl mx-auto rounded-2xl ring-1 ring-amber-200 dark:ring-amber-900 bg-white dark:bg-slate-900 shadow-xl px-4 py-3">
        <div class="flex items-start gap-3">
          <span class="text-2xl leading-none">⏸</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm">Tienes un entreno sin terminar</div>
            <p class="text-[11px] text-slate-500 leading-snug">
              {dayName} · {setsLogged} {setsLogged === 1 ? 'serie guardada' : 'series guardadas'}. Sigue donde lo dejaste.
            </p>
            <div class="flex items-center gap-2 mt-2">
              <button class="btn-accent py-2 px-4 text-xs" on:click={resume}>▶️ Continuar</button>
              <button class="text-[11px] text-slate-400 px-1 ml-auto" on:click={() => (dismissed = true)}>Más tarde</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if !draft}
    <WeighInPrompt />
  {/if}
{/if}
