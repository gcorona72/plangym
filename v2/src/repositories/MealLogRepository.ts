import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { DailyMealLog, MealEntry, MealType } from '$lib/types';
import { toDateKey, startOfWeek, endOfWeek } from '$lib/dateUtils';
import { eventBus } from '$lib/events/EventBus';

export class MealLogRepository extends BaseRepository<DailyMealLog> {
  constructor() {
    super(db.mealLogs);
  }

  /** Obtiene (o crea en memoria) el log de un día. */
  async getOrCreateForDate(date: string): Promise<DailyMealLog> {
    const id = `log_${date}`;
    const existing = await this.getById(id);
    return existing ?? { id, date, meals: [] };
  }

  async findBetween(start: string, end: string): Promise<DailyMealLog[]> {
    return this.table.where('date').between(start, end, true, true).toArray();
  }

  async findThisWeek(): Promise<DailyMealLog[]> {
    const s = toDateKey(startOfWeek(new Date()));
    const e = toDateKey(endOfWeek(new Date()));
    return this.findBetween(s, e);
  }

  /** Añade una comida a un día y emite el evento. */
  async logMeal(date: string, meal: MealEntry): Promise<void> {
    const log = await this.getOrCreateForDate(date);
    // Reemplazar si ya hay una entrada del mismo tipo
    log.meals = log.meals.filter(m => m.type !== meal.type);
    log.meals.push(meal);
    await this.upsert(log);
    eventBus.emit('meal.logged', { meal, date });
  }

  async removeMeal(date: string, type: MealType): Promise<void> {
    const log = await this.getById(`log_${date}`);
    if (!log) return;
    log.meals = log.meals.filter(m => m.type !== type);
    await this.upsert(log);
  }
}

export const mealLogRepository = new MealLogRepository();
