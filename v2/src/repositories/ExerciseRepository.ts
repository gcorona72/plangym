import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { Exercise, GymEquipmentId, MuscleGroup, ExerciseModality } from '$lib/types';
import { canPerformExercise } from '$lib/training/exerciseFilter';

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor() {
    super(db.exercises);
  }

  async findByModality(modality: ExerciseModality): Promise<Exercise[]> {
    return this.table.where('modality').equals(modality).toArray();
  }

  async findByMuscle(muscle: MuscleGroup): Promise<Exercise[]> {
    return this.table.where('primaryMuscles').equals(muscle).toArray();
  }

  /** Ejercicios que el usuario puede hacer con su equipamiento. */
  async findAvailable(equipment: GymEquipmentId[], modality?: ExerciseModality): Promise<Exercise[]> {
    const all = modality ? await this.findByModality(modality) : await this.getAll();
    return all.filter(ex => canPerformExercise(ex, equipment));
  }

  /** Mapa id → ejercicio para lookup rápido. */
  async getMap(): Promise<Map<string, Exercise>> {
    const all = await this.getAll();
    return new Map(all.map(e => [e.id, e]));
  }
}

export const exerciseRepository = new ExerciseRepository();
