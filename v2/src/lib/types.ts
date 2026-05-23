/**
 * Tipos del dominio - única fuente de verdad para toda la app.
 */

// ─── PERFIL ────────────────────────────────────────────────────────────────
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'gain' | 'maintain' | 'cut';
export type UnitSystem = 'metric' | 'imperial';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan';
export type Budget = 'low' | 'medium' | 'high';
export type TrainingPreference = 'gym' | 'calisthenics' | 'hybrid';
/**
 * Fase del plan a largo plazo:
 *  - recomp: bajar grasa + ganar músculo a la vez (mantenimiento / muy leve déficit)
 *  - volume: subir masa muscular (+ surplus)
 *  - cut:    perder grasa pura (- déficit)
 */
export type UserPhase = 'recomp' | 'volume' | 'cut';
/**
 * Experiencia entrenando con pesas. Determina la velocidad esperada de
 * progresión: principiante puede subir cada 1-2 sesiones (newbie gains),
 * intermedio cada 2-3 semanas, avanzado mucho más lento.
 *  - beginner:    <6 meses con un programa estructurado
 *  - intermediate: 6 meses - 2 años
 *  - advanced:    >2 años entrenando consistente
 */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  id: 1; // siempre 1, solo hay un usuario
  name: string;
  sex: Sex;
  birthDate: string; // ISO yyyy-mm-dd
  heightCm: number;
  weightKg: number;
  /** % grasa corporal opcional. Para refinar el surplus. */
  bodyFatPct?: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  unitSystem: UnitSystem;
  /** Equipamiento disponible. */
  gymEquipment: GymEquipmentId[];
  /** Surplus calórico configurable (300-700 kcal). Para ectomorfo, default 500. */
  surplusKcal?: number;
  /** Preferencia de entrenamiento: solo gym, solo calistenia, o híbrido. */
  trainingPreference?: TrainingPreference;
  /** Días de entreno por semana objetivo. */
  trainingDaysPerWeek?: number;
  /** Dieta. */
  dietType?: DietType;
  /** Lista libre de alergias/intolerancias. Ej: ["lactosa", "gluten"]. */
  allergies?: string[];
  /** Presupuesto: low/medium/high. */
  budget?: Budget;
  // Preferencias sueño
  bedtimeReminder: string | null;
  bedtimeTarget: string | null;
  wakeTarget: string | null;
  /** Cuándo prefiere ir al gym. Determina el cronograma diario sugerido. */
  gymTimePreference?: 'morning' | 'afternoon' | 'evening';
  /** Hora preferida fija para entrenar (opcional, sobrescribe la sugerencia). Ej: "11:30". */
  preferredGymTime?: string | null;
  /** Fecha en la que arrancó el ciclo actual de entrenamiento (12 semanas). */
  cycleStartDate?: string; // ISO yyyy-mm-dd
  /** Fase actual del plan (recomp / volume / cut). Si está definida, sobrescribe `goal`. */
  userPhase?: UserPhase;
  /** Nivel de experiencia con pesas. Afecta a la velocidad de progresión sugerida. */
  experienceLevel?: ExperienceLevel;
  /** Cardio: días por semana objetivo (0-7). */
  cardioDaysPerWeek?: number;
  /** Cardio: minutos por sesión. */
  cardioMinutesPerSession?: number;
  /** Pasos diarios objetivo. */
  stepGoal?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── EQUIPAMIENTO DE GYM ────────────────────────────────────────────────────
// IDs estandarizados de equipamiento. El usuario marca cuáles tiene en su gym.
export type GymEquipmentId =
  | 'barbell'              // Barra olímpica
  | 'dumbbells'            // Mancuernas
  | 'bench_flat'           // Banco plano
  | 'bench_incline'        // Banco inclinado
  | 'bench_decline'        // Banco declinado
  | 'squat_rack'           // Rack de sentadillas
  | 'power_rack'           // Power rack / jaula
  | 'smith_machine'        // Máquina Smith
  | 'cable_machine'        // Poleas
  | 'pullup_bar'           // Barra de dominadas
  | 'dip_bars'             // Barras paralelas
  | 'leg_press'            // Prensa de piernas
  | 'leg_curl'             // Curl femoral
  | 'leg_extension'        // Extensión cuádriceps
  | 'lat_pulldown'         // Jalón al pecho
  | 'seated_row'           // Remo sentado
  | 'chest_press_machine'  // Máquina press pecho
  | 'shoulder_press_machine' // Máquina press hombros
  | 'pec_deck'             // Contractora de pecho
  | 'calf_raise_machine'   // Máquina gemelos
  | 'preacher_curl'        // Banco scott (predicador)
  | 'kettlebells'          // Kettlebells
  | 'ez_bar'               // Barra Z
  | 'medicine_ball'        // Balón medicinal
  | 'resistance_bands'     // Bandas elásticas
  | 'trx';                 // TRX / anillas

