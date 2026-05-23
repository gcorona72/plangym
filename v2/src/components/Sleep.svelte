<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { profile } from '$stores/profile';
  import type { SleepEntry } from '$lib/types';

  let entries: SleepEntry[] = [];
  let bedtime: string = '';
  let wakeTime: string = '';
  let qualityScore: number | undefined = undefined;
  let notes: string = '';

  const today = new Date().toISOString().split('T')[0];

  onMount(async () => {
    entries = await db.sleep.orderBy('date').reverse().limit(14).toArray();

    // Pre-llenar con horarios objetivo del perfil
    if ($profile?.bedtimeTarget && $profile?.wakeTarget) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      bedtime = `${yesterday}T${$profile.bedtimeTarget}`;
      wakeTime = `${today}T${$profile.wakeTarget}`;
    }
  });

  async function saveSleep() {
    if (!bedtime || !wakeTime) {
      alert('Indica hora de dormir y de despertar');
      return;
    }
    const bed = new Date(bedtime);
    const wake = new Date(wakeTime);
    if (wake <= bed) {
      alert('La hora de despertar debe ser posterior a la de dormir');
      return;
    }
    const minutes = Math.round((wake.getTime() - bed.getTime()) / 60000);

    const entry: SleepEntry = {
      id: `sleep_${today}`,
      date: today,
      bedtime: bed.toISOString(),
      wakeTime: wake.toISOString(),
      durationMinutes: minutes,
      qualityScore,
      notes: notes.trim() || undefined
    };
    await db.sleep.put(entry);
    entries = await db.sleep.orderBy('date').reverse().limit(14).toArray();
    qualityScore = undefined;
    notes = '';
    alert('Sueño registrado ✓');
  }

  function formatDuration(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-4">Sueño 🛌</h1>

  <!-- Formulario para registrar -->
  <div class="card mb-4">
    <h3 class="text-xs font-bold text-slate-500 uppercase mb-3">Registrar noche pasada</h3>
    <div class="space-y-3">
      <div>
        <label class="label" for="bed">Hora de dormir</label>
        <input id="bed" type="datetime-local" bind:value={bedtime} class="input" />
      </div>
      <div>
        <label class="label" for="wake">Hora de despertar</label>
        <input id="wake" type="datetime-local" bind:value={wakeTime} class="input" />
      </div>
      <div>
        <label class="label">Calidad (opcional)</label>
        <div class="flex gap-1">
          {#each [1,2,3,4,5] as n}
            <button
              class="text-2xl active:scale-90"
              class:opacity-30={qualityScore == null || qualityScore < n}
              on:click={() => qualityScore = qualityScore === n ? undefined : n}>
              ⭐
            </button>
          {/each}
        </div>
      </div>
      <div>
        <label class="label" for="notes">Notas (opcional)</label>
        <input id="notes" type="text" bind:value={notes} class="input" placeholder="Ej: cené tarde, estresado…" />
      </div>
      <button class="btn-primary w-full" on:click={saveSleep}>Guardar</button>
    </div>
  </div>

  <!-- Historial -->
  {#if entries.length > 0}
    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Últimas 14 noches</h3>
    <div class="space-y-2">
      {#each entries as e}
        <div class="card flex items-center justify-between">
          <div>
            <div class="font-bold">{new Date(e.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <div class="text-xs text-slate-500">
              {new Date(e.bedtime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              → {new Date(e.wakeTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-primary-400">{formatDuration(e.durationMinutes)}</div>
            {#if e.qualityScore}
              <div class="text-xs">{'⭐'.repeat(e.qualityScore)}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center text-slate-500 text-sm py-8">No hay registros aún</div>
  {/if}
</div>
