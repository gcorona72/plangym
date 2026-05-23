<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { profile, saveProfile } from '$stores/profile';
  import { toDateKey } from '$lib/dateUtils';
  import { computeWeeklyAverages, diagnoseProgress, type WeeklyAvg, type ProgressDiagnosis } from '$lib/training/weightProgress';
  import type { WeightLog } from '$lib/types';

  let logs: WeightLog[] = [];
  let weeklyAvgs: WeeklyAvg[] = [];
  let diagnosis: ProgressDiagnosis | null = null;

  let newWeight: number | undefined = undefined;
  let newDate = toDateKey();
  let saving = false;

  onMount(async () => {
    await loadAll();
    if ($profile && !newWeight) newWeight = $profile.weightKg;
  });

  async function loadAll() {
    logs = await db.weightLogs.orderBy('date').reverse().limit(60).toArray();
    weeklyAvgs = computeWeeklyAverages([...logs].reverse());
    diagnosis = $profile ? diagnoseProgress(weeklyAvgs, $profile) : null;
  }

  async function saveWeight() {
    if (!newWeight || newWeight <= 0 || !newDate) {
      alert('Introduce un peso válido');
      return;
    }
    saving = true;
    const log: WeightLog = {
      id: `w_${newDate}_${Date.now().toString(36)}`,
      date: newDate,
      weightKg: newWeight,
      createdAt: new Date().toISOString()
    };
    await db.weightLogs.put(log);

    // Si es la fecha más reciente, también actualiza el peso del perfil
    if ($profile && newDate >= (logs[0]?.date ?? '0')) {
      await saveProfile({ ...$profile, weightKg: newWeight });
    }

    newWeight = undefined;
    newDate = toDateKey();
    await loadAll();
    saving = false;
  }

  async function deleteLog(id: string) {
    if (!confirm('¿Borrar este registro?')) return;
    await db.weightLogs.delete(id);
    await loadAll();
  }

  /** Aplica la sugerencia de kcal del diagnóstico al perfil. */
  async function applyKcalSuggestion() {
    if (!$profile || !diagnosis?.suggestedKcalDelta) return;
    const current = $profile.surplusKcal ?? 500;
    const next = Math.max(300, Math.min(700, current + diagnosis.suggestedKcalDelta));
    if (!confirm(`Ajustar surplus de ${current} → ${next} kcal?`)) return;
    await saveProfile({ ...$profile, surplusKcal: next });
    await loadAll();
    alert('Surplus actualizado ✓');
  }

  $: lastWeight = logs[0]?.weightKg;
  $: firstWeight = logs[logs.length - 1]?.weightKg;
  $: totalDelta = lastWeight != null && firstWeight != null ? lastWeight - firstWeight : 0;
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-1">Peso ⚖️</h1>
  <p class="text-slate-500 text-sm mb-5">Pésate 3 veces por semana, misma hora, en ayunas.</p>

  <!-- Diagnóstico -->
  {#if diagnosis}
    <div class="card-feature mb-4"
         class:ring-2={diagnosis.status === 'stagnating' || diagnosis.status === 'losing'}
         class:ring-orange-400={diagnosis.status === 'stagnating'}
         class:ring-red-400={diagnosis.status === 'losing'}>
      <div class="flex items-center gap-2 mb-1">
        <span class="text-2xl">
          {#if diagnosis.status === 'progressing'}✅
          {:else if diagnosis.status === 'stagnating'}⚠️
          {:else if diagnosis.status === 'losing'}🚨
          {:else}📊{/if}
        </span>
        <span class="font-bold text-sm uppercase tracking-wider">
          {#if diagnosis.status === 'progressing'}Progresando
          {:else if diagnosis.status === 'stagnating'}Estancamiento
          {:else if diagnosis.status === 'losing'}Bajada inesperada
          {:else}Sin datos suficientes{/if}
        </span>
      </div>
      <p class="text-sm text-slate-700 mt-1">{diagnosis.message}</p>
      {#if diagnosis.suggestedKcalDelta}
        <button class="btn-primary w-full mt-3 text-sm py-2" on:click={applyKcalSuggestion}>
          Aplicar {diagnosis.suggestedKcalDelta > 0 ? '+' : ''}{diagnosis.suggestedKcalDelta} kcal automáticamente
        </button>
      {/if}
    </div>
  {/if}

  <!-- Estadísticas resumen -->
  <div class="grid grid-cols-3 gap-3 mb-4">
    <div class="card text-center">
      <div class="text-xs text-slate-500 uppercase">Actual</div>
      <div class="text-xl font-bold mt-1">{lastWeight?.toFixed(1) ?? '—'}<span class="text-xs text-slate-500"> kg</span></div>
    </div>
    <div class="card text-center">
      <div class="text-xs text-slate-500 uppercase">Variación</div>
      <div class="text-xl font-bold mt-1"
           class:text-emerald-600={totalDelta > 0}
           class:text-red-500={totalDelta < 0}>
        {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(1)}<span class="text-xs text-slate-500"> kg</span>
      </div>
    </div>
    <div class="card text-center">
      <div class="text-xs text-slate-500 uppercase">Registros</div>
      <div class="text-xl font-bold mt-1">{logs.length}</div>
    </div>
  </div>

  <!-- Formulario nuevo peso -->
  <div class="card mb-4">
    <h3 class="section-title mb-3">Nuevo pesaje</h3>
    <div class="grid grid-cols-3 gap-2">
      <input type="date" bind:value={newDate} class="input col-span-1" />
      <input type="number" step="0.1" placeholder="kg" bind:value={newWeight} class="input col-span-1" inputmode="decimal" />
      <button class="btn-primary col-span-1" on:click={saveWeight} disabled={saving}>
        {saving ? '...' : '+ Añadir'}
      </button>
    </div>
  </div>

  <!-- Medias semanales -->
  {#if weeklyAvgs.length > 0}
    <h3 class="section-title mb-2">Media semanal</h3>
    <div class="card mb-4">
      <div class="space-y-1.5">
        {#each [...weeklyAvgs].reverse().slice(0, 8) as w}
          <div class="flex items-center justify-between text-sm border-b border-slate-100 pb-1 last:border-0">
            <span class="text-slate-500">Semana del {new Date(w.weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            <span class="font-mono font-semibold">{w.avgKg.toFixed(2)} kg <span class="text-[10px] text-slate-400">({w.count} pesajes)</span></span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Historial de pesajes -->
  {#if logs.length > 0}
    <h3 class="section-title mb-2">Últimos pesajes</h3>
    <div class="space-y-1.5">
      {#each logs.slice(0, 20) as log}
        <div class="card-compact flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold">{new Date(log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-base font-bold">{log.weightKg.toFixed(1)} kg</span>
            <button class="text-red-400 text-sm active:scale-95" on:click={() => deleteLog(log.id)}>✕</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center text-slate-500 text-sm py-8">No hay pesajes aún. Empieza por añadir el de hoy.</div>
  {/if}
</div>
