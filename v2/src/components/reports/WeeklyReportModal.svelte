<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { WeeklyReport } from '$lib/reports/weeklyReport';
  import { markWeeklyReportSeen } from '$lib/reports/weeklyReport';
  import WeeklyReportView from './WeeklyReportView.svelte';
  import WeighInPrompt from '../WeighInPrompt.svelte';

  /**
   * Informe semanal OBLIGATORIO.
   * Sin "X" ni cierre por fondo: sólo se cierra confirmando, y el botón no se
   * activa hasta haber llegado al final del informe. La idea es que no se
   * pueda despachar sin leer qué ha supuesto la semana.
   */
  export let report: WeeklyReport;
  const dispatch = createEventDispatcher<{ close: void }>();

  let scroller: HTMLDivElement;
  let readToEnd = false;
  let saving = false;

  /** Se considera leído al llegar (casi) al final del scroll. */
  function checkEnd() {
    if (!scroller || readToEnd) return;
    const { scrollTop, clientHeight, scrollHeight } = scroller;
    if (scrollTop + clientHeight >= scrollHeight - 24) readToEnd = true;
  }

  onMount(() => {
    document.body.style.overflow = 'hidden';
    // Informe corto que cabe entero → ya está "leído"
    requestAnimationFrame(checkEnd);
  });
  onDestroy(() => {
    document.body.style.overflow = '';
  });

  async function confirm() {
    if (!readToEnd || saving) return;
    saving = true;
    await markWeeklyReportSeen(report.weekStart);
    dispatch('close');
  }
</script>

<div class="fixed inset-0 z-[60] bg-[#f7f8fa] dark:bg-slate-900 flex flex-col" role="dialog" aria-modal="true" aria-label="Informe semanal">
  <header class="px-5 pt-6 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 safe-top">
    <div class="max-w-xl mx-auto">
      <div class="text-[11px] uppercase tracking-wider font-bold text-primary-600">📋 Informe semanal</div>
      <h2 class="text-xl font-extrabold">Tu semana pasada, sin filtros</h2>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto" bind:this={scroller} on:scroll={checkEnd}>
    <div class="max-w-xl mx-auto px-5 py-4">
      <WeeklyReportView {report} />
      <!-- El informe semanal es buen momento para registrar el peso -->
      <div class="mt-5">
        <WeighInPrompt variant="inline" />
      </div>
    </div>
  </div>

  <footer class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 safe-bottom">
    <div class="max-w-xl mx-auto">
      <button class="btn-accent w-full" disabled={!readToEnd || saving} on:click={confirm}>
        {readToEnd ? 'Entendido — a por esta semana 💪' : '↓ Lee el informe hasta el final'}
      </button>
    </div>
  </footer>
</div>
