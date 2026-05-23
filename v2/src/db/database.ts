import Dexie, { type Table } from 'dexie';
import type {
  UserProfile,
  Exercise,
  TrainingProgram,
  WorkoutSession,
  Ingredient,
  Recipe,
  DailyMealLog,
  SleepEntry,
  AppSettings,
  WeightLog
} from '$lib/types';

/**
 * Base de datos local (IndexedDB) via Dexie.
 * Toda la app es local-first. No hay backend.
 *
 * Para hacer backup → Settings → "Exportar datos" descarga JSON.
 * Para restaurar → Settings → "Importar datos" carga JSON.
 */
class PlanGymDB extends Dexie {
  profile!: Table<UserProfile, number>;
  settings!: Table<AppSettings, number>;
  exercises!: Table<Exercise, string>;
  programs!: Table<TrainingProgram, string>;
  sessions!: Table<WorkoutSession, string>;
  ingredients!: Table<Ingredient, string>;
  recipes!: Table<Recipe, string>;
  mealLogs!: Table<DailyMealLog, string>;
  sleep!: Table<SleepEntry, string>;
  weightLogs!: Table<WeightLog, string>;

  constructor() {
    super('PlanGymDB');

    this.version(1).stores({
      profile: 'id, updatedAt',
      settings: 'id',
      exercises: 'id, modality, *primaryMuscles, *requiredEquipment',
      programs: 'id, active, createdAt',
      sessions: 'id, date, programId, dayId, modality',
      ingredients: 'id, category',
      recipes: 'id, *mealTypes, custom, *tags',
      mealLogs: 'id, date',
      sleep: 'id, date'
    });
    // v2: añade tabla de pesos
    this.version(2).stores({
      weightLogs: 'id, date'
    });
  }
}

export const db = new PlanGymDB();

/**
 * Listeners de cambios — usados por cloudSync para detectar cuándo subir.
 * En vez de hooks por tabla (complejo y ruidoso), exponemos un trigger global.
 */
type ChangeListener = () => void;
const changeListeners = new Set<ChangeListener>();

export function onDataChange(fn: ChangeListener): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

export function emitDataChange(): void {
  for (const fn of changeListeners) {
    try { fn(); } catch (e) { console.error('change listener error', e); }
  }
}

// Hookeamos las tablas que cambian con frecuencia
for (const table of [db.profile, db.sessions, db.mealLogs, db.sleep, db.weightLogs, db.recipes]) {
  // Dexie permite hooks pero los hooks corren dentro de la transacción.
  // Disparamos `emitDataChange` después de commitear via setTimeout(0).
  (table as any).hook('creating', () => { setTimeout(emitDataChange, 0); });
  (table as any).hook('updating', () => { setTimeout(emitDataChange, 0); });
  (table as any).hook('deleting', () => { setTimeout(emitDataChange, 0); });
}

/**
 * Helper: ¿la app ya tiene perfil de usuario configurado?
 * Sirve para decidir si mostrar onboarding o la app normal.
 */
export async function hasProfile(): Promise<boolean> {
  const p = await db.profile.get(1);
  return p != null;
}

/**
 * Exporta todos los datos como JSON para backup.
 */
export async function exportAllData(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await db.profile.toArray(),
    settings: await db.settings.toArray(),
    exercises: await db.exercises.toArray(),
    programs: await db.programs.toArray(),
    sessions: await db.sessions.toArray(),
    ingredients: await db.ingredients.toArray(),
    recipes: await db.recipes.toArray(),
    mealLogs: await db.mealLogs.toArray(),
    sleep: await db.sleep.toArray(),
    weightLogs: await db.weightLogs.toArray()
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Importa datos desde un JSON exportado previamente.
 * SOBRESCRIBE los datos actuales. Pedir confirmación antes de llamar.
 */
export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object' || data.version !== 1) {
    throw new Error('Formato de backup inválido o versión incompatible.');
  }

  await db.transaction(
    'rw',
    [db.profile, db.settings, db.exercises, db.programs, db.sessions,
     db.ingredients, db.recipes, db.mealLogs, db.sleep, db.weightLogs],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.settings.clear(),
        db.exercises.clear(),
        db.programs.clear(),
        db.sessions.clear(),
        db.ingredients.clear(),
        db.recipes.clear(),
        db.mealLogs.clear(),
        db.sleep.clear(),
        db.weightLogs.clear()
      ]);

      if (Array.isArray(data.profile)) await db.profile.bulkAdd(data.profile);
      if (Array.isArray(data.settings)) await db.settings.bulkAdd(data.settings);
      if (Array.isArray(data.exercises)) await db.exercises.bulkAdd(data.exercises);
      if (Array.isArray(data.programs)) await db.programs.bulkAdd(data.programs);
      if (Array.isArray(data.sessions)) await db.sessions.bulkAdd(data.sessions);
      if (Array.isArray(data.ingredients)) await db.ingredients.bulkAdd(data.ingredients);
      if (Array.isArray(data.recipes)) await db.recipes.bulkAdd(data.recipes);
      if (Array.isArray(data.mealLogs)) await db.mealLogs.bulkAdd(data.mealLogs);
      if (Array.isArray(data.sleep)) await db.sleep.bulkAdd(data.sleep);
      if (Array.isArray(data.weightLogs)) await db.weightLogs.bulkAdd(data.weightLogs);
    }
  );
}

/**
 * Borra TODO. Usar con cuidado. Sirve para "reset de fábrica" en settings.
 */
export async function wipeAllData(): Promise<void> {
  await db.delete();
  await db.open();
}