// ─── EJERCICIOS ─────────────────────────────────────────────────────────────
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'forearms';

export type ExerciseModality = 'gym' | 'calisthenics';

export interface Exercise {
  id: string;
  name: string;
  modality: ExerciseModality;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** Equipamiento necesario. Si está vacío → no necesita equipamiento (calistenia básica). */
  requiredEquipment: GymEquipmentId[];
  /** Equipamientos alternativos (cualquiera vale, OR). */
  alternativeEquipment?: GymEquipmentId[][];
  description?: string;
  cues?: string[]; // puntos de técnica
  /** ID de YouTube (la parte después de v=). Si está → se embebe autoplay+mute+loop. */
  videoId?: string;
  /** URL de GIF animado opcional (si tienes uno propio). */
  gifUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  /** Por defecto: rango de reps recomendado para hipertrofia ectomorfo. */
  defaultReps: { min: number; max: number };
  defaultSets: number;
  defaultRestSeconds: number;
  /** Equivalente en la otra modalidad (mismo grupo muscular). */
  equivalentExerciseId?: string;
  /**
   * Cadena de progresión para calistenia. Cuando el usuario domina este
   * ejercicio (top de reps en todas las series con RIR≥1) → la app sugiere
   * pasar a `progressionNextId` con el rango inferior de reps.
   */
  progressionNextId?: string;
  /**
   * Tier ranking según evidencia / análisis biomecánico.
   * S = excelente · A = muy bueno · B = bueno · C = mediocre · D = evitar
   */
  tier?: 'S' | 'A' | 'B' | 'C' | 'D';
  /** Nota corta justificando el tier (aparece en ExerciseDetail). */
  tierNotes?: string;
  /** Tipo de progresión por defecto del ejercicio. */
  progressionType?: ProgressionType;
  /** Incremento (kg) sugerido al subir peso. Diferenciado por tipo de ejercicio. */
  incrementKg?: number;
  /**
   * Carpeta dentro de free-exercise-db (yuhonas, dominio público).
   * Si está definido, se construyen URLs de 2 imágenes
   * (posición inicial 0.jpg + final 1.jpg) para mostrarlas en la app.
   */
  imageFolder?: string;
}

/** Tipo de objetivo del ejercicio: fuerza, hipertrofia o resistencia. */
export type ProgressionType = 'strength' | 'hypertrophy' | 'endurance';

export type ExerciseTier = NonNullable<Exercise['tier']>;

// ─── PLAN DE ENTRENAMIENTO ──────────────────────────────────────────────────
/**
 * Día del programa. Un programa típico tiene 4-7 días.
 * El usuario puede tener 2 modos por día: gimnasio y calistenia/aire libre.
 */
export interface TrainingDay {
  id: string;
  name: string; // "Pecho + Tríceps", "Push", etc.
  order: number; // 0-6
  primaryMuscles: MuscleGroup[];
  /** Plantilla de ejercicios para versión gym. */
  gymExercises: PlannedExercise[];
  /** Plantilla equivalente para versión calistenia/casa/parque (mismos músculos). */
  calisthenicsExercises: PlannedExercise[];
  isRestDay?: boolean;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  /** Notas para el día (RIR objetivo, tempo, etc). */
  targetRIR?: number;
  notes?: string;
  /** Tipo de progresión específico para este ejercicio en este programa. */
  progressionType?: ProgressionType;
  /** Incremento (kg) específico — override del valor del ejercicio. */
  incrementKg?: number;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  days: TrainingDay[];
  /** Activo. Solo puede haber uno activo. */
  active: boolean;
  createdAt: string;
}

// ─── SESIÓN DE ENTRENAMIENTO (registro en vivo) ─────────────────────────────
export interface WorkoutSession {
  id: string;
  date: string; // ISO yyyy-mm-dd
  startedAt: string; // ISO datetime
  finishedAt: string | null;
  programId: string;
  dayId: string;
  modality: ExerciseModality; // gym o calistenia
  exercises: WorkoutSessionExercise[];
  notes?: string;
  /** Sensaciones generales 1-5. */
  feeling?: number;
}

