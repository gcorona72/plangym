const { escapeHtml, formatNumber } = require('../utils/helpers');

function renderDashboard(state = {}) {
  const profile = state.profile || {};
  const goals = state.goals || {};
  return `
    <section class="glass-panel section-panel dashboard-view">
      <p class="eyebrow">Resumen</p>
      <h2>Dashboard</h2>
      <p class="muted">${escapeHtml(profile.name || 'Usuario')} · Objetivo ${escapeHtml(profile.goalMode || 'gain')}</p>
      <div class="stats-grid">
        <div class="stat-card"><span>Calorías</span><strong>${formatNumber(goals.calories || 0)}</strong></div>
        <div class="stat-card"><span>Proteína</span><strong>${formatNumber(goals.protein || 0)} g</strong></div>
        <div class="stat-card"><span>Carbohidratos</span><strong>${formatNumber(goals.carbs || 0)} g</strong></div>
        <div class="stat-card"><span>Grasas</span><strong>${formatNumber(goals.fats || 0)} g</strong></div>
      </div>
    </section>
  `;
}

function renderDashboardHero(props = {}) {
  return `
    <section class="hero glass-panel calendar-hero">
      <div class="hero-copy">
        <p class="eyebrow">Calendario ${escapeHtml(props.calendarModeLabel || 'semanal')}</p>
        <h2>${escapeHtml(props.calendarTitle || '')}</h2>
        <p class="subtitle">${escapeHtml(props.calendarSubtitle || '')}</p>
        <div class="plan-view-toggle" role="tablist" aria-label="Cambiar vista del plan">
          <button class="chip chip--filter ${props.planViewMode === 'week' ? 'is-active' : ''}" type="button" data-view-mode="week">Semana</button>
          <button class="chip chip--filter ${props.planViewMode === 'day' ? 'is-active' : ''}" type="button" data-view-mode="day">Día</button>
          <button class="chip chip--filter ${props.planViewMode === 'month' ? 'is-active' : ''}" type="button" data-view-mode="month">Mes</button>
        </div>
        <div class="progress-rail" aria-label="Progreso semanal de proteína"><span class="progress-rail__label">Proteína</span><div class="progress-rail__track"><span style="width:${Number(props.weeklyCompletion || 0)}%"></span></div><span class="progress-rail__value">${Number(props.weeklyCompletion || 0)}%</span></div>
      </div>
      <div class="hero-actions hero-actions--stacked">
        <button class="btn btn--ghost" data-action="previous-week">Semana anterior</button>
        <button class="btn btn--primary" data-action="go-today">Ir a hoy</button>
        <button class="btn btn--ghost" data-action="next-week">Semana siguiente</button>
        <button class="btn btn--ghost" data-action="open-nutrition">Nutrición</button>
        <button class="btn btn--ghost" data-action="open-training">Entrenamiento</button>
      </div>
    </section>
  `;
}

module.exports = {
  renderDashboardHero,
};

