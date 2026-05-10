const { escapeHtml, formatNumber } = require('../utils/helpers');
const { MEAL_LABELS } = require('../data/recipes');
const { appStore } = require('../store/store');

function renderNutrition(state = {}) {
  const meals = Array.isArray(state.nutrition?.meals) ? state.nutrition.meals : [];
  return `
	<section class="glass-panel section-panel nutrition-view">
	  <p class="eyebrow">Nutrición</p>
	  <h2>Plan diario</h2>
	  <div class="nutrition-list">
		${meals.map((meal) => `
		  <article class="nutrition-card">
			<header>
			  <strong>${escapeHtml(MEAL_LABELS[meal.id?.replace('meal_', '')] || meal.nombre || 'Comida')}</strong>
			  <span>${formatNumber(meal.kcal || 0)} kcal</span>
			</header>
			<p>${escapeHtml(meal.alimentos || '')}</p>
		  </article>
		`).join('')}
	  </div>
	</section>
  `;
}

function renderNutritionHero(props = {}) {
  const totals = props.totals || {};
  const progress = props.progress || {};
  const target = props.target || {};
  const consumedCount = Number(props.consumedCount || 0);
  const mealCount = Number(props.mealCount || 0);
  const completion = Number(props.completion || 0);

  return `
	<article class="glass-panel section-panel">
	  <div class="section-heading">
		<div>
		  <p class="eyebrow">Nutrición</p>
		  <h2>Objetivo estático · ${formatNumber(target.kcal || 3000)} kcal para masa muscular</h2>
		</div>
		<span class="step-pill">${consumedCount}/${mealCount} comidas marcadas</span>
	  </div>

	  <div class="nutrition-hero">
		<div class="nutrition-hero__summary">
		  <p class="muted">Lo consumido hoy se compara con tu objetivo total y el plan es editable por marcas de consumido.</p>
		  <div class="nutrition-total">
			<strong>${formatNumber(totals.kcal || 0)} / ${formatNumber(target.kcal || 0)} kcal</strong>
			<div class="progress-rail"><span class="progress-rail__label">Energía</span><div class="progress-rail__track"><span style="width:${completion}%"></span></div><span class="progress-rail__value">${completion}%</span></div>
		  </div>
		</div>
		<div class="nutrition-hero__macros">
		  <article class="metric-card"><span class="metric-card__label">Proteína</span><strong>${formatNumber(totals.protein || 0)} / ${formatNumber(target.protein || 0)} g</strong><small>${Number(progress.protein || 0)}%</small></article>
		  <article class="metric-card"><span class="metric-card__label">Grasas</span><strong>${formatNumber(totals.fats || 0)} / ${formatNumber(target.fats || 0)} g</strong><small>${Number(progress.fats || 0)}%</small></article>
		  <article class="metric-card"><span class="metric-card__label">Carbohidratos</span><strong>${formatNumber(totals.carbs || 0)} / ${formatNumber(target.carbs || 0)} g</strong><small>${Number(progress.carbs || 0)}%</small></article>
		</div>
		<div class="nutrition-hero__actions">
		  <button class="btn btn--primary" type="button" data-action="open-nutrition-today-meals">Ver comidas de hoy</button>
		  <p class="muted">La vista principal se queda limpia; el detalle completo vive en su propia ventana.</p>
		</div>
	  </div>
	</article>
  `;
}

