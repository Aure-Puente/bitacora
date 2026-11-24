import { db } from './firebase';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { addDoc, deleteDoc, updateDoc, writeBatch } from './syncService';

const activityRef = (tripId, id) => doc(db, 'trips', tripId, 'activities', id);

// Crea o edita una actividad del itinerario (day = null es una idea). Si viene `id`, edita.
export async function saveActivity(
  tripId,
  user,
  { title, day, time, place, mapsUrl, notes, status, order, pollId },
  id
) {
  const data = {
    title: title.trim(),
    day: day || null,
    time: time || null,
    place: place.trim(),
    mapsUrl: mapsUrl || '',
    notes: notes.trim(),
    status,
    order,
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await updateDoc(activityRef(tripId, id), data);
    return id;
  }
  const ref = await addDoc(collection(db, 'trips', tripId, 'activities'), {
    ...data,
    pollId: pollId || null, // votación de la que salió, si la hay
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function setActivityStatus(tripId, id, status) {
  return updateDoc(activityRef(tripId, id), { status, updatedAt: serverTimestamp() });
}

// Asigna un día a una idea (o a una actividad que quedó fuera de las fechas).
export function setActivityDay(tripId, id, day, order) {
  return updateDoc(activityRef(tripId, id), { day: day || null, order, updatedAt: serverTimestamp() });
}

// updates: [{ id, order }]
export function saveActivityOrder(tripId, updates) {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => batch.update(activityRef(tripId, id), { order }));
  return batch.commit();
}

export function deleteActivity(tripId, id) {
  return deleteDoc(activityRef(tripId, id));
}
