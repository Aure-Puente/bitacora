import { db } from './firebase';
import { collection, doc, serverTimestamp, Timestamp } from './sdk/firestore';
import { writeBatch } from './syncService';

const bookingRef = (tripId, id) => doc(db, 'trips', tripId, 'bookings', id);

// Crea o edita una reserva. Si viene `id`, edita.
// flight: { airline, number, terminal, gate } solo para type = 'vuelo'; si no, null.
// departure: { date } hace que la cuenta regresiva use este vuelo | 'unlink' deja de usarlo | null no toca nada.
export async function saveBooking(
  tripId,
  user,
  { type, title, code, day, time, address, mapsUrl, notes, flight, departure },
  id
) {
  const data = {
    type,
    title: title.trim(),
    code: code.trim(),
    day,
    time: time || null,
    address: address.trim(),
    mapsUrl: mapsUrl || '',
    notes: notes.trim(),
    flight:
      type === 'vuelo'
        ? {
            airline: flight.airline.trim(),
            number: flight.number.trim().toUpperCase(),
            terminal: flight.terminal.trim().toUpperCase(),
            gate: flight.gate.trim().toUpperCase(),
          }
        : null,
    updatedAt: serverTimestamp(),
  };
  // La reserva y la salida del viaje se guardan juntas: o las dos o ninguna.
  const ref = id ? bookingRef(tripId, id) : doc(collection(db, 'trips', tripId, 'bookings'));
  const batch = writeBatch(db);
  if (id) batch.update(ref, data);
  else batch.set(ref, { ...data, createdBy: user.uid, createdAt: serverTimestamp() });

  if (departure === 'unlink') {
    batch.update(doc(db, 'trips', tripId), { departureBookingId: null });
  } else if (departure) {
    batch.update(doc(db, 'trips', tripId), {
      departureAt: Timestamp.fromDate(departure.date),
      departureBookingId: ref.id,
    });
  }
  await batch.commit();
  return ref.id;
}

// isDeparture: la cuenta regresiva usaba este vuelo (conserva la fecha, pero deja de seguirlo).
export async function deleteBooking(tripId, id, isDeparture) {
  const batch = writeBatch(db);
  batch.delete(bookingRef(tripId, id));
  if (isDeparture) batch.update(doc(db, 'trips', tripId), { departureBookingId: null });
  await batch.commit();
}