export interface WorkoutSessionExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  skipped?: boolean;
  notes?: string;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg?: number; // null para calistenia sin peso
  rir?: number; // Reps In Reserve (0-5)
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completedAt: string; // ISO datetime
  restSeconds?: number;
}

// ─── NUTRICIÓN ──────────────────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'pre_workout' | 'post_workout' | 'dinner' | 'snack';

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  /** Macros por 100g (o por unidad si unit !== 'g'). */
  macrosPer100: Macros;
  unit: 'g' | 'ml' | 'unit';
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'other';
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number; // en la unidad del ingrediente
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  mealTypes: MealType[];
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepMinutes: number;
  tags?: string[]; // 'volumen', 'rápido', 'meal-prep', 'hipercalorico', etc.
  custom?: boolean;
  /** Tipos de dieta compatibles. Si no se indica, omnivore por defecto. */
  dietTypes?: DietType[];
  /** Alergenos contenidos. Para filtrar. Ej: ['lactosa', 'gluten', 'frutos secos']. */
  allergens?: string[];
  /** Coste relativo. Bajo / medio / alto. */
  costLevel?: Budget;
  /** Búsqueda recomendada para YouTube (botón "Ver tutorial" → abre búsqueda). */
  youtubeQuery?: string;
  /** ID de YouTube directo (autoplay+mute+loop) — solo para recetas complejas. */
  videoId?: string;
  /** Marca si la receta es "compleja" → muestra botón de vídeo prominente. */
  isComplex?: boolean;
  /**
   * Tamaño calórico aproximado:
   *  - small  → 200-400 kcal (snack)
   *  - medium → 400-700 kcal (comida estándar)
   *  - large  → 700-1000+ kcal (comida densa / día duro)
   */
  calorieSize?: 'small' | 'medium' | 'large';
  /** True si aguanta bien en nevera 2-3 días para batch cooking. */
  mealPrepFriendly?: boolean;
  /** Coste aproximado por ración en euros (precios Mercadona/Día). */
  costPerServingEur?: number;
  /**
   * Fases del plan en las que esta receta es apropiada.
   * Si no se especifica → asume ['recomp', 'volume', 'cut'] (compatible).
   * - 'volume': solo en fase de volumen (recetas muy densas, >700 kcal)
   * - 'recomp': solo en fase de recomposición (densidad media-baja)
   * - 'cut':    solo en fase de definición (densidad baja)
   */
  phases?: UserPhase[];
  /** Momento ideal del día para esta receta. */
  recommendedTiming?: 'pre_workout' | 'post_workout' | 'breakfast' | 'dinner' | 'snack' | 'any';
}

export interface DailyMealLog {
  id: string;
  date: string; // ISO yyyy-mm-dd
  meals: MealEntry[];
}

export interface MealEntry {
  type: MealType;
  recipeId?: string;
  customName?: string;
  servings: number;
  macros: Macros; // calculadas en el momento
  consumed: boolean;
  consumedAt?: string;
}

// ─── SUEÑO ──────────────────────────────────────────────────────────────────
export interface SleepEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd (fecha en la que despiertas)
  bedtime: string; // ISO datetime
  wakeTime: string; // ISO datetime
  durationMinutes: number;
  qualityScore?: number; // 1-5 opcional
  notes?: string;
}

// ─── METAS CALCULADAS ───────────────────────────────────────────────────────
export interface DailyGoals {
  bmr: number;
  tdee: number;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
}

// ─── PESO CORPORAL ─────────────────────────────────────────────────────────
/**
 * Registro de peso. El usuario se pesa 3 veces por semana (mismo día,
 * misma hora, en ayunas). La app calcula la media semanal.
 */
export interface WeightLog {
  id: string;
  date: string; // ISO yyyy-mm-dd
  weightKg: number;
  notes?: string;
  createdAt: string;
}

// ─── AJUSTES ────────────────────────────────────────────────────────────────
export interface AppSettings {
  id: 1;
  theme: 'dark' | 'light' | 'auto';
  restTimerSound: boolean;
  restTimerVibration: boolean;
  weightSuggestionMode: 'progressive' | 'maintain' | 'manual';
  language: 'es' | 'en';
}
