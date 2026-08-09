<script lang="ts">
  import { onMount } from 'svelte';
  import { getWeeklyVolume, type WeeklyVolumeReport, type MuscleVolume } from '$lib/training/weeklyVolume';

  let report: WeeklyVolumeReport | null = null;
  let loading = true;
  let expanded = false;

  onMount(async () => {
    report = await getWeeklyVolume();
    loading = false;
  });

  function barColor(v: MuscleVolume): string {
    if (v.status === 'none') return 'bg-red-500';
    if (v.status === 'low') return 'bg-orange-400';
    if (v.status === 'high') return 'bg-blue-500';
    return 'bg-emerald-500';
  }

  function dot(v: MuscleVolume): string {
    if (v.status === 'none') return '⛔';
    if (v.status === 'low') return '🔴';
    if (v.status === 'high') return '🔵';
    return '🟢';
  }

  $: optimal = report ? report.muscles.filter(m => m.status === 'optimal' || m.status === 'high').length : 0;
  $: shown = report ? (expanded ? report.muscles : report.muscles.filter(m => m.status !== 'optimal').slice(0, 5)) : [];
</script>

<div class="card mb-3">
  <div class="flex items-center justify-between mb-1">
    <h2 class="section-title">📊 Volumen semanal por músculo</h2>
    {#if report}
      <span class="text-[10px] font-bold"
            class:text-emerald-600={optimal >= 7}
            class:text-orange-500={optimal < 7}>
        {optimal}/{report.muscles.length} en rango
      </span>
    {/if}
  </div>

  {#if loading}
    <div class="text-xs text-slate-400">Calculando…</div>
  {:else if report}
    <p class="text-[10px] text-slate-500 mb-3">
      Series efectivas esta semana ({report.sessions} {report.sessions === 1 ? 'sesión' : 'sesiones'}).
      Para crecer: <b>10-20 series/semana</b> por músculo grande.
    </p>

    {#if report.sessions === 0}
      <div class="text-sm text-slate-500 py-2">
        Aún no has entrenado esta semana. En cuanto registres una sesión verás aquí tu volumen.
      </div>
    {:else}
      <div class="space-y-2">
        {#each shown as v (v.muscle)}
          <div>
            <div class="flex items-center justify-between text-xs mb-0.5">
              <span class="flex items-center gap-1.5">
                <span>{dot(v)}</span>
                <span class="font-medium">{v.label}</span>
              </span>
              <span class="font-mono text-slate-500">
                {v.sets} <span class="text-slate-400">/ {v.target.min}-{v.target.max}</span>
              </span>
            </div>
            <div class="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full {barColor(v)} transition-all duration-500" style="width: {v.pct}%"></div>
            </div>
          </div>
        {/each}
      </div>

      <button class="text-[11px] text-primary-600 font-semibold mt-3"
              on:click={() => expanded = !expanded}>
        {expanded ? '▲ Ver solo los que fallan' : '▼ Ver todos los músculos'}
      </button>

      {#if report.lagging.length > 0}
        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <p class="text-[11px] text-slate-600 dark:text-slate-300">
            {#if report.lagging.some(l => l.status === 'none')}
              ⛔ <b>Sin trabajar:</b> {report.lagging.filter(l => l.status === 'none').map(l => l.label).join(', ')}.
              Completa los ejercicios finales de tus sesiones — son los que sueles saltarte.
            {:else}
              🔴 <b>Van cortos:</b> {report.lagging.slice(0, 3).map(l => l.label).join(', ')}.
              Cumplir tus días de entreno planificados los pone en rango.
            {/if}
          </p>
        </div>
      {/if}
    {/if}
  {/if}
</div>
