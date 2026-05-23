import type { Exercise } from '$lib/types';

/**
 * Seed inicial de ejercicios.
 *
 * Cada ejercicio de gym tiene equivalentExerciseId que apunta a su
 * variante calistenia/aire libre (mismos músculos primarios).
 *
 * Para añadir más → simplemente extender este array.
 */
export const SEED_EXERCISES: Exercise[] = [
  // ─── PECHO ──────────────────────────────────────────────────────────────
  {
    id: 'gym_bench_press',
    name: 'Press de banca con barra',
    modality: 'gym',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders'],
    requiredEquipment: ['barbell', 'bench_flat'],
    alternativeEquipment: [['dumbbells', 'bench_flat']],
    defaultReps: { min: 6, max: 10 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    cues: ['Escápulas retraídas', 'Pies firmes', 'Codos ~45°'],
    equivalentExerciseId: 'cal_pushup',
    tier: 'A',
    tierNotes: 'Fundamental. Excelente tanto con barra como con mancuernas.'
  },
  {
    id: 'gym_incline_db_press',
    name: 'Press inclinado con mancuernas',
    modality: 'gym',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    requiredEquipment: ['dumbbells', 'bench_incline'],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    equivalentExerciseId: 'cal_decline_pushup',
    tier: 'S',
    tierNotes: 'Press inclinado con mancuernas: gran rango de movimiento y énfasis en pecho superior.'
  },
  {
    id: 'cal_pushup',
    name: 'Flexiones',
    modality: 'calisthenics',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'shoulders', 'core'],
    requiredEquipment: [],
    defaultReps: { min: 10, max: 20 },
    defaultSets: 4,
    defaultRestSeconds: 90,
    cues: ['Cuerpo recto', 'Bajar hasta casi tocar suelo', 'Codos ~45°'],
    progressionNextId: 'cal_decline_pushup'
  },
  {
    id: 'cal_decline_pushup',
    name: 'Flexiones declinadas (pies elevados)',
    modality: 'calisthenics',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'triceps'],
    requiredEquipment: [],
    defaultReps: { min: 8, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    progressionNextId: 'cal_diamond_pushup'
  },
  {
    id: 'cal_dips',
    name: 'Fondos en paralelas',
    modality: 'calisthenics',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    requiredEquipment: ['dip_bars'],
    defaultReps: { min: 6, max: 12 },
    defaultSets: 4,
    defaultRestSeconds: 120
  },

  // ─── ESPALDA ────────────────────────────────────────────────────────────
  {
    id: 'gym_pullup',
    name: 'Dominadas',
    modality: 'gym',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'forearms'],
    requiredEquipment: ['pullup_bar'],
    defaultReps: { min: 6, max: 12 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    equivalentExerciseId: 'cal_pullup',
    tier: 'B',
    tierNotes: 'Gran ejercicio de fuerza global, pero difícil de ajustar carga para hipertrofia aislada.'
  },
  {
    id: 'gym_barbell_row',
    name: 'Remo con barra',
    modality: 'gym',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    requiredEquipment: ['barbell'],
    defaultReps: { min: 6, max: 10 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    equivalentExerciseId: 'cal_inverted_row'
  },
  {
    id: 'gym_lat_pulldown',
    name: 'Jalón al pecho',
    modality: 'gym',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    requiredEquipment: ['lat_pulldown'],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    equivalentExerciseId: 'cal_pullup',
    tier: 'A',
    tierNotes: 'Cómodo y seguro, fácil de progresar. Versión unilateral (una mano) sube a Tier S.'
  },
  {
    id: 'cal_pullup',
    name: 'Dominadas (calistenia)',
    modality: 'calisthenics',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps', 'forearms'],
    requiredEquipment: ['pullup_bar'],
    defaultReps: { min: 4, max: 12 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    progressionNextId: 'cal_chinup'
  },
  {
    id: 'cal_inverted_row',
    name: 'Remo invertido (australian pullup)',
    modality: 'calisthenics',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    requiredEquipment: [],
    alternativeEquipment: [['pullup_bar']],
    defaultReps: { min: 8, max: 15 },
    defaultSets: 4,
    defaultRestSeconds: 90,
    cues: ['Usa una barra baja, mesa o anillas', 'Cuerpo recto'],
    progressionNextId: 'cal_pullup'
  },

  // ─── HOMBROS ────────────────────────────────────────────────────────────
  {
    id: 'gym_overhead_press',
    name: 'Press militar con barra',
    modality: 'gym',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    requiredEquipment: ['barbell'],
    alternativeEquipment: [['dumbbells']],
    defaultReps: { min: 5, max: 8 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    equivalentExerciseId: 'cal_pike_pushup',
    tier: 'B',
    tierNotes: 'Buen ejercicio de fuerza, pero no aísla el deltoide tan bien como movimientos analíticos.'
  },
  {
    id: 'gym_lateral_raise',
    name: 'Elevaciones laterales con mancuerna',
    modality: 'gym',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    requiredEquipment: ['dumbbells'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 4,
    defaultRestSeconds: 60,
    tier: 'A',
    tierNotes: 'Muy efectivo si cuidas la técnica (sin tirones ni inercia).'
  },
  {
    id: 'cal_pike_pushup',
    name: 'Flexiones pike (en V)',
    modality: 'calisthenics',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps'],
    requiredEquipment: [],
    defaultReps: { min: 6, max: 12 },
    defaultSets: 4,
    defaultRestSeconds: 90,
    cues: ['Cadera arriba formando V', 'La cabeza apunta al suelo entre las manos']
  },

  // ─── BÍCEPS ─────────────────────────────────────────────────────────────
  {
    id: 'gym_barbell_curl',
    name: 'Curl de bíceps de pie con barra',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['barbell'],
    alternativeEquipment: [['ez_bar'], ['dumbbells']],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    equivalentExerciseId: 'cal_chinup',
    tier: 'B',
    tierNotes: 'Clásico, válido. Mejora si lo haces de espaldas a una polea baja (perfil de resistencia más constante).'
  },
  {
    id: 'cal_chinup',
    name: 'Dominadas supinas (chin-ups)',
    modality: 'calisthenics',
    primaryMuscles: ['biceps', 'back'],
    secondaryMuscles: [],
    requiredEquipment: ['pullup_bar'],
    defaultReps: { min: 5, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90
  },

  // ─── TRÍCEPS ────────────────────────────────────────────────────────────
  {
    id: 'gym_tricep_pushdown',
    name: 'Extensión de tríceps en polea',
    modality: 'gym',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    equivalentExerciseId: 'cal_diamond_pushup',
    tier: 'B',
    tierNotes: 'Aísla bien el tríceps. Mejora con variante a una mano para más estabilidad y rango.'
  },
  {
    id: 'cal_diamond_pushup',
    name: 'Flexiones diamante',
    modality: 'calisthenics',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'shoulders'],
    requiredEquipment: [],
    defaultReps: { min: 6, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75
  },

  // ─── PIERNAS - CUÁDRICEPS ───────────────────────────────────────────────
  {
    id: 'gym_squat',
    name: 'Sentadilla con barra',
    modality: 'gym',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    requiredEquipment: ['barbell', 'squat_rack'],
    alternativeEquipment: [['barbell', 'power_rack']],
    defaultReps: { min: 6, max: 10 },
    defaultSets: 4,
    defaultRestSeconds: 150,
    cues: ['Bajar hasta ~paralelo', 'Rodillas en línea con pies', 'Core activo'],
    equivalentExerciseId: 'cal_pistol_squat'
  },
  {
    id: 'gym_leg_press',
    name: 'Prensa de piernas',
    modality: 'gym',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    requiredEquipment: ['leg_press'],
    defaultReps: { min: 8, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 120
  },
  {
    id: 'cal_pistol_squat',
    name: 'Sentadilla a una pierna (pistol)',
    modality: 'calisthenics',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    requiredEquipment: [],
    defaultReps: { min: 3, max: 8 },
    defaultSets: 4,
    defaultRestSeconds: 90,
    cues: ['Si no puedes a una pierna → squats búlgaras o squats salto']
  },
  {
    id: 'cal_bulgarian_split',
    name: 'Sentadilla búlgara',
    modality: 'calisthenics',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    requiredEquipment: [],
    defaultReps: { min: 8, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Pie trasero elevado en banco o silla'],
    progressionNextId: 'cal_pistol_squat'
  },

  // ─── PIERNAS - ISQUIOS / GLÚTEOS ────────────────────────────────────────
  {
    id: 'gym_romanian_deadlift',
    name: 'Peso muerto rumano',
    modality: 'gym',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back'],
    requiredEquipment: ['barbell'],
    alternativeEquipment: [['dumbbells']],
    defaultReps: { min: 6, max: 10 },
    defaultSets: 4,
    defaultRestSeconds: 120,
    equivalentExerciseId: 'cal_glute_bridge'
  },
  {
    id: 'gym_leg_curl',
    name: 'Curl femoral',
    modality: 'gym',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    requiredEquipment: ['leg_curl'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75
  },
  {
    id: 'cal_glute_bridge',
    name: 'Puente de glúteo a una pierna',
    modality: 'calisthenics',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['core'],
    requiredEquipment: [],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75
  },

  // ─── GEMELOS ────────────────────────────────────────────────────────────
  {
    id: 'gym_calf_raise',
    name: 'Elevación de gemelos',
    modality: 'gym',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    requiredEquipment: ['calf_raise_machine'],
    alternativeEquipment: [['smith_machine'], ['dumbbells']],
    defaultReps: { min: 12, max: 20 },
    defaultSets: 4,
    defaultRestSeconds: 60,
    equivalentExerciseId: 'cal_calf_raise'
  },
  {
    id: 'cal_calf_raise',
    name: 'Elevación de gemelos a una pierna',
    modality: 'calisthenics',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    requiredEquipment: [],
    defaultReps: { min: 15, max: 25 },
    defaultSets: 4,
    defaultRestSeconds: 60,
    cues: ['De pie sobre un escalón para mayor rango']
  },

  // ─── CORE ───────────────────────────────────────────────────────────────
  {
    id: 'cal_plank',
    name: 'Plancha',
    modality: 'calisthenics',
    primaryMuscles: ['core'],
    secondaryMuscles: ['shoulders'],
    requiredEquipment: [],
    defaultReps: { min: 30, max: 60 }, // segundos
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Reps = segundos en isométrico']
  },
  {
    id: 'cal_hanging_leg_raise',
    name: 'Elevación de piernas colgado',
    modality: 'calisthenics',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    requiredEquipment: ['pullup_bar'],
    defaultReps: { min: 8, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75
  },

  // ─── EJERCICIOS NUEVOS (Plan PPL+Torso) ─────────────────────────────────
  // Gym
  {
    id: 'gym_db_shoulder_press',
    name: 'Press militar sentado con mancuernas',
    modality: 'gym',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['triceps', 'core'],
    requiredEquipment: ['dumbbells', 'bench_flat'],
    alternativeEquipment: [['dumbbells', 'bench_incline'], ['shoulder_press_machine']],
    defaultReps: { min: 8, max: 10 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Espalda apoyada en el respaldo', 'No bloquear codos arriba'],
    equivalentExerciseId: 'cal_pike_pushup',
    tier: 'A',
    tierNotes: 'Más rango y estabilidad que la barra. Permite trabajar cada hombro individualmente.'
  },
  {
    id: 'gym_dips_weighted',
    name: 'Fondos en paralelas (con peso si puedes)',
    modality: 'gym',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['shoulders'],
    requiredEquipment: ['dip_bars'],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Inclinar torso adelante = más pecho', 'Codos pegados al cuerpo = más tríceps'],
    equivalentExerciseId: 'cal_dips'
  },
  {
    id: 'gym_face_pull',
    name: 'Face pull en polea',
    modality: 'gym',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 12, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Codos altos, cuerda hacia la cara', 'Apretar escápulas al final del movimiento'],
    equivalentExerciseId: 'cal_band_face_pull'
  },
  {
    id: 'gym_db_alt_curl',
    name: 'Curl de bíceps alterno con mancuernas',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['dumbbells'],
    defaultReps: { min: 10, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Una mano cada vez', 'Codo pegado al torso, sin balanceo'],
    equivalentExerciseId: 'cal_band_curl',
    tier: 'B',
    tierNotes: 'Variante clásica unilateral. Buena pero no aprovecha el perfil de resistencia de la polea.'
  },
  {
    id: 'gym_cable_curl',
    name: 'Curl de bíceps en polea baja',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 10, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Tensión constante (no descansar abajo)', 'Codos pegados al cuerpo'],
    equivalentExerciseId: 'cal_band_curl'
  },

  // Calistenia
  {
    id: 'cal_band_face_pull',
    name: 'Face pull con banda elástica',
    modality: 'calisthenics',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['back'],
    requiredEquipment: ['resistance_bands'],
    defaultReps: { min: 12, max: 20 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Banda anclada a la altura de la cara', 'Codos altos al tirar']
  },
  {
    id: 'cal_band_lateral',
    name: 'Elevaciones laterales con banda',
    modality: 'calisthenics',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    requiredEquipment: ['resistance_bands'],
    defaultReps: { min: 12, max: 20 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Pisar la banda con ambos pies', 'Subir codos ligeramente flexionados hasta hombros']
  },
  {
    id: 'cal_band_curl',
    name: 'Curl de bíceps con banda',
    modality: 'calisthenics',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['resistance_bands'],
    defaultReps: { min: 12, max: 20 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Pisar la banda y agarrar palmas arriba']
  },
  {
    id: 'cal_lunges',
    name: 'Zancadas (lunges)',
    modality: 'calisthenics',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    requiredEquipment: [],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Rodilla trasera casi al suelo', 'Tronco recto'],
    progressionNextId: 'cal_bulgarian_split'
  },
  {
    id: 'cal_single_leg_rdl',
    name: 'Peso muerto rumano a una pierna',
    modality: 'calisthenics',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['core'],
    requiredEquipment: [],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Cadera hacia atrás', 'Pierna trasera estirada', 'Espalda neutra']
  },
  {
    id: 'cal_nordic_curl',
    name: 'Curl nórdico (negativo)',
    modality: 'calisthenics',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes'],
    requiredEquipment: [],
    defaultReps: { min: 5, max: 10 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Fija los pies bajo algo pesado', 'Baja controlado, sube ayudándote con las manos si hace falta']
  },

  // ╭──────────────────────────────────────────────────────────────────────╮
  // │ EJERCICIOS TIER-S/A · selección por análisis biomecánico              │
  // ╰──────────────────────────────────────────────────────────────────────╯

  // ─── ESPALDA ──────────────────────────────────────────────────────────
  {
    id: 'gym_chest_supported_row',
    name: 'Remo en T con pecho apoyado',
    modality: 'gym',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    requiredEquipment: ['bench_incline', 'dumbbells'],
    alternativeEquipment: [['cable_machine']],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 4,
    defaultRestSeconds: 90,
    cues: ['Pecho firme contra el banco', 'Codos cerca del cuerpo para dorsal', 'Aprieta escápulas arriba'],
    equivalentExerciseId: 'cal_inverted_row',
    tier: 'S',
    tierNotes: 'Pecho apoyado = máxima estabilidad y cero carga lumbar. Permite centrar el esfuerzo en dorsal o espalda alta según agarre.'
  },

  // ─── PECHO ────────────────────────────────────────────────────────────
  {
    id: 'gym_cable_crossover',
    name: 'Cruces en polea',
    modality: 'gym',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders'],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Codos ligeramente flexionados (no rígidos)', 'Cierra cruzando las manos al final', 'Variante tumbado en banco = aún mejor'],
    equivalentExerciseId: 'cal_diamond_pushup',
    tier: 'S',
    tierNotes: 'Tensión constante en todo el rango. Tumbado en banco aumenta estabilidad y se vuelve excelente.'
  },

  // ─── BÍCEPS ───────────────────────────────────────────────────────────
  {
    id: 'gym_bayesian_curl',
    name: 'Curl Bayesian (de espaldas a la polea)',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 10, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['De espaldas a la polea baja', 'Codo detrás del torso (hombro en extensión)', 'Estira al máximo abajo'],
    equivalentExerciseId: 'cal_chinup',
    tier: 'S',
    tierNotes: 'Hombro en extensión = estiramiento profundo del bíceps. Tensión muy favorable para hipertrofia.'
  },
  {
    id: 'gym_preacher_curl',
    name: 'Curl en banco Scott (preacher)',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: [],
    requiredEquipment: ['preacher_curl'],
    alternativeEquipment: [['cable_machine'], ['ez_bar', 'bench_incline']],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Brazos completamente apoyados en el banco', 'No bloquees codos abajo'],
    equivalentExerciseId: 'cal_chinup',
    tier: 'A',
    tierNotes: 'Fija la posición y aísla bien. La versión en máquina de placas o polea es superior a peso libre.'
  },

  // ─── TRÍCEPS ──────────────────────────────────────────────────────────
  {
    id: 'gym_katana_extension',
    name: 'Extensiones Katana en polea',
    modality: 'gym',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Polea baja, a una mano', 'Brazo flexionado por detrás de la cabeza', 'Estira la cabeza larga del tríceps al máximo'],
    equivalentExerciseId: 'cal_diamond_pushup',
    tier: 'S',
    tierNotes: 'A una mano y desde polea baja: estabilidad máxima + estiramiento total de la cabeza larga del tríceps.'
  },
  {
    id: 'gym_french_press',
    name: 'Press francés (rompecráneos)',
    modality: 'gym',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    requiredEquipment: ['ez_bar', 'bench_flat'],
    alternativeEquipment: [['barbell', 'bench_flat'], ['dumbbells', 'bench_incline']],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Codos fijos apuntando arriba', 'Baja la barra detrás de la frente', 'Variante en banco inclinado = mejor perfil de resistencia'],
    equivalentExerciseId: 'cal_diamond_pushup',
    tier: 'A',
    tierNotes: 'Estable y aísla muy bien. Subir a Tier S si lo haces en banco inclinado o declinado.'
  },

  // ─── HOMBROS ──────────────────────────────────────────────────────────
  {
    id: 'gym_cable_lateral_raise',
    name: 'Elevaciones laterales en polea',
    modality: 'gym',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: [],
    requiredEquipment: ['cable_machine'],
    defaultReps: { min: 12, max: 15 },
    defaultSets: 4,
    defaultRestSeconds: 60,
    cues: ['Polea a la altura de la pierna contraria', 'Codo ligeramente flexionado', 'Tensión constante en todo el recorrido'],
    equivalentExerciseId: 'cal_band_lateral',
    tier: 'S',
    tierNotes: 'El ejercicio rey para aislar el deltoide lateral. Tensión constante incluso en la fase de estiramiento.'
  },

  // ╭──────────────────────────────────────────────────────────────────────╮
  // │ EJERCICIOS BASE (entrenador personal · Upper/Lower coach)             │
  // ╰──────────────────────────────────────────────────────────────────────╯

  {
    id: 'gym_one_arm_db_row',
    name: 'Remo a una mano con mancuerna',
    modality: 'gym',
    primaryMuscles: ['back'],
    secondaryMuscles: ['biceps'],
    requiredEquipment: ['dumbbells', 'bench_flat'],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Rodilla y mano contraria apoyadas en el banco', 'Codo cerca del costado al subir', 'Espalda neutra, no rotar el torso'],
    equivalentExerciseId: 'cal_inverted_row',
    tier: 'A'
  },
  {
    id: 'gym_hammer_curl',
    name: 'Curl martillo con mancuernas',
    modality: 'gym',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    requiredEquipment: ['dumbbells'],
    defaultReps: { min: 10, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Palmas mirando al cuerpo (agarre neutro)', 'Codo pegado al torso', 'Trabaja braquial y braquiorradial'],
    equivalentExerciseId: 'cal_chinup',
    tier: 'A'
  },
  {
    id: 'gym_front_squat',
    name: 'Sentadilla frontal con barra',
    modality: 'gym',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    requiredEquipment: ['barbell', 'squat_rack'],
    alternativeEquipment: [['barbell', 'power_rack']],
    defaultReps: { min: 6, max: 10 },
    defaultSets: 4,
    defaultRestSeconds: 150,
    cues: ['Barra en hombros frontales (codos altos)', 'Torso vertical', 'Más énfasis en cuádriceps que la sentadilla trasera'],
    equivalentExerciseId: 'cal_pistol_squat',
    tier: 'A'
  },
  {
    id: 'gym_conventional_deadlift',
    name: 'Peso muerto convencional',
    modality: 'gym',
    primaryMuscles: ['back', 'hamstrings', 'glutes'],
    secondaryMuscles: ['quads', 'core', 'forearms'],
    requiredEquipment: ['barbell'],
    defaultReps: { min: 3, max: 6 },
    defaultSets: 3,
    defaultRestSeconds: 180,
    cues: ['Barra pegada al cuerpo en todo el recorrido', 'Cadera y rodillas suben juntas', 'Espalda neutra (no curvada)', 'Mira al frente, no al techo'],
    equivalentExerciseId: 'cal_single_leg_rdl',
    tier: 'S',
    tierNotes: 'Ejercicio fundamental para fuerza global, cadena posterior y agarre. Imprescindible para principiantes/intermedios.'
  },
  {
    id: 'gym_db_lunges',
    name: 'Zancadas con mancuernas',
    modality: 'gym',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'core'],
    requiredEquipment: ['dumbbells'],
    defaultReps: { min: 10, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 90,
    cues: ['Paso largo, rodilla trasera casi al suelo', 'Tronco vertical', 'Empuja con el talón al subir'],
    equivalentExerciseId: 'cal_lunges',
    tier: 'A'
  },
  {
    id: 'gym_leg_extension',
    name: 'Extensión de cuádriceps en máquina',
    modality: 'gym',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    requiredEquipment: ['leg_extension'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Espalda apoyada en el respaldo', 'Sube hasta extender (pero sin bloquear de golpe)', 'Bajada controlada'],
    tier: 'A'
  },
  {
    id: 'gym_seated_leg_curl',
    name: 'Curl femoral sentado',
    modality: 'gym',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    requiredEquipment: ['leg_curl'],
    defaultReps: { min: 10, max: 15 },
    defaultSets: 3,
    defaultRestSeconds: 60,
    cues: ['Rodillas alineadas con el eje de la máquina', 'Pies en flexión dorsal', 'Variante con cadera flexionada → más estiramiento'],
    tier: 'A',
    tierNotes: 'Versión sentada genera más estiramiento que la tumbada → mejor para hipertrofia.'
  },
  {
    id: 'gym_seated_calf_raise',
    name: 'Elevación de gemelos sentado',
    modality: 'gym',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    requiredEquipment: ['calf_raise_machine'],
    alternativeEquipment: [['bench_flat', 'dumbbells']],
    defaultReps: { min: 12, max: 15 },
    defaultSets: 4,
    defaultRestSeconds: 45,
    cues: ['Rodillas en 90°', 'Trabaja sobre todo el sóleo', 'Pausa de 1s en el estiramiento'],
    equivalentExerciseId: 'cal_calf_raise',
    tier: 'A'
  },
  {
    id: 'gym_french_press_db',
    name: 'Press francés con mancuerna',
    modality: 'gym',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    requiredEquipment: ['dumbbells', 'bench_flat'],
    alternativeEquipment: [['dumbbells', 'bench_incline']],
    defaultReps: { min: 8, max: 12 },
    defaultSets: 3,
    defaultRestSeconds: 75,
    cues: ['Tumbado, codos fijos apuntando al techo', 'Baja la mancuerna detrás/al lado de la cabeza', 'Sin abrir codos'],
    equivalentExerciseId: 'cal_diamond_pushup',
    tier: 'A'
  }
];
