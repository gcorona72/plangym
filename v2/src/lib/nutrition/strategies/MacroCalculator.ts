import type { UserProfile, DailyGoals } from '$lib/types';
import type { MacroStrategy } from './MacroStrategy';
import { EctomorphGainStrategy } from './EctomorphGainStrategy';
import { MaintenanceStrategy } from './MaintenanceStrategy';
import { CutStrategy } from './CutStrategy';
import { RecompStrategy } from './RecompStrategy';

/**
 * Contexto del patrón Strategy. Elige y ejecuta la estrategia adecuada.
 *
 * Prioridad de selección:
 *   1. profile.userPhase (recomp/volume/cut) — si está definida, manda
 *   2. profile.goal (gain/maintain/cut) — fallback clásico
 */
class MacroCalculatorImpl {
  private strategies = new Map<string, MacroStrategy>();

  constructor() {
    this.register(new EctomorphGainStrategy());
    this.register(new MaintenanceStrategy());
    this.register(new CutStrategy());
    this.register(new RecompStrategy());
  }

  register(strategy: MacroStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  listAll(): MacroStrategy[] {
    return Array.from(this.strategies.values());
  }

  private resolveStrategy(profile: UserProfile): MacroStrategy {
    // 1. Si hay userPhase definida → prioridad
    if (profile.userPhase) {
      const id = profile.userPhase === 'recomp' ? 'recomp'
              : profile.userPhase === 'volume' ? 'ectomorph_gain'
              : 'cut';
      return this.strategies.get(id) ?? this.strategies.get('maintenance')!;
    }
    // 2. Fallback: goal clásico
    const id = profile.goal === 'gain' ? 'ectomorph_gain'
             : profile.goal === 'cut'  ? 'cut'
             : 'maintenance';
    return this.strategies.get(id) ?? this.strategies.get('maintenance')!;
  }

  compute(profile: UserProfile, bmr: number, tdee: number): DailyGoals {
    const strategy = this.resolveStrategy(profile);
    return strategy.compute(profile, bmr, tdee);
  }
}

export const macroCalculator = new MacroCalculatorImpl();
