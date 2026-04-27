const DATE_LOCALE = 'es-ES';

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function todayKey(reference = new Date()) {
  const date = reference instanceof Date ? reference : new Date(reference);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value, offset) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + Number(offset || 0));
  return dateKey(date);
}

function formatDateLabel(value, locale = DATE_LOCALE) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function shortDay(value, locale = DATE_LOCALE) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(date);
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', '&#10;');
}

function seededRandom(seed) {
  let h = 2166136261;
  const text = String(seed || '');
  for (let index = 0; index < text.length; index += 1) {
    h ^= text.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value), Number(min)), Number(max));
}

function formatNumber(value, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat(DATE_LOCALE, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(number);
}

module.exports = {
  DATE_LOCALE,
  clone,
  todayKey,
  dateKey,
  addDays,
  formatDateLabel,
  shortDay,
  normalize,
  escapeHtml,
  escapeAttr,
  seededRandom,
  clamp,
  formatNumber,
};

