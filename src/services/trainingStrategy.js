class TrainingStrategy {
  constructor(id = 'base', label = 'Base') {
    this.id = id;
    this.label = label;
  }

  generateRoutine(baseWorkouts = []) {
    return Array.isArray(baseWorkouts) ? baseWorkouts : [];
  }

  calculateMacros(weight, height, age) {
    throw new Error('TrainingStrategy.calculateMacros debe implementarse en una subclase.');
  }
}

class DefaultTrainingStrategy extends TrainingStrategy {
  constructor() {
    super('balanced', 'Balanced');
  }

  generateRoutine(baseWorkouts = []) {
    return Array.isArray(baseWorkouts)
      ? baseWorkouts.map((workout) => ({
          ...workout,
          exercises: Array.isArray(workout?.exercises)
            ? workout.exercises.map((exercise) => ({ ...exercise }))
            : [],
        }))
      : [];
  }

  calculateMacros(weight, height, age, options = {}) {
    const safeWeight = Number(weight) || 0;
    const safeHeight = Number(height) || 0;
    const safeAge = Number(age) || 0;
    const activityMultiplier = Number(options.activityMultiplier || 1.55);
    const calorieSurplus = Number.isFinite(Number(options.calorieSurplus)) ? Number(options.calorieSurplus) : 250;
    const bmr = (10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5;
    const targetCalories = (bmr * activityMultiplier) + calorieSurplus;
    const protein = safeWeight > 0 ? safeWeight * 2 : 0;
    const fats = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.max(0, Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4));

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fats,
      carbs,
    };
  }
}

class EctomorphStrategy extends TrainingStrategy {
  constructor() {
    super('ectomorph', 'Ectomorfo');
  }

  generateRoutine(baseWorkouts = []) {
    return Array.isArray(baseWorkouts)
      ? baseWorkouts.map((workout) => {
          const compoundExercises = Array.isArray(workout?.exercises)
            ? workout.exercises.filter((exercise) => exercise?.type === 'compound' || exercise?.isCompound || exercise?.multiJoint)
            : [];

          return {
            ...workout,
            exercises: compoundExercises.slice(0, 5).map((exercise) => ({
              ...exercise,
              sets: 3,
              reps: '6-8',
              rest: '120-180s',
            })),
          };
        })
      : [];
  }

  calculateMacros(weight, height, age, options = {}) {
    const safeWeight = Number(weight) || 0;
    const safeHeight = Number(height) || 0;
    const safeAge = Number(age) || 0;
    const activityMultiplier = Number(options.activityMultiplier || 1.55);
    const calorieSurplus = Number.isFinite(Number(options.calorieSurplus)) ? Number(options.calorieSurplus) : 500;
    const bmr = (10 * safeWeight) + (6.25 * safeHeight) - (5 * safeAge) + 5;
    const targetCalories = (bmr * activityMultiplier) + calorieSurplus;
    const protein = safeWeight > 0 ? safeWeight * 2.2 : 0;
    const fats = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.max(0, Math.round((targetCalories - (protein * 4) - (targetCalories * 0.25)) / 4));

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fats,
      carbs,
    };
  }
}

function normalizeStrategyId(value) {
  return String(value || '').trim().toLowerCase();
}

function createTrainingStrategy(strategyId = 'balanced') {
  const id = normalizeStrategyId(strategyId);
  if (id === 'ectomorph' || id === 'ectomorfo' || id === 'hardgainer') return new EctomorphStrategy();
  return new DefaultTrainingStrategy();
}

function resolveTrainingStrategy(profile = {}) {
  const explicitId = normalizeStrategyId(profile.trainingStrategyId || profile.strategyId || profile.bodyType || profile.somatotype);
  if (explicitId) return createTrainingStrategy(explicitId);

  const weight = Number(profile.weight) || 0;
  const height = Number(profile.height) || 0;
  const bmi = weight > 0 && height > 0 ? weight / Math.pow(height / 100, 2) : 0;
  if (bmi > 0 && bmi < 21) return new EctomorphStrategy();
  return new DefaultTrainingStrategy();
}

function applyTrainingStrategy({ profile = {}, baseWorkouts = [], strategyId = '' } = {}) {
  const strategy = strategyId ? createTrainingStrategy(strategyId) : resolveTrainingStrategy(profile);
  const macros = strategy.calculateMacros(profile.weight, profile.height, profile.age, profile);
  const routine = strategy.generateRoutine(baseWorkouts);

  return {
    strategy,
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    dailyMacros: macros,
    routine,
  };
}

module.exports = {
  TrainingStrategy,
  DefaultTrainingStrategy,
  EctomorphStrategy,
  createTrainingStrategy,
  resolveTrainingStrategy,
  applyTrainingStrategy,
};
