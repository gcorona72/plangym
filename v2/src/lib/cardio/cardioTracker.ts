import { writable, derived, type Readable } from 'svelte/store';
import type { CardioType, RoutePoint } from '$lib/types';

/**
 * Tracker de cardio con GPS.
 *
 * Usa `navigator.geolocation.watchPosition` (API nativa del navegador,
 * funciona en PWAs sin librerías). Cada lectura del GPS se acumula como
 * RoutePoint y se va calculando la distancia con Haversine.
 *
 * Limitaciones de una PWA:
 *  - En segundo plano la captura se ralentiza/pausa cuando se bloquea la
 *    pantalla (limitación del SO, no del código). Para sesiones cortas con
 *    pantalla encendida funciona bien.
 *  - Mantener la pantalla activa: requestWakeLock cuando se inicia (best
 *    effort, no todos los navegadores lo soportan).
 */

export interface LiveCardioState {
  /** ¿Hay una sesión activa? */
  running: boolean;
  /** Pausada manualmente. */
  paused: boolean;
  type: CardioType;
  startedAt: number | null;     // epoch ms
  /** Suma de ms transcurridos (no incluye tiempo en pausa). */
  elapsedMs: number;
  route: RoutePoint[];
  distanceMeters: number;
  /** Última lectura cruda del GPS (puede tener mucho error si accuracy>30m). */
  lastFix: RoutePoint | null;
  /** Mensaje de error visible (permiso denegado, sin señal, etc). */
  error: string | null;
}

const INITIAL: LiveCardioState = {
  running: false,
  paused: false,
  type: 'walk',
  startedAt: null,
  elapsedMs: 0,
  route: [],
  distanceMeters: 0,
  lastFix: null,
  error: null
};

