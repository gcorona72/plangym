import type { Recipe } from '$lib/types';

/**
 * Recetas base para un ectomorfo en volumen.
 * Densidad calórica alta + ingredientes de supermercado español.
 */
export const SEED_RECIPES: Recipe[] = [
  // ─── DESAYUNOS ──────────────────────────────────────────────────────────
  {
    id: 'r_oats_protein_bowl',
    name: 'Bowl de avena proteica con plátano',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 5,
    tags: ['volumen', 'rápido'],
    phases: ['volume'],
    ingredients: [
      { ingredientId: 'oats', amount: 90 },
      { ingredientId: 'whey_protein', amount: 30 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'peanut_butter', amount: 20 },
      { ingredientId: 'greek_yogurt', amount: 150 }
    ],
    steps: [
      'Mezcla la avena con agua o leche y caliéntala 2 min en el microondas.',
      'Cuando esté templada, añade la proteína en polvo y mezcla bien.',
      'Cubre con plátano en rodajas, crema de cacahuete y yogur griego.'
    ]
  },
  {
    id: 'r_scrambled_eggs_toast',
    name: 'Huevos revueltos con tostada integral',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 10,
    tags: ['rápido'],
    ingredients: [
      { ingredientId: 'egg', amount: 3 },
      { ingredientId: 'egg_white', amount: 2 },
      { ingredientId: 'bread_whole', amount: 80 },
      { ingredientId: 'avocado', amount: 60 },
      { ingredientId: 'olive_oil', amount: 5 }
    ],
    steps: [
      'Bate los huevos enteros con las claras.',
      'Calienta el aceite y revuelve a fuego suave.',
      'Tuesta el pan y úntalo con aguacate machacado.'
    ]
  },

  // ─── ALMUERZOS ──────────────────────────────────────────────────────────
  {
    id: 'r_chicken_rice_broccoli',
    name: 'Pollo, arroz y brócoli',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 25,
    tags: ['meal-prep', 'volumen'],
    isComplex: true,
    youtubeQuery: 'meal prep pollo arroz brocoli fitness',
    ingredients: [
      { ingredientId: 'chicken_breast', amount: 200 },
      { ingredientId: 'rice_white_cooked', amount: 250 },
      { ingredientId: 'broccoli', amount: 200 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Hierve el brócoli 5 min al vapor.',
      'A la plancha, cocina el pollo 4-5 min por lado con aceite, sal y pimienta.',
      'Sirve sobre el arroz ya cocido.'
    ]
  },
  {
    id: 'r_beef_pasta',
    name: 'Pasta con ternera magra',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 20,
    tags: ['volumen'],
    isComplex: true,
    youtubeQuery: 'pasta con ternera magra fitness tomate',
    ingredients: [
      { ingredientId: 'pasta_cooked', amount: 250 },
      { ingredientId: 'beef_lean', amount: 180 },
      { ingredientId: 'tomato', amount: 150 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Cocina la pasta al dente.',
      'Sofríe la ternera picada con tomate troceado y aceite.',
      'Mezcla todo y sirve.'
    ]
  },

  // ─── PRE / POST WORKOUT ─────────────────────────────────────────────────
  {
    id: 'r_banana_pb',
    name: 'Plátano + crema de cacahuete (pre-entreno)',
    mealTypes: ['pre_workout'],
    servings: 1,
    prepMinutes: 1,
    ingredients: [
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'peanut_butter', amount: 20 }
    ],
    steps: ['Untar la crema de cacahuete sobre el plátano abierto.']
  },
  {
    id: 'r_shake_post',
    name: 'Batido post-entreno',
    mealTypes: ['post_workout'],
    servings: 1,
    prepMinutes: 2,
    ingredients: [
      { ingredientId: 'whey_protein', amount: 35 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'oats', amount: 40 }
    ],
    steps: ['Triturar todo con 300ml de agua o leche.']
  },

  // ─── CENAS ──────────────────────────────────────────────────────────────
  {
    id: 'r_salmon_sweet_potato',
    name: 'Salmón con boniato y espinacas',
    mealTypes: ['dinner'],
    servings: 1,
    prepMinutes: 30,
    isComplex: true,
    youtubeQuery: 'salmon al horno con boniato fitness',
    ingredients: [
      { ingredientId: 'salmon', amount: 180 },
      { ingredientId: 'sweet_potato', amount: 250 },
      { ingredientId: 'spinach', amount: 150 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Hornea el boniato cortado en cubos 25 min a 200°C.',
      'En los últimos 12 min añade el salmón con sal.',
      'Saltea las espinacas con un chorro de aceite 2 min.'
    ]
  },
  {
    id: 'r_tuna_rice_avocado',
    name: 'Bowl de atún, arroz y aguacate',
    mealTypes: ['dinner', 'lunch'],
    servings: 1,
    prepMinutes: 10,
    tags: ['rápido'],
    ingredients: [
      { ingredientId: 'tuna_canned', amount: 150 },
      { ingredientId: 'rice_brown_cooked', amount: 220 },
      { ingredientId: 'avocado', amount: 80 },
      { ingredientId: 'tomato', amount: 100 },
      { ingredientId: 'olive_oil', amount: 5 }
    ],
    steps: ['Mezcla todo en un bowl con un chorrito de aceite y sal.']
  },

  // ─── BATIDOS HIPERCALÓRICOS (gran densidad energética) ──────────────────
  {
    id: 'r_batido_mutante',
    name: 'Batido Mutante (~900 kcal · día duro)',
    description: 'Boost para cuando no puedes comer más sólido. Reserva para días de pierna/duro.',
    mealTypes: ['snack', 'post_workout', 'breakfast'],
    servings: 1,
    prepMinutes: 3,
    tags: ['hipercalorico', 'volumen', 'rápido', 'batido', 'dia-duro'],
    calorieSize: 'large',
    mealPrepFriendly: false,
    phases: ['volume'],
    dietTypes: ['omnivore', 'vegetarian'],
    allergens: ['lactosa', 'frutos secos'],
    costLevel: 'medium',
    youtubeQuery: 'batido 1000 calorias ectomorfo',
    ingredients: [
      { ingredientId: 'oats', amount: 60 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'whey_protein', amount: 30 },
      { ingredientId: 'peanut_butter', amount: 30 },
      { ingredientId: 'almonds', amount: 25 },
      { ingredientId: 'greek_yogurt', amount: 100 }
    ],
    steps: [
      'Echa 400ml de leche entera (o bebida vegetal) en la batidora.',
      'Añade el resto de ingredientes.',
      'Bate 30-40 segundos hasta cremoso.',
      '💡 Si te queda muy espeso → +50ml. Si te falta sabor → 1 cucharadita de cacao puro.'
    ]
  },
  {
    id: 'r_avena_hiper',
    name: 'Avena hipercalórica (~800 kcal)',
    description: 'Desayuno potente para empezar el día con energía.',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 5,
    tags: ['hipercalorico', 'volumen'],
    phases: ['volume'],
    dietTypes: ['omnivore', 'vegetarian'],
    allergens: ['lactosa', 'frutos secos'],
    costLevel: 'low',
    youtubeQuery: 'avena hipercalórica ganar masa muscular',
    ingredients: [
      { ingredientId: 'oats', amount: 100 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'peanut_butter', amount: 30 },
      { ingredientId: 'whey_protein', amount: 25 }
    ],
    steps: [
      'Cocina 100g de avena con 300ml de leche entera en el microondas (3 min).',
      'Añade plátano en rodajas, crema de cacahuete y proteína.',
      'Mezcla bien. Si quieres añade canela.'
    ]
  },
  {
    id: 'r_pasta_bolo_carnaza',
    name: 'Pasta boloñesa volumen (~900 kcal · día duro)',
    description: 'Almuerzo denso en calorías. Reserva para días de pierna intensos.',
    mealTypes: ['lunch'],
    servings: 1,
    prepMinutes: 25,
    tags: ['hipercalorico', 'volumen', 'dia-duro'],
    calorieSize: 'large',
    mealPrepFriendly: true,
    phases: ['volume'],
    dietTypes: ['omnivore'],
    costLevel: 'medium',
    isComplex: true,
    youtubeQuery: 'pasta boloñesa fitness volumen muscular',
    ingredients: [
      { ingredientId: 'pasta_cooked', amount: 350 },
      { ingredientId: 'beef_lean', amount: 200 },
      { ingredientId: 'tomato', amount: 150 },
      { ingredientId: 'olive_oil', amount: 15 }
    ],
    steps: [
      'Sofríe la carne con tomate troceado, sal, pimienta y un poco de orégano.',
      'Cocina la pasta al dente.',
      'Mezcla todo con un chorro de aceite virgen extra.'
    ]
  },
  {
    id: 'r_avena_vegana',
    name: 'Avena vegana proteica',
    description: 'Versión vegana del desayuno proteico.',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 5,
    tags: ['volumen', 'rápido'],
    dietTypes: ['vegan', 'vegetarian', 'omnivore'],
    costLevel: 'low',
    ingredients: [
      { ingredientId: 'oats', amount: 80 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'peanut_butter', amount: 25 },
      { ingredientId: 'almonds', amount: 20 }
    ],
    steps: [
      'Cocina la avena con 300ml de bebida vegetal (soja preferentemente, máxima proteína).',
      'Añade plátano, crema y almendras troceadas.'
    ]
  },

  // ─── SNACKS ─────────────────────────────────────────────────────────────
  {
    id: 'r_yogurt_almonds',
    name: 'Yogur griego con almendras (snack noche)',
    mealTypes: ['snack'],
    servings: 1,
    prepMinutes: 1,
    calorieSize: 'small',
    mealPrepFriendly: false,
    ingredients: [
      { ingredientId: 'greek_yogurt', amount: 200 },
      { ingredientId: 'almonds', amount: 25 }
    ],
    steps: ['Servir el yogur y espolvorear las almendras.']
  },

  // ╭──────────────────────────────────────────────────────────────────────╮
  // │ RECETAS V2 · sugeridas por entrenador para variedad y rotación        │
  // ╰──────────────────────────────────────────────────────────────────────╯

  // ─── Desayunos ────────────────────────────────────────────────────────
  {
    id: 'r_oat_pancakes',
    name: 'Tortitas de avena y plátano',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 10,
    tags: ['rápido'],
    calorieSize: 'medium',
    mealPrepFriendly: false,
    dietTypes: ['omnivore', 'vegetarian'],
    ingredients: [
      { ingredientId: 'oats', amount: 80 },
      { ingredientId: 'banana', amount: 1 },
      { ingredientId: 'egg_white', amount: 3 },
      { ingredientId: 'egg', amount: 1 }
    ],
    steps: [
      'Tritura avena + plátano + huevos en la batidora hasta masa homogénea.',
      'En sartén antiadherente caliente, vierte porciones para 4-5 tortitas.',
      'Voltea cuando salgan burbujas (~2 min/lado). Sirve con canela.'
    ]
  },
  {
    id: 'r_turkey_avocado_toast',
    name: 'Tostadas de pavo y aguacate',
    mealTypes: ['breakfast'],
    servings: 1,
    prepMinutes: 10,
    tags: ['rápido'],
    calorieSize: 'medium',
    mealPrepFriendly: false,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'bread_whole', amount: 80 },
      { ingredientId: 'turkey_breast_slices', amount: 80 },
      { ingredientId: 'avocado', amount: 80 },
      { ingredientId: 'egg', amount: 1 },
      { ingredientId: 'tomato', amount: 50 }
    ],
    steps: [
      'Tuesta el pan y machaca el aguacate por encima.',
      'Coloca las lonchas de pavo y el tomate en rodajas.',
      'Termina con huevo a la plancha encima.'
    ]
  },

  // ─── Comidas / cenas principales ──────────────────────────────────────
  {
    id: 'r_beef_wok',
    name: 'Wok de ternera con verduras y arroz',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 20,
    tags: ['volumen', 'meal-prep'],
    calorieSize: 'large',
    mealPrepFriendly: true,
    isComplex: true,
    dietTypes: ['omnivore'],
    youtubeQuery: 'wok ternera verduras arroz receta fitness',
    ingredients: [
      { ingredientId: 'beef_lean', amount: 150 },
      { ingredientId: 'rice_raw', amount: 100 },
      { ingredientId: 'wok_vegetables_frozen', amount: 150 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Cocina el arroz aparte (~15 min en agua hirviendo).',
      'En wok/sartén bien caliente: 1 cda aceite, ternera 3 min hasta dorar.',
      'Añade verduras congeladas, saltea 5 min. Sirve sobre el arroz con un chorro de salsa de soja.'
    ]
  },
  {
    id: 'r_pork_potato',
    name: 'Lomo de cerdo con patata y judía verde',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 25,
    tags: ['meal-prep'],
    calorieSize: 'medium',
    mealPrepFriendly: true,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'pork_loin', amount: 180 },
      { ingredientId: 'potato', amount: 300 },
      { ingredientId: 'green_beans', amount: 150 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Patatas en cubos al horno 25 min a 200°C con aceite y especias.',
      'Lomo a la plancha 4 min/lado, sal y pimentón.',
      'Hierve la judía verde 8 min. Sirve todo junto.'
    ]
  },
  {
    id: 'r_mediterranean_bowl',
    name: 'Bowl mediterráneo de pollo',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 20,
    tags: ['volumen', 'meal-prep'],
    calorieSize: 'large',
    mealPrepFriendly: true,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'chicken_breast', amount: 180 },
      { ingredientId: 'couscous_raw', amount: 80 },
      { ingredientId: 'chickpeas_cooked', amount: 100 },
      { ingredientId: 'cherry_tomato', amount: 80 },
      { ingredientId: 'cucumber', amount: 70 },
      { ingredientId: 'onion', amount: 30 },
      { ingredientId: 'feta_cheese', amount: 20 },
      { ingredientId: 'olive_oil', amount: 10 }
    ],
    steps: [
      'Hidrata el cuscús con agua hirviendo durante 5 min y separa con un tenedor.',
      'Plancha el pollo cortado en tiras 5 min con sal y pimienta.',
      'Monta el bowl: cuscús abajo, pollo, garbanzos y verduras. Termina con feta, aceite y zumo de limón.'
    ]
  },
  {
    id: 'r_turkey_burrito',
    name: 'Burritos de pavo con arroz',
    mealTypes: ['lunch', 'dinner'],
    servings: 1,
    prepMinutes: 20,
    tags: ['volumen'],
    calorieSize: 'large',
    mealPrepFriendly: true,
    isComplex: true,
    dietTypes: ['omnivore'],
    youtubeQuery: 'burritos pavo arroz fitness receta',
    ingredients: [
      { ingredientId: 'wheat_tortilla', amount: 2 },
      { ingredientId: 'ground_turkey', amount: 150 },
      { ingredientId: 'rice_raw', amount: 80 },
      { ingredientId: 'black_beans_cooked', amount: 80 },
      { ingredientId: 'tomato_sauce', amount: 50 },
      { ingredientId: 'bell_pepper', amount: 60 },
      { ingredientId: 'onion', amount: 30 }
    ],
    steps: [
      'Cocina el arroz aparte. Sofríe pavo picado con pimiento y cebolla picados.',
      'Añade frijoles + salsa de tomate + especias (comino, pimentón, ajo en polvo). Cocina 5 min más.',
      'Calienta las tortillas y rellena con la mezcla y el arroz. Enrolla.'
    ]
  },
  {
    id: 'r_hake_sweet_potato',
    name: 'Merluza al horno con boniato y espinacas',
    mealTypes: ['dinner', 'lunch'],
    servings: 1,
    prepMinutes: 30,
    tags: ['proteína magra'],
    calorieSize: 'medium',
    mealPrepFriendly: false,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'hake', amount: 200 },
      { ingredientId: 'sweet_potato', amount: 250 },
      { ingredientId: 'spinach', amount: 150 },
      { ingredientId: 'olive_oil', amount: 15 }
    ],
    steps: [
      'Boniato en cubos al horno 25 min a 200°C con un poco de aceite.',
      'En los últimos 12 min, añade la merluza con sal, limón y un chorro de aceite.',
      'Saltea las espinacas con ajo en sartén 2 min. Sirve todo junto.'
    ]
  },

  // ─── Snacks intermedios ──────────────────────────────────────────────
  {
    id: 'r_tuna_egg_sandwich',
    name: 'Sándwich de atún y huevo',
    mealTypes: ['snack', 'pre_workout'],
    servings: 1,
    prepMinutes: 5,
    tags: ['rápido'],
    calorieSize: 'small',
    mealPrepFriendly: false,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'bread_whole', amount: 80 },
      { ingredientId: 'tuna_canned', amount: 80 },
      { ingredientId: 'egg', amount: 1 },
      { ingredientId: 'light_mayo', amount: 10 },
      { ingredientId: 'tomato', amount: 30 }
    ],
    steps: [
      'Mezcla el atún escurrido con el huevo cocido picado y la mayonesa.',
      'Rellena el pan integral. Añade lechuga y tomate.'
    ]
  },
  {
    id: 'r_ricotta_honey_walnuts',
    name: 'Requesón con miel y nueces',
    mealTypes: ['snack', 'pre_workout'],
    servings: 1,
    prepMinutes: 2,
    tags: ['rápido'],
    calorieSize: 'small',
    mealPrepFriendly: false,
    dietTypes: ['omnivore', 'vegetarian'],
    ingredients: [
      { ingredientId: 'ricotta_cheese', amount: 200 },
      { ingredientId: 'walnuts', amount: 20 },
      { ingredientId: 'honey', amount: 20 }
    ],
    steps: [
      'En un bowl: requesón con miel encima.',
      'Espolvorea las nueces y un toque de canela si quieres.'
    ]
  },
  {
    id: 'r_turkey_baguette',
    name: 'Bocadillo de pavo y queso',
    mealTypes: ['snack', 'pre_workout', 'lunch'],
    servings: 1,
    prepMinutes: 5,
    tags: ['rápido', 'portátil'],
    calorieSize: 'medium',
    mealPrepFriendly: false,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'baguette', amount: 1 },
      { ingredientId: 'turkey_breast_slices', amount: 100 },
      { ingredientId: 'cheese_slices', amount: 30 },
      { ingredientId: 'tomato', amount: 40 },
      { ingredientId: 'olive_oil', amount: 5 }
    ],
    steps: [
      'Abre la mini baguette y unta un chorrito de aceite.',
      'Rellena con pavo, queso y tomate en rodajas.'
    ]
  },
  {
    id: 'r_rice_cakes_ham',
    name: 'Tortitas de arroz con jamón y queso',
    mealTypes: ['snack', 'pre_workout'],
    servings: 1,
    prepMinutes: 2,
    tags: ['rápido', 'portátil'],
    calorieSize: 'small',
    mealPrepFriendly: false,
    dietTypes: ['omnivore'],
    ingredients: [
      { ingredientId: 'rice_cakes', amount: 3 },
      { ingredientId: 'cooked_ham', amount: 80 },
      { ingredientId: 'cottage_cheese_low_fat', amount: 30 }
    ],
    steps: [
      'Sobre cada tortita: una capa fina de queso fresco batido y una loncha de jamón.',
      'Opcional: añade plátano en rodajas si necesitas más kcal.'
    ]
  },

  // ─── Snack noche extra ───────────────────────────────────────────────
  {
    id: 'r_chia_protein_pudding',
    name: 'Pudding de chía y proteína',
    mealTypes: ['snack'],
    servings: 1,
    prepMinutes: 5,
    tags: ['meal-prep'],
    calorieSize: 'medium',
    mealPrepFriendly: true,
    dietTypes: ['omnivore', 'vegetarian'],
    ingredients: [
      { ingredientId: 'whole_milk', amount: 250 },
      { ingredientId: 'chia_seeds', amount: 25 },
      { ingredientId: 'whey_protein', amount: 30 },
      { ingredientId: 'frozen_berries', amount: 80 }
    ],
    steps: [
      'En un tarro: leche + chía + proteína. Agita bien.',
      'Deja en nevera mínimo 4 h (mejor toda la noche).',
      'Sirve con frutos rojos por encima.'
    ]
  }
];
