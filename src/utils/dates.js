const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const pad = (n) => String(n).padStart(2, '0');

// Acepta Timestamp de Firestore, Date, número o string.
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "sábado 27 de febrero de 2027"
export function formatLongDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

// "sábado 27 de febrero · 08:30 hs"
export function formatDateTimeLong(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} · ${formatTime(d)} hs`;
}

export function startOfDay(value) {
  const d = new Date(toDate(value));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Días de calendario entre a y b (b - a).
export function daysBetween(a, b) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}