function createCardioTracker() {
  const { subscribe, update, set } = writable<LiveCardioState>(INITIAL);
  let watchId: number | null = null;
  let tickInterval: ReturnType<typeof setInterval> | null = null;
  let lastTickAt: number | null = null;
  let wakeLock: any = null;

  function startTick() {
    lastTickAt = Date.now();
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      update(s => {
        if (!s.running || s.paused) return s;
        const now = Date.now();
        const delta = lastTickAt ? now - lastTickAt : 0;
        lastTickAt = now;
        return { ...s, elapsedMs: s.elapsedMs + delta };
      });
    }, 1000);
  }

  function stopTick() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    lastTickAt = null;
  }

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {/* sin wake lock — peor pero no rompe */}
  }

  function releaseWakeLock() {
    try { wakeLock?.release(); } catch {/* noop */}
    wakeLock = null;
  }

  function startWatch() {
    if (!('geolocation' in navigator)) {
      update(s => ({ ...s, error: 'Geolocalización no disponible en este dispositivo.' }));
      return;
    }
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const fix: RoutePoint = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          t: new Date(pos.timestamp).toISOString(),
          speed: pos.coords.speed ?? undefined,
          accuracy: pos.coords.accuracy ?? undefined
        };
        update(s => {
          if (!s.running || s.paused) return { ...s, lastFix: fix };
          // Descartamos lecturas con error >50m (interior, pasillo de bloque)
          if (fix.accuracy != null && fix.accuracy > 50 && s.route.length > 0) {
            return { ...s, lastFix: fix };
          }
          const prev = s.route[s.route.length - 1];
          // Throttle: aceptamos un fix si ha pasado >=5s o si es el primero
          if (prev) {
            const dt = (new Date(fix.t).getTime() - new Date(prev.t).getTime()) / 1000;
            if (dt < 5) return { ...s, lastFix: fix };
          }
          const addDist = prev ? haversineMeters(prev.lat, prev.lon, fix.lat, fix.lon) : 0;
          // Descartamos "saltos" sospechosos (> 30 m/s = 108 km/h)
          if (prev) {
            const dt = (new Date(fix.t).getTime() - new Date(prev.t).getTime()) / 1000;
            if (dt > 0 && addDist / dt > 30) return { ...s, lastFix: fix };
          }
          return {
            ...s,
            route: [...s.route, fix],
            distanceMeters: s.distanceMeters + addDist,
            lastFix: fix,
            error: null
          };
        });
      },
      err => {
        const msg = err.code === err.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado. Habilítalo en los ajustes del navegador.'
          : err.code === err.POSITION_UNAVAILABLE
            ? 'Sin señal GPS. Sal a un lugar con vista al cielo.'
            : 'Error obteniendo ubicación: ' + err.message;
        update(s => ({ ...s, error: msg }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
    );
  }

  function stopWatch() {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  return {
    subscribe,

    /** Arranca una sesión nueva. Resetea estado. Para elíptica no abre GPS. */
    async start(type: CardioType) {
      set({ ...INITIAL, running: true, type, startedAt: Date.now() });
      startTick();
      acquireWakeLock();
      if (type !== 'elliptical') startWatch();
    },

    pause() {
      update(s => ({ ...s, paused: true }));
      lastTickAt = null;
    },

    resume() {
      lastTickAt = Date.now();
      update(s => ({ ...s, paused: false }));
    },

    /** Para la sesión sin guardarla (descartar). */
    discard() {
      stopWatch();
      stopTick();
      releaseWakeLock();
      set(INITIAL);
    },

    /** Para la sesión y devuelve el snapshot final (para guardar). */
    finish(): LiveCardioState {
      stopWatch();
      stopTick();
      releaseWakeLock();
      let snapshot!: LiveCardioState;
      update(s => { snapshot = { ...s, running: false }; return snapshot; });
      // Reseteamos el store tras un tick para que la pantalla de detalle pueda leer
      setTimeout(() => set(INITIAL), 0);
      return snapshot;
    },

    /** Para tests / casos extremos: permite setear distancia manual (elíptica). */
    setManualDistance(meters: number) {
      update(s => ({ ...s, distanceMeters: Math.max(0, meters) }));
    }
  };
}

export const cardioTracker = createCardioTracker();

// ─── HELPERS ──────────────────────────────────────────────────────────────

/** Distancia Haversine entre dos puntos GPS, en metros. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Distancia total de una ruta (m).
 */
export function routeDistanceMeters(route: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += haversineMeters(route[i - 1].lat, route[i - 1].lon, route[i].lat, route[i].lon);
  }
  return total;
}

/**
 * Calorías estimadas. Fórmula simple basada en MET (Metabolic Equivalent of Task):
 *   kcal = MET × peso_kg × horas
 *
 * MET por tipo (valores estándar Compendium of Physical Activities):
 *  - walk:       3.5 (caminar moderado ~5 km/h)
 *  - run:        9.8 (correr ~9 km/h)
 *  - bike:       7.5 (bici moderada)
 *  - elliptical: 5.0
 */
export function estimateKcal(type: CardioType, durationSeconds: number, weightKg: number): number {
  const MET: Record<CardioType, number> = { walk: 3.5, run: 9.8, bike: 7.5, elliptical: 5.0 };
  const hours = durationSeconds / 3600;
  return Math.round(MET[type] * weightKg * hours);
}

/** Formato "HH:MM:SS" o "MM:SS" si <1h. */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Formato "X,XX km" o "XXX m". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
}

/** Ritmo en "min/km" (solo tiene sentido para walk/run). */
export function formatPace(meters: number, seconds: number): string {
  if (meters < 50) return '—';
  const pace = (seconds / 60) / (meters / 1000); // min/km
  if (!isFinite(pace) || pace > 60) return '—';
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

export const liveDuration: Readable<string> = derived(cardioTracker, $t => formatDuration(Math.floor($t.elapsedMs / 1000)));
export const liveDistance: Readable<string> = derived(cardioTracker, $t => formatDistance($t.distanceMeters));
