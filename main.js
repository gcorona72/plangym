const helpers = require('./src/utils/helpers');
const recipes = require('./src/data/recipes');
const workouts = require('./src/data/workouts');
const macros = require('./src/services/macros');
const summaryBuilder = require('./src/services/summaryBuilder');
const api = require('./src/services/api');
const database = require('./src/db/database');
const repository = require('./src/db/repository');
const store = require('./src/store/store');
const dashboard = require('./src/components/dashboard');
const nutrition = require('./src/components/nutrition');
const training = require('./src/components/training');

const architecture = {
  utils: helpers,
  data: { recipes, workouts },
  services: { macros, summaryBuilder, api },
  db: { database, repository },
  store,
  components: { dashboard, nutrition, training },
};

if (typeof window !== 'undefined') {
  window.planComidaArchitecture = architecture;
}

if (typeof module !== 'undefined') {
  module.exports = architecture;
}

require('./js/app.js');

