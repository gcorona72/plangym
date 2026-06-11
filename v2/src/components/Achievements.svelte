<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import {
    evaluateAchievements, CATEGORY_LABELS,
    type AchievementStatus, type AchievementCategory
  } from '$lib/achievements';

  let statuses: AchievementStatus[] = [];
  let newlyUnlockedIds = new Set<string>();
  let loading = true;

  onMount(async () => {
    const { statuses: s, newlyUnlocked } = await evaluateAchievements();
    statuses = s;
    newlyUnlockedIds = new Set(newlyUnlocked.map(d => d.id));
    loading = false;
  });

  $: unlockedCount = statuses.filter(s => s.unlocked).length;
  $: categories = Object.keys(CATEGORY_LABELS) as AchievementCategory[];

  function byCategory(cat: AchievementCategory): AchievementStatus[] {
    return statuses.filter(s => s.category === cat);
  }

  function fmtValue(v: number, unit: string): string {
    if (unit === 'kg' && v >= 1000) return `${Math.round(v / 100) / 10}k`;
    return String(v);
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function pct(current: number, target: number): number {
    return Math.min(Math.round((current / target) * 100), 100);
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <button class="text-sm text-slate-500 mb-3 active:scale-95" on:click={() => navigate('dashboard')}>← Volver</button>

  <div class="flex items-center justify-between mb-1">
    <h1 class="text-3xl font-bold">Logros 🏆</h1>
    {#if !loading}
      <span class="text-sm font-bold text-primary-600">{unlockedCount}/{statuses.length}</span>
    {/if}
  </div>
  <p class="text-slate-500 text-sm mb-6">Tu galería de trofeos. Los grises aún te esperan.</p>

  {#if loading}
    <div class="text-sm text-slate-500">Cargando…</div>
  {:else}
    <!-- Barra de progreso global -->
    <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
      <div class="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
           style="width: {pct(unlockedCount, statuses.length)}%"></div>
    </div>

    {#each categories as cat}
      {@const items = byCategory(cat)}
      {#if items.length > 0}
        <h2 class="section-title mb-2 mt-5">{CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          {#each items as a (a.id)}
            <div class="card-compact relative overflow-hidden transition"
                 class:ring-2={newlyUnlockedIds.has(a.id)}
                 class:ring-amber-400={newlyUnlockedIds.has(a.id)}
                 class:opacity-100={a.unlocked}>
              {#if newlyUnlockedIds.has(a.id)}
                <span class="absolute top-1.5 right-1.5 text-[9px] uppercase font-bold tracking-wider bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">¡Nuevo!</span>
              {/if}
              <div class="text-3xl mb-1" class:grayscale={!a.unlocked} class:opacity-40={!a.unlocked}>{a.icon}</div>
              <div class="font-bold text-sm leading-tight" class:text-slate-400={!a.unlocked}>{a.title}</div>
              <div class="text-[10px] mt-0.5 leading-snug" class:text-slate-500={a.unlocked} class:text-slate-400={!a.unlocked}>{a.description}</div>

              {#if a.unlocked}
                <div class="text-[10px] text-emerald-600 font-semibold mt-1.5">✓ {a.unlockedAt ? fmtDate(a.unlockedAt) : 'Desbloqueado'}</div>
              {:else}
                <div class="mt-1.5">
                  <div class="flex justify-between text-[9px] text-slate-400 mb-0.5 font-mono">
                    <span>{fmtValue(a.current, a.unit)}/{fmtValue(a.target, a.unit)} {a.unit}</span>
                    <span>{pct(a.current, a.target)}%</span>
                  </div>
                  <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-slate-300 transition-all" style="width: {pct(a.current, a.target)}%"></div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  {/if}
</div>
