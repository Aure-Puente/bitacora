import { db } from './firebase';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { addDoc, deleteDoc, updateDoc } from './syncService';

const contactRef = (tripId, id) => doc(db, 'trips', tripId, 'contacts', id);

// Crea o edita un contacto útil. Si viene `id`, edita.
export async function saveContact(tripId, user, { name, phone, note }, id) {
  const data = {
    name: name.trim(),
    phone: phone.trim(),
    note: note.trim(),
    updatedAt: serverTimestamp(),
  };
  if (id) {
    await updateDoc(contactRef(tripId, id), data);
    return id;
  }
  const ref = await addDoc(collection(db, 'trips', tripId, 'contacts'), {
    ...data,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function deleteContact(tripId, id) {
  return deleteDoc(contactRef(tripId, id));
}
