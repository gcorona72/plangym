const TRAINING_MODE_LABELS = {
  gym: 'Gym',
  calisthenia: 'Calistenia',
};

const TRAINING_SECTION_LABELS = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  quads: 'Cuádriceps',
  hamstrings: 'Isquios y Glúteo',
  arms: 'Brazos',
  calves: 'Gemelos',
};

const DEFAULT_TRAINING_ROUTINE = {
  routineId: 'torso-pierna-4d',
  routineName: 'Torso / Pierna 4 días',
  notes: 'Programa Torso/Pierna 4 días para hipertrofia con sobrecarga progresiva.',
};

const TRAINING_CATALOG_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Cuádriceps',
  'Isquios y Glúteo',
  'Brazos',
  'Gemelos',
];

// Mapeo de términos técnicos a nomenclatura de grupos musculares
const TRAINING_TERMINOLOGY_MAP = {
  'tirones': 'Espalda y Bíceps',
  'pull': 'Espalda y Bíceps',
  'tirones verticales': 'Espalda y Bíceps',
  'tirones horizontales': 'Espalda y Bíceps',
  'tirones verticales y/o horizontales': 'Espalda y Bíceps',
  'empujes': 'Pecho, Hombros y Tríceps',
  'push': 'Pecho, Hombros y Tríceps',
  'empujes verticales': 'Pecho, Hombros y Tríceps',
  'empujes horizontales': 'Pecho, Hombros y Tríceps',
  'dominantes de rodilla': 'Piernas completas',
  'dominantes de cadera': 'Piernas completas',
  'dominantes de rodilla / cadera': 'Piernas completas',
  'dominantes de rodilla/cadera': 'Piernas completas',
};

module.exports = {
  TRAINING_MODE_LABELS,
  TRAINING_SECTION_LABELS,
  DEFAULT_TRAINING_ROUTINE,
  TRAINING_CATALOG_GROUPS,
  TRAINING_TERMINOLOGY_MAP,
};

