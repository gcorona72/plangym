<script lang="ts">
  import { onMount } from 'svelte';
  import {
    buildShoppingList, formatAmount, categoryLabel, CATEGORY_ORDER,
    shoppingListToCSV, shoppingListToText,
    type ShoppingList as ShoppingListType, type Period
  } from '$lib/nutrition/shoppingList';

  let period: Period = 'week';
  let list: ShoppingListType | null = null;
  let loading = false;
  let checkedItems: Set<string> = new Set();

  const PERIOD_LABELS: Record<Period, string> = {
    today: 'Hoy',
    week: 'Esta semana',
    month: 'Próximos 30 días',
    year: 'Anual (estimación)'
  };
  const PERIOD_OPTIONS: { key: Period; label: string }[] = (Object.entries(PERIOD_LABELS) as [Period, string][])
    .map(([key, label]) => ({ key, label }));

  $: load(period);

  async function load(p: Period) {
    loading = true;
    list = await buildShoppingList(p);
    loading = false;
  }

  function toggleItem(id: string) {
    if (checkedItems.has(id)) checkedItems.delete(id);
    else checkedItems.add(id);
    checkedItems = checkedItems;
  }

  function downloadCSV() {
    if (!list) return;
    const csv = shoppingListToCSV(list);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-compra-${list.period}-${list.startDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareText() {
    if (!list) return;
    const text = shoppingListToText(list, `Lista de la compra (${PERIOD_LABELS[period]})`);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lista de la compra', text });
        return;
      } catch (e) {
        // fallback a copia
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Lista copiada al portapapeles ✓');
    }
  }

  function printList() {
    window.print();
  }

  $: progress = list && list.totalItems > 0
    ? Math.round((checkedItems.size / list.totalItems) * 100)
    : 0;
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-1">Lista de la compra 🛒</h1>
  <p class="text-slate-500 text-sm mb-5">
    Ingredientes agregados a partir de tu plan de comidas.
  </p>

  <!-- Selector de periodo -->
  <div class="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
    {#each PERIOD_OPTIONS as opt}
      <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
              class:bg-primary-600={period === opt.key}
              class:text-white={period === opt.key}
              class:text-slate-500={period !== opt.key}
              on:click={() => period = opt.key}>{opt.label}</button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center text-slate-500 py-12">Calculando…</div>
  {:else if list}
    <!-- Stats + acciones -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-xs text-slate-500 uppercase tracking-wider font-bold">{PERIOD_LABELS[period]}</div>
          <div class="font-bold text-lg">{list.totalItems} ingredientes · {list.days} días</div>
          {#if period === 'year'}
            <div class="text-[10px] text-slate-500 mt-1">
              ⚠️ Estimación basada en una semana × 52. La realidad fluctúa con cambios de plan.
            </div>
          {/if}
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-primary-600">{progress}%</div>
          <div class="text-[10px] text-slate-500">comprado</div>
        </div>
      </div>

      <!-- Barra de progreso -->
      <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-accent-600 transition-all" style="width: {progress}%"></div>
      </div>

      <!-- Acciones -->
      <div class="grid grid-cols-3 gap-2 mt-3 print:hidden">
        <button class="btn-secondary py-2 text-xs" on:click={shareText}>📤 Compartir</button>
        <button class="btn-secondary py-2 text-xs" on:click={downloadCSV}>💾 CSV</button>
        <button class="btn-secondary py-2 text-xs" on:click={printList}>🖨️ Imprimir</button>
      </div>
    </div>

    <!-- Lista por categorías -->
    {#each CATEGORY_ORDER as cat}
      {@const items = list.itemsByCategory[cat] ?? []}
      {#if items.length > 0}
        <h3 class="section-title mt-5 mb-2">{categoryLabel(cat)}</h3>
        <div class="card p-2">
          <div class="space-y-0">
            {#each items as item, idx}
              {@const id = `${cat}-${item.ingredient.id}`}
              {@const checked = checkedItems.has(id)}
              <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg active:bg-slate-50 transition text-left"
                class:border-b={idx < items.length - 1}
                class:border-slate-100={idx < items.length - 1}
                on:click={() => toggleItem(id)}>
                <span class="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition"
                      class:bg-accent-600={checked}
                      class:border-accent-600={checked}
                      class:border-slate-300={!checked}>
                  {#if checked}<span class="text-white text-xs font-bold">✓</span>{/if}
                </span>
                <span class="flex-1 text-sm" class:line-through={checked} class:text-slate-400={checked}>
                  {item.ingredient.name}
                </span>
                <span class="font-mono text-sm font-bold tabular-nums"
                      class:text-slate-400={checked}>
                  {formatAmount(item.amount, item.ingredient.unit)}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {/each}

    {#if list.totalItems === 0}
      <div class="card text-center py-8 text-slate-500">
        Sin ingredientes en el plan. Añade recetas en <b>Nutrición</b> primero.
      </div>
    {/if}
  {/if}
</div>

<style>
  /* Al imprimir: oculta navs, marca checks, etc. */
  @media print {
    :global(aside), :global(nav) { display: none !important; }
  }
</style>
