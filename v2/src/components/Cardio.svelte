<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '$stores/navigation';
  import { listCardioSessions } from '$lib/cardio/cardioRepository';
  import { formatDistance, formatDuration, cardioTracker } from '$lib/cardio/cardioTracker';
  import type { CardioSession, CardioType } from '$lib/types';

  let sessions: CardioSession[] = [];
  let loading = true;

  onMount(async () => {
    sessions = await listCardioSessions(50);
    loading = false;
  });

  const TYPE_META: Record<CardioType, { label: string; icon: string }> = {
    walk:       { label: 'Caminar',  icon: '🚶' },
    run:        { label: 'Correr',   icon: '🏃' },
    bike:       { label: 'Bici',     icon: '🚴' },
    elliptical: { label: 'Elíptica', icon: '🤖' }
  };

  let selectedType: CardioType = 'walk';

  function selectType(t: string) {
    selectedType = t as CardioType;
  }

  function startSession(type: CardioType) {
    cardioTracker.start(type);
    navigate('cardio_live');
  }

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-1">Cardio 🚴</h1>
  <p class="text-slate-500 text-sm mb-6">Captura la ruta con GPS o registra una sesión indoor.</p>

  <!-- Selector de tipo -->
  <div class="card mb-3">
    <h3 class="section-title mb-2">Tipo de actividad</h3>
    <div class="grid grid-cols-4 gap-2">
      {#each Object.entries(TYPE_META) as [t, meta]}
        <button class="py-3 rounded-xl border transition active:scale-95"
                class:bg-primary-600={selectedType === t}
                class:text-white={selectedType === t}
                class:border-primary-600={selectedType === t}
                class:bg-white={selectedType !== t}
                class:border-slate-200={selectedType !== t}
                on:click={() => selectType(t)}>
          <div class="text-2xl">{meta.icon}</div>
          <div class="text-[11px] font-semibold mt-1">{meta.label}</div>
        </button>
      {/each}
    </div>
    <p class="text-[10px] text-slate-500 mt-2">
      {#if selectedType === 'elliptical'}
        Modo indoor: el cronómetro corre, la distancia la introduces al terminar.
      {:else}
        Captura GPS cada ~5s. Mantén la pantalla encendida si puedes (el wake lock lo hace solo).
      {/if}
    </p>
  </div>

  <button class="btn-accent w-full py-4 text-lg mb-6" on:click={() => startSession(selectedType)}>
    ▶ Iniciar {TYPE_META[selectedType].label.toLowerCase()}
  </button>

  <!-- Historial -->
  <h2 class="section-title mb-2">Historial</h2>
  {#if loading}
    <div class="text-sm text-slate-500">Cargando…</div>
  {:else if sessions.length === 0}
    <div class="card text-sm text-slate-500 text-center py-6">
      Aún no hay sesiones. Pulsa "Iniciar" para registrar la primera.
    </div>
  {:else}
    <div class="space-y-2">
      {#each sessions as s (s.id)}
        {@const meta = TYPE_META[s.type]}
        <button class="card w-full text-left active:scale-[0.99] transition"
                on:click={() => navigate('cardio_detail', { id: s.id })}>
          <div class="flex items-center gap-3">
            <div class="text-3xl">{meta.icon}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-2">
                <div class="font-bold">{meta.label}</div>
                <div class="text-[11px] text-slate-500">{fmtDate(s.startedAt)}</div>
              </div>
              <div class="text-xs text-slate-600 mt-0.5">
                {formatDistance(s.distanceMeters)} · {formatDuration(s.durationSeconds)}
                {#if s.estimatedKcal}· ~{s.estimatedKcal} kcal{/if}
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
