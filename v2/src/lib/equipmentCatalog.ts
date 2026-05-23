import type { GymEquipmentId } from './types';

export interface EquipmentInfo {
  id: GymEquipmentId;
  name: string;
  emoji: string;
  category: 'basics' | 'racks' | 'machines' | 'accessories';
}

export const EQUIPMENT_CATALOG: EquipmentInfo[] = [
  // Básicos
  { id: 'barbell',             name: 'Barra olímpica',     emoji: '🏋️', category: 'basics' },
  { id: 'ez_bar',              name: 'Barra Z',            emoji: '🏋️', category: 'basics' },
  { id: 'dumbbells',           name: 'Mancuernas',         emoji: '🏋️', category: 'basics' },
  { id: 'kettlebells',         name: 'Kettlebells',        emoji: '🔔', category: 'basics' },
  { id: 'bench_flat',          name: 'Banco plano',        emoji: '🛋️', category: 'basics' },
  { id: 'bench_incline',       name: 'Banco inclinado',    emoji: '📐', category: 'basics' },
  { id: 'bench_decline',       name: 'Banco declinado',    emoji: '📐', category: 'basics' },

  // Racks
  { id: 'squat_rack',          name: 'Rack de sentadillas', emoji: '🟦', category: 'racks' },
  { id: 'power_rack',          name: 'Power rack / Jaula',  emoji: '🟦', category: 'racks' },
  { id: 'smith_machine',       name: 'Máquina Smith',       emoji: '🟦', category: 'racks' },
  { id: 'pullup_bar',          name: 'Barra de dominadas',  emoji: '🚪', category: 'racks' },
  { id: 'dip_bars',            name: 'Barras paralelas',    emoji: '🟰', category: 'racks' },

  // Máquinas
  { id: 'cable_machine',       name: 'Poleas',                  emoji: '🎚️', category: 'machines' },
  { id: 'lat_pulldown',        name: 'Jalón al pecho',          emoji: '⬇️', category: 'machines' },
  { id: 'seated_row',          name: 'Remo sentado',            emoji: '🚣', category: 'machines' },
  { id: 'leg_press',           name: 'Prensa de piernas',       emoji: '🦵', category: 'machines' },
  { id: 'leg_curl',            name: 'Curl femoral',            emoji: '🦵', category: 'machines' },
  { id: 'leg_extension',       name: 'Extensión cuádriceps',    emoji: '🦵', category: 'machines' },
  { id: 'chest_press_machine', name: 'Máquina press pecho',     emoji: '💪', category: 'machines' },
  { id: 'shoulder_press_machine', name: 'Máquina press hombros', emoji: '💪', category: 'machines' },
  { id: 'pec_deck',            name: 'Contractora de pecho',    emoji: '🦋', category: 'machines' },
  { id: 'calf_raise_machine',  name: 'Máquina de gemelos',      emoji: '🦶', category: 'machines' },
  { id: 'preacher_curl',       name: 'Banco Scott',             emoji: '🪑', category: 'machines' },

  // Accesorios
  { id: 'resistance_bands',    name: 'Bandas elásticas',  emoji: '🎀', category: 'accessories' },
  { id: 'medicine_ball',       name: 'Balón medicinal',   emoji: '🏐', category: 'accessories' },
  { id: 'trx',                 name: 'TRX / Anillas',     emoji: '🪢', category: 'accessories' }
];

export const EQUIPMENT_BY_CATEGORY = {
  basics: 'Básicos',
  racks: 'Racks y soportes',
  machines: 'Máquinas',
  accessories: 'Accesorios'
} as const;
