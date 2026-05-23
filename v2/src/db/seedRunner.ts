import { db } from './database';
import { SEED_EXERCISES } from './seeds/exercises';
import { SEED_INGREDIENTS } from './seeds/ingredients';
import { SEED_RECIPES } from './seeds/recipes';
import { DEFAULT_PROGRAM, BEGINNER_PROGRAM, PPLT_4DAYS_PROGRAM, COACH_UPPER_LOWER_PROGRAM } from './seeds/programs';
import { EXERCISE_VIDEO_IDS } from './seeds/exerciseVideos';
import { EXERCISE_IMAGE_FOLDERS } from './seeds/exerciseImageMap';
import { RECIPE_VIDEO_IDS } from './seeds/recipeVideos';
import type { AppSettings } from '$lib/types';

/**
 * Carga los datos semilla en la primera ejecución.
 * Solo carga lo que falta — idempotente.
 */
export async function runSeeds(): Promise<void> {
  await db.transaction('rw', [db.exercises, db.ingredients, db.recipes, db.programs, db.settings, db.profile], async () => {
    const exerciseCount = await db.exercises.count();
    if (exerciseCount === 0) {
      await db.exercises.bulkAdd(SEED_EXERCISES);
    } else {
      // Upgrade incremental: añade ejercicios nuevos y aplica metadatos
      for (const seed of SEED_EXERCISES) {
        const mapVideoId = EXERCISE_VIDEO_IDS[seed.id];
        const mapImageFolder = EXERCISE_IMAGE_FOLDERS[seed.id];
        const enrichedSeed = {
          ...seed,
          ...(mapVideoId ? { videoId: mapVideoId } : {}),
          ...(mapImageFolder ? { imageFolder: mapImageFolder } : {})
        };
        const existing = await db.exercises.get(seed.id);
        if (!existing) {
          await db.exercises.add(enrichedSeed);
        } else {
          const patch: Partial<typeof seed> = {};
          if (mapVideoId && existing.videoId !== mapVideoId) patch.videoId = mapVideoId;
          if (mapImageFolder && existing.imageFolder !== mapImageFolder) patch.imageFolder = mapImageFolder;
          if (seed.gifUrl && !existing.gifUrl) patch.gifUrl = seed.gifUrl;
          if (seed.tier && existing.tier !== seed.tier) patch.tier = seed.tier;
          if (seed.tierNotes && existing.tierNotes !== seed.tierNotes) patch.tierNotes = seed.tierNotes;
          if (seed.cues && JSON.stringify(seed.cues) !== JSON.stringify(existing.cues)) patch.cues = seed.cues;
          if (seed.name && existing.name !== seed.name) patch.name = seed.name;
          if (Object.keys(patch).length > 0) {
            await db.exercises.update(seed.id, patch);
          }
        }
      }
    }

    const ingCount = await db.ingredients.count();
    if (ingCount === 0) {
      await db.ingredients.bulkAdd(SEED_INGREDIENTS);
    } else {
      // Upgrade incremental: añadir ingredientes nuevos
      for (const ing of SEED_INGREDIENTS) {
        const exists = await db.ingredients.get(ing.id);
        if (!exists) await db.ingredients.add(ing);
      }
    }

    const recipeCount = await db.recipes.count();
    if (recipeCount === 0) {
      await db.recipes.bulkAdd(SEED_RECIPES);
    } else {
      // Upgrade: añadir recetas nuevas y aplicar videoIds del mapa
      for (const r of SEED_RECIPES) {
        const videoId = RECIPE_VIDEO_IDS[r.id];
        const withVideo = videoId ? { ...r, videoId } : r;
        const exists = await db.recipes.get(r.id);
        if (!exists) {
          await db.recipes.add(withVideo);
        } else {
          const patch: Partial<typeof r> = {};
          if (videoId && exists.videoId !== videoId) patch.videoId = videoId;
          if (r.isComplex && !exists.isComplex) patch.isComplex = r.isComplex;
          if (r.youtubeQuery && !exists.youtubeQuery) patch.youtubeQuery = r.youtubeQuery;
          // Migrar campos nuevos: tamaño calórico + meal-prep + nombre actualizado
          if (r.calorieSize && exists.calorieSize !== r.calorieSize) patch.calorieSize = r.calorieSize;
          if (r.mealPrepFriendly != null && exists.mealPrepFriendly !== r.mealPrepFriendly) patch.mealPrepFriendly = r.mealPrepFriendly;
          if (r.name && exists.name !== r.name) patch.name = r.name;
          if (r.description && exists.description !== r.description) patch.description = r.description;
          if (Object.keys(patch).length > 0) {
            await db.recipes.update(r.id, patch);
          }
        }
      }
    }

    const programCount = await db.programs.count();
    if (programCount === 0) {
      // Primera instalación: COACH como activo, resto disponibles
      await db.programs.bulkAdd([
        COACH_UPPER_LOWER_PROGRAM,
        PPLT_4DAYS_PROGRAM,
        DEFAULT_PROGRAM,
        BEGINNER_PROGRAM
      ]);
    } else {
      // Upgrade incremental
      const hasBeginner = await db.programs.get(BEGINNER_PROGRAM.id);
      if (!hasBeginner) await db.programs.add(BEGINNER_PROGRAM);

      const hasPPLT = await db.programs.get(PPLT_4DAYS_PROGRAM.id);
      if (!hasPPLT) await db.programs.add({ ...PPLT_4DAYS_PROGRAM, active: false });

      const hasCoach = await db.programs.get(COACH_UPPER_LOWER_PROGRAM.id);
      if (!hasCoach) {
        // MIGRACIÓN: añadir programa COACH y activarlo (desactivar otros)
        const allPrograms = await db.programs.toArray();
        for (const p of allPrograms) {
          if (p.active) await db.programs.update(p.id, { active: false });
        }
        await db.programs.add(COACH_UPPER_LOWER_PROGRAM);
      } else {
        // El programa COACH ya existe → SOBRESCRIBIMOS los días con la última versión
        // del seed (rangos de reps + incrementos + tipo de progresión actualizados).
        // Preservamos solo el flag `active` y `createdAt` originales.
        await db.programs.update(COACH_UPPER_LOWER_PROGRAM.id, {
          name: COACH_UPPER_LOWER_PROGRAM.name,
          description: COACH_UPPER_LOWER_PROGRAM.description,
          days: COACH_UPPER_LOWER_PROGRAM.days
        });
      }
    }

    // ─── MIGRACIÓN DE PERFIL ──────────────────────────────────────────────
    // Si el usuario está en fase 'recomp' pero aún no tiene cardio configurado,
    // aplicamos los valores recomendados por el entrenador (4 días × 25 min).
    const profile = await db.profile.get(1);
    if (profile) {
      const patch: Partial<typeof profile> = {};
      if (profile.userPhase === 'recomp') {
        if (profile.cardioDaysPerWeek == null || profile.cardioDaysPerWeek === 0) {
          patch.cardioDaysPerWeek = 4;
        }
        if (profile.cardioMinutesPerSession == null || profile.cardioMinutesPerSession === 0) {
          patch.cardioMinutesPerSession = 25;
        }
        if (profile.stepGoal == null || profile.stepGoal === 0) {
          patch.stepGoal = 10000;
        }
      }
      if (Object.keys(patch).length > 0) {
        await db.profile.update(1, { ...patch, updatedAt: new Date().toISOString() });
      }
    }

    const settings = await db.settings.get(1);
    if (!settings) {
      const defaultSettings: AppSettings = {
        id: 1,
        theme: 'dark',
        restTimerSound: true,
        restTimerVibration: true,
        weightSuggestionMode: 'progressive',
        language: 'es'
      };
      await db.settings.add(defaultSettings);
    }
  });
}
