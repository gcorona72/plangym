const helpers = require('./src/utils/helpers');
const recipes = require('./src/data/recipes');
const workouts = require('./src/data/workouts');
const macros = require('./src/services/macros');
const api = require('./src/services/api');
const trainingStrategy = require('./src/services/trainingStrategy');
const database = require('./src/db/database');
const repository = require('./src/db/repository');
const store = require('./src/store/store');
const dashboard = require('./src/components/dashboard');
const nutrition = require('./src/components/nutrition');
const training = require('./src/components/training');

function applyTrainingProfile(profile = {}, baseWorkouts = []) {
  const applied = trainingStrategy.applyTrainingStrategy({ profile, baseWorkouts });
  if (store.appStore?.patchState) {
    store.appStore.patchState({
      currentTrainingStrategyId: applied.strategyId,
      currentTrainingStrategyLabel: applied.strategyLabel,
      dailyMacros: applied.dailyMacros,
      trainingRoutinePreview: applied.routine,
    });
  }
  return applied;
}

const architecture = {
  utils: helpers,
  data: { recipes, workouts },
  services: { macros, api, trainingStrategy },
  db: { database, repository },
  store,
  components: { dashboard, nutrition, training },
  applyTrainingProfile,
};

if (typeof window !== 'undefined') {
  window.planComidaArchitecture = architecture;
}

if (typeof module !== 'undefined') {
  module.exports = architecture;
}

require('./js/app.js');

