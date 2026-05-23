/**
 * Base de conocimiento: suplementación y FAQ.
 * Contenido basado en literatura científica (ISSN, Helms 2014, Schoenfeld 2010).
 */

export interface Supplement {
  id: string;
  name: string;
  emoji: string;
  dose: string;
  when: string;
  why: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export const SUPPLEMENTS: Supplement[] = [
  {
    id: 'creatine',
    name: 'Creatina monohidrato',
    emoji: '💪',
    dose: '5 g/día (todos los días, incluso descanso)',
    when: 'En cualquier momento, da igual la hora',
    why: 'Aumenta la fuerza y el volumen intracelular. El suplemento con MÁS evidencia. No necesita fase de carga.',
    priority: 'essential'
  },
  {
    id: 'whey',
    name: 'Proteína whey (o vegetal)',
    emoji: '🥤',
    dose: '25-40 g por toma. Suma hasta llegar a tu objetivo diario.',
    when: 'Post-entreno o cuando no llegues a la proteína con comida real',
    why: 'Facilita alcanzar la proteína diaria. Tu sistema lo aprovecha bien.',
    priority: 'recommended'
  },
  {
    id: 'malto',
    name: 'Maltodextrina / Harina de avena',
    emoji: '⚡',
    dose: '50-100 g por batido',
    when: 'En batidos hipercalóricos cuando no puedes comer más sólido',
    why: 'Densidad calórica líquida sin saciedad. Útil si tienes poco apetito.',
    priority: 'optional'
  },
  {
    id: 'vitd',
    name: 'Vitamina D3',
    emoji: '☀️',
    dose: '1000-2000 UI/día',
    when: 'Con una comida que tenga grasa',
    why: 'La mayoría de españoles tiene déficit. Influye en testosterona y recuperación.',
    priority: 'recommended'
  },
  {
    id: 'omega3',
    name: 'Omega 3 (EPA/DHA)',
    emoji: '🐟',
    dose: '2-3 g de EPA+DHA al día',
    when: 'Con comida',
    why: 'Antiinflamatorio. Mejora recuperación y salud cardiovascular.',
    priority: 'optional'
  }
];

// ─── FAQ / Troubleshooting ──────────────────────────────────────────────────
export interface FAQ {
  question: string;
  answer: string;
  emoji: string;
  category: 'nutrition' | 'training' | 'sleep' | 'general';
}

export const FAQS: FAQ[] = [
  {
    emoji: '🍝',
    category: 'nutrition',
    question: 'Me siento muy lleno y no puedo comer tanto',
    answer: 'Cambia parte de las comidas sólidas por batidos hipercalóricos (avena + leche + proteína + plátano + crema de cacahuete). Cada cucharada extra de aceite virgen en tus comidas son +120 kcal sin saciedad apenas. Otra opción: aumenta a 6 comidas más pequeñas en lugar de 4 grandes.'
  },
  {
    emoji: '🍔',
    category: 'nutrition',
    question: 'Gano peso pero es mucha grasa',
    answer: 'Tu surplus es excesivo. Baja 200 kcal y mantén la proteína. Asegúrate también de estar progresando en el entrenamiento (subiendo carga semana a semana). Sin sobrecarga progresiva, las kcal extra van a grasa.'
  },
  {
    emoji: '🏋️',
    category: 'training',
    question: 'No subo de peso en el gym desde hace 2 semanas',
    answer: 'Si el peso corporal SÍ progresa pero los kg en el gym no, prueba una semana de descarga (reduce volumen a la mitad e intensidad un 20%). Después vuelve con 1 serie extra por grupo muscular. Si nada progresa, revisa el sueño y las calorías.'
  },
  {
    emoji: '😴',
    category: 'sleep',
    question: 'Duermo poco y rindo mal',
    answer: 'Apunta a 7-9h. Cenar 2-3h antes de dormir, evitar cafeína después de las 14:00, móvil fuera de la cama. El sueño es donde el músculo crece. Si entrenas duro y duermes 5h, no progresarás.'
  },
  {
    emoji: '📅',
    category: 'training',
    question: '¿Cuánto debo subir cada semana?',
    answer: 'Aumenta un 2.5%-5% de la carga o 1-2 repeticiones respecto a la semana anterior. Mantén RIR 1-3 (deja 1-3 reps en la recámara). No fallo total cada serie.'
  },
  {
    emoji: '💧',
    category: 'general',
    question: '¿Cuánta agua debo beber?',
    answer: 'Aproximadamente 35 ml por kg de peso. Para 70 kg → ~2.4 L/día. Si entrenas duro o hace calor, súmale 500-1000 ml. El color de la orina debe ser amarillo claro.'
  },
  {
    emoji: '🥩',
    category: 'nutrition',
    question: '¿Cuánta proteína realmente necesito?',
    answer: 'Entre 1.6 y 2.2 g por kg de peso corporal. Para ti (recalculado en tu perfil) el target ya está optimizado. Repártela en 4-5 tomas a lo largo del día (30-40g por toma) para máxima síntesis proteica.'
  },
  {
    emoji: '⏰',
    category: 'training',
    question: 'No puedo ir al gym hoy, ¿qué hago?',
    answer: 'Usa la versión calistenia del día — están diseñadas para trabajar los mismos músculos sin equipamiento. Mejor entrenar que saltar la sesión. Solo si estás enfermo, descansa.'
  }
];
