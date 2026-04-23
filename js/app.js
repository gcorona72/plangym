(() => {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const STORAGE_KEY = 'plan-comida-state-v1';
  const DB_NAME = 'plan-comida-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'kv';
  const DEFAULT_TAB = 'plan';
  const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];
  const MEAL_LABELS = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena' };
  const TAB_LABELS = {
    plan: 'Mi Plan',
    recipes: 'Recetas',
    progress: 'Progreso',
    shopping: 'Lista de la Compra',
    settings: 'Ajustes',
  };
  const activityLevels = {
    sedentary: { label: 'Sedentario', multiplier: 1.2 },
    light: { label: 'Ligero', multiplier: 1.375 },
    moderate: { label: 'Moderado', multiplier: 1.55 },
    high: { label: 'Alto', multiplier: 1.725 },
    athlete: { label: 'Muy alto', multiplier: 1.9 },
  };
  const dietaryStyles = {
    omnivore: 'Omnívoro',
    pescatarian: 'Pescetariano',
    vegetarian: 'Vegetariano',
    flexible: 'Flexible',
  };
  const restrictionsCatalog = [
    { id: 'lactose', label: 'Sin lactosa' },
    { id: 'gluten', label: 'Sin gluten' },
    { id: 'nuts', label: 'Sin frutos secos' },
    { id: 'egg', label: 'Sin huevo' },
    { id: 'fish', label: 'Sin pescado' },
  ];
  const recipeCategories = ['all', 'Desayunos Altos en Proteína', 'Comidas Rápidas', 'Cenas Ligeras', 'Post-Entrenamiento'];
  const defaultProfile = {
    name: 'Alex',
    age: 28,
    height: 180,
    weight: 72,
    targetWeight: 78,
    activity: 'moderate',
    dietaryStyle: 'omnivore',
    restrictions: [],
    unit: 'metric',
    goalMode: 'gain',
    completed: false,
    notes: '',
  };
  const defaultGoals = { calories: 2850, protein: 170, carbs: 355, fats: 90 };

  const baseRecipes = [
    {
      id: 'breakfast-claras-avena',
      name: 'Tortilla de claras con avena y yogur griego',
      mealType: 'breakfast',
      categories: ['Desayunos Altos en Proteína', 'Post-Entrenamiento'],
      emoji: '🥚',
      accent: ['#0f766e', '#155e75'],
      prepTime: 12,
      proteinSource: 'Claras de huevo y yogur griego',
      calories: 560,
      protein: 44,
      carbs: 52,
      fats: 18,
      sections: ['Huevos', 'Lácteos', 'Despensa'],
      dietary: ['omnivore', 'vegetarian', 'flexible'],
      allergens: ['egg', 'lactose'],
      ingredients: [
        { name: 'Claras de huevo', amount: '250 ml', section: 'Huevos' },
        { name: 'Huevo entero', amount: '1 ud', section: 'Huevos' },
        { name: 'Avena', amount: '70 g', section: 'Despensa' },
        { name: 'Yogur griego natural', amount: '200 g', section: 'Lácteos' },
        { name: 'Plátano', amount: '1 ud', section: 'Fruta' },
        { name: 'Canela', amount: '1 cdita', section: 'Despensa' },
      ],
      steps: ['Bate las claras con el huevo y la canela.', 'Cocina la tortilla a fuego medio.', 'Sirve con avena y yogur griego.'],
      notes: 'Ingredientes fáciles de encontrar en Mercadona, Carrefour, DIA o Alcampo.',
    },
    {
      id: 'breakfast-tostadas-pavo',
      name: 'Tostadas integrales con pavo, queso fresco y tomate',
      mealType: 'breakfast',
      categories: ['Desayunos Altos en Proteína', 'Comidas Rápidas'],
      emoji: '🥪',
      accent: ['#2563eb', '#0f172a'],
      prepTime: 8,
      proteinSource: 'Pavo y queso fresco batido',
      calories: 515,
      protein: 38,
      carbs: 44,
      fats: 18,
      sections: ['Panadería', 'Charcutería', 'Lácteos', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['gluten', 'lactose'],
      ingredients: [
        { name: 'Pan integral', amount: '4 rebanadas', section: 'Panadería' },
        { name: 'Pechuga de pavo', amount: '120 g', section: 'Charcutería' },
        { name: 'Queso fresco batido', amount: '150 g', section: 'Lácteos' },
        { name: 'Tomate', amount: '1 ud grande', section: 'Verduras' },
        { name: 'Aceite de oliva virgen extra', amount: '1 cda', section: 'Despensa' },
      ],
      steps: ['Tuesta el pan y unta el queso fresco batido.', 'Añade el pavo y el tomate.', 'Termina con aceite de oliva y pimienta.'],
      notes: 'Muy fácil de preparar y con buena densidad energética.',
    },
    {
      id: 'breakfast-skyr-avena',
      name: 'Bol de skyr con avena, frutos rojos y semillas',
      mealType: 'breakfast',
      categories: ['Desayunos Altos en Proteína'],
      emoji: '🍓',
      accent: ['#7c3aed', '#0f172a'],
      prepTime: 6,
      proteinSource: 'Skyr y semillas',
      calories: 470,
      protein: 34,
      carbs: 45,
      fats: 14,
      sections: ['Lácteos', 'Fruta', 'Despensa'],
      dietary: ['omnivore', 'vegetarian', 'flexible'],
      allergens: ['lactose'],
      ingredients: [
        { name: 'Skyr natural', amount: '250 g', section: 'Lácteos' },
        { name: 'Avena', amount: '50 g', section: 'Despensa' },
        { name: 'Frutos rojos', amount: '100 g', section: 'Fruta' },
        { name: 'Semillas de chía', amount: '10 g', section: 'Despensa' },
        { name: 'Miel', amount: '1 cdita', section: 'Despensa' },
      ],
      steps: ['Mezcla el skyr con la avena.', 'Añade frutos rojos y semillas.', 'Endulza ligeramente con miel si lo deseas.'],
      notes: 'Una opción rápida, fresca y muy saciante.',
    },
    {
      id: 'lunch-pollo-arroz',
      name: 'Pollo al horno con arroz, brócoli y aceite de oliva',
      mealType: 'lunch',
      categories: ['Comidas Rápidas', 'Post-Entrenamiento'],
      emoji: '🍗',
      accent: ['#16a34a', '#1e293b'],
      prepTime: 25,
      proteinSource: 'Pechuga de pollo',
      calories: 760,
      protein: 58,
      carbs: 76,
      fats: 22,
      sections: ['Carnicería', 'Despensa', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: [],
      ingredients: [
        { name: 'Pechuga de pollo', amount: '220 g', section: 'Carnicería' },
        { name: 'Arroz basmati', amount: '100 g', section: 'Despensa' },
        { name: 'Brócoli', amount: '200 g', section: 'Verduras' },
        { name: 'Aceite de oliva virgen extra', amount: '1 cda', section: 'Despensa' },
        { name: 'Limón', amount: '1/2 ud', section: 'Fruta' },
      ],
      steps: ['Hornea el pollo con limón y especias suaves.', 'Cuece el arroz y el brócoli al vapor.', 'Sirve con aceite de oliva.'],
      notes: 'Clásica comida de volumen con ingredientes de supermercado.',
    },
    {
      id: 'lunch-lentejas-atun',
      name: 'Lentejas con atún, huevo y verduras',
      mealType: 'lunch',
      categories: ['Comidas Rápidas', 'Post-Entrenamiento'],
      emoji: '🥫',
      accent: ['#b45309', '#1e293b'],
      prepTime: 22,
      proteinSource: 'Lentejas, atún y huevo',
      calories: 690,
      protein: 46,
      carbs: 72,
      fats: 21,
      sections: ['Despensa', 'Huevos', 'Conservas', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['fish', 'egg'],
      ingredients: [
        { name: 'Lentejas cocidas', amount: '300 g', section: 'Despensa' },
        { name: 'Atún al natural', amount: '2 latas', section: 'Conservas' },
        { name: 'Huevo cocido', amount: '2 ud', section: 'Huevos' },
        { name: 'Zanahoria', amount: '1 ud', section: 'Verduras' },
        { name: 'Pimiento rojo', amount: '1/2 ud', section: 'Verduras' },
      ],
      steps: ['Mezcla las lentejas con el atún escurrido.', 'Añade el huevo cocido y las verduras.', 'Aliña con aceite de oliva y vinagre.'],
      notes: 'Muy accesible, económico y excelente para ectomorfos.',
    },
    {
      id: 'lunch-pasta-pavo',
      name: 'Pasta integral con pavo y tomate casero',
      mealType: 'lunch',
      categories: ['Comidas Rápidas', 'Post-Entrenamiento'],
      emoji: '🍝',
      accent: ['#dc2626', '#0f172a'],
      prepTime: 20,
      proteinSource: 'Pavo y pasta integral',
      calories: 780,
      protein: 49,
      carbs: 92,
      fats: 20,
      sections: ['Pasta', 'Carne', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['gluten'],
      ingredients: [
        { name: 'Pasta integral', amount: '110 g', section: 'Pasta' },
        { name: 'Pechuga de pavo picada', amount: '200 g', section: 'Carnicería' },
        { name: 'Tomate triturado', amount: '200 g', section: 'Conservas' },
        { name: 'Cebolla', amount: '1/2 ud', section: 'Verduras' },
        { name: 'Queso rallado', amount: '20 g', section: 'Lácteos' },
      ],
      steps: ['Cocina la pasta al dente.', 'Saltea la cebolla y el pavo, añade tomate triturado.', 'Termina con queso rallado.'],
      notes: 'Perfecta como comida posentrenamiento con carbohidratos de calidad.',
    },
    {
      id: 'lunch-salmon-patata',
      name: 'Salmón al horno con patata y espinacas',
      mealType: 'lunch',
      categories: ['Post-Entrenamiento', 'Comidas Rápidas'],
      emoji: '🐟',
      accent: ['#0ea5e9', '#0f172a'],
      prepTime: 28,
      proteinSource: 'Salmón',
      calories: 745,
      protein: 45,
      carbs: 62,
      fats: 31,
      sections: ['Pescadería', 'Verduras', 'Despensa'],
      dietary: ['omnivore', 'pescatarian', 'flexible'],
      allergens: ['fish'],
      ingredients: [
        { name: 'Lomos de salmón', amount: '200 g', section: 'Pescadería' },
        { name: 'Patata', amount: '350 g', section: 'Verduras' },
        { name: 'Espinacas', amount: '100 g', section: 'Verduras' },
        { name: 'Aceite de oliva virgen extra', amount: '1 cda', section: 'Despensa' },
        { name: 'Limón', amount: '1/2 ud', section: 'Fruta' },
      ],
      steps: ['Hornea la patata en gajos con aceite y sal.', 'Añade el salmón en los últimos minutos.', 'Sirve con espinacas salteadas y limón.'],
      notes: 'Muy completo y apto para una comida principal potente.',
    },
    {
      id: 'dinner-merluza-verduras',
      name: 'Merluza con verduras al vapor y patata',
      mealType: 'dinner',
      categories: ['Cenas Ligeras', 'Post-Entrenamiento'],
      emoji: '🍽️',
      accent: ['#14b8a6', '#1f2937'],
      prepTime: 20,
      proteinSource: 'Merluza',
      calories: 520,
      protein: 41,
      carbs: 48,
      fats: 16,
      sections: ['Pescadería', 'Verduras'],
      dietary: ['omnivore', 'pescatarian', 'flexible'],
      allergens: ['fish'],
      ingredients: [
        { name: 'Filetes de merluza', amount: '220 g', section: 'Pescadería' },
        { name: 'Patata', amount: '220 g', section: 'Verduras' },
        { name: 'Calabacín', amount: '1 ud', section: 'Verduras' },
        { name: 'Zanahoria', amount: '1 ud', section: 'Verduras' },
        { name: 'Aceite de oliva virgen extra', amount: '1 cda', section: 'Despensa' },
      ],
      steps: ['Cuece o vaporiza la patata y las verduras.', 'Marca la merluza en sartén o al vapor.', 'Termina con aceite de oliva y perejil.'],
      notes: 'Ligera, digestiva y muy buena para la noche.',
    },
    {
      id: 'dinner-tortilla-espanola-pro',
      name: 'Tortilla española alta en proteína',
      mealType: 'dinner',
      categories: ['Cenas Ligeras', 'Desayunos Altos en Proteína'],
      emoji: '🥔',
      accent: ['#a16207', '#111827'],
      prepTime: 18,
      proteinSource: 'Huevos y claras',
      calories: 590,
      protein: 39,
      carbs: 44,
      fats: 25,
      sections: ['Huevos', 'Verduras'],
      dietary: ['omnivore', 'vegetarian', 'flexible'],
      allergens: ['egg'],
      ingredients: [
        { name: 'Huevos', amount: '3 ud', section: 'Huevos' },
        { name: 'Claras de huevo', amount: '150 ml', section: 'Huevos' },
        { name: 'Patata', amount: '250 g', section: 'Verduras' },
        { name: 'Cebolla', amount: '1/2 ud', section: 'Verduras' },
        { name: 'Aceite de oliva virgen extra', amount: '1 cda', section: 'Despensa' },
      ],
      steps: ['Pocha la patata y la cebolla con poco aceite.', 'Añade los huevos y las claras batidas.', 'Cuaja a fuego medio para mantener jugosidad.'],
      notes: 'Una cena tradicional con extra de proteína.',
    },
    {
      id: 'dinner-requeson-atun',
      name: 'Ensalada templada de atún, requesón y garbanzos',
      mealType: 'dinner',
      categories: ['Cenas Ligeras', 'Post-Entrenamiento'],
      emoji: '🥗',
      accent: ['#059669', '#172554'],
      prepTime: 15,
      proteinSource: 'Atún, requesón y garbanzos',
      calories: 540,
      protein: 43,
      carbs: 39,
      fats: 20,
      sections: ['Conservas', 'Lácteos', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['fish', 'lactose'],
      ingredients: [
        { name: 'Atún al natural', amount: '2 latas', section: 'Conservas' },
        { name: 'Requesón', amount: '180 g', section: 'Lácteos' },
        { name: 'Garbanzos cocidos', amount: '150 g', section: 'Despensa' },
        { name: 'Mezcla de hojas verdes', amount: '100 g', section: 'Verduras' },
        { name: 'Tomates cherry', amount: '100 g', section: 'Verduras' },
      ],
      steps: ['Mezcla los ingredientes en un bol.', 'Templa los garbanzos si prefieres una cena más reconfortante.', 'Aliña con aceite de oliva y limón.'],
      notes: 'Súper rápida y fácil de adaptar a una dieta alta en proteína.',
    },
    {
      id: 'dinner-quesadilla-pollo',
      name: 'Quesadilla integral de pollo y queso fresco',
      mealType: 'dinner',
      categories: ['Cenas Ligeras', 'Comidas Rápidas'],
      emoji: '🫓',
      accent: ['#f59e0b', '#111827'],
      prepTime: 14,
      proteinSource: 'Pollo y queso fresco',
      calories: 610,
      protein: 44,
      carbs: 55,
      fats: 21,
      sections: ['Carnicería', 'Lácteos', 'Panadería', 'Verduras'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['gluten', 'lactose'],
      ingredients: [
        { name: 'Tortillas integrales', amount: '2 ud', section: 'Panadería' },
        { name: 'Pechuga de pollo', amount: '160 g', section: 'Carnicería' },
        { name: 'Queso fresco', amount: '80 g', section: 'Lácteos' },
        { name: 'Pimiento', amount: '1/2 ud', section: 'Verduras' },
        { name: 'Cebolla', amount: '1/4 ud', section: 'Verduras' },
      ],
      steps: ['Saltea el pollo con las verduras.', 'Rellena las tortillas con pollo y queso fresco.', 'Dora la quesadilla en la sartén.'],
      notes: 'Muy versátil para cena o post-entrenamiento tardío.',
    },
    {
      id: 'snack-yogur-fruta',
      name: 'Yogur griego con fruta y nueces',
      mealType: 'snack',
      categories: ['Post-Entrenamiento'],
      emoji: '🧁',
      accent: ['#8b5cf6', '#0f172a'],
      prepTime: 5,
      proteinSource: 'Yogur griego',
      calories: 320,
      protein: 24,
      carbs: 24,
      fats: 14,
      sections: ['Lácteos', 'Fruta', 'Despensa'],
      dietary: ['omnivore', 'vegetarian', 'flexible'],
      allergens: ['lactose', 'nuts'],
      ingredients: [
        { name: 'Yogur griego natural', amount: '200 g', section: 'Lácteos' },
        { name: 'Manzana', amount: '1 ud', section: 'Fruta' },
        { name: 'Nueces', amount: '20 g', section: 'Despensa' },
      ],
      steps: ['Sirve el yogur en un bol.', 'Añade la fruta troceada y las nueces.', 'Toma como merienda o post-entrenamiento ligero.'],
      notes: 'Se puede usar como refuerzo si necesitas más calorías.',
    },
  ];

  let dbPromise = null;
  let saveQueue = null;
  let state = clone(defaultState);

  init().catch((error) => {
    console.error(error);
    state.status = { text: 'No se pudo arrancar la aplicación. Se mantendrá una copia temporal en memoria.', type: 'error' };
    render();
  });

  async function init() {
    dbPromise = openDB();
    const stored = await loadState();
    state = hydrateState(stored);

    if (!state.profile.completed) {
      state.onboardingDraft = clone(state.profile);
      state.onboardingStep = 0;
    }

    syncGoalsFromProfile();
    ensureTodayPlan();
    seedHistoryIfNeeded();
    bindGlobalEvents();
    registerServiceWorker();
    render();
    announce('Aplicación lista. Tu plan se guarda localmente.');
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hydrateState(stored) {
    const incoming = stored && typeof stored === 'object' ? stored : {};
    const merged = clone(defaultState);
    merged.tab = incoming.tab || merged.tab;
    merged.activeDate = incoming.activeDate || merged.activeDate;
    merged.recipeQuery = incoming.recipeQuery || '';
    merged.recipeCategory = incoming.recipeCategory || 'all';
    merged.shoppingDays = Number(incoming.shoppingDays) || merged.shoppingDays;
    merged.onboardingStep = Number(incoming.onboardingStep) || 0;
    merged.onboardingDraft = incoming.onboardingDraft ? { ...clone(defaultProfile), ...incoming.onboardingDraft } : clone(defaultProfile);
    merged.recipeDraftOpen = Boolean(incoming.recipeDraftOpen);
    merged.recipeDraft = incoming.recipeDraft ? { ...createEmptyRecipeDraft(), ...incoming.recipeDraft } : createEmptyRecipeDraft();
    merged.selectedRecipeId = incoming.selectedRecipeId || null;
    merged.profile = incoming.profile ? { ...clone(defaultProfile), ...incoming.profile } : clone(defaultProfile);
    merged.goals = incoming.goals ? { ...clone(defaultGoals), ...incoming.goals } : clone(defaultGoals);
    merged.customRecipes = Array.isArray(incoming.customRecipes) ? incoming.customRecipes : [];
    merged.plans = incoming.plans && typeof incoming.plans === 'object' ? incoming.plans : {};
    merged.history = Array.isArray(incoming.history) ? incoming.history : seedHistory();
    merged.weightLog = Array.isArray(incoming.weightLog) ? incoming.weightLog : [];
    merged.lastSync = incoming.lastSync || null;
    merged.status = incoming.status || merged.status;
    return merged;
  }

  function bindGlobalEvents() {
    appRoot.addEventListener('click', onClick);
    appRoot.addEventListener('submit', onSubmit);
    appRoot.addEventListener('input', onInput);
    window.addEventListener('online', () => {
      state.status = { text: 'Conexión restablecida. Los datos siguen sincronizados localmente.', type: 'success' };
      render();
      queueSave();
    });
    window.addEventListener('offline', () => {
      state.status = { text: 'Estás sin conexión. La app seguirá funcionando con datos locales.', type: 'warning' };
      render();
    });
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.installPrompt = event;
      render();
    });
  }

  function onClick(event) {
    const actionTarget = event.target.closest('[data-action]');
    const tabTarget = event.target.closest('[data-tab]');
    const recipeTarget = event.target.closest('[data-recipe-id]');
    const categoryTarget = event.target.closest('[data-category]');

    if (tabTarget) {
      state.tab = tabTarget.dataset.tab;
      state.selectedRecipeId = null;
      render();
      queueSave();
      return;
    }

    if (recipeTarget) {
      state.selectedRecipeId = recipeTarget.dataset.recipeId;
      render();
      queueSave();
      return;
    }

    if (categoryTarget) {
      state.recipeCategory = categoryTarget.dataset.category;
      render();
      queueSave();
      return;
    }

    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (action === 'swap-meal' || action === 'toggle-lock' || action === 'open-meal-detail') {
      const mealCard = actionTarget.closest('[data-meal-slot]');
      const slot = mealCard?.dataset.mealSlot;
      if (!slot) return;
      if (action === 'swap-meal') {
        swapMeal(slot);
      } else if (action === 'toggle-lock') {
        toggleMealLock(slot);
      } else {
        const recipeId = getActivePlan().meals[slot]?.selectedRecipeId;
        if (recipeId) {
          state.selectedRecipeId = recipeId;
          render();
        }
      }
      return;
    }

    switch (action) {
      case 'next-plan':
        state.activeDate = addDays(state.activeDate, 1);
        ensureTodayPlan();
        state.status = { text: `Se generó el plan para ${formatDateLabel(state.activeDate)}.`, type: 'success' };
        queueSave();
        render();
        break;
      case 'regenerate-plan':
        regenerateCurrentPlan();
        break;
      case 'lock-day':
        lockEntireDay();
        break;
      case 'open-recipes':
        state.tab = 'recipes';
        render();
        break;
      case 'open-settings':
        state.tab = 'settings';
        render();
        break;
      case 'generate-shopping':
        state.tab = 'shopping';
        render();
        break;
      case 'open-install':
        installApp();
        break;
      case 'open-recipe-creator':
        state.recipeDraftOpen = true;
        state.recipeDraft = createEmptyRecipeDraft();
        render();
        break;
      case 'close-recipe-creator':
        state.recipeDraftOpen = false;
        render();
        break;
      case 'close-recipe-detail':
        state.selectedRecipeId = null;
        render();
        break;
      case 'export-data':
        exportState();
        break;
      case 'import-data':
        document.getElementById('import-file')?.click();
        break;
      case 'set-shopping-days':
        state.shoppingDays = Number(actionTarget.dataset.days) || 3;
        render();
        queueSave();
        break;
      case 'add-weight-entry':
        addWeightEntry();
        break;
      case 'dismiss-status':
        state.status = { text: '', type: 'info' };
        render();
        break;
      case 'previous-step':
        state.onboardingStep = Math.max(0, state.onboardingStep - 1);
        render();
        break;
      default:
        break;
    }
  }

  function onInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;

    if (target.id === 'recipe-query') {
      state.recipeQuery = target.value;
      render();
      queueSave();
      return;
    }

    if (target.name && target.form && target.form.id === 'onboarding-form') {
      updateOnboardingDraft(target);
      return;
    }

    if (target.name && target.form && target.form.id === 'recipe-creator-form') {
      updateRecipeDraft(target);
    }
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();

    if (form.id === 'onboarding-form') {
      if (!validateOnboardingStep()) return;
      if (state.onboardingStep < 2) {
        state.onboardingStep += 1;
        render();
        return;
      }
      completeOnboarding();
      return;
    }

    if (form.id === 'settings-form') {
      saveSettings(form);
      return;
    }

    if (form.id === 'recipe-creator-form') {
      saveCustomRecipe(form);
      return;
    }

    if (form.id === 'shopping-form') {
      state.shoppingDays = Number(form.shoppingDays.value) || 3;
      render();
      queueSave();
    }
  }

  function updateOnboardingDraft(target) {
    if (target.name === 'restrictions') {
      const current = new Set(state.onboardingDraft.restrictions || []);
      if (target.checked) current.add(target.value);
      else current.delete(target.value);
      state.onboardingDraft.restrictions = Array.from(current);
      return;
    }
    const value = target.type === 'number' ? Number(target.value) : target.value;
    state.onboardingDraft = { ...state.onboardingDraft, [target.name]: value };
  }

  function updateRecipeDraft(target) {
    const value = target.type === 'number' ? Number(target.value) : target.value;
    state.recipeDraft = { ...state.recipeDraft, [target.name]: value };
  }

  function validateOnboardingStep() {
    const draft = state.onboardingDraft;
    if (state.onboardingStep === 0) return Boolean(draft.name?.trim() && Number(draft.weight) > 0 && Number(draft.height) > 0);
    if (state.onboardingStep === 1) return Boolean(Number(draft.age) > 0 && draft.activity);
    return true;
  }

  function completeOnboarding() {
    const draft = clone(state.onboardingDraft);
    draft.completed = true;
    state.profile = draft;
    syncGoalsFromProfile();
    state.profile.completed = true;
    state.activeDate = todayKey();
    ensureTodayPlan(true);
    seedHistoryIfNeeded(true);
    state.status = { text: 'Perfil guardado. Se generó tu plan alto en proteína para hoy.', type: 'success' };
    queueSave();
    render();
  }

  function saveSettings(form) {
    const profile = {
      ...state.profile,
      name: form.name.value.trim() || state.profile.name,
      age: Number(form.age.value) || state.profile.age,
      height: Number(form.height.value) || state.profile.height,
      weight: Number(form.weight.value) || state.profile.weight,
      targetWeight: Number(form.targetWeight.value) || state.profile.targetWeight,
      activity: form.activity.value,
      dietaryStyle: form.dietaryStyle.value,
      unit: form.unit.value,
      goalMode: form.goalMode.value,
      restrictions: Array.from(form.querySelectorAll('input[name="restrictions"]:checked')).map((input) => input.value),
      completed: true,
      notes: form.notes.value.trim(),
    };
    state.profile = profile;
    syncGoalsFromProfile();
    ensureTodayPlan(true);
    state.status = { text: 'Ajustes guardados y objetivos recalculados.', type: 'success' };
    queueSave();
    render();
  }

  function saveCustomRecipe(form) {
    const rawName = form.name.value.trim();
    if (!rawName) {
      state.status = { text: 'Escribe un nombre para la receta.', type: 'warning' };
      render();
      return;
    }
    const ingredients = String(form.ingredients.value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, amount = 'al gusto'] = line.split('|').map((part) => part.trim());
        return { name, amount, section: guessSection(name) };
      });
    const steps = String(form.steps.value || '')
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);
    const customRecipe = {
      id: `custom-${cryptoId()}`,
      name: rawName,
      mealType: form.mealType.value,
      categories: [form.category.value || 'Comidas Rápidas'],
      emoji: form.emoji.value || '🍽️',
      accent: ['#334155', '#111827'],
      prepTime: Number(form.prepTime.value) || 15,
      proteinSource: form.proteinSource.value.trim() || 'Fuente proteica local',
      calories: Number(form.calories.value) || 500,
      protein: Number(form.protein.value) || 30,
      carbs: Number(form.carbs.value) || 40,
      fats: Number(form.fats.value) || 15,
      sections: Array.from(new Set(ingredients.map((item) => item.section))),
      dietary: ['omnivore', 'flexible', 'pescatarian', 'vegetarian'],
      allergens: [],
      ingredients,
      steps: steps.length ? steps : ['Prepara los ingredientes.', 'Cocina y sirve.'],
      notes: form.notes.value.trim() || 'Receta personalizada del usuario.',
      custom: true,
    };
    state.customRecipes = [customRecipe, ...state.customRecipes].slice(0, 40);
    state.selectedRecipeId = customRecipe.id;
    state.recipeDraftOpen = false;
    state.status = { text: 'Receta personalizada guardada en tu biblioteca local.', type: 'success' };
    queueSave();
    render();
  }

  function addWeightEntry() {
    const field = document.getElementById('weight-entry');
    if (!field) return;
    const weight = Number(field.value);
    if (!weight || weight <= 0) {
      state.status = { text: 'Introduce un peso válido.', type: 'warning' };
      render();
      return;
    }
    const entry = {
      date: todayKey(),
      weight,
      calories: getDailyTotals(getActivePlan()).calories,
      protein: getDailyTotals(getActivePlan()).protein,
    };
    state.weightLog = [...state.weightLog.filter((item) => item.date !== entry.date), entry];
    state.history = [...state.history.filter((item) => item.date !== entry.date), entry].slice(-90);
    state.status = { text: 'Peso registrado en tu historial local.', type: 'success' };
    queueSave();
    render();
  }

  function swapMeal(slot) {
    const plan = getActivePlan();
    const meal = plan.meals[slot];
    if (!meal || meal.locked) {
      state.status = { text: 'Desbloquea la comida para poder intercambiarla.', type: 'warning' };
      render();
      return;
    }
    const nextIndex = (meal.optionIndex + 1) % meal.options.length;
    meal.optionIndex = nextIndex;
    meal.selectedRecipeId = meal.options[nextIndex];
    persistPlan(state.activeDate, plan);
    state.status = { text: `${MEAL_LABELS[slot]} cambiada por una alternativa similar.`, type: 'success' };
    queueSave();
    render();
  }

  function toggleMealLock(slot) {
    const plan = getActivePlan();
    const meal = plan.meals[slot];
    if (!meal) return;
    meal.locked = !meal.locked;
    persistPlan(state.activeDate, plan);
    state.status = { text: meal.locked ? `${MEAL_LABELS[slot]} bloqueada para hoy.` : `${MEAL_LABELS[slot]} desbloqueada.`, type: 'info' };
    queueSave();
    render();
  }

  function lockEntireDay() {
    const plan = getActivePlan();
    MEAL_ORDER.forEach((slot) => {
      if (plan.meals[slot]) plan.meals[slot].locked = true;
    });
    persistPlan(state.activeDate, plan);
    state.status = { text: 'El día completo quedó bloqueado.', type: 'info' };
    queueSave();
    render();
  }

  function regenerateCurrentPlan() {
    const preserved = getActivePlan();
    state.plans[state.activeDate] = generatePlanForDate(state.activeDate, preserved);
    state.status = { text: 'Se regeneró el plan del día sin tocar las comidas bloqueadas.', type: 'success' };
    queueSave();
    render();
  }

  function ensureTodayPlan(forceRegenerate = false) {
    const date = state.activeDate || todayKey();
    if (!forceRegenerate && state.plans[date]) return state.plans[date];
    state.plans[date] = generatePlanForDate(date, forceRegenerate ? null : state.plans[date]);
    return state.plans[date];
  }

  function generatePlanForDate(date, preservePlan = null) {
    const plan = { date, meals: {} };
    MEAL_ORDER.forEach((slot) => {
      const options = getRecipeOptions(slot, date);
      const preservedMeal = preservePlan?.meals?.[slot];
      const selectedId = preservedMeal && preservedMeal.locked && options.some((recipe) => recipe.id === preservedMeal.selectedRecipeId)
        ? preservedMeal.selectedRecipeId
        : options[0]?.id || null;
      plan.meals[slot] = {
        slot,
        locked: Boolean(preservedMeal?.locked),
        options: options.slice(0, 3).map((recipe) => recipe.id),
        optionIndex: Math.max(0, options.findIndex((recipe) => recipe.id === selectedId)),
        selectedRecipeId: selectedId,
      };
    });
    return plan;
  }

  function getRecipeOptions(slot, date) {
    const mealType = slot === 'breakfast' ? 'breakfast' : slot === 'lunch' ? 'lunch' : 'dinner';
    const recipes = getAllRecipes().filter((recipe) => recipe.mealType === mealType);
    const seed = `${date}-${slot}-${state.profile.dietaryStyle}-${state.profile.restrictions.join(',')}`;
    const target = mealTarget(slot);
    return recipes
      .filter((recipe) => recipeMatchesProfile(recipe, state.profile))
      .map((recipe) => ({ recipe, score: scoreRecipe(recipe, target, seed) }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.recipe)
      .slice(0, 3);
  }

  function scoreRecipe(recipe, target, seed) {
    const rng = seededRandom(`${recipe.id}-${seed}`);
    const proteinScore = 1 - Math.min(1, Math.abs(recipe.protein - target.protein) / Math.max(1, target.protein));
    const calorieScore = 1 - Math.min(1, Math.abs(recipe.calories - target.calories) / Math.max(1, target.calories));
    const styleBonus = state.profile.goalMode === 'gain' ? 0.08 : 0.02;
    const priorityBonus = recipe.categories.includes('Post-Entrenamiento') ? 0.05 : 0;
    return proteinScore * 0.6 + calorieScore * 0.3 + styleBonus + priorityBonus + rng * 0.1;
  }

  function mealTarget(slot) {
    const ratio = slot === 'breakfast' ? 0.28 : slot === 'lunch' ? 0.38 : 0.34;
    return { calories: state.goals.calories * ratio, protein: state.goals.protein * ratio };
  }

  function recipeMatchesProfile(recipe, profile) {
    const styleAllowed = recipe.dietary.includes(profile.dietaryStyle) || recipe.dietary.includes('flexible');
    if (!styleAllowed) return false;
    return !profile.restrictions.some((restriction) => recipe.allergens.includes(restriction));
  }

  function getAllRecipes() {
    return [...baseRecipes, ...state.customRecipes];
  }

  function getRecipeById(id) {
    return getAllRecipes().find((recipe) => recipe.id === id) || null;
  }

  function getActivePlan() {
    return ensureTodayPlan();
  }

  function persistPlan(date, plan) {
    state.plans[date] = plan;
  }

  function getDailyTotals(plan = getActivePlan()) {
    return MEAL_ORDER.reduce((totals, slot) => {
      const recipe = getRecipeById(plan.meals[slot]?.selectedRecipeId);
      if (recipe) {
        totals.calories += recipe.calories;
        totals.protein += recipe.protein;
        totals.carbs += recipe.carbs;
        totals.fats += recipe.fats;
      }
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }

  function shoppingListItems(days) {
    const items = new Map();
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(state.activeDate, offset);
      const plan = state.plans[date] || generatePlanForDate(date, null);
      state.plans[date] = plan;
      MEAL_ORDER.forEach((slot) => {
        const recipe = getRecipeById(plan.meals[slot]?.selectedRecipeId);
        if (!recipe) return;
        recipe.ingredients.forEach((ingredient) => {
          const key = `${ingredient.section}::${ingredient.name}`;
          const existing = items.get(key);
          if (existing) {
            existing.days += 1;
            existing.meals.push(`${MEAL_LABELS[slot]} · ${formatDateLabel(date)}`);
          } else {
            items.set(key, {
              section: ingredient.section,
              name: ingredient.name,
              amount: ingredient.amount,
              days: 1,
              meals: [`${MEAL_LABELS[slot]} · ${formatDateLabel(date)}`],
            });
          }
        });
      });
    }
    return Array.from(items.values()).sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
  }

  function computeGoals(profile) {
    const activity = activityLevels[profile.activity] || activityLevels.moderate;
    const sexAdjustment = profile.sex === 'female' ? -161 : 5;
    const bmr = 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * Number(profile.age) + sexAdjustment;
    const baseCalories = Math.round(bmr * activity.multiplier);
    const surplus = profile.goalMode === 'gain' ? 300 : profile.goalMode === 'maintain' ? 150 : 80;
    const calories = Math.max(2200, baseCalories + surplus);
    const protein = Math.round(Number(profile.weight) * (profile.dietaryStyle === 'vegetarian' ? 2.0 : 2.2));
    const fats = Math.round(Number(profile.weight) * 0.9);
    const carbs = Math.max(220, Math.round((calories - protein * 4 - fats * 9) / 4));
    return { calories, protein, fats, carbs };
  }

  function syncGoalsFromProfile() {
    state.goals = computeGoals(state.profile);
  }

  function seedHistoryIfNeeded(force = false) {
    if (state.history.length && !force) return;
    state.history = Array.from({ length: 14 }, (_, index) => {
      const day = addDays(todayKey(), index - 13);
      const calories = Math.round(defaultGoals.calories * (0.9 + ((index % 5) * 0.03)));
      const protein = Math.round(defaultGoals.protein * (0.88 + ((index % 4) * 0.04)));
      const weight = Number((state.profile.weight - 0.7 + index * 0.08).toFixed(1));
      return { date: day, calories, protein, weight };
    });
  }

  function seedHistory() {
    return Array.from({ length: 14 }, (_, index) => ({ date: addDays(todayKey(), index - 13), calories: 0, protein: 0, weight: 0 }));
  }

  function createEmptyRecipeDraft() {
    return { name: '', mealType: 'lunch', category: 'Comidas Rápidas', emoji: '🍽️', prepTime: 15, proteinSource: '', calories: 500, protein: 30, carbs: 40, fats: 15, ingredients: '', steps: '', notes: '' };
  }

  function render() {
    document.title = `${TAB_LABELS[state.tab] || 'Plan comida'} · PWA local-first`;
    const plan = getActivePlan();
    const totals = getDailyTotals(plan);
    const completion = Math.min(100, Math.round((totals.protein / state.goals.protein) * 100));
    appRoot.innerHTML = `
      <div class="app-shell">
        <div class="ambient ambient--one"></div>
        <div class="ambient ambient--two"></div>
        <div class="noise-layer" aria-hidden="true"></div>
        <header class="topbar glass-panel">
          <div>
            <p class="eyebrow">PWA local-first · ectomorfos · España</p>
            <h1>Plan de comida alto en proteína</h1>
            <p class="subtitle">Menús con ingredientes fáciles de encontrar en supermercados españoles, guardados en tu dispositivo con IndexedDB.</p>
          </div>
          <div class="topbar-actions">
            ${state.installPrompt ? '<button class="btn btn--ghost" data-action="open-install">Instalar app</button>' : ''}
            <button class="btn btn--ghost" data-action="open-settings">Ajustes</button>
          </div>
        </header>

        <section class="status-bar" aria-live="polite">
          ${renderStatus()}
          <div class="connection-pill ${navigator.onLine ? 'is-online' : 'is-offline'}"><span class="dot"></span>${navigator.onLine ? 'Sincronización local activa' : 'Modo offline activo'}</div>
        </section>

        <nav class="tabs glass-panel" aria-label="Navegación principal">
          ${Object.entries(TAB_LABELS).map(([tab, label]) => `<button class="tab ${state.tab === tab ? 'is-active' : ''}" data-tab="${tab}" aria-current="${state.tab === tab ? 'page' : 'false'}">${label}</button>`).join('')}
        </nav>

        <main class="content-layout">
          ${renderTabContent(plan, totals, completion)}
        </main>

        ${renderRecipeDetailModal()}
        ${renderOnboardingModal()}
        ${renderRecipeCreatorModal()}
      </div>
    `;
  }

  function renderStatus() {
    if (!state.status.text) return '<p class="status-copy">Tu plan y tus recetas se guardan solo en este dispositivo.</p>';
    return `
      <div class="status-message status-message--${state.status.type}">
        <span>${escapeHtml(state.status.text)}</span>
        <button class="status-close" type="button" data-action="dismiss-status" aria-label="Cerrar mensaje">×</button>
      </div>
    `;
  }

  function renderTabContent(plan, totals, completion) {
    if (!state.profile.completed) {
      return `<section class="hero hero--onboarding glass-panel"><div><p class="eyebrow">Bienvenida</p><h2>Vamos a configurar tu perfil para crear un plan potente y realista.</h2><p>Solo tardarás unos minutos. Después verás 3 comidas principales por día, recetas adaptadas y una lista de compra automática.</p></div><div class="hero-card hero-card--accent"><p class="hero-card__label">Paso actual</p><strong>Onboarding inicial</strong><p>Guardado local, sin cuentas ni nube.</p></div></section>${renderOnboardingModal()}`;
    }
    switch (state.tab) {
      case 'plan': return renderDashboard(plan, totals, completion);
      case 'recipes': return renderRecipes();
      case 'progress': return renderProgress();
      case 'shopping': return renderShoppingList();
      case 'settings': return renderSettings();
      default: return renderDashboard(plan, totals, completion);
    }
  }

  function renderDashboard(plan, totals, completion) {
    return `
      <section class="hero glass-panel">
        <div class="hero-copy">
          <p class="eyebrow">Mi Plan</p>
          <h2>Meals for Today · ${formatDateLabel(plan.date)}</h2>
          <p class="subtitle">Objetivo diario: ${state.goals.calories.toLocaleString('es-ES')} kcal · ${state.goals.protein} g proteína. Hoy llevas ${totals.calories.toLocaleString('es-ES')} kcal y ${totals.protein} g de proteína.</p>
          <div class="progress-rail" aria-label="Progreso de proteína"><span class="progress-rail__label">Proteína</span><div class="progress-rail__track"><span style="width:${completion}%"></span></div><span class="progress-rail__value">${completion}%</span></div>
        </div>
        <div class="hero-actions">
          <button class="btn btn--primary" data-action="next-plan">Generar Plan Siguiente</button>
          <button class="btn btn--ghost" data-action="regenerate-plan">Modificar Plan Diario</button>
          <button class="btn btn--ghost" data-action="lock-day">Bloquear día</button>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="stack">
          <h3 class="section-title">Comidas de hoy</h3>
          <div class="meal-grid">${MEAL_ORDER.map((slot) => renderMealCard(slot, plan.meals[slot])).join('')}</div>
        </div>

        <aside class="summary-panel glass-panel">
          <h3 class="section-title">Resumen nutricional</h3>
          <div class="summary-cards">
            ${renderMetricCard('Calorías', `${totals.calories.toLocaleString('es-ES')} / ${state.goals.calories.toLocaleString('es-ES')}`, `${Math.round((totals.calories / state.goals.calories) * 100)}%`)}
            ${renderMetricCard('Proteína', `${totals.protein} / ${state.goals.protein} g`, `${Math.round((totals.protein / state.goals.protein) * 100)}%`)}
            ${renderMetricCard('Carbohidratos', `${totals.carbs} g`, 'Aproximado')}
            ${renderMetricCard('Grasas', `${totals.fats} g`, 'Aproximado')}
          </div>
          <div class="mini-progress"><h4>Visión semanal</h4>${renderMiniWeeklyBars()}</div>
          <div class="quick-actions"><label class="input-group"><span>Peso actual</span><input id="weight-entry" type="number" min="30" step="0.1" placeholder="${state.profile.weight}" aria-label="Registrar peso actual"></label><button class="btn btn--secondary" data-action="add-weight-entry">Registrar peso</button></div>
        </aside>
      </section>

      <section class="dashboard-grid dashboard-grid--secondary">
        <article class="glass-panel snapshot-card"><h3 class="section-title">Objetivo ectomorfo</h3><p>Calorías altas, proteína repartida en 3 comidas principales y opciones comunes en España para adherencia real.</p><ul class="checklist"><li>Proteína por comida: 35–60 g</li><li>Ingredientes accesibles y económicos</li><li>Plan local-first con cambios sin conexión</li></ul></article>
        <article class="glass-panel snapshot-card"><h3 class="section-title">Acciones rápidas</h3><div class="action-stack"><button class="btn btn--ghost" data-action="open-recipes">Explorar recetas</button><button class="btn btn--ghost" data-action="generate-shopping">Ver lista de compra</button><button class="btn btn--ghost" data-action="open-settings">Revisar ajustes</button></div></article>
      </section>
    `;
  }

  function renderMealCard(slot, meal) {
    const recipe = getRecipeById(meal?.selectedRecipeId);
    if (!recipe) return '<article class="meal-card glass-panel">No hay receta disponible.</article>';
    return `
      <article class="meal-card glass-panel" data-meal-slot="${slot}">
        <div class="meal-card__art" style="background: linear-gradient(160deg, ${recipe.accent[0]}, ${recipe.accent[1]});"><span class="meal-card__emoji">${recipe.emoji}</span><button class="icon-btn" data-action="toggle-lock" aria-label="${meal.locked ? 'Desbloquear' : 'Bloquear'} ${MEAL_LABELS[slot]}">${meal.locked ? '🔒' : '🔓'}</button></div>
        <div class="meal-card__body">
          <div class="meal-card__header"><div><p class="eyebrow">${MEAL_LABELS[slot]}</p><h4>${escapeHtml(recipe.name)}</h4><p class="meal-card__meta">${escapeHtml(recipe.proteinSource)} · ${recipe.prepTime} min</p></div><button class="text-button" data-action="open-meal-detail">Ver</button></div>
          <div class="macro-row"><span>${recipe.calories} kcal</span><span>${recipe.protein} g proteína</span><span>${recipe.carbs} g carbos</span><span>${recipe.fats} g grasas</span></div>
          <div class="meal-card__tags">${recipe.categories.slice(0, 2).map((category) => `<span class="chip">${category}</span>`).join('')}</div>
          <div class="meal-card__actions"><button class="btn btn--ghost btn--small" data-action="swap-meal" ${meal.locked ? 'disabled' : ''}>Swap</button><button class="btn btn--secondary btn--small" data-recipe-id="${recipe.id}">Detalle</button></div>
        </div>
      </article>
    `;
  }

  function renderMetricCard(label, value, hint) {
    return `<article class="metric-card"><span class="metric-card__label">${label}</span><strong>${value}</strong><small>${hint}</small></article>`;
  }

  function renderMiniWeeklyBars() {
    const entries = state.history.slice(-7);
    if (!entries.length) return '<p class="muted">Sin datos todavía.</p>';
    return `<div class="bars">${entries.map((entry) => { const height = Math.max(20, Math.min(100, Math.round((entry.protein / state.goals.protein) * 100))); return `<div class="bar-item"><span style="height:${height}%"></span><small>${shortDay(entry.date)}</small></div>`; }).join('')}</div>`;
  }

  function renderRecipes() {
    const recipes = getAllRecipes().filter((recipe) => {
      const query = normalize(state.recipeQuery);
      const inQuery = !query || normalize(recipe.name).includes(query) || normalize(recipe.ingredients.map((item) => item.name).join(' ')).includes(query);
      const inCategory = state.recipeCategory === 'all' || recipe.categories.includes(state.recipeCategory);
      return inQuery && inCategory && recipeMatchesProfile(recipe, state.profile);
    });

    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading"><div><p class="eyebrow">Recetas</p><h2>Biblioteca alta en proteína con ingredientes de supermercado</h2></div><button class="btn btn--primary" data-action="open-recipe-creator">Nueva receta</button></div>
          <div class="search-row"><label class="input-group input-group--wide" for="recipe-query"><span>Buscar por ingrediente o nombre</span><input id="recipe-query" type="search" placeholder="pollo, yogur, arroz, atún..." value="${escapeAttr(state.recipeQuery)}" aria-label="Buscar receta"></label></div>
          <div class="chip-row" role="tablist" aria-label="Filtros de recetas">${recipeCategories.map((category) => `<button class="chip chip--filter ${state.recipeCategory === category ? 'is-active' : ''}" data-category="${category}">${category === 'all' ? 'Todas' : category}</button>`).join('')}</div>
        </article>
        <section class="recipe-grid">${recipes.map(renderRecipeCard).join('') || '<article class="glass-panel empty-state">No hay recetas que coincidan con el filtro actual.</article>'}</section>
      </section>
    `;
  }

  function renderRecipeCard(recipe) {
    return `<article class="recipe-card glass-panel" data-recipe-id="${recipe.id}"><div class="recipe-card__art" style="background: linear-gradient(155deg, ${recipe.accent[0]}, ${recipe.accent[1]});"><span>${recipe.emoji}</span><span class="recipe-card__time">${recipe.prepTime} min</span></div><div class="recipe-card__body"><div><p class="eyebrow">${MEAL_LABELS[recipe.mealType] || 'Snack'}</p><h3>${escapeHtml(recipe.name)}</h3><p class="recipe-card__meta">${escapeHtml(recipe.proteinSource)}</p></div><div class="macro-row macro-row--compact"><span>${recipe.protein} g</span><span>${recipe.calories} kcal</span><span>${recipe.prepTime} min</span></div><p class="recipe-card__note">${escapeHtml(recipe.notes)}</p></div></article>`;
  }

  function renderProgress() {
    const caloriesSeries = state.history.slice(-14).map((entry) => entry.calories || 0);
    const proteinSeries = state.history.slice(-14).map((entry) => entry.protein || 0);
    const weightSeries = state.history.slice(-14).map((entry) => entry.weight || 0);
    const avgProtein = proteinSeries.length ? Math.round(proteinSeries.reduce((sum, value) => sum + value, 0) / proteinSeries.length) : 0;
    const avgCalories = caloriesSeries.length ? Math.round(caloriesSeries.reduce((sum, value) => sum + value, 0) / caloriesSeries.length) : 0;
    const lastWeight = weightSeries.filter(Boolean).slice(-1)[0] || state.profile.weight;
    const milestones = buildMilestones();

    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading"><div><p class="eyebrow">Progreso</p><h2>Seguimiento semanal y mensual</h2></div><p class="muted">Datos guardados localmente; puedes revisarlos sin conexión.</p></div>
          <div class="progress-grid">${renderChartCard('Calorías', caloriesSeries, state.goals.calories, '#0ea5e9')} ${renderChartCard('Proteína', proteinSeries, state.goals.protein, '#22c55e')} ${renderChartCard('Peso', weightSeries.map((value) => (value || state.profile.weight)), state.profile.targetWeight, '#f59e0b', true)}</div>
        </article>
        <section class="progress-grid progress-grid--secondary">
          <article class="glass-panel summary-card"><h3 class="section-title">Resumen rápido</h3><ul class="detail-list"><li><strong>Promedio de calorías</strong><span>${avgCalories} kcal</span></li><li><strong>Promedio de proteína</strong><span>${avgProtein} g</span></li><li><strong>Peso actual registrado</strong><span>${Number(lastWeight).toFixed(1)} kg</span></li><li><strong>Objetivo</strong><span>${state.profile.targetWeight} kg</span></li></ul></article>
          <article class="glass-panel summary-card"><h3 class="section-title">Milestones</h3><div class="milestone-list">${milestones.map((item) => `<div class="milestone ${item.done ? 'is-done' : ''}"><span>${item.icon}</span><div><strong>${item.title}</strong><p>${item.text}</p></div></div>`).join('')}</div></article>
        </section>
      </section>
    `;
  }

  function renderChartCard(label, series, target, color, inverted = false) {
    return `<article class="chart-card"><div class="chart-card__heading"><div><span class="eyebrow">${label}</span><strong>${series.length ? series[series.length - 1] : 0}${label === 'Peso' ? ' kg' : ''}</strong></div><small>Objetivo: ${target}${label === 'Peso' ? ' kg' : label === 'Calorías' ? ' kcal' : ' g'}</small></div>${buildSvgChart(series, target, color, inverted)}</article>`;
  }

  function renderShoppingList() {
    const items = shoppingListItems(Number(state.shoppingDays) || 3);
    const grouped = items.reduce((groups, item) => {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
      return groups;
    }, {});
    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading"><div><p class="eyebrow">Lista de la compra</p><h2>Planificada para ${state.shoppingDays} días</h2></div><form id="shopping-form" class="inline-form"><label class="input-group input-group--compact"><span>Días</span><select name="shoppingDays">${[1, 3, 5, 7].map((days) => `<option value="${days}" ${Number(state.shoppingDays) === days ? 'selected' : ''}>${days}</option>`).join('')}</select></label><button class="btn btn--secondary" type="submit">Actualizar</button></form></div>
          <p class="muted">Los ingredientes se agrupan por secciones habituales de supermercado para facilitar la compra.</p>
        </article>
        <section class="shopping-grid">${Object.entries(grouped).map(([section, sectionItems]) => `<article class="glass-panel shopping-section"><h3>${section}</h3><ul class="shopping-list">${sectionItems.map((item) => `<li><strong>${item.name}</strong><span>${item.amount} · ${item.days} día(s)</span><small>${item.meals.join(' · ')}</small></li>`).join('')}</ul></article>`).join('')}</section>
      </section>
    `;
  }

  function renderSettings() {
    const draft = state.profile;
    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading">
            <div><p class="eyebrow">Ajustes</p><h2>Perfil, objetivos y preferencias</h2></div>
            <div class="inline-actions"><button class="btn btn--ghost" data-action="export-data">Exportar datos</button><button class="btn btn--ghost" data-action="import-data">Importar datos</button><input id="import-file" type="file" accept="application/json" class="hidden-input" hidden></div>
          </div>
          <form id="settings-form" class="settings-grid">
            ${renderTextField('name', 'Nombre', draft.name)}
            ${renderNumberField('age', 'Edad', draft.age, 16, 100)}
            ${renderNumberField('height', `Altura (${draft.unit === 'metric' ? 'cm' : 'in'})`, draft.height, 120, 230)}
            ${renderNumberField('weight', `Peso (${draft.unit === 'metric' ? 'kg' : 'lb'})`, draft.weight, 30, 200, 0.1)}
            ${renderNumberField('targetWeight', 'Peso objetivo', draft.targetWeight, 30, 200, 0.1)}
            ${renderSelectField('activity', 'Actividad', activityLevels, draft.activity, true)}
            ${renderSelectField('dietaryStyle', 'Estilo dietético', dietaryStyles, draft.dietaryStyle, false)}
            ${renderSelectField('goalMode', 'Objetivo', { gain: 'Ganar masa', maintain: 'Mantener', cut: 'Definir' }, draft.goalMode, false)}
            ${renderSelectField('unit', 'Unidades', { metric: 'Métricas', imperial: 'Imperiales' }, draft.unit, false)}
            <fieldset class="field-group field-group--full"><legend>Restricciones</legend><div class="check-grid">${restrictionsCatalog.map((item) => `<label class="check-item"><input type="checkbox" name="restrictions" value="${item.id}" ${draft.restrictions.includes(item.id) ? 'checked' : ''}><span>${item.label}</span></label>`).join('')}</div></fieldset>
            <div class="field-group field-group--full"><label class="input-group"><span>Nota alimentaria</span><textarea name="notes" rows="3" placeholder="Ej. Entreno por la tarde, prefiero comida más densa...">${escapeHtml(draft.notes || '')}</textarea></label></div>
            <div class="field-group field-group--full form-footer"><button class="btn btn--primary" type="submit">Guardar cambios</button><p class="muted">Tus objetivos se recalculan al guardar y se mantienen en este dispositivo.</p></div>
          </form>
        </article>
        <article class="glass-panel section-panel"><div class="section-heading"><div><p class="eyebrow">Nueva receta</p><h2>Guarda tus propios platos</h2></div><button class="btn btn--secondary" data-action="open-recipe-creator">Abrir creador</button></div><p class="muted">Puedes usar este creador para añadir recetas locales con pollo, huevos, atún, legumbres o lácteos.</p></article>
      </section>
    `;
  }

  function renderRecipeCreatorModal() {
    if (!state.recipeDraftOpen) return '';
    const draft = state.recipeDraft;
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="creator-title">
          <div class="section-heading"><div><p class="eyebrow">Creador de recetas</p><h2 id="creator-title">Añadir receta personalizada</h2></div><button class="icon-btn icon-btn--plain" data-action="close-recipe-creator" aria-label="Cerrar">×</button></div>
          <form id="recipe-creator-form" class="settings-grid settings-grid--single">
            ${renderTextField('name', 'Nombre de la receta', draft.name)}
            ${renderSelectField('mealType', 'Momento del día', { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' }, draft.mealType, false)}
            ${renderTextField('category', 'Categoría', draft.category)}
            ${renderTextField('emoji', 'Emoji', draft.emoji)}
            ${renderNumberField('prepTime', 'Tiempo de preparación (min)', draft.prepTime, 1, 240)}
            ${renderTextField('proteinSource', 'Fuente de proteína', draft.proteinSource)}
            ${renderNumberField('calories', 'Calorías', draft.calories, 50, 2000)}
            ${renderNumberField('protein', 'Proteína (g)', draft.protein, 1, 200)}
            ${renderNumberField('carbs', 'Carbohidratos (g)', draft.carbs, 1, 300)}
            ${renderNumberField('fats', 'Grasas (g)', draft.fats, 1, 100)}
            <label class="input-group field-group--full"><span>Ingredientes, uno por línea. Usa "nombre | cantidad"</span><textarea name="ingredients" rows="5" placeholder="Pechuga de pollo | 200 g\nArroz | 100 g">${escapeHtml(draft.ingredients)}</textarea></label>
            <label class="input-group field-group--full"><span>Pasos, uno por línea</span><textarea name="steps" rows="4" placeholder="Cocina el arroz.\nMarca el pollo.\nSirve y disfruta.">${escapeHtml(draft.steps)}</textarea></label>
            <label class="input-group field-group--full"><span>Notas</span><textarea name="notes" rows="3">${escapeHtml(draft.notes)}</textarea></label>
            <div class="field-group field-group--full form-footer"><button class="btn btn--primary" type="submit">Guardar receta</button><button class="btn btn--ghost" type="button" data-action="close-recipe-creator">Cancelar</button></div>
          </form>
        </section>
      </div>
    `;
  }

  function renderRecipeDetailModal() {
    const recipe = getRecipeById(state.selectedRecipeId);
    if (!recipe) return '';
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal glass-panel modal--detail" role="dialog" aria-modal="true" aria-labelledby="recipe-title">
          <div class="detail-hero" style="background: linear-gradient(155deg, ${recipe.accent[0]}, ${recipe.accent[1]});"><div><p class="eyebrow">${MEAL_LABELS[recipe.mealType] || 'Snack'}</p><h2 id="recipe-title">${escapeHtml(recipe.name)}</h2><p>${escapeHtml(recipe.proteinSource)} · ${recipe.prepTime} min · ${recipe.calories} kcal</p></div><button class="icon-btn icon-btn--plain" data-action="close-recipe-detail" aria-label="Cerrar">×</button></div>
          <div class="detail-body">
            <div class="macro-row macro-row--detail"><span>${recipe.protein} g proteína</span><span>${recipe.carbs} g carbohidratos</span><span>${recipe.fats} g grasas</span><span>${recipe.sections.join(' · ')}</span></div>
            <p class="muted">${escapeHtml(recipe.notes)}</p>
            <div class="two-column"><section><h3>Ingredientes</h3><ul class="detail-list">${recipe.ingredients.map((ingredient) => `<li><strong>${escapeHtml(ingredient.name)}</strong><span>${escapeHtml(ingredient.amount)}</span></li>`).join('')}</ul></section><section><h3>Preparación</h3><ol class="detail-steps">${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section></div>
          </div>
        </section>
      </div>
    `;
  }

  function buildMilestones() {
    const entries = state.history.slice(-14);
    const avgProtein = entries.length ? entries.reduce((sum, item) => sum + (item.protein || 0), 0) / entries.length : 0;
    const latestWeight = [...entries].reverse().find((item) => item.weight)?.weight || state.profile.weight;
    return [
      { icon: '🥇', title: 'Proteína consistente', text: 'Mantén media semanal por encima del objetivo para crecer más fácil.', done: avgProtein >= state.goals.protein * 0.9 },
      { icon: '📈', title: 'Peso en progreso', text: 'Tu tendencia de peso debería subir poco a poco, sin saltos bruscos.', done: Number(latestWeight) >= Number(state.profile.weight) },
      { icon: '🗂️', title: 'Plan local-first', text: 'Tus recetas, planes y ajustes viven en tu dispositivo y funcionan offline.', done: true },
    ];
  }

  function buildSvgChart(series, target, color, inverted = false) {
    const width = 520;
    const height = 180;
    const padding = 20;
    const values = series.length ? series : [0];
    const max = Math.max(target * 1.25, ...values, 1);
    const min = inverted ? Math.min(target * 0.85, ...values, target * 0.7) : 0;
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => {
      const x = padding + ((width - padding * 2) * index) / Math.max(1, values.length - 1);
      const normalized = (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return { x, y, value };
    });
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const targetY = height - padding - (((target - min) / range) * (height - padding * 2));
    const gradientId = `gradient-${color.replace('#', '')}`;
    return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de progreso"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.6"></stop><stop offset="100%" stop-color="${color}" stop-opacity="0.04"></stop></linearGradient></defs><line x1="20" y1="${targetY.toFixed(1)}" x2="500" y2="${targetY.toFixed(1)}" stroke="${color}" stroke-dasharray="4 6" opacity="0.45"></line><path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path><path d="${line} L 500 160 L 20 160 Z" fill="url(#${gradientId})"></path>${points.map((point, index) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.5" fill="#ffffff" stroke="${color}" stroke-width="2"><title>${series[index]}</title></circle>`).join('')}</svg>`;
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `plan-comida-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    state.status = { text: 'Exportación generada correctamente.', type: 'success' };
    render();
  }

  async function installApp() {
    if (!state.installPrompt) {
      state.status = { text: 'La instalación no está disponible en este momento.', type: 'warning' };
      render();
      return;
    }
    state.installPrompt.prompt();
    const choice = await state.installPrompt.userChoice;
    state.status = choice.outcome === 'accepted' ? { text: 'Gracias por instalar la app.', type: 'success' } : { text: 'La instalación fue pospuesta.', type: 'info' };
    state.installPrompt = null;
    render();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('No se pudo registrar el service worker.', error);
    });
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const dbInstance = request.result;
        if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
          dbInstance.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStateFromIndexedDB() {
    const dbInstance = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function writeStateToIndexedDB(nextState) {
    const dbInstance = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(clone(nextState), STORAGE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function queueSave() {
    clearTimeout(saveQueue);
    saveQueue = setTimeout(async () => {
      state.lastSync = new Date().toISOString();
      try {
        await writeStateToIndexedDB(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Persistencia local fallida, se conserva la sesión en memoria.', error);
      }
    }, 60);
  }

  function renderTextField(name, label, value) {
    return `<label class="input-group"><span>${label}</span><input name="${name}" type="text" value="${escapeAttr(value || '')}"></label>`;
  }

  function renderNumberField(name, label, value, min, max, step = 1) {
    return `<label class="input-group"><span>${label}</span><input name="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${escapeAttr(value)}"></label>`;
  }

  function renderSelectField(name, label, options, value, isMap = false) {
    const pairs = isMap ? Object.entries(options) : Object.entries(options).map(([key, labelValue]) => [key, labelValue]);
    return `<label class="input-group"><span>${label}</span><select name="${name}">${pairs.map(([key, labelValue]) => `<option value="${key}" ${String(value) === key ? 'selected' : ''}>${escapeHtml(labelValue)}</option>`).join('')}</select></label>`;
  }

  function formatDateLabel(value) {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
  }

  function shortDay(value) {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' }).format(new Date(`${value}T12:00:00`));
  }

  function todayKey() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addDays(value, offset) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return dateKey(date);
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('\n', '&#10;');
  }

  function seededRandom(seed) {
    let h = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
      h ^= seed.charCodeAt(index);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  }

  function cryptoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().slice(0, 8);
    return Math.random().toString(16).slice(2, 10);
  }

  function guessSection(name) {
    const normalized = normalize(name);
    if (normalized.includes('pollo') || normalized.includes('pavo') || normalized.includes('ternera')) return 'Carnicería';
    if (normalized.includes('atun') || normalized.includes('salmon') || normalized.includes('merluza')) return 'Pescadería';
    if (normalized.includes('yogur') || normalized.includes('queso') || normalized.includes('requeson')) return 'Lácteos';
    if (normalized.includes('huevo') || normalized.includes('claras')) return 'Huevos';
    if (normalized.includes('arroz') || normalized.includes('avena') || normalized.includes('pasta')) return 'Despensa';
    return 'Despensa';
  }

  function createEmptyRecipeDraft() {
    return { name: '', mealType: 'lunch', category: 'Comidas Rápidas', emoji: '🍽️', prepTime: 15, proteinSource: '', calories: 500, protein: 30, carbs: 40, fats: 15, ingredients: '', steps: '', notes: '' };
  }

  function announce(message) {
    state.status = { text: message, type: 'info' };
  }
})();

