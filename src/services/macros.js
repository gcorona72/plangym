const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentario', multiplier: 1.2 },
  light: { label: 'Ligero', multiplier: 1.375 },
  moderate: { label: 'Moderado', multiplier: 1.55 },
  high: { label: 'Alto', multiplier: 1.725 },
  athlete: { label: 'Muy alto', multiplier: 1.9 },
};

function getActivityMultiplier(activity = 'moderate') {
  const key = String(activity || 'moderate').toLowerCase();
  return ACTIVITY_LEVELS[key]?.multiplier || ACTIVITY_LEVELS.moderate.multiplier;
}

function calculateBmr(profile = {}) {
  const weight = Number(profile.weight) || 0;
  const height = Number(profile.height) || 0;
  const age = Number(profile.age) || 0;
  const sex = String(profile.sex || profile.gender || 'male').toLowerCase();

  if (sex === 'female' || sex === 'mujer') {
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  }

  return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
}

function calculateTdee(profile = {}) {
  const bmr = calculateBmr(profile);
  return Math.round(bmr * getActivityMultiplier(profile.activity));
}

function buildSurplusTargets(profile = {}, options = {}) {
  const tdee = calculateTdee(profile);
  const surplus = Number.isFinite(Number(options.surplus)) ? Number(options.surplus) : 250;
  const calories = Math.max(0, Math.round(tdee + surplus));
  const weight = Number(profile.weight) || 0;
  const protein = Number.isFinite(Number(options.protein)) ? Number(options.protein) : Math.round(weight * 2.2);
  const fats = Number.isFinite(Number(options.fats)) ? Number(options.fats) : Math.round((calories * 0.25) / 9);
  const carbs = Number.isFinite(Number(options.carbs))
    ? Number(options.carbs)
    : Math.max(0, Math.round((calories - (protein * 4) - (fats * 9)) / 4));

  return {
    calories,
    protein,
    fats,
    carbs,
  };
}

function distributeMealTargets(totalCalories, ratios = {}) {
  return Object.entries(ratios).reduce((acc, [mealId, ratio]) => {
    acc[mealId] = Math.round(Number(totalCalories || 0) * Number(ratio || 0));
    return acc;
  }, {});
}

function formatMacroSummary(targets = {}) {
  return `${Math.round(targets.calories || 0)} kcal · ${Math.round(targets.protein || 0)} g proteína · ${Math.round(targets.carbs || 0)} g carbohidratos · ${Math.round(targets.fats || 0)} g grasa`;
}

module.exports = {
  ACTIVITY_LEVELS,
  getActivityMultiplier,
  calculateBmr,
  calculateTdee,
  buildSurplusTargets,
  distributeMealTargets,
  formatMacroSummary,
};

