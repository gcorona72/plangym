<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import { buildWeeklyReport, type WeeklyReport } from '$lib/reports/weeklyReport';
  import { startOfWeek, addDays, fromDateKey, toDateKey } from '$lib/dateUtils';
  import { db } from '$db/database';
  import WeeklyReportView from './reports/WeeklyReportView.svelte';
  import MonthlyGoalsCard from './reports/MonthlyGoalsCard.svelte';

  /** Semanas a mostrar (la actual + las 4 anteriores). */
  const WEEKS = 5;

  let reports: WeeklyReport[] = [];
  let loading = true;
  let open: Record<string, boolean> = {};

  onMount(async () => {
    const monday = startOfWeek(new Date());
    const [built, profile] = await Promise.all([
      Promise.all(Array.from({ length: WEEKS }, (_, i) => buildWeeklyReport(addDays(monday, -7 * i), { includeMonth: i === 0 }))),
      db.profile.get(1)
    ]);
    // Las semanas anteriores a crear la cuenta no se evalúan
    const created = profile?.createdAt ? new Date(profile.createdAt) : null;
    const createdKey = created && !isNaN(created.getTime()) ? toDateKey(created) : '';
    reports = built.filter((r): r is WeeklyReport => r != null && r.days.length > 0 && r.weekEnd >= createdKey);
    if (reports[0]) open[reports[0].weekStart] = true;
    loading = false;
  });

  function title(r: WeeklyReport) {
    if (r.isCurrentWeek) return 'Esta semana';
    const f = (k: string) => fromDateKey(k).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${f(r.weekStart)} – ${f(r.weekEnd)}`;
  }
  const GRADE_CLS: Record<string, string> = {
    A: 'bg-emerald-600', B: 'bg-emerald-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-600', '–': 'bg-slate-400'
  };
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <button class="text-slate-500 mb-3 active:scale-95 text-sm" on:click={() => navigate('settings')}>← Volver</button>
  <h1 class="text-2xl md:text-3xl font-bold mb-1">📋 Informes</h1>
  <p class="text-slate-500 text-sm mb-4">Lo que tocaba, lo que hiciste y lo que supone para tu progreso.</p>

  <MonthlyGoalsCard />

  {#if loading}
    <div class="card text-sm text-slate-400">Preparando informes…</div>
  {:else if reports.length === 0}
    <div class="card text-sm text-slate-500">Activa un programa de entreno para generar informes semanales.</div>
  {:else}
    <div class="space-y-3">
      {#each reports as r (r.weekStart)}
        <div class="card">
          <button class="w-full flex items-center justify-between gap-3 text-left" on:click={() => (open[r.weekStart] = !open[r.weekStart])}>
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-9 h-9 shrink-0 rounded-xl {GRADE_CLS[r.grade.letter]} text-white font-extrabold flex items-center justify-center">{r.grade.letter}</span>
              <div class="min-w-0">
                <div class="font-bold">{title(r)}</div>
                <div class="text-xs text-slate-500 truncate">
                  {r.compliancePct != null ? `${r.compliancePct}% de series · ${r.sessionsDone}/${r.sessionsDue} sesiones` : 'Sin sesiones todavía'}
                </div>
              </div>
            </div>
            <span class="text-slate-400 text-sm">{open[r.weekStart] ? '▲' : '▼'}</span>
          </button>
          {#if open[r.weekStart]}
            <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <WeeklyReportView report={r} />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
