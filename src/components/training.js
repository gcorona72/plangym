const { escapeHtml } = require('../utils/helpers');
const { TRAINING_MODE_LABELS } = require('../data/workouts');
const { EXERCISE_MASTER_DICTIONARY, groupExerciseMasters } = require('../../js/exerciseMasterDictionary');

function renderTraining(state = {}, options = {}) {
  // 1. Detectamos en qué modo estamos
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
              ${items.map((exercise) => {
                // 2. Lógica dinámica: elegimos el título según el modo
                const isGym = mode === 'gym';
                const mainTitle = isGym ? exercise.nombre_es : exercise.alternativa_calistenia;

                // 3. El subtítulo muestra la alternativa contraria
                const altText = isGym
                  ? `Alternativa Calistenia: ${exercise.alternativa_calistenia}`
                  : `Equivalente Gym: ${exercise.nombre_es}`;

                return `
                  <div class="exercise-card">
                    <strong>${escapeHtml(mainTitle || '')}</strong>
                    <p class="muted">${escapeHtml(altText)}</p>
                  </div>
                `;
              }).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

module.exports = { renderTraining };
