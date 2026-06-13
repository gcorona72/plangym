import { db } from '$db/database';
import { canPerformExercise } from './exerciseFilter';
import type {
  UserProfile, TrainingProgram, TrainingDay, PlannedExercise,
  Exercise, MuscleGroup, ExperienceLevel, ProgressionType
} from '$lib/types';

/**
 * GENERADOR DE PROGRAMAS DE ENTRENAMIENTO.
 *
 * A diferencia de ProgramFactory (que elige entre 3 plantillas fijas), esto
 * CONSTRUYE un programa a medida a partir de:
 *   - días de entreno por semana (2-6)
 *   - nivel de experiencia (principiante/intermedio/avanzado)
 *   - equipamiento disponible (filtra ejercicios que no puede hacer)
 *   - preferencia (gym / calistenia / híbrido)
 *
 * Estructura por días (programación estándar de hipertrofia):
 *   2 días → Full Body A/B
 *   3 días → Full Body A/B/C
 *   4 días → Upper/Lower ×2  (frecuencia 2× por grupo)
 *   5 días → Upper/Lower/Push/Pull/Legs
 *   6 días → Push/Pull/Legs ×2
 *
 * Periodización de reps según nivel (principiante = menos volumen + más
 * técnica con rangos algo más bajos; avanzado = más volumen y reps altas en
 * accesorios). La sobrecarga progresiva la gestiona la doble progresión ya
 * existente; aquí solo se fija el rango inicial.
 */

// ─── PLANTILLAS DE DÍA: slots (músculo + rol compuesto/accesorio) ───────────
type SlotRole = 'compound' | 'accessory';
interface Slot { muscle: MuscleGroup; role: SlotRole; }

const TEMPLATES: Record<string, Slot[]> = {
  full_body: [
    { muscle: 'quads', role: 'compound' },
    { muscle: 'chest', role: 'compound' },
    { muscle: 'back', role: 'compound' },
    { muscle: 'hamstrings', role: 'accessory' },
    { muscle: 'shoulders', role: 'accessory' },
    { muscle: 'biceps', role: 'accessory' },
    { muscle: 'triceps', role: 'accessory' }
  ],
  upper: [
    { muscle: 'chest', role: 'compound' },
    { muscle: 'back', role: 'compound' },
    { muscle: 'shoulders', role: 'compound' },
    { muscle: 'back', role: 'accessory' },
    { muscle: 'chest', role: 'accessory' },
    { muscle: 'biceps', role: 'accessory' },
    { muscle: 'triceps', role: 'accessory' }
  ],
  lower: [
    { muscle: 'quads', role: 'compound' },
    { muscle: 'hamstrings', role: 'compound' },
    { muscle: 'quads', role: 'accessory' },
    { muscle: 'glutes', role: 'accessory' },
    { muscle: 'calves', role: 'accessory' },
    { muscle: 'core', role: 'accessory' }
  ],
  push: [
    { muscle: 'chest', role: 'compound' },
    { muscle: 'shoulders', role: 'compound' },
    { muscle: 'chest', role: 'accessory' },
    { muscle: 'triceps', role: 'accessory' },
    { muscle: 'shoulders', role: 'accessory' },
    { muscle: 'triceps', role: 'accessory' }
  ],
  pull: [
    { muscle: 'back', role: 'compound' },
    { muscle: 'back', role: 'compound' },
    { muscle: 'back', role: 'accessory' },
    { muscle: 'biceps', role: 'accessory' },
    { muscle: 'biceps', role: 'accessory' },
    { muscle: 'shoulders', role: 'accessory' }
  ],
  legs: [
    { muscle: 'quads', role: 'compound' },
    { muscle: 'hamstrings', role: 'compound' },
    { muscle: 'quads', role: 'accessory' },
    { muscle: 'glutes', role: 'accessory' },
    { muscle: 'hamstrings', role: 'accessory' },
    { muscle: 'calves', role: 'accessory' }
  ]
};

const DAY_LABELS: Record<string, string> = {
  full_body: 'Full Body', upper: 'Tren superior', lower: 'Tren inferior',
  push: 'Empuje (Push)', pull: 'Tirón (Pull)', legs: 'Pierna'
};

