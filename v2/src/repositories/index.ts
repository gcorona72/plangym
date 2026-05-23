/**
 * Capa Repository — punto único de entrada a los datos.
 *
 * En vez de hacer `db.sessions.where(...)` por toda la app, los componentes
 * usan `sessionRepository.findThisWeek()`. Esto:
 *   - desacopla de Dexie
 *   - da nombres del dominio
 *   - facilita tests
 */

export { BaseRepository } from './BaseRepository';
export { sessionRepository, SessionRepository } from './SessionRepository';
export { exerciseRepository, ExerciseRepository } from './ExerciseRepository';
export { programRepository, ProgramRepository } from './ProgramRepository';
export { recipeRepository, RecipeRepository } from './RecipeRepository';
export { mealLogRepository, MealLogRepository } from './MealLogRepository';
export { weightLogRepository, WeightLogRepository } from './WeightLogRepository';
export { sleepRepository, SleepRepository } from './SleepRepository';
export { profileRepository, ProfileRepository } from './ProfileRepository';
