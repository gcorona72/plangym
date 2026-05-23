import { writable, derived, type Readable } from 'svelte/store';
import { TimerContext } from './timerStates';

/**
 * Store del timer de descanso.
 *
 * Internamente usa el patrón State (ver `timerStates.ts`) — las transiciones
 * y reglas viven en clases separadas. Aquí solo orquestamos el bucle del
 * tick y emitimos el snapshot al store de Svelte.
 *
 * La API pública (`start`, `stop`, `pause`, `resume`, `addSeconds`,
 * `$restTimer.running`, `$restTimer.remainingSeconds`, …) se mantiene
 * compatible con los componentes existentes.
 */

interface TimerStoreShape {
  running: boolean;        // true si está corriendo (no idle/paused/finished)
  paused: boolean;         // true si está pausado
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
}

function snapshotFromContext(ctx: TimerContext): TimerStoreShape {
  const snap = ctx.snapshot();
  return {
    running: snap.state === 'running',
    paused: snap.state === 'paused',
    totalSeconds: snap.totalSeconds,
    remainingSeconds: snap.remainingSeconds,
    startedAt: ctx.startedAt
  };
}

function createRestTimer() {
  const ctx = new TimerContext();
  const initial: TimerStoreShape = snapshotFromContext(ctx);
  const { subscribe, set } = writable<TimerStoreShape>(initial);
  let interval: ReturnType<typeof setInterval> | null = null;

  // Hooks del contexto: actualizan el store de Svelte cada vez que el estado cambia
  ctx.onChange = () => set(snapshotFromContext(ctx));
  ctx.onFinish = () => {
    set(snapshotFromContext(ctx));
    notifyFinished();
    stopInterval();
  };

  function ensureInterval() {
    if (interval) return;
    interval = setInterval(() => ctx.tick(), 250);
  }
  function stopInterval() {
    if (interval) { clearInterval(interval); interval = null; }
  }

  return {
    subscribe,
    start(seconds: number) {
      ctx.start(seconds);
      ensureInterval();
    },
    stop() {
      ctx.stop();
      stopInterval();
    },
    pause() {
      ctx.pause();
      stopInterval();
    },
    resume() {
      ctx.resume();
      ensureInterval();
    },
    addSeconds(delta: number) {
      ctx.addSeconds(delta);
    }
  };
}

export const restTimer = createRestTimer();

// ─── Notificación (vibración + beep) ──────────────────────────────────────
let lastNotified = 0;
function notifyFinished() {
  const now = Date.now();
  if (now - lastNotified < 2000) return;
  lastNotified = now;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }
  playBeep();
}
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // silencio
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const formattedTime: Readable<string> = derived(restTimer, $t => formatTime($t.remainingSeconds));
