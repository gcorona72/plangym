<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import type { MonthlyGoals } from '$lib/types';
  import {
    getOrCreateGoals, evaluateGoals, saveGoals, proposeGoals, monthKeyOf, monthLabel,
    type GoalsProgress
  } from '$lib/reports/monthlyGoals';

  /** compact: versión resumida para el dashboard; si no, completa y editable. */
  export let compact = false;
  export let month: string = monthKeyOf();

  let progress: GoalsProgress | null = null;
  let loading = true;
  let editing = false;
  let draft: MonthlyGoals | null = null;

  async function load() {
    loading = true;
    const goals = await getOrCreateGoals(month);
    progress = goals ? await evaluateGoals(goals) : null;
    loading = false;
  }
  onMount(load);

  function startEdit() {
    if (!progress) return;
    draft = JSON.parse(JSON.stringify(progress.goals));
    editing = true;
  }
  async function saveEdit() {
    if (!draft) return;
    draft.auto = false;
    draft.sessionsTarget = Math.max(1, Math.round(draft.sessionsTarget));
    draft.minCompliancePct = Math.min(100, Math.max(10, Math.round(draft.minCompliancePct)));
    draft.musclesInRangeTarget = Math.min(10, Math.max(1, Math.round(draft.musclesInRangeTarget)));
    await saveGoals(draft);
    editing = false;
    await load();
  }
  async function resetToProposal() {
    const p = await proposeGoals(month);
    if (p) { await saveGoals(p); editing = false; await load(); }
  }

  const STATUS = {
    on_track:  { label: 'En línea',   cls: 'bg-emerald-100 text-emerald-700' },
    at_risk:   { label: 'Vas justo',  cls: 'bg-amber-100 text-amber-700' },
    off_track: { label: 'Por detrás', cls: 'bg-red-100 text-red-700' }
  } as const;

  $: sessPct = progress && progress.goals.sessionsTarget > 0
    ? Math.min(100, Math.round((progress.sessionsDone / progress.goals.sessionsTarget) * 100)) : 0;
  $: projPct = progress && progress.goals.sessionsTarget > 0
    ? Math.min(100, Math.round((progress.projectedSessions / progress.goals.sessionsTarget) * 100)) : 0;
</script>

<div class="card mb-3">
  <div class="flex items-center justify-between mb-2">
    <h2 class="section-title">🎯 Objetivos de {monthLabel(month).split(' ')[0].toLowerCase()}</h2>
    {#if progress}
      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full {STATUS[progress.status].cls}">{STATUS[progress.status].label}</span>
    {/if}
  </div>

  {#if loading}
    <div class="text-xs text-slate-400">Calculando…</div>
  {:else if !progress}
    <div class="text-sm text-slate-500">Activa un programa de entreno para tener objetivos mensuales.</div>
  {:else if editing && draft}
    <!-- Edición -->
    <div class="space-y-3">
      <div class="grid grid-cols-3 gap-2">
        <label class="text-[11px] text-slate-500">Sesiones
          <input type="number" min="1" class="input mt-1" bind:value={draft.sessionsTarget} />
        </label>
        <label class="text-[11px] text-slate-500">% series/sem
          <input type="number" min="10" max="100" class="input mt-1" bind:value={draft.minCompliancePct} />
        </label>
        <label class="text-[11px] text-slate-500">Músculos en rango
          <input type="number" min="1" max="10" class="input mt-1" bind:value={draft.musclesInRangeTarget} />
        </label>
      </div>
      {#each draft.strength as g, i}
        <label class="block text-[11px] text-slate-500">
          {progress.strength[i]?.name ?? g.exerciseId} · empieza en {g.startKg} kg → objetivo (kg)
          <input type="number" step="0.5" class="input mt-1" bind:value={g.targetKg} />
        </label>
      {/each}
      <div class="grid grid-cols-2 gap-2">
        <button class="btn-primary py-2 text-xs" on:click={saveEdit}>Guardar</button>
        <button class="btn-secondary py-2 text-xs" on:click={() => (editing = false)}>Cancelar</button>
      </div>
      <button class="text-[11px] text-slate-400 w-full" on:click={resetToProposal}>↺ Volver a la propuesta de la app</button>
    </div>
  {:else}
    <!-- Sesiones -->
    <div class="mb-3">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-semibold">Sesiones</span>
        <span class="font-mono"><b>{progress.sessionsDone}</b> / {progress.goals.sessionsTarget}</span>
      </div>
      <div class="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div class="absolute inset-y-0 left-0 bg-slate-300/70 dark:bg-slate-600" style="width: {projPct}%"></div>
        <div class="absolute inset-y-0 left-0 bg-primary-600" style="width: {sessPct}%"></div>
      </div>
      <p class="text-[10px] text-slate-500 mt-1">{progress.summary}</p>
    </div>

    {#if !compact}
      <div class="grid grid-cols-2 gap-2 mb-3 text-center">
        <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
          <div class="font-bold">≥{progress.goals.minCompliancePct}%</div>
          <div class="text-[10px] text-slate-500">series cada semana</div>
        </div>
        <div class="rounded-lg bg-slate-50 dark:bg-slate-800 py-2">
          <div class="font-bold">{progress.goals.musclesInRangeTarget}/10</div>
          <div class="text-[10px] text-slate-500">músculos en rango</div>
        </div>
      </div>
    {/if}

    <!-- Fuerza -->
    {#if progress.strength.length > 0}
      <div class="space-y-2">
        {#each progress.strength as g (g.exerciseId)}
          <div>
            <div class="flex justify-between text-[11px] mb-0.5">
              <span class="font-medium truncate pr-2">{g.reached ? '🏅 ' : ''}{g.name}</span>
              <span class="font-mono text-slate-500 shrink-0">{g.currentKg} → <b class="text-slate-700 dark:text-slate-200">{g.targetKg} kg</b></span>
            </div>
            <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full transition-all duration-500"
                   class:bg-emerald-500={g.reached}
                   class:bg-accent-600={!g.reached}
                   style="width: {Math.max(g.pct, 3)}%"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex justify-between mt-3">
      {#if compact}
        <button class="text-[11px] text-primary-600 font-semibold" on:click={() => navigate('reports')}>📋 Ver informes →</button>
      {:else}
        <span class="text-[10px] text-slate-400">{progress.goals.auto ? 'Propuestos por la app según tu programa' : 'Editados por ti'}</span>
        <button class="text-[11px] text-primary-600 font-semibold" on:click={startEdit}>✏️ Editar</button>
      {/if}
    </div>
  {/if}
</div>
