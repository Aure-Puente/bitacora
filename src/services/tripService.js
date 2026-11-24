import { generateTripCode, pickMemberColor } from '../utils/code';
import { db } from './firebase';
import { arrayUnion, collection, doc, getDoc, serverTimestamp, Timestamp } from './sdk/firestore';
import { ensureOnline, updateDoc, writeBatch } from './syncService';

function memberPayload(user) {
  return {
    uid: user.uid,
    displayName:
      user.displayName || (user.email ? user.email.split('@')[0] : 'Viajero'),
    email: user.email || null,
    photoURL: user.photoURL || null,
    color: pickMemberColor(user.uid),
    joinedAt: serverTimestamp(),
  };
}

// Código de invitación único (verifica que no exista).
async function freshCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = generateTripCode();
    const snap = await getDoc(doc(db, 'tripCodes', code));
    if (!snap.exists()) return code;
  }
  throw new Error('No pudimos generar un código de invitación. Intentá de nuevo.');
}

export async function createTrip(
  user,
  { name, destination, emoji, theme, currency, departureAt, returnAt }
) {
  ensureOnline('crear un viaje');
  const code = await freshCode();
  const tripRef = doc(collection(db, 'trips'));
  const batch = writeBatch(db);

  batch.set(tripRef, {
    name: name.trim(),
    destination: (destination || '').trim(),
    emoji,
    theme: { primary: theme.primary, accent: theme.accent },
    currency,
    departureAt: Timestamp.fromDate(departureAt),
    returnAt: Timestamp.fromDate(returnAt),
    ownerId: user.uid,
    memberIds: [user.uid],
    code,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'trips', tripRef.id, 'members', user.uid), memberPayload(user));
  batch.set(doc(db, 'tripCodes', code), { tripId: tripRef.id, ownerId: user.uid });

  await batch.commitNow();
  return tripRef.id;
}

// Edición del viaje (solo el creador, lo controlan las reglas).
// unlinkDeparture: se cambió la salida a mano, así que deja de seguir al vuelo de Reservas.
export function updateTrip(
  tripId,
  { name, destination, emoji, theme, departureAt, returnAt, unlinkDeparture }
) {
  return updateDoc(doc(db, 'trips', tripId), {
    name: name.trim(),
    destination: (destination || '').trim(),
    emoji,
    theme: { primary: theme.primary, accent: theme.accent },
    departureAt: Timestamp.fromDate(departureAt),
    returnAt: Timestamp.fromDate(returnAt),
    ...(unlinkDeparture ? { departureBookingId: null } : {}),
  });
}

// Unirse con el código de invitación. Devuelve el id del viaje.
// myTripIds: viajes de los que ya soy parte (si el código es de uno de ellos, no hay nada que escribir).
export async function joinTripByCode(user, rawCode, myTripIds = []) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (code.length < 4) throw new Error('Ingresá el código de invitación.');

  ensureOnline('unirte a un viaje');
  const codeSnap = await getDoc(doc(db, 'tripCodes', code));
  if (!codeSnap.exists()) {
    throw new Error('Ese código no existe. Revisalo e intentá de nuevo.');
  }
  const { tripId } = codeSnap.data();
  if (myTripIds.includes(tripId)) return tripId;

  const batch = writeBatch(db);
  batch.update(doc(db, 'trips', tripId), { memberIds: arrayUnion(user.uid) });
  batch.set(doc(db, 'trips', tripId, 'members', user.uid), memberPayload(user), { merge: true });
  await batch.commitNow();
  return tripId;
}
