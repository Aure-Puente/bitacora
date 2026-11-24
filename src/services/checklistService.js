import { db } from './firebase';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { deleteDoc, updateDoc, writeBatch } from './syncService';

const itemRef = (tripId, id) => doc(db, 'trips', tripId, 'checklistItems', id);

// Agrega uno o varios ítems. listId: 'shared' o el uid propio (lista personal).
export function addChecklistItems(tripId, user, listId, texts) {
  const shared = listId === 'shared';
  const batch = writeBatch(db);
  texts.forEach((text, position) => {
    batch.set(doc(collection(db, 'trips', tripId, 'checklistItems')), {
      text: text.trim(),
      scope: shared ? 'shared' : 'personal',
      ownerId: shared ? null : user.uid,
      done: false,
      doneBy: null,
      position, // mantiene el orden de los que se agregan juntos (plantillas)
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  });
  return batch.commit();
}

export function setChecklistItemDone(tripId, id, done, uid) {
  return updateDoc(itemRef(tripId, id), { done, doneBy: done ? uid : null });
}

export function deleteChecklistItem(tripId, id) {
  return deleteDoc(itemRef(tripId, id));
}
