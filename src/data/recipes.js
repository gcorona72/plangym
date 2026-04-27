const MEAL_ORDER = ['breakfast', 'lunch', 'prepost', 'dinner', 'nightSnack'];

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  prepost: 'Pre/Post Entreno',
  dinner: 'Cena',
  nightSnack: 'Snack Nocturno',
  snack: 'Snack',
};

const MEAL_TARGET_RATIOS = {
  breakfast: 0.22,
  lunch: 0.3,
  prepost: 0.12,
  dinner: 0.26,
  nightSnack: 0.1,
};

const RECIPE_CATEGORIES = [
  'all',
  'Desayunos Altos en Proteína',
  'Comidas Rápidas',
  'Cenas Ligeras',
  'Post-Entrenamiento',
];

const DIETARY_STYLES = {
  omnivore: 'Omnívoro',
  pescatarian: 'Pescetariano',
  vegetarian: 'Vegetariano',
  flexible: 'Flexible',
};

const RESTRICTIONS_CATALOG = [
  { id: 'lactose', label: 'Sin lactosa' },
  { id: 'gluten', label: 'Sin gluten' },
  { id: 'nuts', label: 'Sin frutos secos' },
  { id: 'egg', label: 'Sin huevo' },
  { id: 'fish', label: 'Sin pescado' },
];

module.exports = {
  MEAL_ORDER,
  MEAL_LABELS,
  MEAL_TARGET_RATIOS,
  RECIPE_CATEGORIES,
  DIETARY_STYLES,
  RESTRICTIONS_CATALOG,
  recipeCategories: RECIPE_CATEGORIES,
  restrictionsCatalog: RESTRICTIONS_CATALOG,
};

