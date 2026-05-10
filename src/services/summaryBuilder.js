const { MEAL_ORDER, MEAL_LABELS } = require('../data/recipes');
const { TRAINING_TERMINOLOGY_MAP } = require('../data/workouts');

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeExerciseName(exercise = {}) {
  return String(exercise.name || exercise.baseName || exercise.nombre_es || exercise.alternativeName || '').trim();
}

function normalizeTrainingTerminology(text = '') {
  const normalized = String(text).trim().toLowerCase();
  return TRAINING_TERMINOLOGY_MAP[normalized] || String(text).trim();
}

function normalizeMealLabel(meal = {}, slot = '') {
  return String(meal.label || meal.nombre || MEAL_LABELS[slot] || slot || 'Comida').trim();
}

function extractMealMetrics(meal = {}) {
  const source = meal.recipe || meal;
  const macros = source.macros || {};

  return {
    label: normalizeMealLabel(source, meal.slot),
    calories: toNumber(source.calories ?? source.kcal),
    protein: toNumber(source.protein ?? macros.proteina ?? macros.protein),
    carbs: toNumber(source.carbs ?? macros.carbohidratos ?? macros.carbs),
    fats: toNumber(source.fats ?? macros.grasa ?? macros.fats),
  };
}

function extractMeals(plan = {}, recipeLookup) {
  if (Array.isArray(plan)) {
    return plan.filter(Boolean).map((meal, index) => ({
      slot: meal.slot || MEAL_ORDER[index] || '',
      ...extractMealMetrics(meal),
    }));
  }

  const meals = plan && typeof plan === 'object' ? plan.meals : null;
  if (!meals || typeof meals !== 'object') return [];

  return MEAL_ORDER.reduce((acc, slot) => {
    const currentMeal = meals[slot];
    if (!currentMeal) return acc;

    const directMeal = currentMeal.calories || currentMeal.kcal || currentMeal.macros ? currentMeal : null;
    const recipe = typeof recipeLookup === 'function' ? recipeLookup(currentMeal.selectedRecipeId) : null;
    const resolved = directMeal || recipe;
    if (!resolved) return acc;

    acc.push({
      slot,
      ...extractMealMetrics(resolved),
    });
    return acc;
  }, []);
}

function buildExerciseSummary(training = {}) {
  const exercises = Array.isArray(training.exercises) ? training.exercises : [];
  if (training.restDay) {
    const message = String(training.message || training.focus || 'Recuperación').trim();
    return `${message} · sesión suave para recuperar`;
  }

  const rawFocus = String(training.focus || training.name || training.badge || 'Entrenamiento').trim();
  const focus = normalizeTrainingTerminology(rawFocus);
  const group = String(training.group || '').trim();
  const countText = exercises.length ? `${exercises.length} ejercicio${exercises.length === 1 ? '' : 's'}` : 'sesión completa';
  const highlightText = exercises
    .slice(0, 2)
    .map(normalizeExerciseName)
    .filter(Boolean)
    .join(' · ');

  const parts = [focus, countText];
  if (group) parts.push(group);
  if (highlightText) parts.push(highlightText);
  return parts.join(' · ');
}

function buildMealSummary({ meals = [], goals = {}, training = {} } = {}) {
  const list = Array.isArray(meals) ? meals.filter(Boolean) : [];
  if (!list.length) {
    return 'todavía faltan comidas por asignar';
  }

  const totals = list.reduce((acc, meal) => {
    const metrics = extractMealMetrics(meal);
    acc.calories += metrics.calories;
    acc.protein += metrics.protein;
    acc.carbs += metrics.carbs;
    acc.fats += metrics.fats;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const caloriesGoal = toNumber(goals.calories);
  const calorieCoverage = caloriesGoal > 0 ? totals.calories / caloriesGoal : 0;
  const macroPairs = [
    ['carbs', totals.carbs],
    ['protein', totals.protein],
    ['fats', totals.fats],
  ].sort((a, b) => b[1] - a[1]);
  const [dominantMacro, dominantValue] = macroPairs[0];
  const [, secondValue = 0] = macroPairs[1] || [];
  const isBalanced = dominantValue <= Math.max(1, secondValue) * 1.15;

  const topMeals = list
    .slice()
    .sort((a, b) => extractMealMetrics(b).calories - extractMealMetrics(a).calories)
    .slice(0, 2);

  const anchorLabels = topMeals
    .map((meal) => normalizeMealLabel(meal, meal.slot))
    .filter(Boolean);

  // Eliminar duplicados y construir texto de comidas
  const uniqueLabels = [...new Set(anchorLabels)];
  let anchorText;

  if (uniqueLabels.length === 0) {
    anchorText = 'Las comidas del día';
  } else if (uniqueLabels.length === 1 && anchorLabels.length > 1) {
    // Si hay duplicados, mostrar cantidad de comidas
    anchorText = `${list.length} comidas`;
  } else if (uniqueLabels.length === 2) {
    anchorText = `${uniqueLabels[0]} y ${uniqueLabels[1]}`;
  } else {
    anchorText = uniqueLabels[0];
  }

  let macroText = 'reparto equilibrado entre macros';
  if (calorieCoverage > 0 && calorieCoverage < 0.7) {
    macroText = 'todavía va corto de energía';
  } else if (dominantMacro === 'carbs' && !isBalanced) {
    macroText = training.restDay ? 'carbohidratos moderados para recargar' : 'carbohidratos repartidos para sostener el entreno';
  } else if (dominantMacro === 'protein' && !isBalanced) {
    macroText = 'prioridad en proteína para recuperar';
  } else if (dominantMacro === 'fats' && !isBalanced) {
    macroText = 'más densidad energética y saciedad';
  } else if (list.length >= 4) {
    macroText = 'menú completo y bien repartido';
  }

  if (caloriesGoal > 0) {
    return `${anchorText} · ${macroText} · ${Math.round(totals.calories)} / ${Math.round(caloriesGoal)} kcal`;
  }

  return `${anchorText} · ${macroText}`;
}

class SummaryBuilder {
  static getDailySummary(input = {}, options = {}) {
    const source = input && typeof input === 'object' ? input : {};
    const plan = options.plan || source.plan || source;
    const training = options.training || source.training || source.currentWorkout || {};
    const goals = options.goals || source.goals || {};
    const recipeLookup = options.recipeLookup || source.recipeLookup || null;
    const meals = options.meals || source.dailyMeals || extractMeals(plan, recipeLookup);

    return {
      exercise: {
        label: 'Ejercicio',
        text: buildExerciseSummary(training),
      },
      food: {
        label: 'Comida',
        text: buildMealSummary({ meals, goals, training }),
      },
    };
  }

  static getDailyMessage(input = {}, options = {}) {
    const summary = SummaryBuilder.getDailySummary(input, options);
    return `${summary.exercise.text} · ${summary.food.text}`;
  }

  static _extractMeals(plan, recipeLookup) {
    return extractMeals(plan, recipeLookup);
  }

  static _buildExerciseSummary(training) {
    return buildExerciseSummary(training);
  }

  static _buildMealSummary(payload) {
    return buildMealSummary(payload);
  }
}

module.exports = { SummaryBuilder };
