<script lang="ts">
  import type { WeeklyReport, DayOutcome, ConsequenceLevel } from '$lib/reports/weeklyReport';
  import { fromDateKey } from '$lib/dateUtils';
  import { MISSED_REASON_LABEL } from '$lib/training/sessionStatus';

  export let report: WeeklyReport;

  const OUTCOME: Record<DayOutcome, { icon: string; label: string; cls: string }> = {
    done:     { icon: '✓',  label: 'Hecho',        cls: 'bg-emerald-100 text-emerald-700' },
    partial:  { icon: '◐',  label: 'Incompleto',   cls: 'bg-amber-100 text-amber-700' },
    draft:    { icon: '⏸',  label: 'Sin cerrar',   cls: 'bg-amber-100 text-amber-700' },
    missed:   { icon: '🚫', label: 'No asistí',    cls: 'bg-red-100 text-red-600' },
    skipped:  { icon: '✕',  label: 'Sin hacer',    cls: 'bg-red-100 text-red-700' },
    upcoming: { icon: '·',  label: 'Pendiente',    cls: 'bg-slate-100 text-slate-500' }
  };

  const LEVEL: Record<ConsequenceLevel, string> = {
    critical: 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900',
    warning:  'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900',
    info:     'border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700',
    good:     'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'
  };

  const GRADE_CLS: Record<string, string> = {
    A: 'bg-emerald-600', B: 'bg-emerald-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-600', '–': 'bg-slate-400'
  };

  function dayShort(key: string) {
    return fromDateKey(key).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }
  function range(a: string, b: string) {
    const f = (k: string) => fromDateKey(k).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${f(a)} – ${f(b)}`;
  }
  function fmt(n: number) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
  }
  $: ordered = [...report.muscles].sort((a, b) => (a.sets / a.target.min) - (b.sets / b.target.min));
</script>

<!-- Cabecera: nota de la semana -->
<div class="flex items-center gap-4 mb-4">
  <div class="w-16 h-16 shrink-0 rounded-2xl {GRADE_CLS[report.grade.letter]} text-white flex items-center justify-center text-3xl font-extrabold">
    {report.grade.letter}
  </div>
  <div class="min-w-0">
    <div class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
      {range(report.weekStart, report.weekEnd)}{report.isCurrentWeek ? ' · en curso' : ''}
    </div>
    <div class="font-bold text-lg leading-tight">{report.grade.emoji} {report.grade.label}</div>
    <div class="text-xs text-slate-500 mt-0.5">
      {#if report.compliancePct != null}
        <b class="text-slate-700 dark:text-slate-200">{report.compliancePct}%</b> de las series programadas
        · {report.sessionsDone}/{report.sessionsDue} sesiones
      {:else}
        Aún no tocaba ninguna sesión
      {/if}
    </div>
  </div>
</div>

<!-- Días -->
<div class="grid gap-1.5 mb-4" style="grid-template-columns: repeat({Math.max(report.days.length, 1)}, minmax(0, 1fr));">
  {#each report.days as d (d.date)}
    {@const o = OUTCOME[d.outcome]}
    <div class="rounded-lg px-1 py-1.5 text-center {o.cls}" title={d.dayName}>
      <div class="text-[10px] font-semibold capitalize">{dayShort(d.date)}</div>
      <div class="text-base leading-none my-0.5">{o.icon}</div>
      <div class="text-[9px] leading-tight">
        {d.outcome === 'missed' && d.missedReason ? MISSED_REASON_LABEL[d.missedReason] : o.label}
      </div>
    </div>
  {/each}
</div>

<!-- Consecuencias -->
{#if report.consequences.length > 0}
  <h3 class="section-title mb-2">Qué ha supuesto esta semana</h3>
  <div class="space-y-2 mb-4">
    {#each report.consequences as c}
      <div class="rounded-xl border px-3 py-2.5 {LEVEL[c.level]}">
        <div class="flex items-start gap-2">
          <span class="text-lg leading-none mt-0.5">{c.icon}</span>
          <div class="min-w-0">
            <div class="text-sm font-bold leading-snug">{c.title}</div>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{c.detail}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<!-- Volumen por músculo -->
<h3 class="section-title mb-1">Series por músculo</h3>
<p class="text-[10px] text-slate-500 mb-2">
  Hechas vs las que tocaban según tu programa · {report.musclesInRange}/10 en rango de crecimiento (10-20)
</p>
<div class="space-y-1.5 mb-2">
  {#each ordered as m (m.muscle)}
    {@const pct = Math.min(100, Math.round((m.sets / m.target.min) * 100))}
    {@const plannedPct = Math.min(100, Math.round((m.planned / m.target.min) * 100))}
    <div>
      <div class="flex justify-between text-[11px] mb-0.5">
        <span class="font-medium">{m.label}</span>
        <span class="font-mono text-slate-500">{fmt(m.sets)} <span class="text-slate-400">/ {fmt(m.planned)} prev.</span></span>
      </div>
      <div class="relative h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div class="absolute inset-y-0 left-0 bg-slate-300 dark:bg-slate-600" style="width: {plannedPct}%"></div>
        <div class="absolute inset-y-0 left-0"
             class:bg-red-500={m.sets < 4}
             class:bg-amber-400={m.sets >= 4 && m.status === 'low'}
             class:bg-emerald-500={m.status === 'optimal'}
             class:bg-blue-500={m.status === 'high'}
             style="width: {pct}%"></div>
      </div>
    </div>
  {/each}
</div>
<p class="text-[10px] text-slate-400">Barra gris: lo que te daba el programa · color: lo que hiciste.</p>
