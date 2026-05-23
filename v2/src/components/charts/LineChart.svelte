<script lang="ts">
  import type { TimePoint } from '$lib/progress';

  export let data: TimePoint[] = [];
  export let title: string;
  export let unit: string = '';
  export let color: 'primary' | 'accent' | 'orange' = 'accent';

  const COLOR_MAP = {
    primary: { line: '#3b82f6', fill: '#dbeafe', dot: '#1d4ed8' },
    accent: { line: '#10b981', fill: '#d1fae5', dot: '#047857' },
    orange: { line: '#f97316', fill: '#ffedd5', dot: '#c2410c' }
  };
  $: c = COLOR_MAP[color];

  const VB_W = 100;
  const VB_H = 50;
  const PAD_TOP = 4;
  const PAD_BOTTOM = 8;
  const PAD_X = 3;

  // Solo puntos con valor > 0
  $: validPoints = data.filter(p => p.value > 0);
  $: minValue = validPoints.length > 0 ? Math.min(...validPoints.map(p => p.value)) : 0;
  $: maxValue = validPoints.length > 0 ? Math.max(...validPoints.map(p => p.value)) : 1;
  $: range = Math.max(maxValue - minValue, 0.5); // mínimo 0.5 para evitar línea plana invisible
  $: chartH = VB_H - PAD_TOP - PAD_BOTTOM;
  $: stepX = data.length > 1 ? (VB_W - PAD_X * 2) / (data.length - 1) : 0;

  function pointY(v: number): number {
    if (v === 0) return PAD_TOP + chartH;
    return PAD_TOP + chartH - ((v - minValue) / range) * chartH;
  }
  function pointX(i: number): number {
    return PAD_X + i * stepX;
  }

  $: pathD = (() => {
    const valids = data.map((p, i) => ({ ...p, i })).filter(p => p.value > 0);
    if (valids.length === 0) return '';
    return valids.map((p, k) => `${k === 0 ? 'M' : 'L'} ${pointX(p.i)} ${pointY(p.value)}`).join(' ');
  })();

  $: areaD = (() => {
    if (!pathD) return '';
    const valids = data.map((p, i) => ({ ...p, i })).filter(p => p.value > 0);
    if (valids.length === 0) return '';
    const first = pointX(valids[0].i);
    const last = pointX(valids[valids.length - 1].i);
    return `${pathD} L ${last} ${PAD_TOP + chartH} L ${first} ${PAD_TOP + chartH} Z`;
  })();

  $: latest = validPoints.length > 0 ? validPoints[validPoints.length - 1].value : null;
  $: first = validPoints.length > 0 ? validPoints[0].value : null;
  $: delta = latest != null && first != null ? latest - first : null;
</script>

<div class="bg-white rounded-xl p-3 ring-1 ring-slate-200">
  <div class="flex items-center justify-between mb-2">
    <h4 class="text-xs font-bold text-slate-700">{title}</h4>
    {#if latest != null}
      <div class="text-right">
        <div class="text-xs font-mono font-bold">{latest.toFixed(1)}{unit}</div>
        {#if delta != null}
          <div class="text-[9px] font-bold"
               class:text-emerald-600={delta > 0}
               class:text-red-500={delta < -0.05}
               class:text-slate-400={Math.abs(delta) < 0.05}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}{unit}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if validPoints.length === 0}
    <div class="h-24 flex items-center justify-center text-[11px] text-slate-400">Sin datos aún</div>
  {:else if validPoints.length === 1}
    <div class="h-24 flex items-center justify-center text-[11px] text-slate-400">
      Necesito ≥2 puntos para mostrar la tendencia
    </div>
  {:else}
    <svg viewBox="0 0 {VB_W} {VB_H}" class="w-full" preserveAspectRatio="none" style="height: 110px">
      <!-- Área rellena bajo la línea -->
      <path d={areaD} fill={c.fill} opacity="0.7" />
      <!-- Línea -->
      <path d={pathD} fill="none" stroke={c.line} stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round" />
      <!-- Puntos -->
      {#each data as point, i}
        {#if point.value > 0}
          <circle cx={pointX(i)} cy={pointY(point.value)} r="1" fill={c.dot}>
            <title>{point.hint ?? `${point.label}: ${point.value}${unit}`}</title>
          </circle>
        {/if}
      {/each}
      <!-- Etiquetas X (cada 1-2) -->
      {#each data as point, i}
        {#if i % 2 === 0 || i === data.length - 1}
          <text
            x={pointX(i)} y={VB_H - 1}
            text-anchor="middle"
            font-size="3.5"
            fill="#94a3b8"
            font-family="sans-serif">
            {point.label}
          </text>
        {/if}
      {/each}
    </svg>
  {/if}
</div>
