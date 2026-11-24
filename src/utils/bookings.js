import { dayKeyToDate, mapsLink } from './itinerary';

// Orden cronológico. En un mismo día, las que no tienen hora van primero (por ejemplo, un alojamiento).
export function compareBookings(a, b) {
  return (
    a.day.localeCompare(b.day) ||
    (a.time || '').localeCompare(b.time || '') ||
    a.title.localeCompare(b.title) ||
    String(a.id).localeCompare(String(b.id))
  );
}

// Agrupa por día: [{ day, items }]
export function groupByDay(bookings) {
  const groups = [];
  bookings
    .slice()
    .sort(compareBookings)
    .forEach((b) => {
      const last = groups[groups.length - 1];
      if (last && last.day === b.day) last.items.push(b);
      else groups.push({ day: b.day, items: [b] });
    });
  return groups;
}

// Separa las que vienen (incluye todo lo de hoy) de las que ya pasaron.
export function splitBookings(bookings, today) {
  return {
    upcoming: groupByDay(bookings.filter((b) => b.day >= today)),
    past: groupByDay(bookings.filter((b) => b.day < today)),
  };
}

// "Aerolíneas Argentinas AR1234 · Terminal A · Puerta 12"
export function flightSummary(flight) {
  if (!flight) return '';
  return [
    [flight.airline, flight.number].filter(Boolean).join(' '),
    flight.terminal ? `Terminal ${flight.terminal}` : '',
    flight.gate ? `Puerta ${flight.gate}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

// Fecha y hora del vuelo como Date, para la cuenta regresiva.
export function bookingDate(day, time) {
  const date = dayKeyToDate(day);
  const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date;
}

// La dirección se busca tal cual: un aeropuerto de salida no está en el destino del viaje.
export function bookingMapsLink(booking) {
  return mapsLink({ place: booking.address, mapsUrl: booking.mapsUrl });
}

// Link para llamar, o null si no parece un teléfono. Acepta +54 9 261 555-1234, 911, *611, etc.
export function phoneLink(phone) {
  const raw = String(phone || '').trim();
  if (!/^\+?[\d\s().*#/-]+$/.test(raw)) return null;
  const digits = raw.replace(/[^\d*#]/g, '');
  if (digits.replace(/\D/g, '').length < 2) return null;
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits.replace(/#/g, '%23')}`;
}