// ─── REPARTO SEMANAL (índice 0=Lunes … 6=Domingo) ───────────────────────────
function weeklyLayout(days: number): (string | null)[] {
  switch (Math.max(2, Math.min(6, days))) {
    case 2: return ['full_body', null, null, 'full_body', null, null, null];
    case 3: return ['full_body', null, 'full_body', null, 'full_body', null, null];
    case 4: return ['upper', 'lower', null, 'upper', 'lower', null, null];
    case 5: return ['upper', 'lower', 'push', null, 'pull', 'legs', null];
    case 6: return ['push', 'pull', 'legs', 'push', 'pull', 'legs', null];
    default: return ['upper', 'lower', null, 'upper', 'lower', null, null];
  }
}

// ─── ESQUEMA DE REPS POR NIVEL ──────────────────────────────────────────────
interface RepScheme { sets: number; repsMin: number; repsMax: number; rest: number; rir: number; prog: ProgressionType; }
const SCHEMES: Record<ExperienceLevel, Record<SlotRole, RepScheme>> = {
  beginner: {
    compound:  { sets: 3, repsMin: 5,  repsMax: 8,  rest: 150, rir: 2, prog: 'strength' },
    accessory: { sets: 3, repsMin: 8,  repsMax: 12, rest: 90,  rir: 1, prog: 'hypertrophy' }
  },
  intermediate: {
    compound:  { sets: 4, repsMin: 6,  repsMax: 10, rest: 150, rir: 2, prog: 'hypertrophy' },
    accessory: { sets: 3, repsMin: 10, repsMax: 15, rest: 75,  rir: 1, prog: 'hypertrophy' }
  },
  advanced: {
    compound:  { sets: 4, repsMin: 6,  repsMax: 10, rest: 180, rir: 1, prog: 'hypertrophy' },
    accessory: { sets: 4, repsMin: 12, repsMax: 18, rest: 75,  rir: 1, prog: 'hypertrophy' }
  }
};

const SLOTS_BY_LEVEL: Record<ExperienceLevel, number> = { beginner: 5, intermediate: 6, advanced: 7 };

// ─── PRIORIZACIÓN DE EJERCICIOS ─────────────────────────────────────────────
const TIER_RANK: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
function tierRank(ex: Exercise): number { return ex.tier ? TIER_RANK[ex.tier] : 2.5; }
function isCompound(ex: Exercise): boolean {
  return (ex.primaryMuscles.length + ex.secondaryMuscles.length) >= 3
    || ex.requiredEquipment.includes('barbell')
    || /squat|deadlift|press|row|pullup|dip|lunge|chinup/.test(ex.id);
}
/**
 * Prioridad para slots compuestos: los básicos con barra primero (sentadilla,
 * press banca, remo, peso muerto, militar), luego el resto de compuestos, y
 * dentro de cada grupo por tier. Para principiantes esto asegura que aprendan
 * los patrones fundamentales.
 */
function fundamentalRank(ex: Exercise): number {
  const isBigLift = /squat|deadlift|bench_press|overhead_press|barbell_row|pullup/.test(ex.id);
  if (isBigLift) return 0;
  if (ex.requiredEquipment.includes('barbell')) return 1;
  if (isCompound(ex)) return 2;
  return 3;
}

/**
 * Pool de ejercicios candidatos para un músculo+rol, ya filtrado por
 * equipamiento, ordenado por idoneidad (tier, y compuesto-primero para
 * slots compound).
 */
function buildPool(
  all: Exercise[], muscle: MuscleGroup, role: SlotRole,
  modality: 'gym' | 'calisthenics', equipment: UserProfile['gymEquipment']
): Exercise[] {
  return all
    .filter(e => e.modality === modality)
    .filter(e => e.primaryMuscles.includes(muscle))
    .filter(e => modality === 'calisthenics' || canPerformExercise(e, equipment))
    .sort((a, b) => {
      if (role === 'compound') {
        const f = fundamentalRank(a) - fundamentalRank(b);
        if (f !== 0) return f;
      }
      return tierRank(a) - tierRank(b);
    });
}

