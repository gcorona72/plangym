<script lang="ts">
  import { SUPPLEMENTS, FAQS, type Supplement, type FAQ } from '$lib/knowledgeBase';
  import { computeCycleStatus, cycleStatusMessage } from '$lib/training/cycle';
  import { profile } from '$stores/profile';

  let activeTab: 'cycle' | 'supplements' | 'faq' = 'cycle';

  $: cycle = computeCycleStatus($profile?.cycleStartDate);

  function badge(p: Supplement['priority']): string {
    if (p === 'essential') return 'bg-emerald-100 text-emerald-700';
    if (p === 'recommended') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  }
  function badgeLabel(p: Supplement['priority']): string {
    return p === 'essential' ? 'Esencial' : p === 'recommended' ? 'Recomendado' : 'Opcional';
  }

  function categoryEmoji(c: FAQ['category']): string {
    return c === 'nutrition' ? '🥗' : c === 'training' ? '🏋️' : c === 'sleep' ? '🛌' : '💡';
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-1">Tu guía 💡</h1>
  <p class="text-slate-500 text-sm mb-5">Ciclo, suplementación y dudas frecuentes.</p>

  <div class="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200">
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
            class:bg-primary-600={activeTab === 'cycle'}
            class:text-white={activeTab === 'cycle'}
            class:text-slate-500={activeTab !== 'cycle'}
            on:click={() => activeTab = 'cycle'}>📅 Ciclo</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
            class:bg-primary-600={activeTab === 'supplements'}
            class:text-white={activeTab === 'supplements'}
            class:text-slate-500={activeTab !== 'supplements'}
            on:click={() => activeTab = 'supplements'}>💊 Suplementos</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition"
            class:bg-primary-600={activeTab === 'faq'}
            class:text-white={activeTab === 'faq'}
            class:text-slate-500={activeTab !== 'faq'}
            on:click={() => activeTab = 'faq'}>❓ FAQ</button>
  </div>

  {#if activeTab === 'cycle'}
    <!-- Ciclo de 12 semanas -->
    <div class="card-feature mb-4"
         class:ring-2={cycle.isDeloadWeek}
         class:ring-orange-400={cycle.isDeloadWeek}>
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">{cycle.isDeloadWeek ? '🔻' : '📈'}</span>
        <div>
          <div class="font-bold text-lg">Semana {cycle.currentWeek} de 12</div>
          {#if cycle.isDeloadWeek}
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">DESCARGA</span>
          {/if}
        </div>
      </div>
      <p class="text-sm text-slate-700 mt-2">{cycleStatusMessage(cycle)}</p>

      <!-- Barra de progreso del ciclo -->
      <div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-primary-500 transition-all" style="width: {(cycle.currentWeek / 12) * 100}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>Semana 1</span>
        <span>Deload 6</span>
        <span>Deload 12</span>
      </div>
    </div>

    <!-- Cómo funciona el ciclo -->
    <div class="card mb-4">
      <h3 class="section-title mb-2">Cómo funciona el ciclo</h3>
      <ul class="space-y-2 text-sm">
        <li class="flex gap-2"><span class="text-accent-600">▸</span><div><b>Semanas 1-5:</b> Acumulación. Subir carga 2.5-5% o +1-2 reps cada semana, RIR 1-3.</div></li>
        <li class="flex gap-2"><span class="text-orange-500">▸</span><div><b>Semana 6 — Descarga:</b> Reduce el volumen a la mitad e intensidad un 20%. Misma frecuencia.</div></li>
        <li class="flex gap-2"><span class="text-accent-600">▸</span><div><b>Semanas 7-11:</b> Acumulación + intensificación. Intenta superar tus marcas previas.</div></li>
        <li class="flex gap-2"><span class="text-orange-500">▸</span><div><b>Semana 12 — Descarga + evaluación:</b> Descarga y evaluación. Mide progreso, ajusta calorías, nuevo ciclo.</div></li>
      </ul>
    </div>

    <!-- Tasa de ganancia esperada -->
    {#if $profile}
      <div class="card mb-4">
        <h3 class="section-title mb-2">Tu tasa de ganancia esperada</h3>
        <p class="text-sm text-slate-700">
          Sano: <b>0.25% – 0.6% del peso corporal por semana</b>.
        </p>
        <p class="text-sm font-mono mt-2">
          Para ti ({$profile.weightKg} kg): <b>{Math.round($profile.weightKg * 0.0025 * 1000)} g</b> – <b>{Math.round($profile.weightKg * 0.006 * 1000)} g</b> por semana.
        </p>
        <p class="text-xs text-slate-500 mt-2">Más rápido = más grasa. Más lento = sin progreso.</p>
      </div>
    {/if}

  {:else if activeTab === 'supplements'}
    <p class="text-xs text-slate-500 mb-4">⚠️ Antes de empezar cualquier suplementación, consulta con un médico si tienes alguna condición de salud.</p>
    <div class="space-y-3">
      {#each SUPPLEMENTS as s}
        <div class="card">
          <div class="flex items-start gap-3 mb-2">
            <span class="text-3xl">{s.emoji}</span>
            <div class="flex-1">
              <div class="font-bold">{s.name}</div>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block {badge(s.priority)}">
                {badgeLabel(s.priority)}
              </span>
            </div>
          </div>
          <div class="text-sm space-y-1 mt-2">
            <div><span class="text-slate-500 font-semibold">Dosis:</span> {s.dose}</div>
            <div><span class="text-slate-500 font-semibold">Cuándo:</span> {s.when}</div>
            <div class="text-slate-700"><span class="text-slate-500 font-semibold">Por qué:</span> {s.why}</div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- FAQ -->
    <div class="space-y-3">
      {#each FAQS as faq}
        <details class="card">
          <summary class="flex items-center gap-2 cursor-pointer font-semibold">
            <span class="text-2xl">{faq.emoji}</span>
            <span class="flex-1">{faq.question}</span>
            <span class="text-[10px] text-slate-400 uppercase">{categoryEmoji(faq.category)}</span>
          </summary>
          <p class="text-sm text-slate-700 mt-3 leading-relaxed">{faq.answer}</p>
        </details>
      {/each}
    </div>
  {/if}
</div>
