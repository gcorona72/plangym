<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from '$stores/navigation';
  import { profile } from '$stores/profile';
  import { cardioTracker, liveDuration, liveDistance, estimateKcal, formatPace } from '$lib/cardio/cardioTracker';
  import { saveCardioSession } from '$lib/cardio/cardioRepository';
  import type { CardioType } from '$lib/types';

  let mapEl: HTMLDivElement;
  let map: any = null;
  let polyline: any = null;
  let marker: any = null;
  let L: any = null;

  /** Distancia manual para elíptica (km, se introduce al finalizar). */
  let manualDistanceKm: number | null = null;

  $: state = $cardioTracker;
  $: isIndoor = state.type === 'elliptical';
  $: pace = formatPace(state.distanceMeters, Math.floor(state.elapsedMs / 1000));

  onMount(async () => {
    if (isIndoor) return;
    // Cargamos Leaflet dinámicamente (no se incluye en el bundle de la home)
    const mod = await import('leaflet');
    L = mod.default ?? mod;
    // Inyectamos el CSS de Leaflet una sola vez
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet-css', 'true');
      link.crossOrigin = '';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      document.head.appendChild(link);
    }
    // Esperamos un tick a que se aplique el CSS antes de inicializar
    setTimeout(initMap, 50);
  });

  function initMap() {
    if (!mapEl || !L) return;
    // Centro: último fix conocido, o coordenada por defecto (Madrid) si aún no hay
    const lastFix = state.lastFix ?? state.route[state.route.length - 1];
    const center: [number, number] = lastFix ? [lastFix.lat, lastFix.lon] : [40.4168, -3.7038];
    map = L.map(mapEl, { zoomControl: false, attributionControl: false }).setView(center, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    polyline = L.polyline([], { color: '#3b82f6', weight: 4, opacity: 0.85 }).addTo(map);
    if (lastFix) {
      marker = L.circleMarker([lastFix.lat, lastFix.lon], {
        radius: 7, color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 3
      }).addTo(map);
    }
  }

  // Actualizar polyline cuando llegan fixes
  $: if (map && polyline && state.route.length > 0) {
    const coords = state.route.map(p => [p.lat, p.lon]);
    polyline.setLatLngs(coords);
    const last = coords[coords.length - 1];
    if (marker) marker.setLatLng(last as [number, number]);
    else if (L) marker = L.circleMarker(last as [number, number], {
      radius: 7, color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 3
    }).addTo(map);
    // Auto-pan suave a la posición actual
    map.panTo(last as [number, number], { animate: true, duration: 0.5 });
  }

  onDestroy(() => {
    if (map) { map.remove(); map = null; }
  });

  async function finish() {
    const snapshot = cardioTracker.finish();
    const seconds = Math.floor(snapshot.elapsedMs / 1000);
    if (seconds < 5) {
      // Sesión demasiado corta — descartar
      navigate('cardio');
      return;
    }
    // Distancia: GPS o manual (elíptica)
    let distance = snapshot.distanceMeters;
    if (snapshot.type === 'elliptical' && manualDistanceKm != null && manualDistanceKm > 0) {
      distance = manualDistanceKm * 1000;
    }
    const weight = $profile?.weightKg ?? 70;
    const kcal = estimateKcal(snapshot.type, seconds, weight);
    const startedAt = new Date(snapshot.startedAt!).toISOString();
    const id = await saveCardioSession({
      type: snapshot.type,
      date: startedAt.split('T')[0],
      startedAt,
      finishedAt: new Date().toISOString(),
      durationSeconds: seconds,
      distanceMeters: distance,
      route: snapshot.route,
      estimatedKcal: kcal
    });
    navigate('cardio_detail', { id });
  }

  function discard() {
    if (!confirm('¿Descartar esta sesión sin guardar?')) return;
    cardioTracker.discard();
    navigate('cardio');
  }

  const TYPE_LABEL: Record<CardioType, string> = {
    walk: '🚶 Caminar', run: '🏃 Correr', bike: '🚴 Bici', elliptical: '🤖 Elíptica'
  };
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="px-5 pt-6 pb-3 bg-white border-b">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm font-semibold">{TYPE_LABEL[state.type]}</div>
      <div class="flex items-center gap-2">
        {#if state.paused}
          <span class="text-[10px] uppercase font-bold tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pausa</span>
        {:else}
          <span class="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">● En vivo</span>
        {/if}
      </div>
    </div>

    <!-- Stats grandes -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Tiempo</div>
        <div class="text-2xl font-bold font-mono tabular-nums">{$liveDuration}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">Distancia</div>
        <div class="text-2xl font-bold font-mono tabular-nums">{$liveDistance}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-500 uppercase tracking-wider">{state.type === 'bike' ? 'Velocidad' : 'Ritmo'}</div>
        <div class="text-2xl font-bold font-mono tabular-nums">{pace}</div>
      </div>
    </div>

    {#if state.error}
      <div class="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
        {state.error}
      </div>
    {/if}
  </header>

  <!-- Mapa / panel indoor -->
  <div class="flex-1 relative bg-slate-100">
    {#if isIndoor}
      <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div class="text-6xl mb-3">🤖</div>
        <div class="font-bold text-lg">Sesión indoor</div>
        <p class="text-sm text-slate-500 mt-1 max-w-xs">Sin GPS. Cuando termines podrás meter la distancia y se calcularán las kcal.</p>
      </div>
    {:else}
      <div bind:this={mapEl} class="absolute inset-0 z-0"></div>
      {#if state.route.length === 0 && !state.error}
        <div class="absolute top-3 left-3 right-3 bg-white/95 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 shadow z-[1000]">
          🛰️ Esperando señal GPS… (puede tardar 10-30s)
        </div>
      {/if}
    {/if}
  </div>

  <!-- Controles inferiores -->
  <div class="bg-white border-t px-5 py-4 safe-bottom">
    {#if isIndoor && state.elapsedMs > 5000}
      <div class="mb-3">
        <label class="label" for="manual-dist">Distancia (km, opcional)</label>
        <input id="manual-dist" type="number" step="0.01" min="0" bind:value={manualDistanceKm}
               class="input" placeholder="Ej: 5.2" />
      </div>
    {/if}
    <div class="grid grid-cols-3 gap-2">
      <button class="btn-secondary text-red-600 border-red-200" on:click={discard}>
        ✕ Descartar
      </button>
      {#if state.paused}
        <button class="btn-primary col-span-1" on:click={() => cardioTracker.resume()}>
          ▶ Reanudar
        </button>
      {:else}
        <button class="btn-secondary col-span-1" on:click={() => cardioTracker.pause()}>
          ⏸ Pausar
        </button>
      {/if}
      <button class="btn-accent" on:click={finish}>
        ⏹ Finalizar
      </button>
    </div>
  </div>
</div>
