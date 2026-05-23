/**
 * Mapeo de IDs internos → carpeta dentro de free-exercise-db (yuhonas).
 *
 * Repositorio: https://github.com/yuhonas/free-exercise-db
 * Licencia: dominio público (Unlicense).
 *
 * Cada carpeta contiene 0.jpg (posición inicial) y 1.jpg (posición final).
 * URL base:
 *   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{folder}/{0|1}.jpg
 *
 * Si un ejercicio no tiene mapeo aquí, la app no muestra imagen
 * (se usa el diagrama muscular SVG como fallback).
 *
 * NOTA: para algunos ejercicios "tier S" muy específicos (Bayesian, Katana…)
 * no hay un equivalente exacto en el dataset, así que mapeamos a la
 * variante más cercana.
 */
export const EXERCISE_IMAGE_FOLDERS: Record<string, string> = {
  // ─── PECHO ─────────────────────────────────────────────────────────────
  gym_bench_press:        'Barbell_Bench_Press_-_Medium_Grip',
  gym_incline_db_press:   'Incline_Dumbbell_Press',
  gym_cable_crossover:    'Cable_Crossover',
  gym_dips_weighted:      'Dips_-_Chest_Version',

  // ─── ESPALDA ───────────────────────────────────────────────────────────
  gym_pullup:                 'Pullups',
  gym_barbell_row:            'Bent_Over_Barbell_Row',
  gym_lat_pulldown:           'Wide-Grip_Lat_Pulldown',
  gym_one_arm_db_row:         'One-Arm_Dumbbell_Row',
  gym_chest_supported_row:    'T-Bar_Row_with_Handle',

  // ─── HOMBROS ───────────────────────────────────────────────────────────
  gym_overhead_press:         'Standing_Military_Press',
  gym_db_shoulder_press:      'Seated_Dumbbell_Press',
  gym_lateral_raise:          'Side_Lateral_Raise',
  gym_cable_lateral_raise:    'Side_Lateral_Raise',  // fallback al lateral con mancuerna
  gym_face_pull:              'Face_Pull',

  // ─── BÍCEPS ────────────────────────────────────────────────────────────
  gym_barbell_curl:    'Barbell_Curl',
  gym_db_alt_curl:     'Dumbbell_Alternate_Bicep_Curl',
  gym_hammer_curl:     'Hammer_Curls',
  gym_cable_curl:      'Cable_Curl',
  gym_preacher_curl:   'Preacher_Curl',
  gym_bayesian_curl:   'Cable_Curl',  // fallback (no hay variante Bayesian)

  // ─── TRÍCEPS ───────────────────────────────────────────────────────────
  gym_tricep_pushdown:     'Tricep_Pushdown',
  gym_french_press:        'EZ-Bar_Skullcrusher',
  gym_french_press_db:     'Lying_Dumbbell_Tricep_Extension',
  gym_katana_extension:    'Tricep_Pushdown',  // fallback

  // ─── PIERNAS ───────────────────────────────────────────────────────────
  gym_squat:                  'Barbell_Squat',
  gym_front_squat:            'Barbell_Front_Squat',
  gym_conventional_deadlift:  'Barbell_Deadlift',
  gym_romanian_deadlift:      'Romanian_Deadlift_with_Dumbbells',
  gym_leg_press:              'Leg_Press',
  gym_leg_extension:          'Leg_Extensions',
  gym_leg_curl:               'Lying_Leg_Curls',
  gym_seated_leg_curl:        'Seated_Leg_Curl',
  gym_db_lunges:              'Dumbbell_Lunges',
  gym_calf_raise:             'Standing_Calf_Raises',
  gym_seated_calf_raise:      'Seated_Calf_Raise',

  // ─── CALISTENIA ────────────────────────────────────────────────────────
  cal_pushup:           'Pushups',
  cal_decline_pushup:   'Decline_Pushups',
  cal_diamond_pushup:   'Close-Grip_Pushup',
  cal_pike_pushup:      'Pushups_-_Close_Triceps_Position',
  cal_dips:             'Dips',
  cal_pullup:           'Pullups',
  cal_chinup:           'Chin-Up',
  cal_inverted_row:     'Body-Up',
  cal_plank:            'Plank',
  cal_hanging_leg_raise: 'Hanging_Leg_Raise',
  cal_glute_bridge:     'Glute_Bridge',
  cal_lunges:           'Bodyweight_Walking_Lunge',
  cal_bulgarian_split:  'Rear_Lunge',  // aproximación
  cal_pistol_squat:     'Single-Leg_Pistol_Squat',
  cal_single_leg_rdl:   'Single_Leg_Deadlift',
  cal_calf_raise:       'Standing_Calf_Raises'
};
