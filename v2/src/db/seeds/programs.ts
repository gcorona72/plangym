import type { TrainingProgram } from '$lib/types';

/**
 * PROGRAMA ACTIVO POR DEFECTO (validado por entrenador personal).
 *
 * Upper/Lower 4 días. Frecuencia 2× semana por grupo muscular.
 * Énfasis en ejercicios compuestos básicos. Pensado para principiante/intermedio.
 *
 * Estructura semanal:
 *   Lunes      → Tren superior A · fuerza  (RIR 2 en compuestos, 5-8 reps)
 *   Martes     → Tren inferior A · fuerza
 *   Miércoles  → Descanso (caminar 30-40 min suave)
 *   Jueves     → Tren superior B · hipertrofia (RIR 1, 8-12 reps)
 *   Viernes    → Tren inferior B · hipertrofia
 *   Sáb-Dom    → Descanso
 *
 * Reglas:
 *   - Compuestos: 1-2 RIR siempre, nunca al fallo
 *   - Progresión: +2.5 kg en compuestos cuando se completen todas las series
 *   - Accesorios: +1 rep cada sesión hasta tope del rango
 *   - Deload en semana 7: -40% de cargas durante una semana
 */
export const COACH_UPPER_LOWER_PROGRAM: TrainingProgram = {
  id: 'coach_upper_lower_4',
  name: 'Upper / Lower 4 días (entrenador)',
  description: 'Plan validado por entrenador. Frecuencia 2×/semana por grupo. Énfasis en compuestos.',
  active: true,
  createdAt: new Date().toISOString(),
  days: [
    // ─── DÍA 1 · LUNES · TREN SUPERIOR A (fuerza) ─────────────────────────
    {
      id: 'cul_upper_a',
      name: 'Tren superior A · fuerza',
      order: 0,
      primaryMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      gymExercises: [
        { exerciseId: 'gym_bench_press',     sets: 4, repsMin: 5,  repsMax: 7,  restSeconds: 180, targetRIR: 2, progressionType: 'strength',    incrementKg: 2.5 },
        { exerciseId: 'gym_barbell_row',     sets: 4, repsMin: 6,  repsMax: 8,  restSeconds: 180, targetRIR: 2, progressionType: 'strength',    incrementKg: 2.5, notes: 'Variante Pendlay o bent-over' },
        { exerciseId: 'gym_overhead_press',  sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120, targetRIR: 2, progressionType: 'strength',    incrementKg: 2.5 },
        { exerciseId: 'gym_pullup',          sets: 3, repsMin: 5,  repsMax: 12, restSeconds: 120, targetRIR: 1, progressionType: 'hypertrophy',                   notes: 'A reps máximas. Cuando llegues a 12 limpias, añade lastre +2.5kg' },
        { exerciseId: 'gym_barbell_curl',    sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,   notes: 'Con barra Z preferentemente' },
        { exerciseId: 'gym_french_press_db', sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_pushup',         sets: 4, repsMin: 8,  repsMax: 15, restSeconds: 90, targetRIR: 2, notes: 'Equivalente: press de banca' },
        { exerciseId: 'cal_inverted_row',   sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 2, notes: 'Equivalente: remo con barra' },
        { exerciseId: 'cal_pike_pushup',    sets: 3, repsMin: 6,  repsMax: 10, restSeconds: 90, targetRIR: 2, notes: 'Equivalente: press militar' },
        { exerciseId: 'cal_pullup',         sets: 3, repsMin: 4,  repsMax: 10, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_chinup',         sets: 3, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: curl con barra' },
        { exerciseId: 'cal_diamond_pushup', sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press francés' }
      ]
    },

    // ─── DÍA 2 · MARTES · TREN INFERIOR A (fuerza) ────────────────────────
    {
      id: 'cul_lower_a',
      name: 'Tren inferior A · fuerza',
      order: 1,
      primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
      gymExercises: [
        { exerciseId: 'gym_squat',             sets: 4, repsMin: 5,  repsMax: 7,  restSeconds: 180, targetRIR: 2, progressionType: 'strength',    incrementKg: 5,   notes: 'Sentadilla trasera con barra. +5kg al principio, +2.5kg cuando se complique' },
        { exerciseId: 'gym_romanian_deadlift', sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 150, targetRIR: 2, progressionType: 'strength',    incrementKg: 2.5 },
        { exerciseId: 'gym_leg_press',         sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 120, targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 5 },
        { exerciseId: 'gym_leg_curl',          sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 2.5, notes: 'Curl femoral tumbado' },
        { exerciseId: 'gym_calf_raise',        sets: 4, repsMin: 10, repsMax: 15, restSeconds: 60,  targetRIR: 0, progressionType: 'hypertrophy', incrementKg: 2.5, notes: 'Elevación gemelos de pie' },
        { exerciseId: 'cal_plank',             sets: 3, repsMin: 45, repsMax: 60, restSeconds: 60,  progressionType: 'endurance',                                  notes: 'Plancha · segundos. Sube +5s/sesión hasta 60s' }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_bulgarian_split', sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 2, notes: 'Equivalente: sentadilla' },
        { exerciseId: 'cal_single_leg_rdl',  sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 75, targetRIR: 2, notes: 'Equivalente: peso muerto rumano' },
        { exerciseId: 'cal_lunges',          sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 1, notes: 'Equivalente: prensa' },
        { exerciseId: 'cal_nordic_curl',     sets: 3, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: curl femoral' },
        { exerciseId: 'cal_calf_raise',      sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60, targetRIR: 0 },
        { exerciseId: 'cal_plank',           sets: 3, repsMin: 45, repsMax: 60, restSeconds: 60, notes: 'Plancha frontal · segundos' }
      ]
    },

    // ─── DÍA 3 · MIÉRCOLES · DESCANSO ─────────────────────────────────────
    {
      id: 'cul_rest_1',
      name: 'Descanso · camina 30-40 min suave',
      order: 2, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },

    // ─── DÍA 4 · JUEVES · TREN SUPERIOR B (hipertrofia) ───────────────────
    {
      id: 'cul_upper_b',
      name: 'Tren superior B · hipertrofia',
      order: 3,
      primaryMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      gymExercises: [
        { exerciseId: 'gym_incline_db_press',     sets: 4, repsMin: 7,  repsMax: 9,  restSeconds: 120, targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,    notes: '+1kg por mancuerna' },
        { exerciseId: 'gym_lat_pulldown',         sets: 4, repsMin: 8,  repsMax: 10, restSeconds: 120, targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 2.5,  notes: 'Agarre cerrado neutro si tu polea lo permite' },
        { exerciseId: 'gym_db_shoulder_press',    sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,    notes: '+1kg por mancuerna' },
        { exerciseId: 'gym_one_arm_db_row',       sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,    notes: 'Por cada lado' },
        { exerciseId: 'gym_cable_lateral_raise',  sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60,  targetRIR: 0, progressionType: 'hypertrophy', incrementKg: 1.25, notes: 'RIR 0-1. Incremento +1.25-2.5kg' },
        { exerciseId: 'gym_hammer_curl',          sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,    notes: '+1kg por mancuerna' },
        { exerciseId: 'gym_tricep_pushdown',      sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 2.5,  notes: 'Con cuerda preferentemente' }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_decline_pushup',  sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press inclinado' },
        { exerciseId: 'cal_pullup',          sets: 4, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: jalón al pecho' },
        { exerciseId: 'cal_pike_pushup',     sets: 3, repsMin: 6,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press hombro' },
        { exerciseId: 'cal_inverted_row',    sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: remo 1 mano' },
        { exerciseId: 'cal_band_lateral',    sets: 4, repsMin: 12, repsMax: 20, restSeconds: 60, targetRIR: 0, notes: 'Equivalente: lateral en polea (banda)' },
        { exerciseId: 'cal_chinup',          sets: 3, repsMin: 5,  repsMax: 10, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: curl martillo' },
        { exerciseId: 'cal_diamond_pushup',  sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: ext. tríceps' }
      ]
    },

    // ─── DÍA 5 · VIERNES · TREN INFERIOR B (hipertrofia) ──────────────────
    {
      id: 'cul_lower_b',
      name: 'Tren inferior B · hipertrofia',
      order: 4,
      primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
      gymExercises: [
        { exerciseId: 'gym_front_squat',           sets: 4, repsMin: 6,  repsMax: 8,  restSeconds: 150, targetRIR: 1, progressionType: 'strength',    incrementKg: 2.5, notes: 'O sentadilla Hack si tienes' },
        { exerciseId: 'gym_conventional_deadlift', sets: 3, repsMin: 5,  repsMax: 5,  restSeconds: 180, targetRIR: 2, progressionType: 'strength',    incrementKg: 5,   notes: 'Fijo en 5 reps. +5kg al principio, +2.5kg cuando se complique' },
        { exerciseId: 'gym_db_lunges',             sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 1,   notes: 'Por cada pierna. +1kg por mancuerna' },
        { exerciseId: 'gym_leg_extension',         sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 2.5 },
        { exerciseId: 'gym_seated_leg_curl',       sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,  targetRIR: 1, progressionType: 'hypertrophy', incrementKg: 2.5 },
        { exerciseId: 'gym_seated_calf_raise',     sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45,  targetRIR: 0, progressionType: 'hypertrophy', incrementKg: 2.5 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_pistol_squat',     sets: 4, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: sentadilla frontal' },
        { exerciseId: 'cal_single_leg_rdl',   sets: 3, repsMin: 6,  repsMax: 10, restSeconds: 90, targetRIR: 2, notes: 'Equivalente: peso muerto convencional' },
        { exerciseId: 'cal_lunges',           sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_bulgarian_split',  sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75, targetRIR: 1, notes: 'Equivalente: ext. cuádriceps' },
        { exerciseId: 'cal_glute_bridge',     sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: curl femoral sentado' },
        { exerciseId: 'cal_calf_raise',       sets: 4, repsMin: 15, repsMax: 25, restSeconds: 45, targetRIR: 0 }
      ]
    },

    // ─── DÍAS 6 y 7 · SÁBADO + DOMINGO · DESCANSO ─────────────────────────
    {
      id: 'cul_rest_2',
      name: 'Descanso',
      order: 5, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },
    {
      id: 'cul_rest_3',
      name: 'Descanso',
      order: 6, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    }
  ]
};


/**
 * PROGRAMA ACTIVO POR DEFECTO: Push / Pull / Pierna / Torso (4 días).
 *
 * Estructura semanal típica:
 *   Lunes      → Empuje (pecho, hombro, tríceps)
 *   Martes     → Tirón (espalda, hombro posterior, bíceps)
 *   Miércoles  → Descanso
 *   Jueves     → Piernas (completo)
 *   Viernes    → Torso accesorio (puntos débiles)
 *   Sáb-Dom    → Descanso
 *
 * Diseñado para 1-1.5x frecuencia por grupo muscular. Equilibrado para ectomorfos.
 */
export const PPLT_4DAYS_PROGRAM: TrainingProgram = {
  id: 'ppl_torso_4days',
  name: 'Push / Pull / Pierna / Torso (4 días)',
  description: 'Split clásico de 4 días. Cada grupo muscular 1-1.5× semana. (Alternativa)',
  active: false,
  createdAt: new Date().toISOString(),
  days: [
    // ─── DÍA 1 · LUNES · EMPUJE ───────────────────────────────────────────
    {
      id: 'p4_push',
      name: 'Empuje · pecho · hombros · tríceps',
      order: 0,
      primaryMuscles: ['chest', 'shoulders', 'triceps'],
      gymExercises: [
        { exerciseId: 'gym_bench_press',       sets: 4, repsMin: 6,  repsMax: 8,  restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_db_shoulder_press', sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 120, targetRIR: 1 },
        { exerciseId: 'gym_dips_weighted',     sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90,  targetRIR: 1 },
        { exerciseId: 'gym_lateral_raise',     sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60,  targetRIR: 1 },
        { exerciseId: 'gym_tricep_pushdown',   sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,  targetRIR: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_decline_pushup', sets: 4, repsMin: 6,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press de banca' },
        { exerciseId: 'cal_pike_pushup',    sets: 3, repsMin: 6,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press militar' },
        { exerciseId: 'cal_dips',           sets: 3, repsMin: 6,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: fondos' },
        { exerciseId: 'cal_band_lateral',   sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: elevaciones laterales (requiere banda)' },
        { exerciseId: 'cal_diamond_pushup', sets: 3, repsMin: 6,  repsMax: 12, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: extensión tríceps' }
      ]
    },

    // ─── DÍA 2 · MARTES · TIRÓN ───────────────────────────────────────────
    {
      id: 'p4_pull',
      name: 'Tirón · espalda · hombro post · bíceps',
      order: 1,
      primaryMuscles: ['back', 'biceps', 'shoulders'],
      gymExercises: [
        { exerciseId: 'gym_pullup',      sets: 4, repsMin: 6,  repsMax: 8,  restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_barbell_row', sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 120, targetRIR: 1 },
        { exerciseId: 'gym_face_pull',   sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60,  targetRIR: 1 },
        { exerciseId: 'gym_db_alt_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75,  targetRIR: 1 },
        { exerciseId: 'cal_chinup',      sets: 2, repsMin: 6,  repsMax: 15, restSeconds: 90,  targetRIR: 0, notes: 'Al fallo o RIR 1' }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_pullup',         sets: 4, repsMin: 4,  repsMax: 10, restSeconds: 120, targetRIR: 1, notes: 'Equivalente: dominadas' },
        { exerciseId: 'cal_inverted_row',   sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90,  targetRIR: 1, notes: 'Equivalente: remo con barra' },
        { exerciseId: 'cal_band_face_pull', sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60,  targetRIR: 1, notes: 'Equivalente: face pull (requiere banda)' },
        { exerciseId: 'cal_band_curl',      sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60,  targetRIR: 1, notes: 'Equivalente: curl bíceps (requiere banda)' },
        { exerciseId: 'cal_chinup',         sets: 2, repsMin: 5,  repsMax: 12, restSeconds: 90,  targetRIR: 0, notes: 'Al fallo' }
      ]
    },

    // ─── DÍA 3 · MIÉRCOLES · DESCANSO ─────────────────────────────────────
    {
      id: 'p4_rest_1',
      name: 'Descanso',
      order: 2, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },

    // ─── DÍA 4 · JUEVES · PIERNAS ─────────────────────────────────────────
    {
      id: 'p4_legs',
      name: 'Piernas completo',
      order: 3,
      primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
      gymExercises: [
        { exerciseId: 'gym_squat',             sets: 4, repsMin: 6,  repsMax: 8,  restSeconds: 180, targetRIR: 1 },
        { exerciseId: 'gym_romanian_deadlift', sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_leg_press',         sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, targetRIR: 1 },
        { exerciseId: 'gym_leg_curl',          sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75,  targetRIR: 1 },
        { exerciseId: 'gym_calf_raise',        sets: 4, repsMin: 15, repsMax: 15, restSeconds: 60,  targetRIR: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_bulgarian_split', sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: sentadilla libre' },
        { exerciseId: 'cal_single_leg_rdl',  sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 75, targetRIR: 1, notes: 'Equivalente: peso muerto rumano' },
        { exerciseId: 'cal_lunges',          sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 1, notes: 'Equivalente: prensa de piernas' },
        { exerciseId: 'cal_nordic_curl',     sets: 3, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: curl de isquios' },
        { exerciseId: 'cal_calf_raise',      sets: 4, repsMin: 15, repsMax: 25, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: elevación gemelos' }
      ]
    },

    // ─── DÍA 5 · VIERNES · TORSO ACCESORIO ────────────────────────────────
    {
      id: 'p4_torso',
      name: 'Torso · volumen reducido · puntos débiles',
      order: 4,
      primaryMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      gymExercises: [
        { exerciseId: 'gym_incline_db_press', sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'gym_lat_pulldown',     sets: 3, repsMin: 8,  repsMax: 10, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'gym_lateral_raise',    sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 1 },
        { exerciseId: 'gym_cable_curl',       sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, targetRIR: 1, notes: '🔗 Superserie con flexiones diamante' },
        { exerciseId: 'cal_diamond_pushup',   sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, targetRIR: 1, notes: '🔗 Superserie con curl en polea' }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_decline_pushup', sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: press inclinado' },
        { exerciseId: 'cal_pullup',         sets: 3, repsMin: 5,  repsMax: 10, restSeconds: 90, targetRIR: 1, notes: 'Equivalente: jalón al pecho' },
        { exerciseId: 'cal_band_lateral',   sets: 3, repsMin: 12, repsMax: 20, restSeconds: 60, targetRIR: 1, notes: 'Equivalente: elevaciones laterales (requiere banda)' },
        { exerciseId: 'cal_band_curl',      sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, targetRIR: 1, notes: '🔗 Superserie con diamante' },
        { exerciseId: 'cal_diamond_pushup', sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60, targetRIR: 1, notes: '🔗 Superserie con curl' }
      ]
    },

    // ─── DÍAS 6 y 7 · SÁBADO + DOMINGO · DESCANSO ─────────────────────────
    {
      id: 'p4_rest_2',
      name: 'Descanso',
      order: 5, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },
    {
      id: 'p4_rest_3',
      name: 'Descanso',
      order: 6, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    }
  ]
};


/**
 * Programa PRINCIPIANTE: Full Body 3 días por semana (L-X-V).
 *
 * Para usuarios que llevan <6 meses entrenando o tras un parón.
 * Frecuencia muy alta (3x) por grupo muscular pero con menor volumen total.
 * Ideal para aprender técnica y construir base.
 */
export const BEGINNER_PROGRAM: TrainingProgram = {
  id: 'beginner_full_body_3',
  name: 'Principiante Full Body 3 días',
  description: 'Frecuencia 3x semana. Para empezar o tras parón. L-X-V.',
  active: false,
  createdAt: new Date().toISOString(),
  days: [
    {
      id: 'b_full_1',
      name: 'Full Body A',
      order: 0,
      primaryMuscles: ['chest', 'back', 'shoulders', 'quads', 'hamstrings'],
      gymExercises: [
        { exerciseId: 'gym_squat', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 150, targetRIR: 2 },
        { exerciseId: 'gym_bench_press', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_barbell_row', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_overhead_press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 120, targetRIR: 2 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_bulgarian_split', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_pushup', sets: 3, repsMin: 8, repsMax: 15, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_inverted_row', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_pike_pushup', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90, targetRIR: 2 }
      ]
    },
    {
      id: 'b_rest_1',
      name: 'Descanso',
      order: 1, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },
    {
      id: 'b_full_2',
      name: 'Full Body B',
      order: 2,
      primaryMuscles: ['hamstrings', 'glutes', 'back', 'chest', 'core'],
      gymExercises: [
        { exerciseId: 'gym_romanian_deadlift', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 150, targetRIR: 2 },
        { exerciseId: 'gym_pullup', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_incline_db_press', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'gym_calf_raise', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 2 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_glute_bridge', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 2 },
        { exerciseId: 'cal_pullup', sets: 3, repsMin: 4, repsMax: 10, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_decline_pushup', sets: 3, repsMin: 8, repsMax: 15, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_plank', sets: 3, repsMin: 30, repsMax: 60, restSeconds: 60, targetRIR: 2 }
      ]
    },
    {
      id: 'b_rest_2',
      name: 'Descanso',
      order: 3, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },
    {
      id: 'b_full_3',
      name: 'Full Body C',
      order: 4,
      primaryMuscles: ['quads', 'glutes', 'shoulders', 'back', 'biceps'],
      gymExercises: [
        { exerciseId: 'gym_leg_press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_lat_pulldown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'gym_lateral_raise', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 2 },
        { exerciseId: 'gym_barbell_curl', sets: 2, repsMin: 10, repsMax: 12, restSeconds: 75, targetRIR: 2 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_pistol_squat', sets: 3, repsMin: 3, repsMax: 8, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_chinup', sets: 3, repsMin: 5, repsMax: 10, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_dips', sets: 3, repsMin: 6, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_hanging_leg_raise', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 75, targetRIR: 2 }
      ]
    },
    {
      id: 'b_rest_3',
      name: 'Descanso',
      order: 5, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    },
    {
      id: 'b_rest_4',
      name: 'Descanso',
      order: 6, primaryMuscles: [], gymExercises: [], calisthenicsExercises: [], isRestDay: true
    }
  ]
};


/**
 * Programa por defecto: Upper/Lower 4 días.
 *
 * Cada día tiene versión GIMNASIO y versión CALISTENIA/CASA con los mismos
 * grupos musculares trabajados. El usuario elige al empezar la sesión.
 *
 * Frecuencia: 2x por grupo muscular/semana → óptimo para hipertrofia en
 * ectomorfos según la literatura (Schoenfeld 2016, ISSN).
 */
export const DEFAULT_PROGRAM: TrainingProgram = {
  id: 'default_upper_lower_4',
  name: 'Upper/Lower 4 días',
  description: 'Frecuencia 2x semana por grupo. Alternativa de alto volumen.',
  active: false,
  createdAt: new Date().toISOString(),
  days: [
    {
      id: 'd_upper_1',
      name: 'Tren superior (fuerza)',
      order: 0,
      primaryMuscles: ['chest', 'back', 'shoulders'],
      gymExercises: [
        { exerciseId: 'gym_bench_press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_barbell_row', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_overhead_press', sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_pullup', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120, targetRIR: 2 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_pushup', sets: 4, repsMin: 8, repsMax: 15, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_inverted_row', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_pike_pushup', sets: 3, repsMin: 6, repsMax: 12, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_pullup', sets: 3, repsMin: 4, repsMax: 10, restSeconds: 120, targetRIR: 2 }
      ]
    },
    {
      id: 'd_lower_1',
      name: 'Tren inferior (fuerza)',
      order: 1,
      primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
      gymExercises: [
        { exerciseId: 'gym_squat', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180, targetRIR: 1 },
        { exerciseId: 'gym_romanian_deadlift', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150, targetRIR: 1 },
        { exerciseId: 'gym_leg_press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 120, targetRIR: 2 },
        { exerciseId: 'gym_calf_raise', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_bulgarian_split', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_glute_bridge', sets: 4, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_pistol_squat', sets: 3, repsMin: 3, repsMax: 8, restSeconds: 90, targetRIR: 2 },
        { exerciseId: 'cal_calf_raise', sets: 4, repsMin: 15, repsMax: 25, restSeconds: 60, targetRIR: 1 }
      ]
    },
    {
      id: 'd_rest_1',
      name: 'Descanso',
      order: 2,
      primaryMuscles: [],
      gymExercises: [],
      calisthenicsExercises: [],
      isRestDay: true
    },
    {
      id: 'd_upper_2',
      name: 'Tren superior (hipertrofia)',
      order: 3,
      primaryMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
      gymExercises: [
        { exerciseId: 'gym_incline_db_press', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'gym_lat_pulldown', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'gym_lateral_raise', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 1 },
        { exerciseId: 'gym_barbell_curl', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'gym_tricep_pushdown', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, targetRIR: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_decline_pushup', sets: 4, repsMin: 8, repsMax: 15, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_pullup', sets: 4, repsMin: 5, repsMax: 10, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'cal_pike_pushup', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_chinup', sets: 3, repsMin: 5, repsMax: 12, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_diamond_pushup', sets: 3, repsMin: 6, repsMax: 12, restSeconds: 60, targetRIR: 1 }
      ]
    },
    {
      id: 'd_lower_2',
      name: 'Tren inferior (hipertrofia)',
      order: 4,
      primaryMuscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
      gymExercises: [
        { exerciseId: 'gym_leg_press', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 90, targetRIR: 1 },
        { exerciseId: 'gym_leg_curl', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'gym_calf_raise', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 60, targetRIR: 1 }
      ],
      calisthenicsExercises: [
        { exerciseId: 'cal_bulgarian_split', sets: 4, repsMin: 10, repsMax: 15, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_glute_bridge', sets: 4, repsMin: 12, repsMax: 20, restSeconds: 75, targetRIR: 1 },
        { exerciseId: 'cal_calf_raise', sets: 4, repsMin: 20, repsMax: 30, restSeconds: 60, targetRIR: 1 },
        { exerciseId: 'cal_hanging_leg_raise', sets: 3, repsMin: 8, repsMax: 15, restSeconds: 75, targetRIR: 1 }
      ]
    },
    {
      id: 'd_rest_2',
      name: 'Descanso',
      order: 5,
      primaryMuscles: [],
      gymExercises: [],
      calisthenicsExercises: [],
      isRestDay: true
    },
    {
      id: 'd_rest_3',
      name: 'Descanso',
      order: 6,
      primaryMuscles: [],
      gymExercises: [],
      calisthenicsExercises: [],
      isRestDay: true
    }
  ]
};
