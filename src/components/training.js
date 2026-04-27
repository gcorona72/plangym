const { escapeHtml } = require('../utils/helpers');
const { TRAINING_MODE_LABELS } = require('../data/workouts');
const { EXERCISE_MASTER_DICTIONARY, groupExerciseMasters } = require('../../js/exerciseMasterDictionary');

function renderTraining(state = {}, options = {}) {
  const mode = String(state.training?.mode || 'gym').toLowerCase() === 'calisthenia' ? 'calisthenia' : 'gym';
  const exercises = Array.isArray(options.exercises) ? options.exercises : EXERCISE_MASTER_DICTIONARY;
  const grouped = groupExerciseMasters(exercises);
  const groups = Object.entries(grouped);

  return `
    <section class="glass-panel section-panel training-view">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Entrenamiento</p>
          <h2>Diccionario maestro de ejercicios</h2>
        </div>
        <span class="step-pill">${escapeHtml(TRAINING_MODE_LABELS[mode] || mode)}</span>
      </div>
      <div class="training-catalog">
        ${groups.map(([group, items]) => `
          <article class="training-group">
            <h3>${escapeHtml(group)}</h3>
            <div class="training-grid">
              ${items.map((exercise) => `
                <div class="exercise-card">
                  <strong>${escapeHtml(exercise.nombre_es || exercise.name || '')}</strong>
                  <p class="muted">Gym: ${escapeHtml(exercise.api_target_name || '')}</p>
                  <p class="muted">Calistenia: ${escapeHtml(exercise.alternativa_calistenia || '')}</p>
                </div>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

module.exports = { renderTraining };
