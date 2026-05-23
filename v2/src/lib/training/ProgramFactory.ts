import type { UserProfile, TrainingProgram } from '$lib/types';
import { DEFAULT_PROGRAM, BEGINNER_PROGRAM, PPLT_4DAYS_PROGRAM } from '$db/seeds/programs';

/**
 * Factory para recomendar / seleccionar un programa de entrenamiento
 * basado en el perfil del usuario.
 *
 * Reglas (sencillas, ajustables):
 *  - Si el usuario indica preferencia o sin experiencia previa → Beginner Full Body 3 días
 *  - Si entrena 4 días y prefiere split clásico → PPL + Torso (default)
 *  - Si entrena 4 días pero quiere frecuencia alta → Upper/Lower
 *  - Si entrena 5+ días → PPL + Torso (más volumen)
 */

export interface ProgramRecommendation {
  program: TrainingProgram;
  reason: string;
}

export class ProgramFactory {
  /** Devuelve todos los programas disponibles (para que el usuario elija). */
  static listAll(): TrainingProgram[] {
    return [PPLT_4DAYS_PROGRAM, DEFAULT_PROGRAM, BEGINNER_PROGRAM];
  }

  /** Programa recomendado para el perfil. */
  static recommendForUser(profile: UserProfile): ProgramRecommendation {
    const days = profile.trainingDaysPerWeek ?? 4;
    const pref = profile.trainingPreference;

    // 2-3 días por semana → principiante
    if (days <= 3) {
      return {
        program: BEGINNER_PROGRAM,
        reason: 'Pocos días de entreno: programa Full Body 3 días con alta frecuencia es óptimo para principiantes/intermedios.'
      };
    }

    // Calistenia pura → PPL + Torso funciona bien con sus alternativas
    if (pref === 'calisthenics') {
      return {
        program: PPLT_4DAYS_PROGRAM,
        reason: 'Calistenia preferida: el split Push/Pull/Pierna/Torso ofrece alternativas calistenia para cada día.'
      };
    }

    // 5+ días con frecuencia alta deseada → Upper/Lower
    if (days >= 5) {
      return {
        program: DEFAULT_PROGRAM,
        reason: 'Entrenas 5+ días: Upper/Lower 4 días con frecuencia 2× semana por grupo maximiza hipertrofia.'
      };
    }

    // Por defecto: 4 días → PPL + Torso
    return {
      program: PPLT_4DAYS_PROGRAM,
      reason: 'Entrenamiento equilibrado: PPL + Torso es el split clásico para 4 días, cada grupo trabaja 1-1.5× semana.'
    };
  }

  /** Útil para evaluar un programa ya guardado vs lo recomendado. */
  static isRecommendedFor(programId: string, profile: UserProfile): boolean {
    return this.recommendForUser(profile).program.id === programId;
  }
}