function pickPlanned(
  pool: Exercise[], used: Set<string>, variant: number,
  scheme: RepScheme
): PlannedExercise | null {
  if (pool.length === 0) return null;
  // Rotación por variante para que días repetidos no salgan idénticos
  for (let i = 0; i < pool.length; i++) {
    const ex = pool[(variant + i) % pool.length];
    if (!used.has(ex.id)) {
      used.add(ex.id);
      return {
        exerciseId: ex.id,
        sets: scheme.sets,
        repsMin: scheme.repsMin,
        repsMax: scheme.repsMax,
        restSeconds: scheme.rest,
        targetRIR: scheme.rir,
        progressionType: scheme.prog
      };
    }
  }
  return null;
}

function buildDay(
  all: Exercise[], type: string, order: number, variant: number,
  level: ExperienceLevel, equipment: UserProfile['gymEquipment']
): TrainingDay {
  const template = TEMPLATES[type] ?? TEMPLATES.full_body;
  const cap = SLOTS_BY_LEVEL[level];
  const slots = template.slice(0, cap);

  const gymUsed = new Set<string>();
  const calUsed = new Set<string>();
  const gymExercises: PlannedExercise[] = [];
  const calisthenicsExercises: PlannedExercise[] = [];

  for (const slot of slots) {
    const scheme = SCHEMES[level][slot.role];
    const gymPick = pickPlanned(buildPool(all, slot.muscle, slot.role, 'gym', equipment), gymUsed, variant, scheme);
    if (gymPick) gymExercises.push(gymPick);
    // Calistenia: reps un poco más altas (peso corporal)
    const calScheme: RepScheme = { ...scheme, repsMin: scheme.repsMin + 2, repsMax: scheme.repsMax + 4, rest: Math.min(scheme.rest, 120) };
    const calPick = pickPlanned(buildPool(all, slot.muscle, slot.role, 'calisthenics', equipment), calUsed, variant, calScheme);
    if (calPick) calisthenicsExercises.push(calPick);
  }

  const muscles = Array.from(new Set(slots.map(s => s.muscle)));
  return {
    id: `gen_${type}_${order}`,
    name: `${DAY_LABELS[type]}${variant > 0 ? ' B' : ''}`,
    order,
    primaryMuscles: muscles,
    gymExercises,
    calisthenicsExercises
  };
}

function restDay(order: number): TrainingDay {
  return {
    id: `gen_rest_${order}`,
    name: 'Descanso',
    order,
    primaryMuscles: [],
    gymExercises: [],
    calisthenicsExercises: [],
    isRestDay: true
  };
}

/**
 * Genera un TrainingProgram completo y a medida para el perfil.
 */
export async function generateProgram(profile: UserProfile): Promise<TrainingProgram> {
  const all = await db.exercises.toArray();
  const days = profile.trainingDaysPerWeek ?? 4;
  const level: ExperienceLevel = profile.experienceLevel ?? 'beginner';
  const equipment = profile.gymEquipment ?? [];

  const layout = weeklyLayout(days);
  // Contador de variante por tipo de día (2º Upper → variante B)
  const seen: Record<string, number> = {};
  const programDays: TrainingDay[] = layout.map((type, i) => {
    if (!type) return restDay(i);
    const variant = seen[type] ?? 0;
    seen[type] = variant + 1;
    return buildDay(all, type, i, variant, level, equipment);
  });

  const splitName =
    days <= 3 ? 'Full Body' :
    days === 4 ? 'Upper/Lower' :
    days === 5 ? 'U/L + PPL' : 'PPL ×2';

  return {
    id: `gen_${Date.now()}`,
    name: `${splitName} · ${days} días (${levelLabel(level)})`,
    description: `Generado para ti: ${days} días/semana, nivel ${levelLabel(level).toLowerCase()}, filtrado por tu equipamiento.`,
    active: true,
    createdAt: new Date().toISOString(),
    days: programDays
  };
}

function levelLabel(l: ExperienceLevel): string {
  return l === 'beginner' ? 'Principiante' : l === 'intermediate' ? 'Intermedio' : 'Avanzado';
}

/**
 * Genera el programa, lo marca como activo (desactivando los demás) y lo
 * guarda en la BBDD. Devuelve el programa creado.
 */
export async function generateAndActivate(profile: UserProfile): Promise<TrainingProgram> {
  const program = await generateProgram(profile);
  await db.transaction('rw', db.programs, async () => {
    const existing = await db.programs.toArray();
    for (const p of existing) {
      if (p.active) await db.programs.update(p.id, { active: false });
    }
    await db.programs.add(program);
  });
  return program;
}
