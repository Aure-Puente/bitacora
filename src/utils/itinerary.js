import { startOfDay, toDate } from './dates';

// Los días se guardan como texto 'AAAA-MM-DD' y la hora como 'HH:MM': así una actividad
// no cambia de día si el celular está en otra zona horaria. Una idea es una actividad con day = null.

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LONG_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDER_STEP = 1000;
const MAX_DAYS = 120; // tope por si las fechas del viaje están mal cargadas
const RECENT_MINUTES = 60; // una actividad sigue siendo "la próxima" hasta una hora después de empezar

const pad = (n) => String(n).padStart(2, '0');

export function dayKey(value) {
  const d = toDate(value);
  if (!d) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayKeyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Días de calendario del viaje, de la salida al regreso (los dos incluidos).
export function tripDays(departureAt, returnAt) {
  const from = toDate(departureAt);
  const to = toDate(returnAt) || from;
  if (!from) return [];
  const days = [];
  const cursor = startOfDay(from);
  const last = dayKey(to);
  while (dayKey(cursor) <= last && days.length < MAX_DAYS) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// "Vie 26/2"
export function formatDayShort(key) {
  const d = dayKeyToDate(key);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

// "Viernes 26/2"
export function formatDayLong(key) {
  const d = dayKeyToDate(key);
  return `${LONG_DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

// "Hoy", "Mañana" o "Viernes 26/2"
export function formatDayRelative(key, now) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === dayKey(now)) return 'Hoy';
  if (key === dayKey(tomorrow)) return 'Mañana';
  return formatDayLong(key);
}

export function compareActivities(a, b) {
  return (a.order || 0) - (b.order || 0) || String(a.id).localeCompare(String(b.id));
}

// Separa las actividades en ideas (sin día), por día del viaje y fuera de las fechas del viaje.
export function groupActivities(activities, days) {
  const byDay = {};
  days.forEach((d) => {
    byDay[d] = [];
  });
  const ideas = [];
  const outOfRange = [];
  activities
    .slice()
    .sort(compareActivities)
    .forEach((a) => {
      if (!a.day) ideas.push(a);
      else if (byDay[a.day]) byDay[a.day].push(a);
      else outOfRange.push(a);
    });
  outOfRange.sort((a, b) => a.day.localeCompare(b.day) || compareActivities(a, b));
  return { ideas, byDay, outOfRange };
}

// Valor de `order` para sumar una actividad a un día ya ordenado a mano:
// con hora va antes de la primera que sea más tarde; sin hora va al final.
export function insertOrder(list, time) {
  if (!list.length) return ORDER_STEP;
  const index = time ? list.findIndex((a) => a.time && a.time > time) : -1;
  if (index === -1) return list[list.length - 1].order + ORDER_STEP;
  if (index === 0) return list[0].order - ORDER_STEP;
  return (list[index - 1].order + list[index].order) / 2;
}

// Cambios de `order` necesarios para que la lista quede como está: [{ id, order }].
export function orderUpdates(list) {
  return list
    .map((a, i) => ({ id: a.id, order: (i + 1) * ORDER_STEP, prev: a.order }))
    .filter((u) => u.order !== u.prev)
    .map(({ id, order }) => ({ id, order }));
}

// Próxima actividad con día que no esté hecha. Dentro del día respeta el orden manual.
export function nextActivity(activities, now) {
  const today = dayKey(now);
  const limit = new Date(now.getTime() - RECENT_MINUTES * 60000);
  // Pasada la medianoche, el límite de "recién empezada" no puede caer en el día anterior.
  const minTime = dayKey(limit) === today ? `${pad(limit.getHours())}:${pad(limit.getMinutes())}` : '00:00';

  const upcoming = activities.filter((a) => {
    if (!a.day || a.status === 'hecho' || a.day < today) return false;
    return a.day > today || !a.time || a.time >= minTime;
  });
  upcoming.sort((a, b) => a.day.localeCompare(b.day) || compareActivities(a, b));
  return upcoming[0] || null;
}

// Acepta un link con o sin https://. Devuelve '' si está vacío y null si no es un link web.
export function normalizeUrl(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const url = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url) ? url : null;
}

// Link para abrir en Maps: el que se cargó o, si no hay, una búsqueda por el texto del lugar.
export function mapsLink(activity, destination) {
  const own = normalizeUrl(activity.mapsUrl);
  if (own) return own;
  const place = String(activity.place || '').trim();
  if (!place) return null;
  const query = destination ? `${place}, ${destination}` : place;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
