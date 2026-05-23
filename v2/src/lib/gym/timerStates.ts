/**
 * State pattern para el timer de descanso.
 *
 * El timer puede estar en uno de varios estados (idle / running / paused /
 * finished). Cada estado define qué acciones son válidas y cómo se transita
 * a otros estados — evitando un `switch(status)` con docenas de casos.
 */

export interface TimerSnapshot {
  state: 'idle' | 'running' | 'paused' | 'finished';
  totalSeconds: number;
  remainingSeconds: number;
}

/**
 * Contrato común. Cada estado implementa sus transiciones; las acciones
 * inválidas son no-ops (no lanzan excepción para no romper la UI).
 */
export interface TimerStateLogic {
  readonly name: TimerSnapshot['state'];

  /** Cuando el contexto inicia un nuevo timer. */
  start(ctx: TimerContext, seconds: number): void;
  /** Cuando el contexto pulsa pausa. */
  pause(ctx: TimerContext): void;
  /** Cuando el contexto pulsa reanudar. */
  resume(ctx: TimerContext): void;
  /** Cuando el contexto cancela el timer. */
  stop(ctx: TimerContext): void;
  /** Tick (cada 250 ms). Devuelve los segundos restantes. */
  tick(ctx: TimerContext, nowMs: number): number;
  /** Suma/resta segundos al total (botones +15s / -15s). */
  addSeconds(ctx: TimerContext, delta: number): void;
}

/**
 * Contexto del patrón: guarda el estado actual y permite cambiarlo.
 * Es un agregador de datos que cada estado modifica.
 */
export class TimerContext {
  private _state: TimerStateLogic = new IdleState();
  totalSeconds = 0;
  remainingSeconds = 0;
  /** Timestamp de cuando arrancó el segmento actual (para calcular elapsed). */
  startedAt: number | null = null;
  /** Cuando se pausó, cuántos segundos quedaban — para reanudar bien. */
  pausedRemaining: number = 0;
  /** Callback que se dispara cuando el timer llega a 0. */
  onFinish: () => void = () => {};
  /** Callback con cada cambio (para que el store de Svelte notifique a la UI). */
  onChange: () => void = () => {};

  get state(): TimerStateLogic { return this._state; }

  /** Solo accesible desde dentro de un estado: transicionar a otro. */
  transitionTo(state: TimerStateLogic): void {
    this._state = state;
    this.onChange();
  }

  snapshot(): TimerSnapshot {
    return {
      state: this._state.name,
      totalSeconds: this.totalSeconds,
      remainingSeconds: this.remainingSeconds
    };
  }

  // Métodos de fachada — delegan en el estado actual
  start(seconds: number): void { this._state.start(this, seconds); }
  pause(): void { this._state.pause(this); }
  resume(): void { this._state.resume(this); }
  stop(): void { this._state.stop(this); }
  tick(nowMs: number = Date.now()): number { return this._state.tick(this, nowMs); }
  addSeconds(delta: number): void { this._state.addSeconds(this, delta); }
}

// ─── ESTADO: IDLE ─────────────────────────────────────────────────────────
export class IdleState implements TimerStateLogic {
  readonly name = 'idle' as const;
  start(ctx: TimerContext, seconds: number): void {
    ctx.totalSeconds = seconds;
    ctx.remainingSeconds = seconds;
    ctx.startedAt = Date.now();
    ctx.pausedRemaining = 0;
    ctx.transitionTo(new RunningState());
  }
  pause(): void { /* no-op */ }
  resume(): void { /* no-op */ }
  stop(): void { /* no-op */ }
  tick(): number { return 0; }
  addSeconds(): void { /* no-op */ }
}

// ─── ESTADO: RUNNING ──────────────────────────────────────────────────────
export class RunningState implements TimerStateLogic {
  readonly name = 'running' as const;
  start(ctx: TimerContext, seconds: number): void {
    // Permitir reiniciar con un nuevo tiempo
    ctx.totalSeconds = seconds;
    ctx.remainingSeconds = seconds;
    ctx.startedAt = Date.now();
    ctx.onChange();
  }
  pause(ctx: TimerContext): void {
    ctx.pausedRemaining = ctx.remainingSeconds;
    ctx.transitionTo(new PausedState());
  }
  resume(): void { /* ya running */ }
  stop(ctx: TimerContext): void {
    ctx.totalSeconds = 0;
    ctx.remainingSeconds = 0;
    ctx.startedAt = null;
    ctx.transitionTo(new IdleState());
  }
  tick(ctx: TimerContext, nowMs: number): number {
    if (ctx.startedAt == null) return ctx.remainingSeconds;
    const elapsed = Math.floor((nowMs - ctx.startedAt) / 1000);
    const remaining = Math.max(ctx.totalSeconds - elapsed, 0);
    ctx.remainingSeconds = remaining;
    if (remaining === 0) {
      ctx.transitionTo(new FinishedState());
      ctx.onFinish();
    } else {
      ctx.onChange();
    }
    return remaining;
  }
  addSeconds(ctx: TimerContext, delta: number): void {
    ctx.totalSeconds = Math.max(ctx.totalSeconds + delta, 1);
    ctx.onChange();
  }
}

// ─── ESTADO: PAUSED ───────────────────────────────────────────────────────
export class PausedState implements TimerStateLogic {
  readonly name = 'paused' as const;
  start(ctx: TimerContext, seconds: number): void {
    // Reiniciar
    ctx.totalSeconds = seconds;
    ctx.remainingSeconds = seconds;
    ctx.startedAt = Date.now();
    ctx.pausedRemaining = 0;
    ctx.transitionTo(new RunningState());
  }
  pause(): void { /* ya pausado */ }
  resume(ctx: TimerContext): void {
    // Reanudar usando los segundos restantes guardados
    ctx.totalSeconds = ctx.pausedRemaining;
    ctx.remainingSeconds = ctx.pausedRemaining;
    ctx.startedAt = Date.now();
    ctx.transitionTo(new RunningState());
  }
  stop(ctx: TimerContext): void {
    ctx.totalSeconds = 0;
    ctx.remainingSeconds = 0;
    ctx.startedAt = null;
    ctx.pausedRemaining = 0;
    ctx.transitionTo(new IdleState());
  }
  tick(_ctx: TimerContext): number { return _ctx.remainingSeconds; }
  addSeconds(ctx: TimerContext, delta: number): void {
    ctx.pausedRemaining = Math.max(ctx.pausedRemaining + delta, 1);
    ctx.remainingSeconds = ctx.pausedRemaining;
    ctx.onChange();
  }
}

// ─── ESTADO: FINISHED ─────────────────────────────────────────────────────
export class FinishedState implements TimerStateLogic {
  readonly name = 'finished' as const;
  start(ctx: TimerContext, seconds: number): void {
    ctx.totalSeconds = seconds;
    ctx.remainingSeconds = seconds;
    ctx.startedAt = Date.now();
    ctx.transitionTo(new RunningState());
  }
  pause(): void { /* no-op */ }
  resume(): void { /* no-op */ }
  stop(ctx: TimerContext): void {
    ctx.totalSeconds = 0;
    ctx.remainingSeconds = 0;
    ctx.transitionTo(new IdleState());
  }
  tick(): number { return 0; }
  addSeconds(): void { /* no-op */ }
}
