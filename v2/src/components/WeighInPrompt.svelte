<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { profile } from '$stores/profile';
  import { getWeighInStatus, logWeight, snoozeWeighInToday, type WeighInStatus } from '$lib/weight/weighIns';

  /**
   * Pide el peso cuando toca (≥3 días sin pesarse). Se usa como aviso
   * flotante en la pantalla principal y dentro del informe semanal.
   *  - floating: tarjeta fija sobre la barra inferior, con "Hoy no".
   *  - inline:   bloque dentro de otra vista (p. ej. el informe semanal).
   */
  export let variant: 'floating' | 'inline' = 'floating';
  const dispatch = createEventDispatcher<{ saved: number; dismissed: void }>();

  let status: WeighInStatus | null = null;
  let value: number | null = null;
  let saving = false;
  let savedKg: number | null = null;
  let hidden = false;

  onMount(async () => {
    status = await getWeighInStatus();
    value = status.lastKg ?? $profile?.weightKg ?? null;
  });

  $: visible = !hidden && status != null && status.due;

  function sinceText(s: WeighInStatus): string {
    if (s.daysSince == null) return 'Aún no tienes ningún pesaje registrado.';
    if (s.daysSince === 1) return `Último pesaje: ayer (${s.lastKg} kg).`;
    return `Último pesaje: hace ${s.daysSince} días (${s.lastKg} kg).`;
  }

  async function save() {
    if (value == null || !(value > 25 && value < 300) || saving) return;
    saving = true;
    const log = await logWeight(value);
    savedKg = log.weightKg;
    saving = false;
    dispatch('saved', log.weightKg);
    setTimeout(() => (hidden = true), variant === 'floating' ? 1800 : 0);
  }

  function later() {
    snoozeWeighInToday();
    hidden = true;
    dispatch('dismissed');
  }
</script>

{#if visible || savedKg != null}
  <div class={variant === 'floating'
      ? 'fixed inset-x-0 bottom-20 md:bottom-6 z-40 px-4 animate-fade-in-up'
      : ''}>
    <div class="max-w-xl mx-auto rounded-2xl ring-1 ring-primary-200 dark:ring-primary-900 bg-white dark:bg-slate-900 px-4 py-3"
         class:shadow-xl={variant === 'floating'}>
      {#if savedKg != null}
        <div class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">✓ Guardado: {savedKg} kg</div>
      {:else if status}
        <div class="flex items-start gap-3">
          <span class="text-2xl leading-none">⚖️</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm">Toca pesarte</div>
            <p class="text-[11px] text-slate-500 leading-snug">
              {sinceText(status)} Mejor por la mañana, en ayunas y tras ir al baño.
            </p>
            <div class="flex items-center gap-2 mt-2">
              <input type="number" inputmode="decimal" step="0.1" min="25" max="300"
                     class="input py-2 w-24 text-center font-mono" bind:value={value}
                     aria-label="Peso en kg" />
              <span class="text-xs text-slate-500">kg</span>
              <button class="btn-primary py-2 px-4 text-xs ml-auto" disabled={saving || value == null} on:click={save}>
                {saving ? '…' : 'Guardar'}
              </button>
              {#if variant === 'floating'}
                <button class="text-[11px] text-slate-400 px-1" on:click={later}>Hoy no</button>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
