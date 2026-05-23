import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { WeightLog } from '$lib/types';
import { eventBus } from '$lib/events/EventBus';
import { computeWeeklyAverages, type WeeklyAvg } from '$lib/training/weightProgress';

export class WeightLogRepository extends BaseRepository<WeightLog> {
  constructor() {
    super(db.weightLogs);
  }

  async findRecent(limit: number = 60): Promise<WeightLog[]> {
    return this.table.orderBy('date').reverse().limit(limit).toArray();
  }

  async getMostRecent(): Promise<WeightLog | undefined> {
    return this.table.orderBy('date').reverse().first();
  }

  async log(weightKg: number, date: string, notes?: string): Promise<WeightLog> {
    const entry: WeightLog = {
      id: `w_${date}_${Date.now().toString(36)}`,
      date,
      weightKg,
      notes,
      createdAt: new Date().toISOString()
    };
    await this.create(entry);
    eventBus.emit('weight.logged', { log: entry });
    return entry;
  }

  async weeklyAverages(): Promise<WeeklyAvg[]> {
    const logs = await this.getAll();
    return computeWeeklyAverages(logs);
  }
}

export const weightLogRepository = new WeightLogRepository();
