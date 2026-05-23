<script lang="ts">
  import type { TimePoint } from '$lib/progress';

  export let data: TimePoint[] = [];
  export let title: string;
  export let unit: string = '';
  export let color: 'primary' | 'accent' | 'orange' | 'yellow' = 'primary';
  /** Línea de objetivo horizontal opcional. */
  export let targetLine: number | undefined = undefined;

  const COLOR_MAP = {
    primary: { bar: '#3b82f6', light: '#dbeafe' },
    accent: { bar: '#10b981', light: '#d1fae5' },
    orange: { bar: '#f97316', light: '#ffedd5' },
    yellow: { bar: '#eab308', light: '#fef9c3' }
  };
  $: c = COLOR_MAP[color];

  // SVG viewBox: 0..100 horizontal, 0..50 vertical (proporción 2:1)
  const VB_W = 100;
  const VB_H = 50;
  const PAD_TOP = 4;
  const PAD_BOTTOM = 8;
  const PAD_X = 2;

  $: maxValue = data.length > 0 ? Math.max(...data.map(d => d.value), targetLine ?? 0) || 1 : 1;
  $: chartH = VB_H - PAD_TOP - PAD_BOTTOM;
  $: barWidth = data.length > 0 ? (VB_W - PAD_X * 2) / data.length * 0.7 : 0;
  $: barGap = data.length > 0 ? (VB_W - PAD_X * 2) / data.length * 0.3 : 0;

  function barHeight(v: number): number {
    return (v / maxValue) * chartH;
  }
  function barY(v: number): number {
    return PAD_TOP + chartH - barHeight(v);
  }
  function barX(i: number): number {
    return PAD_X + i * (barWidth + barGap) + barGap / 2;
  }
  function targetY(): number {
    return PAD_TOP + chartH - ((targetLine ?? 0) / maxValue) * chartH;
  }
</script>

<div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
  <div class="flex items-center justify-between mb-2">
    <h4 class="text-xs font-bold text-slate-700">{title}</h4>
    {#if data.length > 0}
      <span class="text-[10px] text-slate-500 font-mono">
        máx {Math.round(maxValue)}{unit}
      </span>
    {/if}
  </div>

  {#if data.length === 0}
    <div class="h-24 flex items-center justify-center text-[11px] text-slate-400">Sin datos aún</div>
  {:else}
    <svg viewBox="0 0 {VB_W} {VB_H}" class="w-full" preserveAspectRatio="none" style="height: 110px">
      <!-- Línea de target horizontal -->
      {#if targetLine != null && targetLine > 0}
        <line
          x1="0" y1={targetY()}
          x2={VB_W} y2={targetY()}
          stroke={c.bar} stroke-width="0.3" stroke-dasharray="1 1" opacity="0.5" />
      {/if}

      <!-- Barras -->
      {#each data as point, i}
        <rect
          x={barX(i)}
          y={point.value > 0 ? barY(point.value) : VB_H - PAD_BOTTOM}
          width={barWidth}
          height={point.value > 0 ? barHeight(point.value) : 0.2}
          fill={point.value > 0 ? c.bar : c.light}
          rx="0.5">
          <title>{point.hint ?? `${point.label}: ${point.value}${unit}`}</title>
        </rect>
        <!-- Etiqueta eje X -->
        <text
          x={barX(i) + barWidth / 2}
          y={VB_H - 1}
          text-anchor="middle"
          font-size="3.5"
          fill="#94a3b8"
          font-family="sans-serif">
          {point.label}
        </text>
      {/each}
    </svg>
  {/if}
</div>
