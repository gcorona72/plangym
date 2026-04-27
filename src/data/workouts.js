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

module.exports = {
  TRAINING_MODE_LABELS,
  TRAINING_SECTION_LABELS,
  DEFAULT_TRAINING_ROUTINE,
  TRAINING_CATALOG_GROUPS,
};

