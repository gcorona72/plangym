(() => {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const STORAGE_KEY = 'plan-comida-state-v1';
  const DB_NAME = 'plan-comida-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'kv';
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
  const TAB_LABELS = {
    plan: 'Calendario semanal',
    nutrition: 'Nutrición',
    training: 'Entrenamiento',
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
  const defaultExerciseMediaConfig = {
    provider: 'exercisedb',
    enabled: false,
    rapidApiKey: '',
    rapidApiHost: 'exercisedb.p.rapidapi.com',
    baseUrl: 'https://exercisedb.p.rapidapi.com',
  };

  const defaultState = {
    version: 1,
    tab: 'plan',
    activeDate: todayKey(),
    weekFocusDate: todayKey(),
    weekScrollLeft: 0,
    recipeQuery: '',
    recipeCategory: 'all',
    shoppingDays: 3,
    onboardingStep: 0,
    onboardingDraft: clone(defaultProfile),
    recipeDraftOpen: false,
    recipeDraft: createEmptyRecipeDraft(),
    selectedRecipeId: null,
    selectedExerciseVideoId: null,
    routineModalOpen: false,
    selectedRoutineDate: todayKey(),
    exerciseMediaConfig: clone(defaultExerciseMediaConfig),
    exerciseMediaCache: {},
    exerciseMediaRequests: {},
    status: { text: '', type: 'info' },
    profile: clone(defaultProfile),
    goals: clone(defaultGoals),
    nutrition: createNutritionState(),
    training: createTrainingState(),
    customRecipes: [],
    plans: {},
    history: seedHistory(),
    weightLog: [],
    lastSync: null,
  };

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
    {
      id: 'snack-pavo-queso',
      name: 'Sándwich integral de pavo y queso fresco',
      mealType: 'snack',
      categories: ['Post-Entrenamiento', 'Comidas Rápidas'],
      emoji: '🥪',
      accent: ['#14b8a6', '#0f172a'],
      prepTime: 7,
      proteinSource: 'Pavo y queso fresco',
      calories: 360,
      protein: 28,
      carbs: 34,
      fats: 12,
      sections: ['Panadería', 'Charcutería', 'Lácteos'],
      dietary: ['omnivore', 'flexible'],
      allergens: ['gluten', 'lactose'],
      ingredients: [
        { name: 'Pan integral', amount: '2 rebanadas', section: 'Panadería' },
        { name: 'Pechuga de pavo', amount: '100 g', section: 'Charcutería' },
        { name: 'Queso fresco batido', amount: '80 g', section: 'Lácteos' },
        { name: 'Tomate', amount: '1/2 ud', section: 'Verduras' },
      ],
      steps: ['Tuesta el pan ligeramente.', 'Rellena con pavo, queso fresco y tomate.', 'Cierra y toma como snack o pre/post entreno.'],
      notes: 'Una alternativa rápida y alta en proteína para completar el día.',
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
    announce('Aplicación lista. Tu plan se guarda localmente.');
    render();
    queueSave();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hydrateState(stored) {
    const incoming = stored && typeof stored === 'object' ? stored : {};
    const merged = clone(defaultState);
    merged.tab = incoming.tab || 'plan';
    merged.activeDate = incoming.activeDate || merged.activeDate;
    merged.weekFocusDate = incoming.weekFocusDate || merged.activeDate;
    merged.weekScrollLeft = Number(incoming.weekScrollLeft) || 0;
    merged.recipeQuery = incoming.recipeQuery || '';
    merged.recipeCategory = incoming.recipeCategory || 'all';
    merged.shoppingDays = Number(incoming.shoppingDays) || merged.shoppingDays;
    merged.onboardingStep = Number(incoming.onboardingStep) || 0;
    merged.onboardingDraft = incoming.onboardingDraft ? { ...clone(defaultProfile), ...incoming.onboardingDraft } : clone(defaultProfile);
    merged.recipeDraftOpen = Boolean(incoming.recipeDraftOpen);
    merged.recipeDraft = incoming.recipeDraft ? { ...createEmptyRecipeDraft(), ...incoming.recipeDraft } : createEmptyRecipeDraft();
    merged.selectedRecipeId = incoming.selectedRecipeId || null;
    merged.selectedExerciseVideoId = incoming.selectedExerciseVideoId || null;
    merged.routineModalOpen = Boolean(incoming.routineModalOpen);
    merged.selectedRoutineDate = incoming.selectedRoutineDate || merged.activeDate;
    merged.exerciseMediaConfig = normalizeExerciseMediaConfig(incoming.exerciseMediaConfig);
    merged.exerciseMediaCache = sanitizeExerciseMediaCache(incoming.exerciseMediaCache);
    merged.exerciseMediaRequests = {};
    merged.profile = incoming.profile ? { ...clone(defaultProfile), ...incoming.profile } : clone(defaultProfile);
    merged.goals = incoming.goals ? { ...clone(defaultGoals), ...incoming.goals } : clone(defaultGoals);
    merged.nutrition = incoming.nutrition ? { ...createNutritionState(), ...incoming.nutrition, meals: Array.isArray(incoming.nutrition.meals) ? incoming.nutrition.meals : createNutritionState().meals } : createNutritionState();
    merged.training = incoming.training ? { ...createTrainingState(), ...incoming.training, days: Array.isArray(incoming.training.days) ? incoming.training.days : createTrainingState().days, logsByDate: incoming.training.logsByDate && typeof incoming.training.logsByDate === 'object' ? incoming.training.logsByDate : createTrainingState().logsByDate } : createTrainingState();
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
    appRoot.addEventListener('change', onChange);
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

    if (action === 'swap-week-meal' || action === 'select-week-day') {
      if (action === 'select-week-day') {
        state.activeDate = actionTarget.dataset.date;
        state.weekFocusDate = actionTarget.dataset.date;
        ensureTodayPlan();
        render();
        queueSave();
        return;
      }
      setWeekMealOption(actionTarget.dataset.date, actionTarget.dataset.slot, actionTarget.dataset.optionId);
      return;
    }

    if (action === 'open-exercise-video') {
      state.selectedExerciseVideoId = actionTarget.dataset.exerciseId || null;
      state.selectedRoutineDate = actionTarget.dataset.date || state.selectedRoutineDate || state.activeDate;
      state.routineModalOpen = true;
      primeExerciseMedia(getExerciseById(state.selectedExerciseVideoId));
      render();
      queueSave();
      return;
    }

    if (action === 'close-exercise-video') {
      state.selectedExerciseVideoId = null;
      state.routineModalOpen = false;
      render();
      queueSave();
      return;
    }

    if (action === 'open-training-routine') {
      state.selectedRoutineDate = actionTarget.dataset.date || state.activeDate;
      state.routineModalOpen = true;
      const selectedTraining = getTrainingRoutineForDate(state.selectedRoutineDate);
      state.selectedExerciseVideoId = selectedTraining?.exercises?.[0]?.id || null;
      primeExerciseMedia(getExerciseById(state.selectedExerciseVideoId));
      render();
      queueSave();
      return;
    }

    if (action === 'close-training-routine') {
      state.routineModalOpen = false;
      render();
      queueSave();
      return;
    }

    switch (action) {
      case 'next-plan':
        state.activeDate = addDays(state.activeDate, 1);
        state.weekFocusDate = state.activeDate;
        ensureTodayPlan();
        state.status = { text: `Se generó el plan para ${formatDateLabel(state.activeDate)}.`, type: 'success' };
        queueSave();
        render();
        break;
      case 'previous-week':
        state.activeDate = addDays(state.activeDate, -7);
        state.weekFocusDate = state.activeDate;
        ensureTodayPlan();
        render();
        queueSave();
        break;
      case 'next-week':
        state.activeDate = addDays(state.activeDate, 7);
        state.weekFocusDate = state.activeDate;
        ensureTodayPlan();
        render();
        queueSave();
        break;
      case 'go-today':
        state.activeDate = todayKey();
        state.weekFocusDate = state.activeDate;
        ensureTodayPlan();
        render();
        queueSave();
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
      case 'open-nutrition':
        state.tab = 'nutrition';
        render();
        break;
      case 'open-training':
        state.tab = 'training';
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
      case 'toggle-nutrition-meal':
        toggleNutritionMeal(actionTarget.dataset.mealId);
        break;
      case 'select-training-day':
        state.training.selectedDayId = actionTarget.dataset.dayId;
        render();
        queueSave();
        break;
      case 'save-training-set':
        saveTrainingSet(actionTarget);
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

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

    if (target.id === 'import-file' && target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(String(reader.result || '{}'));
          state = hydrateState(imported);
          syncGoalsFromProfile();
          ensureTodayPlan(true);
          seedHistoryIfNeeded(true);
          state.status = { text: 'Datos importados correctamente desde el archivo local.', type: 'success' };
          queueSave();
          render();
        } catch (error) {
          state.status = { text: 'El archivo importado no es válido.', type: 'error' };
          render();
        }
      };
      reader.readAsText(target.files[0]);
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
    const nextProfile = {
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
    const rapidApiKey = form.exerciseMediaApiKey.value.trim();
    const exerciseMediaEnabled = Boolean(rapidApiKey);
    state.exerciseMediaConfig = {
      ...defaultExerciseMediaConfig,
      enabled: exerciseMediaEnabled,
      rapidApiKey,
      rapidApiHost: form.exerciseMediaApiHost.value.trim() || defaultExerciseMediaConfig.rapidApiHost,
      baseUrl: form.exerciseMediaBaseUrl.value.trim() || defaultExerciseMediaConfig.baseUrl,
    };
    state.profile = nextProfile;
    syncGoalsFromProfile();
    ensureTodayPlan(true);
    state.status = { text: exerciseMediaEnabled ? 'Ajustes guardados. ExerciseDB queda como respaldo remoto para cuando falte un vídeo local.' : 'Ajustes guardados. Los vídeos locales en bucle seguirán siendo la opción principal.', type: 'success' };
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
    return normalizePlanMeals(preservePlan, date, true);
  }

  function normalizePlanMeals(plan, date, fillMissing = false) {
    const source = plan && typeof plan === 'object' ? plan : { meals: {} };
    const normalized = { date, meals: {} };

    MEAL_ORDER.forEach((slot) => {
      const currentMeal = source.meals?.[slot] || {};
      const options = getRecipeOptions(slot, date);
      const selectedRecipeId = currentMeal.selectedRecipeId && options.some((recipe) => recipe.id === currentMeal.selectedRecipeId)
        ? currentMeal.selectedRecipeId
        : fillMissing
          ? options[0]?.id || null
          : currentMeal.selectedRecipeId || null;

      normalized.meals[slot] = {
        ...currentMeal,
        slot,
        locked: Boolean(currentMeal.locked),
        options: options.slice(0, 3).map((recipe) => recipe.id),
        optionIndex: Math.max(0, options.findIndex((recipe) => recipe.id === selectedRecipeId)),
        selectedRecipeId,
      };
    });

    return normalized;
  }

  function getRecipeOptions(slot, date) {
    const mealType = getMealTypeForSlot(slot);
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

  function getMealTypeForSlot(slot) {
    if (slot === 'prepost' || slot === 'nightSnack') return 'snack';
    return slot;
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
    const ratio = MEAL_TARGET_RATIOS[slot] || 0.2;
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
    const hasMeaningfulData = state.history.some((entry) => Number(entry.calories) > 0 || Number(entry.protein) > 0 || Number(entry.weight) > 0);
    if (state.history.length && hasMeaningfulData && !force) return;
    const goals = state.goals || defaultGoals;
    state.history = Array.from({ length: 14 }, (_, index) => {
      const day = addDays(todayKey(), index - 13);
      const calories = Math.round(goals.calories * (0.9 + ((index % 5) * 0.03)));
      const protein = Math.round(goals.protein * (0.88 + ((index % 4) * 0.04)));
      const weight = Number((state.profile.weight - 0.7 + index * 0.08).toFixed(1));
      return { date: day, calories, protein, weight };
    });
  }

  function seedHistory() {
    return Array.from({ length: 14 }, (_, index) => ({ date: addDays(todayKey(), index - 13), calories: 0, protein: 0, weight: 0 }));
  }

  function createNutritionState() {
    return {
      target: { kcal: 3000, protein: 128, fats: 83, carbs: 432 },
      meals: [
        { id: 'meal_1', nombre: 'Desayuno', alimentos: '100g avena, 300ml leche entera, 30g crema de cacahuete, 1 plátano, 2 huevos', macros: { proteina: 35, grasa: 30, carbohidratos: 100 }, kcal: 800, consumed: false, consumedAt: null },
        { id: 'meal_2', nombre: 'Almuerzo', alimentos: '120g arroz blanco (crudo), 150g pechuga de pollo, 1.5 cucharadas aceite de oliva', macros: { proteina: 40, grasa: 25, carbohidratos: 95 }, kcal: 750, consumed: false, consumedAt: null },
        { id: 'meal_3', nombre: 'Pre/Post Entreno', alimentos: '250g yogur griego natural, 20g miel, 50g cereales o pan', macros: { proteina: 15, grasa: 5, carbohidratos: 70 }, kcal: 400, consumed: false, consumedAt: null },
        { id: 'meal_4', nombre: 'Cena', alimentos: '120g pasta (crudo), 150g ternera magra picada, salsa de tomate, 1 cucharada aceite', macros: { proteina: 40, grasa: 20, carbohidratos: 90 }, kcal: 800, consumed: false, consumedAt: null },
        { id: 'meal_5', nombre: 'Snack Nocturno', alimentos: '30g nueces o almendras, 200ml leche entera', macros: { proteina: 10, grasa: 22, carbohidratos: 15 }, kcal: 300, consumed: false, consumedAt: null },
      ],
    };
  }

  function createTrainingState() {
    const program = buildTrainingProgram();
    const logsByDate = seedTrainingLogs(program);
    return {
      selectedDayId: 'day1',
      days: program,
      logsByDate,
      notes: 'Programa Torso/Pierna 4 días para hipertrofia con sobrecarga progresiva.',
    };
  }

  function buildTrainingProgram() {
    return [
      {
        id: 'day1',
        name: 'Torso',
        focus: 'Fuerza / Hipertrofia',
        badge: 'Día 1',
        exercises: [
          { id: 'bench-barbell', name: 'Press de Banca con Barra', series: 4, repRange: '6-8' },
          { id: 'barbell-row', name: 'Remo con Barra o Pendlay', series: 4, repRange: '6-8' },
          { id: 'incline-db-press', name: 'Press Inclinado con Mancuernas', series: 3, repRange: '8-10' },
          { id: 'lat-pulldown', name: 'Jalón al pecho o Dominadas', series: 3, repRange: '8-10' },
          { id: 'lateral-raise', name: 'Elevaciones laterales para hombro', series: 3, repRange: '12-15' },
          { id: 'alt-biceps-curl', name: 'Curl de Bíceps alterno', series: 3, repRange: '10-12' },
        ],
      },
      {
        id: 'day2',
        name: 'Pierna',
        focus: 'Cuádriceps',
        badge: 'Día 2',
        exercises: [
          { id: 'back-squat', name: 'Sentadilla Libre con Barra', series: 4, repRange: '6-8' },
          { id: 'romanian-deadlift', name: 'Peso Muerto Rumano', series: 4, repRange: '8-10' },
          { id: 'leg-press', name: 'Prensa de Piernas', series: 3, repRange: '10-12' },
          { id: 'lying-leg-curl', name: 'Curl de Isquios en máquina', series: 3, repRange: '12-15' },
          { id: 'standing-calf-raise', name: 'Gemelos de pie', series: 4, repRange: '12-15' },
        ],
      },
      {
        id: 'day3',
        name: 'Descanso',
        focus: 'Recuperación',
        badge: 'Día 3',
        restDay: true,
        message: 'Recuperación Activa',
        exercises: [],
      },
      {
        id: 'day4',
        name: 'Torso',
        focus: 'Hipertrofia',
        badge: 'Día 4',
        exercises: [
          { id: 'shoulder-press', name: 'Press Militar con Mancuernas o Barra', series: 4, repRange: '8-10' },
          { id: 'low-pulley-row', name: 'Remo en Polea Baja', series: 4, repRange: '10-12' },
          { id: 'flat-db-press', name: 'Press de Banca Plano con Mancuernas', series: 3, repRange: '10-12' },
          { id: 'facepull', name: 'Remo al cuello o Facepull', series: 3, repRange: '12-15' },
          { id: 'triceps-pushdown', name: 'Extensión de Tríceps en polea', series: 3, repRange: '10-12' },
          { id: 'hammer-curl', name: 'Curl de Bíceps Martillo', series: 3, repRange: '10-12' },
        ],
      },
      {
        id: 'day5',
        name: 'Pierna',
        focus: 'Cadera / Isquios',
        badge: 'Día 5',
        exercises: [
          { id: 'conventional-deadlift', name: 'Peso Muerto Convencional o Hip Thrust', series: 4, repRange: '6-8' },
          { id: 'bulgarian-split-squat', name: 'Sentadilla Búlgara con mancuernas', series: 3, repRange: '8-10 por pierna' },
          { id: 'leg-extension', name: 'Extensiones de Cuádriceps en máquina', series: 3, repRange: '12-15' },
          { id: 'seated-leg-curl', name: 'Curl de Isquios sentado', series: 3, repRange: '10-12' },
          { id: 'seated-calf-raise', name: 'Gemelos sentado', series: 4, repRange: '15-20' },
        ],
      },
    ];
  }

  function seedTrainingLogs(program) {
    const baselineDate = addDays(todayKey(), -7);
    const seedSets = {
      'bench-barbell': [{ weight: 50, reps: 8, rir: 2 }, { weight: 50, reps: 8, rir: 1 }, { weight: 47.5, reps: 7, rir: 1 }],
      'barbell-row': [{ weight: 60, reps: 8, rir: 2 }, { weight: 60, reps: 7, rir: 1 }, { weight: 57.5, reps: 7, rir: 1 }],
      'incline-db-press': [{ weight: 22.5, reps: 10, rir: 2 }, { weight: 22.5, reps: 9, rir: 1 }, { weight: 20, reps: 10, rir: 1 }],
      'lat-pulldown': [{ weight: 55, reps: 10, rir: 2 }, { weight: 55, reps: 9, rir: 1 }, { weight: 52.5, reps: 9, rir: 1 }],
      'lateral-raise': [{ weight: 10, reps: 15, rir: 2 }, { weight: 10, reps: 14, rir: 1 }, { weight: 8, reps: 15, rir: 1 }],
      'alt-biceps-curl': [{ weight: 12.5, reps: 12, rir: 2 }, { weight: 12.5, reps: 11, rir: 1 }, { weight: 10, reps: 12, rir: 1 }],
      'back-squat': [{ weight: 80, reps: 8, rir: 2 }, { weight: 80, reps: 7, rir: 1 }, { weight: 75, reps: 7, rir: 1 }],
      'romanian-deadlift': [{ weight: 70, reps: 10, rir: 2 }, { weight: 70, reps: 9, rir: 1 }, { weight: 67.5, reps: 8, rir: 1 }],
      'leg-press': [{ weight: 140, reps: 12, rir: 2 }, { weight: 140, reps: 11, rir: 1 }, { weight: 130, reps: 10, rir: 1 }],
      'lying-leg-curl': [{ weight: 35, reps: 15, rir: 2 }, { weight: 35, reps: 13, rir: 1 }, { weight: 30, reps: 12, rir: 1 }],
      'standing-calf-raise': [{ weight: 40, reps: 15, rir: 2 }, { weight: 40, reps: 14, rir: 1 }, { weight: 35, reps: 14, rir: 1 }],
      'shoulder-press': [{ weight: 30, reps: 10, rir: 2 }, { weight: 30, reps: 9, rir: 1 }, { weight: 27.5, reps: 8, rir: 1 }],
      'low-pulley-row': [{ weight: 50, reps: 12, rir: 2 }, { weight: 50, reps: 11, rir: 1 }, { weight: 47.5, reps: 10, rir: 1 }],
      'flat-db-press': [{ weight: 24, reps: 12, rir: 2 }, { weight: 24, reps: 11, rir: 1 }, { weight: 22.5, reps: 10, rir: 1 }],
      facepull: [{ weight: 20, reps: 15, rir: 2 }, { weight: 20, reps: 13, rir: 1 }, { weight: 17.5, reps: 13, rir: 1 }],
      'triceps-pushdown': [{ weight: 25, reps: 12, rir: 2 }, { weight: 25, reps: 11, rir: 1 }, { weight: 22.5, reps: 10, rir: 1 }],
      'hammer-curl': [{ weight: 14, reps: 12, rir: 2 }, { weight: 14, reps: 11, rir: 1 }, { weight: 12, reps: 10, rir: 1 }],
      'conventional-deadlift': [{ weight: 90, reps: 8, rir: 2 }, { weight: 90, reps: 7, rir: 1 }, { weight: 85, reps: 6, rir: 1 }],
      'bulgarian-split-squat': [{ weight: 22, reps: 10, rir: 2 }, { weight: 22, reps: 9, rir: 1 }, { weight: 20, reps: 8, rir: 1 }],
      'leg-extension': [{ weight: 40, reps: 15, rir: 2 }, { weight: 40, reps: 14, rir: 1 }, { weight: 35, reps: 13, rir: 1 }],
      'seated-leg-curl': [{ weight: 30, reps: 12, rir: 2 }, { weight: 30, reps: 11, rir: 1 }, { weight: 27.5, reps: 10, rir: 1 }],
      'seated-calf-raise': [{ weight: 25, reps: 20, rir: 2 }, { weight: 25, reps: 18, rir: 1 }, { weight: 22.5, reps: 17, rir: 1 }],
    };

    const logsByDate = {
      [baselineDate]: Object.fromEntries(
        program.flatMap((day) => day.exercises || []).map((exercise) => [exercise.id, seedSets[exercise.id] || []]),
      ),
    };

    return logsByDate;
  }

  function createEmptyRecipeDraft() {
    return { name: '', mealType: 'lunch', category: 'Comidas Rápidas', emoji: '🍽️', prepTime: 15, proteinSource: '', calories: 500, protein: 30, carbs: 40, fats: 15, ingredients: '', steps: '', notes: '' };
  }

  function setupWeekGridInteractions(weekGrid) {
    if (!weekGrid || weekGrid.dataset.enhanced === 'true') return;
    weekGrid.dataset.enhanced = 'true';

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const isInteractiveTarget = (target) => Boolean(
      target?.closest?.('button, a, input, select, textarea, [data-action]'),
    );

    const onPointerDown = (event) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      isDragging = true;
      startX = event.clientX;
      startScrollLeft = weekGrid.scrollLeft;
      weekGrid.classList.add('is-dragging');
      weekGrid.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;
      const delta = event.clientX - startX;
      weekGrid.scrollLeft = startScrollLeft - delta;
    };

    const endDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      weekGrid.classList.remove('is-dragging');
      weekGrid.releasePointerCapture?.(event.pointerId);
    };

    weekGrid.addEventListener('pointerdown', onPointerDown);
    weekGrid.addEventListener('pointermove', onPointerMove);
    weekGrid.addEventListener('pointerup', endDrag);
    weekGrid.addEventListener('pointercancel', endDrag);
    weekGrid.addEventListener('pointerleave', endDrag);
  }

  function render() {
    const weekGridBefore = appRoot.querySelector('.week-grid');
    if (weekGridBefore) state.weekScrollLeft = weekGridBefore.scrollLeft;

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
        ${renderExerciseVideoModal()}
        ${renderOnboardingModal()}
        ${renderRecipeCreatorModal()}
      </div>
    `;

    requestAnimationFrame(() => {
      const weekGrid = appRoot.querySelector('.week-grid');
      if (!weekGrid) return;
      setupWeekGridInteractions(weekGrid);
      if (state.weekFocusDate) {
        const focusedCard = weekGrid.querySelector(`[data-day-card="${state.weekFocusDate}"]`);
        if (focusedCard && typeof focusedCard.scrollIntoView === 'function') {
          focusedCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        state.weekFocusDate = null;
        return;
      }
      weekGrid.scrollLeft = Number(state.weekScrollLeft) || 0;
    });
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
      return `<section class="hero hero--onboarding glass-panel"><div><p class="eyebrow">Bienvenida</p><h2>Vamos a configurar tu perfil para crear un plan potente y realista.</h2><p>Solo tardarás unos minutos. Después verás 3 comidas principales por día, recetas adaptadas y una lista de compra automática.</p></div><div class="hero-card hero-card--accent"><p class="hero-card__label">Paso actual</p><strong>Onboarding inicial</strong><p>Guardado local, sin cuentas ni nube.</p></div></section>`;
    }
    switch (state.tab) {
      case 'plan': return renderDashboard(plan, totals, completion);
      case 'nutrition': return renderNutrition();
      case 'training': return renderTraining();
      case 'recipes': return renderRecipes();
      case 'progress': return renderProgress();
      case 'shopping': return renderShoppingList();
      case 'settings': return renderSettings();
      default: return renderDashboard(plan, totals, completion);
    }
  }

  function renderDashboard(plan, totals, completion) {
    const weekDates = getWeekDates(state.activeDate);
    const weekPlans = weekDates.map((date) => ensurePlanForDate(date));
    const weekTotals = weekPlans.reduce((acc, dayPlan) => {
      const dayTotals = getDailyTotals(dayPlan);
      acc.calories += dayTotals.calories;
      acc.protein += dayTotals.protein;
      acc.carbs += dayTotals.carbs;
      acc.fats += dayTotals.fats;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    const activeDayIndex = weekDates.indexOf(state.activeDate);
    const selectedDate = weekDates[activeDayIndex >= 0 ? activeDayIndex : 0];
    const selectedPlan = ensurePlanForDate(selectedDate);
    const selectedTotals = getDailyTotals(selectedPlan);
    const weeklyCompletion = Math.min(100, Math.round((weekTotals.protein / (state.goals.protein * 7)) * 100));

    return `
      <section class="hero glass-panel calendar-hero">
        <div class="hero-copy">
          <p class="eyebrow">Calendario semanal</p>
          <h2>${formatWeekRangeLabel(weekDates[0], weekDates[6])}</h2>
            <p class="subtitle">Semana completa de lunes a domingo con 5 comidas por día. Selecciona un día para entrar al detalle.</p>
          <div class="progress-rail" aria-label="Progreso semanal de proteína"><span class="progress-rail__label">Proteína</span><div class="progress-rail__track"><span style="width:${weeklyCompletion}%"></span></div><span class="progress-rail__value">${weeklyCompletion}%</span></div>
        </div>
        <div class="hero-actions hero-actions--stacked">
          <button class="btn btn--ghost" data-action="previous-week">Semana anterior</button>
          <button class="btn btn--primary" data-action="go-today">Ir a hoy</button>
          <button class="btn btn--ghost" data-action="next-week">Semana siguiente</button>
          <button class="btn btn--ghost" data-action="open-nutrition">Nutrición</button>
          <button class="btn btn--ghost" data-action="open-training">Entrenamiento</button>
        </div>
      </section>

      <section class="dashboard-grid dashboard-grid--secondary">
        <article class="glass-panel summary-card summary-card--week">
          <h3 class="section-title">Resumen semanal</h3>
          <div class="summary-cards">
            ${renderMetricCard('Kcal semana', `${weekTotals.calories.toLocaleString('es-ES')}`, 'Suma de 7 días')}
            ${renderMetricCard('Proteína semana', `${weekTotals.protein} g`, 'Objetivo x 7')}
            ${renderMetricCard('Día activo', `${selectedTotals.calories} kcal`, formatDateLabel(selectedDate))}
            ${renderMetricCard('Proteína activa', `${selectedTotals.protein} g`, `${Math.round((selectedTotals.protein / state.goals.protein) * 100)}%`)}
          </div>
        </article>

        <article class="glass-panel snapshot-card snapshot-card--calendar">
          <h3 class="section-title">Atajos</h3>
          <div class="action-stack">
            <button class="btn btn--ghost" data-action="open-recipes">Explorar recetas</button>
            <button class="btn btn--ghost" data-action="generate-shopping">Ver lista de compra</button>
            <button class="btn btn--ghost" data-action="open-settings">Revisar ajustes</button>
          </div>
        </article>
      </section>

      <section class="week-grid" aria-label="Calendario semanal">
        ${weekDates.map((date, index) => renderWeekDayCard(date, weekPlans[index], index, date === state.activeDate)).join('')}
      </section>
    `;
  }

  function renderWeekDayCard(date, plan, index, isActive) {
    const totals = getDailyTotals(plan);
    const training = getWeeklyTrainingDay(index);
    return `
      <article class="glass-panel day-card ${isActive ? 'is-active' : ''}" data-day-card="${date}">
        <button class="day-card__header day-card__header--button" type="button" data-action="select-week-day" data-date="${date}">
          <div>
            <p class="eyebrow">${weekdayLabel(date)}</p>
            <h3>${formatDateLabel(date)}</h3>
            <p class="day-card__summary-line">${totals.calories} kcal · ${totals.protein} g proteína</p>
          </div>
          <div class="day-card__stats">
            <strong>${training.badge}</strong>
            <small>${MEAL_ORDER.length} comidas</small>
          </div>
        </button>

        <div class="day-card__preview">
          <div class="day-card__meals">
            ${MEAL_ORDER.map((slot) => renderWeekMealPreview(date, slot, plan.meals[slot])).join('')}
          </div>
          ${renderWeeklyTrainingSummary(training, date)}
        </div>
      </article>
    `;
  }

  function renderWeeklyTrainingSummary(training, date) {
    return `
      <div class="routine-block routine-block--compact">
        <button class="btn btn--ghost btn--small routine-block__summary routine-block__summary--button" type="button" data-action="open-training-routine" data-date="${date}">
          Rutina de hoy
        </button>
        <p class="day-card__note">La rutina completa se abre en la ventana grande.</p>
      </div>
    `;
  }

  function renderWeekMealPreview(date, slot, meal) {
    const recipe = getRecipeById(meal?.selectedRecipeId);
    if (!recipe) {
      return `<div class="week-meal week-meal--empty"><span class="week-meal__label">${MEAL_LABELS[slot]}</span><strong>Sin receta asignada</strong></div>`;
    }
    return `
      <button class="week-meal" type="button" data-recipe-id="${recipe.id}" aria-label="Ver detalle de ${escapeAttr(recipe.name)}">
        <div class="week-meal__header">
          <span class="week-meal__label">${MEAL_LABELS[slot]}</span>
          <span class="week-meal__mini">${recipe.calories} kcal</span>
        </div>
        <strong>${escapeHtml(recipe.name)}</strong>
        <div class="week-meal__meta">
          <span>${recipe.protein} g proteína</span>
          <span>${recipe.prepTime} min</span>
        </div>
      </button>
    `;
  }

  function renderWeekMealBlock(date, slot, meal, isActive) {
    const recipe = getRecipeById(meal?.selectedRecipeId);
    if (!recipe) {
      return `<article class="meal-block empty-state">Sin receta disponible.</article>`;
    }
    const options = getRecipeOptions(slot, date);
    return `
      <details class="meal-block ${isActive ? 'is-open' : ''}" ${isActive ? 'open' : ''}>
        <summary>
          <div>
            <span class="meal-block__label">${MEAL_LABELS[slot]}</span>
            <strong>${escapeHtml(recipe.name)}</strong>
          </div>
          <div class="meal-block__mini">
            <span>${recipe.calories} kcal</span>
            <span>${recipe.protein} g</span>
          </div>
        </summary>

        <div class="meal-block__body">
          <div class="meal-block__alternatives">
            ${options.map((option) => `<button class="chip chip--filter ${option.id === recipe.id ? 'is-active' : ''}" type="button" data-action="swap-week-meal" data-date="${date}" data-slot="${slot}" data-option-id="${option.id}">${escapeHtml(option.name)}</button>`).join('')}
          </div>

          <div class="meal-block__content">
            <div>
              <h5>Ingredientes</h5>
              <ul class="ingredients-list">
                ${recipe.ingredients.map((ingredient) => `<li><strong>${escapeHtml(ingredient.name)}</strong><span>${escapeHtml(ingredient.amount)}</span></li>`).join('')}
              </ul>
            </div>
            <div>
              <h5>Preparación</h5>
              <ol class="steps-list">
                ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
              </ol>
            </div>
          </div>

          <div class="meal-block__links">
            <button class="btn btn--secondary btn--small" type="button" data-recipe-id="${recipe.id}">Ver detalle</button>
            <a class="btn btn--ghost btn--small" href="${getRecipeVideoUrl(recipe)}" target="_blank" rel="noopener noreferrer">YouTube</a>
          </div>
        </div>
      </details>
    `;
  }

  function setWeekMealOption(date, slot, recipeId) {
    if (!date || !slot || !recipeId) return;
    const plan = ensurePlanForDate(date);
    const meal = plan.meals[slot];
    if (!meal || meal.locked) {
      state.status = { text: 'Desbloquea la comida para cambiarla.', type: 'warning' };
      render();
      return;
    }
    meal.selectedRecipeId = recipeId;
    const options = getRecipeOptions(slot, date);
    meal.optionIndex = Math.max(0, options.findIndex((option) => option.id === recipeId));
    state.status = { text: `${MEAL_LABELS[slot]} actualizada para ${formatDateLabel(date)}.`, type: 'success' };
    queueSave();
    render();
  }

  function getWeeklyTrainingDay(index) {
    if (index === 0) return state.training.days[0];
    if (index === 1) return state.training.days[1];
    if (index === 2) return state.training.days[2];
    if (index === 3) return state.training.days[3];
    if (index === 4) return state.training.days[4];
    if (index === 5) return { id: 'recovery-sat', badge: 'Sábado', message: 'Recuperación Activa', restDay: true };
    return { id: 'recovery-sun', badge: 'Domingo', message: 'Descanso y preparación', restDay: true };
  }

  function ensurePlanForDate(date) {
    if (!state.plans[date]) {
      state.plans[date] = generatePlanForDate(date, null);
      return state.plans[date];
    }
    state.plans[date] = normalizePlanMeals(state.plans[date], date, false);
    return state.plans[date];
  }

  function getWeekDates(anchorDate) {
    const monday = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  function startOfWeek(value) {
    const date = new Date(`${value}T12:00:00`);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return dateKey(date);
  }

  function formatWeekRangeLabel(startDate, endDate) {
    const start = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(`${startDate}T12:00:00`));
    const end = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(`${endDate}T12:00:00`));
    return `${start} · ${end}`;
  }

  function weekdayLabel(value) {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date(`${value}T12:00:00`));
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

  function computeNutritionProgress() {
    const consumedMeals = state.nutrition.meals.filter((meal) => meal.consumed);
    const totals = consumedMeals.reduce((acc, meal) => {
      acc.kcal += meal.kcal;
      acc.protein += meal.macros.proteina;
      acc.fats += meal.macros.grasa;
      acc.carbs += meal.macros.carbohidratos;
      return acc;
    }, { kcal: 0, protein: 0, fats: 0, carbs: 0 });
    const target = state.nutrition.target;
    return {
      totals,
      consumedCount: consumedMeals.length,
      progress: {
        kcal: Math.min(100, Math.round((totals.kcal / target.kcal) * 100)),
        protein: Math.min(100, Math.round((totals.protein / target.protein) * 100)),
        fats: Math.min(100, Math.round((totals.fats / target.fats) * 100)),
        carbs: Math.min(100, Math.round((totals.carbs / target.carbs) * 100)),
      },
    };
  }

  function renderNutrition() {
    const { totals, consumedCount, progress } = computeNutritionProgress();
    const target = state.nutrition.target;
    const completion = Math.min(100, Math.round((totals.kcal / target.kcal) * 100));

    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Nutrición</p>
              <h2>Objetivo estático · 3000 kcal para masa muscular</h2>
            </div>
            <span class="step-pill">${consumedCount}/${state.nutrition.meals.length} comidas marcadas</span>
          </div>

          <div class="nutrition-hero">
            <div class="nutrition-hero__summary">
              <p class="muted">Lo consumido hoy se compara con tu objetivo total y el plan es editable por marcas de consumido.</p>
              <div class="nutrition-total">
                <strong>${totals.kcal} / ${target.kcal} kcal</strong>
                <div class="progress-rail"><span class="progress-rail__label">Energía</span><div class="progress-rail__track"><span style="width:${completion}%"></span></div><span class="progress-rail__value">${completion}%</span></div>
              </div>
            </div>
            <div class="nutrition-hero__macros">
              ${renderMetricCard('Proteína', `${totals.protein} / ${target.protein} g`, `${progress.protein}%`)}
              ${renderMetricCard('Grasas', `${totals.fats} / ${target.fats} g`, `${progress.fats}%`)}
              ${renderMetricCard('Carbohidratos', `${totals.carbs} / ${target.carbs} g`, `${progress.carbs}%`)}
            </div>
          </div>
        </article>

        <section class="nutrition-grid">
          ${state.nutrition.meals.map((meal) => renderNutritionMealCard(meal)).join('')}
        </section>
      </section>
    `;
  }

  function renderNutritionMealCard(meal) {
    return `
      <article class="glass-panel nutrition-card ${meal.consumed ? 'is-consumed' : ''}" data-meal-id="${meal.id}">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(meal.nombre)}</p>
            <h3>${escapeHtml(meal.alimentos)}</h3>
          </div>
          <button class="btn btn--${meal.consumed ? 'secondary' : 'primary'} btn--small" data-action="toggle-nutrition-meal" data-meal-id="${meal.id}">${meal.consumed ? 'Consumido' : 'Marcar consumido'}</button>
        </div>

        <div class="macro-row macro-row--compact">
          <span>${meal.macros.proteina} g proteína</span>
          <span>${meal.macros.grasa} g grasa</span>
          <span>${meal.macros.carbohidratos} g carbos</span>
          <span>${meal.kcal} kcal</span>
        </div>

        <div class="mini-progress mini-progress--compact">
          <div class="nutrition-bar"><span>Proteína</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.proteina / state.nutrition.target.protein) * 100))}%"></span></div></div>
          <div class="nutrition-bar"><span>Carbohidratos</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.carbohidratos / state.nutrition.target.carbs) * 100))}%"></span></div></div>
          <div class="nutrition-bar"><span>Grasas</span><div class="nutrition-bar__track"><span style="width:${Math.min(100, Math.round((meal.macros.grasa / state.nutrition.target.fats) * 100))}%"></span></div></div>
        </div>

        <p class="muted">${meal.consumed ? `Marcado como consumido${meal.consumedAt ? ` · ${new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(meal.consumedAt))}` : ''}` : 'Toca el botón para sumar esta comida al progreso del día.'}</p>
      </article>
    `;
  }

  function toggleNutritionMeal(mealId) {
    const meal = state.nutrition.meals.find((item) => item.id === mealId);
    if (!meal) return;
    meal.consumed = !meal.consumed;
    meal.consumedAt = meal.consumed ? new Date().toISOString() : null;
    state.status = { text: `${meal.nombre} ${meal.consumed ? 'marcado como consumido' : 'desmarcado'}.`, type: 'success' };
    queueSave();
    render();
  }

  function getTrainingDay(dayId = state.training.selectedDayId) {
    return state.training.days.find((day) => day.id === dayId) || state.training.days[0];
  }

  function getTrainingLogDates() {
    return Object.keys(state.training.logsByDate).sort();
  }

  function getLastSessionForExercise(exerciseId, beforeDate = todayKey()) {
    const dates = getTrainingLogDates().filter((date) => date < beforeDate).sort().reverse();
    for (const date of dates) {
      const dayLogs = state.training.logsByDate[date];
      const session = dayLogs?.[exerciseId];
      if (Array.isArray(session) && session.length) {
        return { date, sets: session };
      }
    }
    return null;
  }

  function summarizeSession(session) {
    if (!session) return 'Sin sesión previa registrada.';
    const bestWeight = Math.max(...session.sets.map((set) => Number(set.weight) || 0));
    const reps = session.sets.map((set) => Number(set.reps) || 0).join(' / ');
    const rir = session.sets.map((set) => `RIR ${set.rir}`).join(' · ');
    const dateLabel = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(`${session.date}T12:00:00`));
    return `${bestWeight} kg · ${reps} reps · ${rir} · ${dateLabel}`;
  }

  function renderTraining() {
    const selectedDay = getTrainingDay();
    const currentLogs = state.training.logsByDate[todayKey()] || {};
    const dayIsRest = Boolean(selectedDay.restDay);

    return `
      <section class="panel-stack">
        <article class="glass-panel section-panel">
          <div class="section-heading">
            <div><p class="eyebrow">Entrenamiento</p><h2>Torso / Pierna 4 días · Sobrecarga progresiva</h2></div>
            <span class="step-pill">${selectedDay.badge}</span>
          </div>
          <p class="muted">Registra peso, repeticiones y RIR. La app buscará automáticamente la última sesión previa de cada ejercicio.</p>
        </article>

        <section class="training-days">
          ${state.training.days.map((day) => `
            <button class="glass-panel training-day ${selectedDay.id === day.id ? 'is-active' : ''}" data-action="select-training-day" data-day-id="${day.id}">
              <strong>${escapeHtml(day.badge)}</strong>
              <span>${escapeHtml(day.name)}</span>
              <small>${day.restDay ? day.message : day.focus}</small>
            </button>
          `).join('')}
        </section>

        ${dayIsRest ? `
          <article class="glass-panel section-panel training-rest">
            <h3>${escapeHtml(selectedDay.message)}</h3>
            <p class="muted">Día de descanso activo: movilidad, paseo suave, sueño y comida para recuperar.</p>
          </article>
        ` : `
          <section class="training-grid">
            ${selectedDay.exercises.map((exercise) => renderExerciseCard(selectedDay, exercise, currentLogs)).join('')}
          </section>
        `}
      </section>
    `;
  }

  function renderExerciseCard(day, exercise, currentLogs) {
    const session = getLastSessionForExercise(exercise.id);
    const todaySets = currentLogs?.[exercise.id] || [];
    return `
      <article class="glass-panel exercise-card" data-exercise-id="${exercise.id}">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(day.name)}</p>
            <h3>${escapeHtml(exercise.name)}</h3>
            <p class="muted">${exercise.series} series · ${exercise.repRange} reps</p>
          </div>
          <span class="step-pill">Última sesión</span>
        </div>

        <div class="last-session">
          <strong>${summarizeSession(session)}</strong>
          <small>Intenta superar esta referencia con una serie más sólida o más reps.</small>
        </div>

        <div class="exercise-log">
          <label class="input-group"><span>Peso levantado</span><input data-field="weight" type="number" min="0" step="0.5" placeholder="kg"></label>
          <label class="input-group"><span>Repeticiones</span><input data-field="reps" type="number" min="1" step="1" placeholder="reps"></label>
          <label class="input-group"><span>RIR</span><input data-field="rir" type="number" min="0" max="5" step="1" placeholder="RIR"></label>
          <button class="btn btn--primary" type="button" data-action="save-training-set" data-exercise-id="${exercise.id}">Guardar serie</button>
        </div>

        <div class="session-list">
          <h4>Sesión de hoy</h4>
          ${todaySets.length ? todaySets.map((set, index) => `<div class="session-item"><span>Serie ${index + 1}</span><strong>${set.weight} kg · ${set.reps} reps · RIR ${set.rir}</strong></div>`).join('') : '<p class="muted">Aún no hay series registradas hoy.</p>'}
        </div>
      </article>
    `;
  }

  function saveTrainingSet(button) {
    const card = button.closest('[data-exercise-id]');
    if (!card) return;
    const exerciseId = card.dataset.exerciseId;
    const weight = Number(card.querySelector('[data-field="weight"]')?.value);
    const reps = Number(card.querySelector('[data-field="reps"]')?.value);
    const rir = Number(card.querySelector('[data-field="rir"]')?.value);

    if (!exerciseId || !weight || !reps || Number.isNaN(rir)) {
      state.status = { text: 'Completa peso, repeticiones y RIR para guardar la serie.', type: 'warning' };
      render();
      return;
    }

    const today = todayKey();
    if (!state.training.logsByDate[today]) {
      state.training.logsByDate[today] = {};
    }
    if (!state.training.logsByDate[today][exerciseId]) {
      state.training.logsByDate[today][exerciseId] = [];
    }

    const entry = { weight, reps, rir, loggedAt: new Date().toISOString(), dayId: state.training.selectedDayId };
    state.training.logsByDate[today][exerciseId].push(entry);
    state.status = { text: 'Serie guardada. La próxima sesión te mostrará esta referencia como última sesión.', type: 'success' };
    queueSave();
    render();
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
            <fieldset class="field-group field-group--full">
              <legend>Vídeos de ejercicios</legend>
              <p class="muted">Los vídeos cortos en bucle son la opción principal. Si un ejercicio no tiene clip local, se intenta ExerciseDB como respaldo remoto.</p>
              <label class="input-group"><span>RapidAPI key</span><input name="exerciseMediaApiKey" type="password" placeholder="Introduce tu clave" value="${escapeAttr(state.exerciseMediaConfig.rapidApiKey || '')}"></label>
              <div class="two-column">
                ${renderTextField('exerciseMediaApiHost', 'RapidAPI host', state.exerciseMediaConfig.rapidApiHost || defaultExerciseMediaConfig.rapidApiHost)}
                ${renderTextField('exerciseMediaBaseUrl', 'Base URL', state.exerciseMediaConfig.baseUrl || defaultExerciseMediaConfig.baseUrl)}
              </div>
              <p class="muted">Los clips locales se reproducen en bucle, sin controles, y se cachea el respaldo remoto si se usa ExerciseDB.</p>
            </fieldset>
            <fieldset class="field-group field-group--full"><legend>Restricciones</legend><div class="check-grid">${restrictionsCatalog.map((item) => `<label class="check-item"><input type="checkbox" name="restrictions" value="${item.id}" ${draft.restrictions.includes(item.id) ? 'checked' : ''}><span>${item.label}</span></label>`).join('')}</div></fieldset>
            <div class="field-group field-group--full"><label class="input-group"><span>Nota alimentaria</span><textarea name="notes" rows="3" placeholder="Ej. Entreno por la tarde, prefiero comida más densa...">${escapeHtml(draft.notes || '')}</textarea></label></div>
            <div class="field-group field-group--full form-footer"><button class="btn btn--primary" type="submit">Guardar cambios</button><p class="muted">Tus objetivos se recalculan al guardar y se mantienen en este dispositivo.</p></div>
          </form>
        </article>
        <article class="glass-panel section-panel"><div class="section-heading"><div><p class="eyebrow">Nueva receta</p><h2>Guarda tus propios platos</h2></div><button class="btn btn--secondary" data-action="open-recipe-creator">Abrir creador</button></div><p class="muted">Puedes usar este creador para añadir recetas locales con pollo, huevos, atún, legumbres o lácteos.</p></article>
      </section>
    `;
  }

  function renderRecipeDetailModal() {
    if (!state.selectedRecipeId) return '';
    const recipe = getRecipeById(state.selectedRecipeId);
    if (!recipe) return '';

    return `
      <div class="modal-backdrop" data-action="close-recipe-detail">
        <section class="glass-panel modal modal--detail" role="dialog" aria-modal="true" aria-labelledby="recipe-detail-title">
          <header class="detail-hero" style="background: linear-gradient(155deg, ${recipe.accent[0]}, ${recipe.accent[1]});">
            <div>
              <p class="eyebrow">Detalle de receta</p>
              <h2 id="recipe-detail-title">${escapeHtml(recipe.name)}</h2>
              <p class="muted">${escapeHtml(recipe.proteinSource)} · ${recipe.prepTime} min · ${recipe.calories} kcal</p>
            </div>
            <button class="btn btn--ghost" type="button" data-action="close-recipe-detail">Cerrar</button>
          </header>

          <div class="detail-body" style="padding: 1rem 1.25rem 1.25rem;">
            <div class="two-column">
              <article class="glass-panel section-panel">
                <h3>Ingredientes</h3>
                <ul class="ingredients-list">
                  ${recipe.ingredients.map((ingredient) => `<li><strong>${escapeHtml(ingredient.name)}</strong><span>${escapeHtml(ingredient.amount)}</span></li>`).join('')}
                </ul>
              </article>

              <article class="glass-panel section-panel">
                <h3>Macros</h3>
                <div class="macro-row macro-row--compact">
                  <span>${recipe.protein} g proteína</span>
                  <span>${recipe.carbs} g carbos</span>
                  <span>${recipe.fats} g grasas</span>
                  <span>${recipe.calories} kcal</span>
                </div>
                <p class="muted">Categorías: ${recipe.categories.map((item) => escapeHtml(item)).join(' · ')}</p>
                <p class="muted">${escapeHtml(recipe.notes || 'Receta guardada en tu biblioteca local.')}</p>
                <a class="btn btn--secondary" href="${getRecipeVideoUrl(recipe)}" target="_blank" rel="noopener noreferrer">Ver vídeo / búsqueda</a>
              </article>
            </div>

            <article class="glass-panel section-panel">
              <h3>Preparación</h3>
              <ol class="detail-steps">
                ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
              </ol>
            </article>
          </div>
        </section>
      </div>
    `;
  }

  function renderExerciseVideoModal() {
    if (!state.routineModalOpen) return '';
    const training = getTrainingRoutineForDate(state.selectedRoutineDate || state.activeDate);
    const exercises = Array.isArray(training?.exercises) ? training.exercises : [];
    const selectedExercise = (state.selectedExerciseVideoId && getExerciseById(state.selectedExerciseVideoId)) || exercises[0] || null;
    const selectedMedia = selectedExercise ? getExerciseMediaDescriptor(selectedExercise) : { kind: 'empty', src: '' };
    const selectedCacheKey = selectedExercise ? getExerciseMediaCacheKey(selectedExercise) : null;
    const isRemoteConfigured = Boolean(state.exerciseMediaConfig.enabled && state.exerciseMediaConfig.rapidApiKey);
    const isLoadingMedia = Boolean(selectedCacheKey && state.exerciseMediaRequests[selectedCacheKey]);
    const cachedEntry = selectedCacheKey ? state.exerciseMediaCache[selectedCacheKey] : null;
    const isRemoteMedia = cachedEntry?.kind === 'remote';
    const isRestDay = Boolean(training?.restDay) || exercises.length === 0;

    return `
      <div class="modal-backdrop" data-action="close-training-routine">
        <section class="glass-panel modal modal--routine" role="dialog" aria-modal="true" aria-labelledby="routine-modal-title">
          <header class="detail-hero detail-hero--video" style="background: linear-gradient(155deg, #0f172a, #111827);">
            <div>
              <p class="eyebrow">Rutina de hoy</p>
              <h2 id="routine-modal-title">${escapeHtml(training?.badge || 'Rutina')}</h2>
              <p class="muted">${escapeHtml(training?.name || 'Sesión programada para hoy')} · ${escapeHtml(training?.focus || (isRestDay ? 'Recuperación' : 'Entrenamiento'))}</p>
            </div>
            <button class="btn btn--ghost" type="button" data-action="close-training-routine">Cerrar</button>
          </header>

          <div class="routine-modal-layout">
            <aside class="routine-modal-list">
              <div class="routine-modal-list__header">
                <p class="eyebrow">Ejercicios</p>
                <h3>${isRestDay ? 'Día de recuperación' : `${exercises.length} ejercicios`}</h3>
                <p class="muted">Toca un ejercicio para ver su vídeo corto en bucle. Si no existe clip local, se usa ExerciseDB como respaldo remoto.</p>
              </div>

              ${isRestDay ? `
                <article class="routine-exercise-card is-active">
                  <strong>${escapeHtml(training?.message || 'Recuperación activa')}</strong>
                  <span>Hoy toca caminar, movilizar y recuperar.</span>
                  <small>No hay ejercicios de fuerza programados para esta fecha.</small>
                </article>
              ` : exercises.map((exercise) => `
                <button class="routine-exercise-card ${exercise.id === selectedExercise?.id ? 'is-active' : ''}" type="button" data-action="open-exercise-video" data-exercise-id="${exercise.id}" data-date="${escapeAttr(state.selectedRoutineDate || state.activeDate)}">
                  <strong>${escapeHtml(exercise.name)}</strong>
                  <span>${exercise.series} series · ${escapeHtml(exercise.repRange)}</span>
                  <small>Vídeo/animación asociada</small>
                </button>
              `).join('')}
            </aside>

            <section class="routine-modal-player">
              <div class="routine-modal-player__header">
                <div>
                  <p class="eyebrow">Vista previa</p>
                  <h3>${selectedExercise ? escapeHtml(selectedExercise.name) : escapeHtml(training?.message || 'Descanso y recuperación')}</h3>
                  <p class="muted">${selectedExercise ? `${selectedExercise.series} series · ${escapeHtml(selectedExercise.repRange)}` : 'Sin animación asignada en este día.'}</p>
                </div>
                ${selectedExercise && selectedMedia.src ? `<a class="btn btn--ghost" href="${selectedMedia.src}" target="_blank" rel="noopener noreferrer">Abrir media</a>` : ''}
              </div>

              ${selectedExercise ? `
                ${selectedMedia.kind === 'loading' && isLoadingMedia && !cachedEntry ? `
                  <div class="exercise-demo-wrap empty-state">
                    <p class="eyebrow">Cargando vídeo real</p>
                    <h4>${escapeHtml(selectedExercise.name)}</h4>
                    <p class="muted">Estamos consultando ExerciseDB para mostrar un respaldo remoto mientras no haya clip local.</p>
                  </div>
                ` : `
                  <div class="exercise-demo-wrap">
                    ${selectedMedia.kind === 'video' ? `
                      <video class="exercise-demo" autoplay muted loop playsinline preload="metadata" poster="${escapeAttr(getExerciseLocalFallbackUrl(selectedExercise))}">
                        <source src="${escapeAttr(selectedMedia.src)}" type="video/mp4">
                      </video>
                    ` : `
                      <img class="exercise-demo" src="${escapeAttr(selectedMedia.src)}" alt="${escapeAttr(selectedExercise.name)}" loading="lazy" decoding="async">
                    `}
                  </div>
                `}
                <div class="detail-body">
                  <article class="glass-panel section-panel">
                    <h4>Notas del ejercicio</h4>
                    <p class="muted">${escapeHtml(selectedExercise.notes || (selectedMedia.kind === 'video' ? 'Clip local corto en bucle para una reproducción más fluida.' : isRemoteConfigured ? 'Se intentará ExerciseDB como respaldo remoto si falta clip local.' : 'Activa ExerciseDB en ajustes si quieres respaldo remoto adicional.'))}</p>
                  </article>
                  <article class="glass-panel section-panel">
                    <h4>Consejo rápido</h4>
                    <p class="muted">Mantén la técnica limpia, controla el recorrido y usa el rango de repeticiones como referencia antes de subir carga. ${selectedMedia.kind === 'video' ? 'Este clip local se repite en bucle para una experiencia más ligera.' : isRemoteMedia ? 'Este respaldo viene desde ExerciseDB.' : ''}</p>
                  </article>
                </div>
              ` : `
                <article class="glass-panel section-panel empty-state">
                  <h4>${escapeHtml(training?.message || 'Descanso')}</h4>
                  <p class="muted">Aprovecha el día para recuperar, dormir más y preparar la siguiente sesión.</p>
                </article>
              `}
            </section>
          </div>
        </section>
      </div>
    `;
  }

  function renderOnboardingModal() {
    if (state.profile.completed) return '';
    const step = state.onboardingStep;
    const draft = state.onboardingDraft || createEmptyRecipeDraft();

    return `
      <div class="modal-backdrop">
        <section class="glass-panel modal modal--onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <header class="detail-hero" style="background: linear-gradient(155deg, #0f766e, #1d4ed8);">
            <div>
              <p class="eyebrow">Configuración inicial</p>
              <h2 id="onboarding-title">Vamos a preparar tu perfil</h2>
              <p class="muted">Solo son 3 pasos y todo queda guardado en tu dispositivo.</p>
            </div>
            <span class="step-pill">Paso ${step + 1} / 3</span>
          </header>

          <form id="onboarding-form" class="detail-body" style="padding: 1rem 1.25rem 1.25rem;">
            ${step === 0 ? `
              <div class="two-column">
                ${renderTextField('name', 'Nombre', draft.name)}
                ${renderNumberField('age', 'Edad', draft.age, 16, 100)}
                ${renderNumberField('height', `Altura (${draft.unit === 'metric' ? 'cm' : 'in'})`, draft.height, 120, 230)}
                ${renderNumberField('weight', `Peso (${draft.unit === 'metric' ? 'kg' : 'lb'})`, draft.weight, 30, 200, 0.1)}
              </div>
            ` : step === 1 ? `
              <div class="two-column">
                ${renderSelectField('activity', 'Actividad', activityLevels, draft.activity, true)}
                ${renderSelectField('goalMode', 'Objetivo', { gain: 'Ganar masa', maintain: 'Mantener', cut: 'Definir' }, draft.goalMode, false)}
                ${renderSelectField('dietaryStyle', 'Estilo dietético', dietaryStyles, draft.dietaryStyle, false)}
                ${renderSelectField('unit', 'Unidades', { metric: 'Métricas', imperial: 'Imperiales' }, draft.unit, false)}
                ${renderNumberField('targetWeight', 'Peso objetivo', draft.targetWeight, 30, 200, 0.1)}
              </div>
            ` : `
              <fieldset class="field-group field-group--full">
                <legend>Restricciones</legend>
                <div class="check-grid">
                  ${restrictionsCatalog.map((item) => `<label class="check-item"><input type="checkbox" name="restrictions" value="${item.id}" ${draft.restrictions.includes(item.id) ? 'checked' : ''}><span>${item.label}</span></label>`).join('')}
                </div>
              </fieldset>
              <div class="field-group field-group--full">
                <label class="input-group"><span>Notas</span><textarea name="notes" rows="4" placeholder="Entreno por la tarde, prefiero comidas más densas...">${escapeHtml(draft.notes || '')}</textarea></label>
              </div>
            `}

            <div class="field-group field-group--full form-footer">
              <div class="inline-actions">
                ${step > 0 ? '<button class="btn btn--ghost" type="button" data-action="previous-step">Anterior</button>' : ''}
              </div>
              <button class="btn btn--primary" type="submit">${step < 2 ? 'Siguiente' : 'Terminar configuración'}</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function renderRecipeCreatorModal() {
    if (!state.recipeDraftOpen) return '';
    const draft = state.recipeDraft || createEmptyRecipeDraft();

    return `
      <div class="modal-backdrop" data-action="close-recipe-creator">
        <section class="glass-panel modal modal--detail" role="dialog" aria-modal="true" aria-labelledby="recipe-creator-title">
          <header class="detail-hero" style="background: linear-gradient(155deg, #334155, #111827);">
            <div>
              <p class="eyebrow">Nueva receta</p>
              <h2 id="recipe-creator-title">Guardar receta personalizada</h2>
              <p class="muted">Añade una receta local con ingredientes, pasos y macros.</p>
            </div>
            <button class="btn btn--ghost" type="button" data-action="close-recipe-creator">Cerrar</button>
          </header>

          <form id="recipe-creator-form" class="detail-body" style="padding: 1rem 1.25rem 1.25rem;">
            <div class="two-column">
              <label class="input-group"><span>Nombre</span><input name="name" type="text" value="${escapeAttr(draft.name)}" placeholder="Pasta con pollo y yogur"></label>
              ${renderSelectField('mealType', 'Tipo de comida', { breakfast: 'Desayuno', lunch: 'Almuerzo', prepost: 'Pre/Post Entreno', dinner: 'Cena', nightSnack: 'Snack nocturno' }, draft.mealType, false)}
              ${renderSelectField('category', 'Categoría', { 'Comidas Rápidas': 'Comidas Rápidas', 'Desayunos Altos en Proteína': 'Desayunos Altos en Proteína', 'Cenas Ligeras': 'Cenas Ligeras', 'Post-Entrenamiento': 'Post-Entrenamiento' }, draft.category, false)}
              <label class="input-group"><span>Emoji</span><input name="emoji" type="text" maxlength="2" value="${escapeAttr(draft.emoji)}" placeholder="🍽️"></label>
              ${renderNumberField('prepTime', 'Tiempo de preparación (min)', draft.prepTime, 5, 180)}
              <label class="input-group"><span>Fuente proteica</span><input name="proteinSource" type="text" value="${escapeAttr(draft.proteinSource)}" placeholder="Pollo, huevo, atún..."></label>
              ${renderNumberField('calories', 'Kcal', draft.calories, 100, 1500)}
              ${renderNumberField('protein', 'Proteína (g)', draft.protein, 0, 120)}
              ${renderNumberField('carbs', 'Carbos (g)', draft.carbs, 0, 200)}
              ${renderNumberField('fats', 'Grasas (g)', draft.fats, 0, 100)}
            </div>

            <div class="two-column">
              <label class="input-group"><span>Ingredientes</span><textarea name="ingredients" rows="8" placeholder="Ingrediente | cantidad\nAvena | 80 g\nLeche | 250 ml">${escapeHtml(draft.ingredients)}</textarea></label>
              <label class="input-group"><span>Pasos</span><textarea name="steps" rows="8" placeholder="Paso 1\nPaso 2\nPaso 3">${escapeHtml(draft.steps)}</textarea></label>
            </div>

            <div class="field-group field-group--full">
              <label class="input-group"><span>Notas</span><textarea name="notes" rows="3" placeholder="Opcional">${escapeHtml(draft.notes)}</textarea></label>
            </div>

            <div class="field-group field-group--full form-footer">
              <button class="btn btn--ghost" type="button" data-action="close-recipe-creator">Cancelar</button>
              <button class="btn btn--primary" type="submit">Guardar receta</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function getTrainingRoutineForDate(date = todayKey()) {
    const normalized = new Date(`${date}T12:00:00`);
    const day = normalized.getDay();
    if (day >= 1 && day <= 5) {
      return state.training.days[day - 1] || state.training.days[0];
    }
    return {
      id: day === 6 ? 'recovery-sat' : 'recovery-sun',
      badge: day === 6 ? 'Sábado' : 'Domingo',
      name: 'Descanso',
      focus: 'Recuperación',
      message: day === 6 ? 'Recuperación activa' : 'Descanso y preparación',
      restDay: true,
      exercises: [],
    };
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

  async function loadState() {
    try {
      const fromDb = await readStateFromIndexedDB();
      if (fromDb) return fromDb;
    } catch (error) {
      console.warn('No se pudo leer IndexedDB.', error);
    }

    try {
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage) return JSON.parse(fromStorage);
    } catch (error) {
      console.warn('No se pudo leer localStorage.', error);
    }

    return null;
  }

  let saveTimeout = null;
  function queueSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      state.lastSync = new Date().toISOString();
      try {
        const snapshot = serializeState();
        await writeStateToIndexedDB(snapshot);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn('Persistencia local fallida, se conserva la sesión en memoria.', error);
      }
    }, 60);
  }

  function serializeState() {
    const { installPrompt, exerciseMediaRequests, ...persisted } = state;
    return clone(persisted);
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

  function buildYouTubeSearchUrl(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  function getExerciseById(exerciseId) {
    if (!exerciseId) return null;
    for (const day of state.training.days || []) {
      const match = (day.exercises || []).find((exercise) => exercise.id === exerciseId);
      if (match) return match;
    }
    return null;
  }

  function normalizeExerciseMediaConfig(config) {
    const incoming = config && typeof config === 'object' ? config : {};
    return {
      ...clone(defaultExerciseMediaConfig),
      ...incoming,
      enabled: Boolean(incoming.rapidApiKey) ? incoming.enabled !== false : Boolean(incoming.enabled),
      rapidApiKey: String(incoming.rapidApiKey || '').trim(),
      rapidApiHost: String(incoming.rapidApiHost || defaultExerciseMediaConfig.rapidApiHost).trim(),
      baseUrl: String(incoming.baseUrl || defaultExerciseMediaConfig.baseUrl).trim().replace(/\/$/, ''),
    };
  }

  function sanitizeExerciseMediaCache(cache) {
    if (!cache || typeof cache !== 'object') return {};
    return Object.entries(cache).reduce((acc, [key, value]) => {
      if (!value || typeof value !== 'object' || !value.src) return acc;
      acc[key] = {
        src: String(value.src),
        kind: value.kind === 'remote' || value.kind === 'video' ? value.kind : 'local',
        updatedAt: Number(value.updatedAt) || Date.now(),
        label: String(value.label || ''),
      };
      return acc;
    }, {});
  }

  function getExerciseMediaCacheKey(exercise) {
    return exercise?.id || normalize(exercise?.name || 'exercise');
  }

  function getExerciseMediaQuery(exercise) {
    const queryMap = {
      'bench-barbell': 'barbell bench press',
      'incline-db-press': 'incline dumbbell press',
      'flat-db-press': 'dumbbell bench press',
      'shoulder-press': 'shoulder press',
      'triceps-pushdown': 'triceps pushdown',
      'barbell-row': 'barbell row',
      'lat-pulldown': 'lat pulldown',
      'low-pulley-row': 'seated cable row',
      'facepull': 'face pull',
      'alt-biceps-curl': 'biceps curl',
      'hammer-curl': 'hammer curl',
      'back-squat': 'barbell squat',
      'leg-press': 'leg press',
      'bulgarian-split-squat': 'bulgarian split squat',
      'leg-extension': 'leg extension',
      'romanian-deadlift': 'romanian deadlift',
      'conventional-deadlift': 'deadlift',
      'seated-leg-curl': 'seated leg curl',
      'lying-leg-curl': 'lying leg curl',
      'standing-calf-raise': 'standing calf raise',
      'seated-calf-raise': 'seated calf raise',
      'lateral-raise': 'lateral raise',
    };
    return queryMap[exercise?.id] || exercise?.videoQuery || exercise?.name || '';
  }

  function getExerciseLocalVideoUrl(exercise) {
    const assetMap = {
      'bench-barbell': 'real/bench-press.webm',
      'flat-db-press': 'real/bench-press.webm',
      'incline-db-press': 'real/incline-press.webm',
      'shoulder-press': 'real/shoulder-press.webm',
      'back-squat': 'real/squat.webm',
      'leg-press': 'real/squat.webm',
      'bulgarian-split-squat': 'real/squat.webm',
      'leg-extension': 'real/squat.webm',
      'romanian-deadlift': 'real/deadlift.webm',
      'conventional-deadlift': 'real/deadlift.webm',
      'seated-leg-curl': 'real/deadlift.webm',
      'lying-leg-curl': 'real/deadlift.webm',
      'triceps-pushdown': 'real/bench-press.webm',
      'barbell-row': 'real/bent-over-row.webm',
      'lat-pulldown': 'real/bent-over-row.webm',
      'low-pulley-row': 'real/bent-over-row.webm',
      'facepull': 'real/bent-over-row.webm',
      'alt-biceps-curl': 'real/bent-over-row.webm',
      'hammer-curl': 'real/bent-over-row.webm',
      'standing-calf-raise': 'real/squat.webm',
      'seated-calf-raise': 'real/squat.webm',
      'lateral-raise': 'real/shoulder-press.webm',
    };
    const assetName = assetMap[exercise?.id];
    return assetName ? `img/exercises/videos/${assetName}` : '';
  }

  function buildExerciseDbSearchUrl(query) {
    const baseUrl = state.exerciseMediaConfig.baseUrl || defaultExerciseMediaConfig.baseUrl;
    return `${baseUrl.replace(/\/$/, '')}/exercises/name/${encodeURIComponent(query)}`;
  }

  function getExerciseLocalFallbackUrl(exercise) {
    const assetMap = {
      'bench-barbell': 'push.svg',
      'incline-db-press': 'push.svg',
      'flat-db-press': 'push.svg',
      'shoulder-press': 'push.svg',
      'triceps-pushdown': 'push.svg',
      'barbell-row': 'pull.svg',
      'lat-pulldown': 'pull.svg',
      'low-pulley-row': 'pull.svg',
      'facepull': 'pull.svg',
      'alt-biceps-curl': 'pull.svg',
      'hammer-curl': 'pull.svg',
      'back-squat': 'squat.svg',
      'leg-press': 'squat.svg',
      'bulgarian-split-squat': 'squat.svg',
      'leg-extension': 'squat.svg',
      'romanian-deadlift': 'hinge.svg',
      'conventional-deadlift': 'hinge.svg',
      'seated-leg-curl': 'hinge.svg',
      'standing-calf-raise': 'calves.svg',
      'seated-calf-raise': 'calves.svg',
      'lateral-raise': 'accessory.svg',
    };
    const assetName = assetMap[exercise?.id] || 'accessory.svg';
    return `img/exercises/${assetName}`;
  }

  function getExerciseMediaDescriptor(exercise) {
    const cacheKey = getExerciseMediaCacheKey(exercise);
    const localVideoUrl = getExerciseLocalVideoUrl(exercise);
    if (localVideoUrl) {
      return {
        src: localVideoUrl,
        kind: 'video',
        poster: getExerciseLocalFallbackUrl(exercise),
        label: exercise?.name || '',
      };
    }

    const cached = state.exerciseMediaCache[cacheKey];
    const ttl = 1000 * 60 * 60 * 24 * 7;
    if (cached && cached.src && cached.kind === 'remote' && (Date.now() - cached.updatedAt) < ttl) {
      return cached;
    }
    if (cached && cached.src && cached.kind !== 'remote') {
      return cached;
    }
    if (state.exerciseMediaConfig.enabled && state.exerciseMediaConfig.rapidApiKey) {
      return { src: '', kind: 'loading', label: String(exercise?.name || '') };
    }
    return {
      src: getExerciseLocalFallbackUrl(exercise),
      kind: 'image',
      label: String(exercise?.name || ''),
    };
  }

  function getExerciseMediaUrl(exercise) {
    return getExerciseMediaDescriptor(exercise).src;
  }

  async function requestExerciseMedia(exercise) {
    if (!exercise) return null;
    const config = state.exerciseMediaConfig;
    if (!config.enabled || !config.rapidApiKey) return null;
    const cacheKey = getExerciseMediaCacheKey(exercise);
    if (getExerciseLocalVideoUrl(exercise)) return null;
    const existing = state.exerciseMediaCache[cacheKey];
    const ttl = 1000 * 60 * 60 * 24 * 7;
    if (existing && existing.kind === 'remote' && (Date.now() - existing.updatedAt) < ttl) {
      return existing;
    }
    if (state.exerciseMediaRequests[cacheKey]) return state.exerciseMediaRequests[cacheKey];

    const promise = (async () => {
      const query = getExerciseMediaQuery(exercise);
      if (!query) {
        const fallbackEntry = { src: getExerciseLocalFallbackUrl(exercise), kind: 'fallback', updatedAt: Date.now(), label: String(exercise.name || '') };
        state.exerciseMediaCache[cacheKey] = fallbackEntry;
        queueSave();
        return fallbackEntry;
      }
      const response = await fetch(buildExerciseDbSearchUrl(query), {
        headers: {
          'X-RapidAPI-Key': config.rapidApiKey,
          'X-RapidAPI-Host': config.rapidApiHost || defaultExerciseMediaConfig.rapidApiHost,
        },
      });
      if (!response.ok) throw new Error(`ExerciseDB error: ${response.status}`);
      const payload = await response.json();
      const first = Array.isArray(payload) ? payload[0] : payload;
      const gifUrl = first?.gifUrl || first?.gif_url || first?.gif || first?.image || null;
      if (!gifUrl) {
        const fallbackEntry = { src: getExerciseLocalFallbackUrl(exercise), kind: 'fallback', updatedAt: Date.now(), label: String(first?.name || exercise.name || '') };
        state.exerciseMediaCache[cacheKey] = fallbackEntry;
        queueSave();
        return fallbackEntry;
      }
      const entry = { src: String(gifUrl), kind: 'remote', updatedAt: Date.now(), label: String(first?.name || exercise.name || '') };
      state.exerciseMediaCache[cacheKey] = entry;
      queueSave();
      return entry;
    })().catch((error) => {
      console.warn('No se pudo cargar ExerciseDB, se usará fallback local.', error);
      const fallbackEntry = { src: getExerciseLocalFallbackUrl(exercise), kind: 'fallback', updatedAt: Date.now(), label: String(exercise.name || '') };
      state.exerciseMediaCache[cacheKey] = fallbackEntry;
      queueSave();
      return fallbackEntry;
    }).finally(() => {
      delete state.exerciseMediaRequests[cacheKey];
    });

    state.exerciseMediaRequests[cacheKey] = promise;
    return promise;
  }

  function primeExerciseMedia(exercise) {
    if (!exercise) return;
    if (getExerciseLocalVideoUrl(exercise)) return;
    void requestExerciseMedia(exercise).then((result) => {
      if (result) render();
    });
  }

  function getRecipeVideoUrl(recipe) {
    return recipe.videoUrl || buildYouTubeSearchUrl(`${recipe.name} receta preparación`);
  }

  function announce(message) {
    state.status = { text: message, type: 'info' };
  }
})();