function renderNutritionMealCard(meal, target = {}) {
  if (!meal) return '';
  const proteinTarget = Number(target.protein || 0);
  const carbsTarget = Number(target.carbs || 0);
  const fatsTarget = Number(target.fats || 0);
  return `
	  <article class="glass-panel nutrition-card ${meal.consumed ? 'is-consumed' : ''}" data-meal-id="${meal.id}">
		<div class="section-heading">
		  <div>
			<p class="eyebrow">${escapeHtml(meal.nombre)}</p>
			<h3>${escapeHtml(meal.kcal)} kcal</h3>
			<p class="meal-card__summary">${escapeHtml(meal.alimentos)}</p>
		  </div>
		  <div class="meal-card__actions">
			<button class="btn btn--ghost btn--small" data-action="open-nutrition-meal-detail" data-meal-id="${meal.id}">Ver detalle</button>
			<button class="btn btn--${meal.consumed ? 'secondary' : 'primary'} btn--small" data-action="toggle-nutrition-meal" data-meal-id="${meal.id}">${meal.consumed ? 'Consumido' : 'Marcar consumido'}</button>
		  </div>
		</div>

		<div class="macro-row macro-row--compact">
		  <span>${meal.macros.proteina} g proteína</span>
		  <span>${meal.macros.grasa} g grasa</span>
		  <span>${meal.macros.carbohidratos} g carbos</span>
		  <span>${meal.kcal} kcal</span>
		</div>

		<div class="mini-progress mini-progress--compact">
		  <div class="nutrition-bar"><span>Proteína</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.proteina / proteinTarget) * 100))}%"></span></div></div>
		  <div class="nutrition-bar"><span>Carbohidratos</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.carbohidratos / carbsTarget) * 100))}%"></span></div></div>
		  <div class="nutrition-bar"><span>Grasas</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.grasa / fatsTarget) * 100))}%"></span></div></div>
		</div>

		<p class="muted">${meal.consumed ? `Marcado como consumido${meal.consumedAt ? ` · ${new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(meal.consumedAt))}` : ''}` : 'Abre el detalle para ver composición y cantidades.'}</p>
	  </article>
	`;
}

function renderNutritionList(meals = [], target = {}) {
  const list = Array.isArray(meals) ? meals : [];
  return `
	<section class="nutrition-grid">
	  ${list.map((meal) => renderNutritionMealCard(meal, target)).join('')}
	</section>
  `;
}

function renderNutritionTodayMealsModal(props = {}) {
  if (!props.open) return '';
  const meals = Array.isArray(props.meals) ? props.meals : [];
  const target = props.target || {};
  const totals = props.totals || {};
  const mealCount = Number(props.mealCount || meals.length || 0);
  const consumedCount = Number(props.consumedCount || 0);
  const title = String(props.title || 'Comidas de hoy').trim();

  return `
	<div class="modal-backdrop" data-action="close-nutrition-today-meals">
	  <section class="glass-panel modal modal--nutrition" role="dialog" aria-modal="true" aria-labelledby="nutrition-today-title">
		<header class="detail-hero detail-hero--nutrition" style="background: linear-gradient(155deg, rgba(52, 211, 153, 0.14), rgba(14, 165, 233, 0.1));">
		  <div>
			<p class="eyebrow">Ventana de comidas de hoy</p>
			<h2 id="nutrition-today-title">${escapeHtml(title)}</h2>
			<p class="muted">${consumedCount}/${mealCount} comidas marcadas · ${formatNumber(totals.kcal || 0)} kcal consumidas</p>
		  </div>
		  <button class="btn btn--ghost" type="button" data-action="close-nutrition-today-meals">Cerrar</button>
		</header>

		<div class="detail-body detail-body--nutrition">
		  <article class="glass-panel section-panel">
			<p class="muted">Aquí se concentran los detalles de cada comida para que el panel diario permanezca resumido.</p>
		  </article>
		  ${renderNutritionList(meals, target)}
		</div>
	  </section>
	</div>
  `;
}

function mountNutritionCard(containerId) {
  const container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
  if (!container) return () => {};

  const paint = () => {
	const state = appStore.getState ? appStore.getState() : {};
	container.innerHTML = renderNutrition(state);
  };

  paint();
  const unsubscribe = appStore.subscribe(() => paint());
  return unsubscribe;
}

module.exports = { renderNutrition, renderNutritionHero, renderNutritionMealCard, renderNutritionList, renderNutritionTodayMealsModal, mountNutritionCard };

