import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { WorkoutSession } from '$lib/types';
import { toDateKey, startOfWeek, endOfWeek, addDays } from '$lib/dateUtils';

export class SessionRepository extends BaseRepository<WorkoutSession> {
  constructor() {
    super(db.sessions);
  }

  /** Sesiones entre dos fechas (inclusive). */
  async findBetween(start: string, end: string): Promise<WorkoutSession[]> {
    return this.table.where('date').between(start, end, true, true).toArray();
  }

  async findThisWeek(): Promise<WorkoutSession[]> {
    const start = toDateKey(startOfWeek(new Date()));
    const end = toDateKey(endOfWeek(new Date()));
    return this.findBetween(start, end);
  }

  async findLastWeek(): Promise<WorkoutSession[]> {
    const start = toDateKey(addDays(startOfWeek(new Date()), -7));
    const end = toDateKey(addDays(endOfWeek(new Date()), -7));
    return this.findBetween(start, end);
  }

  async findOnDate(date: string): Promise<WorkoutSession | undefined> {
    return this.table.where('date').equals(date).first();
  }

  /** Últimas N sesiones que contengan un ejercicio concreto. */
  async findRecentByExercise(exerciseId: string, limit: number = 3): Promise<WorkoutSession[]> {
    return this.table
      .orderBy('date')
      .reverse()
      .filter(s => s.exercises.some(e => e.exerciseId === exerciseId && !e.skipped && e.sets.length > 0))
      .limit(limit)
      .toArray();
  }

  async countCompleted(): Promise<number> {
    return this.table.filter(s => s.finishedAt != null).count();
  }
}

export const sessionRepository = new SessionRepository();
