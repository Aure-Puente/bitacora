import { db } from './firebase';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { addDoc, deleteDoc, updateDoc } from './syncService';

const taskRef = (tripId, id) => doc(db, 'trips', tripId, 'tasks', id);

// Crea o edita una tarea. Si viene `id`, edita. assigneeId = null: sin responsable.
export async function saveTask(tripId, user, { title, assigneeId }, id) {
  const data = { title: title.trim(), assigneeId: assigneeId || null, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(taskRef(tripId, id), data);
    return id;
  }
  const ref = await addDoc(collection(db, 'trips', tripId, 'tasks'), {
    ...data,
    done: false,
    doneBy: null,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function setTaskDone(tripId, id, done, uid) {
  return updateDoc(taskRef(tripId, id), { done, doneBy: done ? uid : null, updatedAt: serverTimestamp() });
}

export function deleteTask(tripId, id) {
  return deleteDoc(taskRef(tripId, id));
}
