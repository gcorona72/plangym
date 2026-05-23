import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { TrainingProgram, TrainingDay } from '$lib/types';
import { isoDayOfWeek } from '$lib/dateUtils';

export class ProgramRepository extends BaseRepository<TrainingProgram> {
  constructor() {
    super(db.programs);
  }

  async getActive(): Promise<TrainingProgram | null> {
    return (await this.table.filter(p => p.active).first()) ?? null;
  }

  async setActive(id: string): Promise<void> {
    await db.transaction('rw', this.table, async () => {
      const all = await this.getAll();
      for (const p of all) {
        await this.update(p.id, { active: p.id === id });
      }
    });
  }

  /** Día del programa activo para una fecha concreta. */
  async getDayForDate(date: Date): Promise<TrainingDay | null> {
    const program = await this.getActive();
    if (!program) return null;
    return program.days[isoDayOfWeek(date)] ?? null;
  }
}

export const programRepository = new ProgramRepository();
