<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { routeParams, navigate } from '$stores/navigation';
  import { getCardioSession, deleteCardioSession } from '$lib/cardio/cardioRepository';
  import { formatDistance, formatDuration, formatPace } from '$lib/cardio/cardioTracker';
  import type { CardioSession, CardioType } from '$lib/types';

  let session: CardioSession | null = null;
  let loading = true;
  let mapEl: HTMLDivElement;
  let map: any = null;
  let L: any = null;

  const TYPE_META: Record<CardioType, { label: string; icon: string }> = {
    walk:       { label: 'Caminar',  icon: '🚶' },
    run:        { label: 'Correr',   icon: '🏃' },
    bike:       { label: 'Bici',     icon: '🚴' },
    elliptical: { label: 'Elíptica', icon: '🤖' }
  };

  onMount(async () => {
    const id = $routeParams.id;
    if (!id) { navigate('cardio'); return; }
    session = (await getCardioSession(id)) ?? null;
    loading = false;
    if (session && session.route.length >= 2) await initMap(session);
  });

  async function initMap(s: CardioSession) {
    const mod = await import('leaflet');
    L = mod.default ?? mod;
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet-css', 'true');
      link.crossOrigin = '';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      document.head.appendChild(link);
    }
    setTimeout(() => {
      if (!mapEl) return;
      const coords = s.route.map(p => [p.lat, p.lon]) as [number, number][];
      map = L.map(mapEl, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      const poly = L.polyline(coords, { color: '#3b82f6', weight: 4, opacity: 0.85 }).addTo(map);
      // Marcadores inicio/fin
      L.circleMarker(coords[0], { radius: 7, color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 3 })
        .bindTooltip('Inicio').addTo(map);
      L.circleMarker(coords[coords.length - 1], { radius: 7, color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 3 })
        .bindTooltip('Fin').addTo(map);
      map.fitBounds(poly.getBounds(), { padding: [20, 20] });
    }, 50);
  }

  onDestroy(() => { if (map) { map.remove(); map = null; } });

  async function remove() {
    if (!session) return;
    if (!confirm('¿Borrar esta sesión? No se puede deshacer.')) return;
    await deleteCardioSession(session.id);
    navigate('cardio');
  }

  function fmtDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <button class="text-sm text-slate-500 mb-3" on:click={() => navigate('cardio')}>← Volver</button>

  {#if loading}
    <div class="text-sm text-slate-500">Cargando…</div>
  {:else if !session}
    <div class="card text-sm">Sesión no encontrada.</div>
  {:else}
    {@const meta = TYPE_META[session.type]}
    <div class="flex items-start gap-3 mb-4">
      <div class="text-4xl">{meta.icon}</div>
      <div class="flex-1">
        <h1 class="text-2xl font-bold leading-tight">{meta.label}</h1>
        <div class="text-sm text-slate-500">{fmtDateTime(session.startedAt)}</div>
      </div>
    </div>

    <!-- Stats principales -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div class="card-compact text-center">
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Distancia</div>
        <div class="text-xl font-bold font-mono">{formatDistance(session.distanceMeters)}</div>
      </div>
      <div class="card-compact text-center">
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Tiempo</div>
        <div class="text-xl font-bold font-mono">{formatDuration(session.durationSeconds)}</div>
      </div>
      <div class="card-compact text-center">
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">{session.type === 'bike' ? 'Vel.' : 'Ritmo'}</div>
        <div class="text-xl font-bold font-mono">{formatPace(session.distanceMeters, session.durationSeconds)}</div>
      </div>
    </div>

    {#if session.estimatedKcal != null}
      <div class="card-feature mb-4">
        <div class="text-sm">
          🔥 <b class="font-mono">{session.estimatedKcal}</b> kcal estimadas
          <span class="text-xs text-slate-500">(MET × peso × duración)</span>
        </div>
      </div>
    {/if}

    {#if session.route.length >= 2}
      <div class="card mb-4 p-0 overflow-hidden">
        <div bind:this={mapEl} class="w-full h-72"></div>
      </div>
    {:else if session.type !== 'elliptical'}
      <div class="card mb-4 text-sm text-slate-500">
        No se capturaron suficientes puntos GPS para dibujar una ruta.
      </div>
    {/if}

    {#if session.notes}
      <div class="card mb-4">
        <h3 class="section-title mb-1">Notas</h3>
        <p class="text-sm whitespace-pre-line">{session.notes}</p>
      </div>
    {/if}

    <button class="btn-secondary w-full text-red-600 border-red-200" on:click={remove}>
      🗑️ Borrar sesión
    </button>
  {/if}
</div>
