const EXERCISE_MASTER_DICTIONARY = [
  {
    id: 'chest_1',
    grupo: 'Pecho',
    nombre_es: 'Press de Banca con Barra',
    alternativa_calistenia: 'Flexiones con déficit',
    api_target_name: 'barbell bench press',
    api_target_name_calistenia: 'push ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'chest_2',
    grupo: 'Pecho',
    nombre_es: 'Press Inclinado con Mancuernas',
    alternativa_calistenia: 'Flexiones declinadas',
    api_target_name: 'dumbbell incline bench press',
    api_target_name_calistenia: 'decline push ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'chest_3',
    grupo: 'Pecho',
    nombre_es: 'Aperturas en Polea (Cruces)',
    alternativa_calistenia: 'Flexiones abiertas',
    api_target_name: 'cable cross-over',
    api_target_name_calistenia: 'wide push ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'back_1',
    grupo: 'Espalda',
    nombre_es: 'Jalón al pecho',
    alternativa_calistenia: 'Dominadas clásicas (Pull-ups)',
    api_target_name: 'cable pulldown',
    api_target_name_calistenia: 'pull ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'back_2',
    grupo: 'Espalda',
    nombre_es: 'Remo con Barra',
    alternativa_calistenia: 'Remo invertido (Australian Pull-ups)',
    api_target_name: 'barbell bent over row',
    api_target_name_calistenia: 'australian pull ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'back_3',
    grupo: 'Espalda',
    nombre_es: 'Remo en Polea Baja',
    alternativa_calistenia: 'Dominadas supinas (Chin-ups)',
    api_target_name: 'cable seated row',
    api_target_name_calistenia: 'chin ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'shoulder_1',
    grupo: 'Hombros',
    nombre_es: 'Press Militar Sentado',
    alternativa_calistenia: 'Flexiones en pica (Pike Push-ups)',
    api_target_name: 'dumbbell seated shoulder press',
    api_target_name_calistenia: 'pike push ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'shoulder_2',
    grupo: 'Hombros',
    nombre_es: 'Elevaciones Laterales',
    alternativa_calistenia: 'Elevaciones isométricas (toalla/puerta)',
    api_target_name: 'dumbbell lateral raise',
    api_target_name_calistenia: '',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'local',
  },
  {
    id: 'shoulder_3',
    grupo: 'Hombros',
    nombre_es: 'Facepull en Polea',
    alternativa_calistenia: 'Remo invertido abierto',
    api_target_name: 'cable face pull',
    api_target_name_calistenia: 'face pull',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_quad_1',
    grupo: 'Cuádriceps',
    nombre_es: 'Sentadilla Libre con Barra',
    alternativa_calistenia: 'Sentadilla Pistol asistida',
    api_target_name: 'barbell squat',
    api_target_name_calistenia: 'pistol squat',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_quad_2',
    grupo: 'Cuádriceps',
    nombre_es: 'Prensa de Piernas',
    alternativa_calistenia: 'Zancadas altas repeticiones',
    api_target_name: 'sled leg press',
    api_target_name_calistenia: 'walking lunge',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_quad_3',
    grupo: 'Cuádriceps',
    nombre_es: 'Sentadilla Búlgara',
    alternativa_calistenia: 'Sentadilla Búlgara sin peso',
    api_target_name: 'dumbbell bulgarian split squat',
    api_target_name_calistenia: 'bulgarian split squat',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_ham_1',
    grupo: 'Isquios y Glúteo',
    nombre_es: 'Peso Muerto Rumano',
    alternativa_calistenia: 'Puente de glúteo a una pierna',
    api_target_name: 'barbell romanian deadlift',
    api_target_name_calistenia: 'single leg glute bridge',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_ham_2',
    grupo: 'Isquios y Glúteo',
    nombre_es: 'Hip Thrust con Barra',
    alternativa_calistenia: 'Hip thrust peso corporal',
    api_target_name: 'barbell hip thrust',
    api_target_name_calistenia: 'single leg hip thrust',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'legs_ham_3',
    grupo: 'Isquios y Glúteo',
    nombre_es: 'Curl de Isquios',
    alternativa_calistenia: 'Curl nórdico / Curl deslizante',
    api_target_name: 'lever seated leg curl',
    api_target_name_calistenia: 'nordic curl',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'arms_1',
    grupo: 'Brazos',
    nombre_es: 'Curl de Bíceps Alterno',
    alternativa_calistenia: 'Dominadas supinas con agarre muy estrecho',
    api_target_name: 'dumbbell alternate bicep curl',
    api_target_name_calistenia: 'close grip chin ups',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'arms_2',
    grupo: 'Brazos',
    nombre_es: 'Extensión de Tríceps Polea',
    alternativa_calistenia: 'Flexiones diamante',
    api_target_name: 'cable triceps pushdown',
    api_target_name_calistenia: 'diamond push up',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
  {
    id: 'calves_1',
    grupo: 'Gemelos',
    nombre_es: 'Elevaciones de Gemelos',
    alternativa_calistenia: 'Elevaciones a un pie en escalón',
    api_target_name: 'smith machine calf raise',
    api_target_name_calistenia: 'single leg calf raise',
    animation_source_gym: 'exercisedb',
    animation_source_calistenia: 'musclewiki',
  },
];

function buildExerciseMasterLookup(items = EXERCISE_MASTER_DICTIONARY) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    if (item && item.id) acc[item.id] = item;
    return acc;
  }, {});
}

function groupExerciseMasters(items = EXERCISE_MASTER_DICTIONARY) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const group = String(item?.grupo || '').trim();
    if (!group) return acc;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

exports.EXERCISE_MASTER_DICTIONARY = EXERCISE_MASTER_DICTIONARY;
exports.buildExerciseMasterLookup = buildExerciseMasterLookup;
exports.groupExerciseMasters = groupExerciseMasters;

