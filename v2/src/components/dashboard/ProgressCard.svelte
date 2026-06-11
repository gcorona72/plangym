<script lang="ts">
  import { onMount } from 'svelte';
  import { computeProgressMetrics, motivationalMessage, type ProgressMetrics } from '$lib/progress';
  import { navigate } from '$stores/navigation';
  import { goals } from '$stores/profile';
  import BarChart from '../charts/BarChart.svelte';
  import LineChart from '../charts/LineChart.svelte';
  import { countUpInt } from '$lib/animations';
  import type { Readable } from 'svelte/store';

  let metrics: ProgressMetrics | null = null;

  // Stores animados (count-up)
  let streakStore: Readable<number> | null = null;
  let sessionsStore: Readable<number> | null = null;
  let volumeStore: Readable<number> | null = null;
  let macrosStore: Readable<number> | null = null;

  onMount(async () => {
    metrics = await computeProgressMetrics();
    if (metrics) {
      streakStore = countUpInt(metrics.streakDays, 700);
      sessionsStore = countUpInt(metrics.sessionsThisWeek, 700);
      volumeStore = countUpInt(metrics.totalVolumeKgThisWeek, 900);
      macrosStore = countUpInt(metrics.macrosAdherencePct, 800);
    }
  });

  function fmt(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${Math.round(n)}`;
  }
</script>

{#if metrics}
  <!-- Cabecera motivacional -->
  <div class="card-feature mb-3">
    <div class="flex items-start justify-between gap-2 mb-3">
      <div class="font-bold text-lg">{motivationalMessage(metrics)}</div>
      <button class="shrink-0 text-2xl active:scale-90 transition" title="Ver logros"
              on:click={() => navigate('achievements')}>🏆</button>
    </div>

    <!-- KPIs principales (2×2) -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
        <div class="flex items-center justify-between">
          <span class="text-2xl">🔥</span>
          <span class="text-[10px] text-slate-500 uppercase font-bold">Racha</span>
        </div>
        <div class="text-2xl font-extrabold mt-1 tabular-nums">{streakStore ? $streakStore : 0}</div>
        <div class="text-[10px] text-slate-500">{metrics.streakDays === 1 ? 'día' : 'días'}</div>
      </div>

      <div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
        <div class="flex items-center justify-between">
          <span class="text-2xl">🏋️</span>
          <span class="text-[10px] text-slate-500 uppercase font-bold">Sesiones</span>
        </div>
        <div class="flex items-baseline gap-1 mt-1">
          <div class="text-2xl font-extrabold tabular-nums">{sessionsStore ? $sessionsStore : 0}</div>
          {#if metrics.sessionsLastWeek > 0}
            <div class="text-[10px] font-bold"
                 class:text-emerald-600={metrics.sessionsThisWeek > metrics.sessionsLastWeek}
                 class:text-red-500={metrics.sessionsThisWeek < metrics.sessionsLastWeek}
                 class:text-slate-400={metrics.sessionsThisWeek === metrics.sessionsLastWeek}>
              {metrics.sessionsThisWeek > metrics.sessionsLastWeek ? '↑' : metrics.sessionsThisWeek < metrics.sessionsLastWeek ? '↓' : '='}
            </div>
          {/if}
        </div>
        <div class="text-[10px] text-slate-500">vs {metrics.sessionsLastWeek} sem pasada</div>
      </div>

      <div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
        <div class="flex items-center justify-between">
          <span class="text-2xl">💪</span>
          <span class="text-[10px] text-slate-500 uppercase font-bold">Volumen</span>
        </div>
        <div class="text-2xl font-extrabold mt-1 tabular-nums">{volumeStore ? fmt($volumeStore ?? 0) : '0'}<span class="text-xs text-slate-500"> kg</span></div>
        {#if metrics.volumeDeltaPct != null}
          <div class="text-[10px] font-bold"
               class:text-emerald-600={metrics.volumeDeltaPct > 0}
               class:text-red-500={metrics.volumeDeltaPct < 0}>
            {metrics.volumeDeltaPct > 0 ? '+' : ''}{metrics.volumeDeltaPct.toFixed(0)}% sem
          </div>
        {:else}
          <div class="text-[10px] text-slate-400">esta semana</div>
        {/if}
      </div>

      <div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
        <div class="flex items-center justify-between">
          <span class="text-2xl">🥗</span>
          <span class="text-[10px] text-slate-500 uppercase font-bold">Macros</span>
        </div>
        <div class="text-2xl font-extrabold mt-1 tabular-nums">{macrosStore ? $macrosStore : 0}<span class="text-xs text-slate-500">%</span></div>
        <div class="text-[10px] text-slate-500">{metrics.daysWithMealsThisWeek} días con plan</div>
      </div>
    </div>
  </div>

  <!-- 📈 GRÁFICAS -->
  <h3 class="section-title mb-2">📈 Tu evolución</h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
    <!-- Peso corporal (línea) -->
    <LineChart
      data={metrics.weightHistory}
      title="⚖️ Peso corporal (últimas 8 sem)"
      unit=" kg"
      color="accent"
    />

    <!-- Volumen semanal (barras) -->
    <BarChart
      data={metrics.weeklyVolumeHistory}
      title="💪 Tonelaje semanal (kg)"
      color="primary"
    />

    <!-- Sesiones por semana (barras) -->
    <BarChart
      data={metrics.weeklySessionsHistory}
      title="🏋️ Sesiones por semana"
      color="orange"
    />

    <!-- Calorías esta semana (barras con línea de target) -->
    <BarChart
      data={metrics.dailyKcalThisWeek}
      title="🥗 Calorías esta semana"
      unit=" kcal"
      color="yellow"
      targetLine={$goals?.targetKcal}
    />
  </div>

  <!-- PRs recientes -->
  {#if metrics.recentPRs.length > 0}
    <div class="card bg-emerald-50 ring-emerald-200 mb-3">
      <div class="text-[10px] uppercase font-bold tracking-wider text-emerald-700 mb-2">🎯 Récords personales recientes</div>
      <div class="space-y-1">
        {#each metrics.recentPRs as pr}
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold text-slate-800 truncate">{pr.exerciseName}</span>
            <span class="font-mono font-bold text-emerald-700">
              {pr.weightKg}kg × {pr.reps}
              {#if pr.improvement && pr.improvement > 0}
                <span class="text-[10px] ml-1">(+{pr.improvement}kg)</span>
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Cambio de peso -->
  {#if metrics.weightDeltaThisWeek != null}
    <button class="card flex items-center justify-between w-full text-left active:scale-[0.98] mb-3"
            on:click={() => navigate('weight')}>
      <div class="flex items-center gap-2">
        <span class="text-2xl">⚖️</span>
        <div>
          <div class="text-xs text-slate-500">Variación peso esta semana</div>
          <div class="text-lg font-bold"
               class:text-emerald-600={metrics.weightDeltaThisWeek > 0}
               class:text-red-500={metrics.weightDeltaThisWeek < -0.1}
               class:text-slate-700={Math.abs(metrics.weightDeltaThisWeek) <= 0.1}>
            {metrics.weightDeltaThisWeek >= 0 ? '+' : ''}{metrics.weightDeltaThisWeek.toFixed(2)} kg
          </div>
        </div>
      </div>
      <span class="text-slate-400">→</span>
    </button>
  {/if}

  <!-- Hitos totales -->
  <div class="card flex items-center justify-around text-center">
    <div>
      <div class="text-base font-bold">{metrics.totalSessions}</div>
      <div class="text-[10px] text-slate-500 uppercase">Sesiones total</div>
    </div>
    <div class="w-px h-8 bg-slate-200"></div>
    <div>
      <div class="text-base font-bold">{fmt(metrics.totalWeightLifted)} kg</div>
      <div class="text-[10px] text-slate-500 uppercase">Levantados</div>
    </div>
    <div class="w-px h-8 bg-slate-200"></div>
    <div>
      <div class="text-base font-bold">{metrics.totalMealsLogged}</div>
      <div class="text-[10px] text-slate-500 uppercase">Comidas</div>
    </div>
  </div>
{/if}
