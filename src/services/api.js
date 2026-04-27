const muscleWikiService = require('../../js/muscleWikiService');
const exerciseAnimationService = require('../../js/exerciseAnimationService');
const exerciseAnatomyService = require('../../js/exerciseAnatomyService');

async function searchMuscleWikiExercise(query, config = {}, options = {}) {
  return muscleWikiService.searchExerciseMedia(query, config, options);
}

async function fetchExerciseAnimation(apiTargetName, config = {}, options = {}) {
  return exerciseAnimationService.fetchExerciseAnimation(apiTargetName, config, options);
}

function getDefaultExerciseAnimationConfig() {
  return exerciseAnimationService.DEFAULT_EXERCISE_ANIMATION_CONFIG || {};
}

module.exports = {
  muscleWikiService,
  exerciseAnimationService,
  exerciseAnatomyService,
  searchMuscleWikiExercise,
  fetchExerciseAnimation,
  getDefaultExerciseAnimationConfig,
  DEFAULT_EXERCISE_ANIMATION_CONFIG: getDefaultExerciseAnimationConfig(),
};

