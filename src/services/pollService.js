import { db } from './firebase';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { addDoc, deleteDoc, updateDoc } from './syncService';

const pollRef = (tripId, id) => doc(db, 'trips', tripId, 'polls', id);

// options: [{ id, text }]. optionIds se guarda aparte para que las reglas puedan validar el voto.
export async function createPoll(tripId, user, { question, options }) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'polls'), {
    question: question.trim(),
    options,
    optionIds: options.map((o) => o.id),
    votes: {},
    status: 'open',
    closedAt: null,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Cada persona tiene una sola clave en `votes`: votar de nuevo reemplaza el voto anterior.
export function votePoll(tripId, pollId, uid, optionId) {
  return updateDoc(pollRef(tripId, pollId), { [`votes.${uid}`]: optionId });
}

export function closePoll(tripId, pollId) {
  return updateDoc(pollRef(tripId, pollId), { status: 'closed', closedAt: serverTimestamp() });
}

export function deletePoll(tripId, pollId) {
  return deleteDoc(pollRef(tripId, pollId));
}
