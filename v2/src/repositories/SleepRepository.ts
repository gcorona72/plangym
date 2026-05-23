import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { SleepEntry } from '$lib/types';

export class SleepRepository extends BaseRepository<SleepEntry> {
  constructor() {
    super(db.sleep);
  }

  async findRecent(limit: number = 14): Promise<SleepEntry[]> {
    return this.table.orderBy('date').reverse().limit(limit).toArray();
  }

  async getMostRecent(): Promise<SleepEntry | undefined> {
    return this.table.orderBy('date').reverse().first();
  }

  async findBetween(start: string, end: string): Promise<SleepEntry[]> {
    return this.table.where('date').between(start, end, true, true).toArray();
  }
}

export const sleepRepository = new SleepRepository();
