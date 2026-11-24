import { db } from './firebase';
import { collection, doc, getDocs, serverTimestamp } from './sdk/firestore';
import { addDoc, deleteDoc, updateDoc, writeBatch } from './syncService';

// Plan de cuotas: alguien (creditorId) pagó por todos y los demás le devuelven en N cuotas.
// debtors: [{ uid, owed }]  (owed = lo que debe cada uno en total)
export async function createPlan(
  tripId,
  { title, totalAmount, installments, creditorId, debtors, createdBy }
) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'plans'), {
    title: title.trim(),
    totalAmount,
    installments,
    creditorId,
    debtors,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePlan(tripId, planId) {
  const payments = await getDocs(collection(db, 'trips', tripId, 'plans', planId, 'payments'));
  const batch = writeBatch(db);
  payments.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'trips', tripId, 'plans', planId));
  await batch.commit();
}

// El deudor avisa "pagué una cuota": queda pendiente hasta que el acreedor confirme.
export function addPayment(tripId, planId, debtorId) {
  return addDoc(collection(db, 'trips', tripId, 'plans', planId, 'payments'), {
    debtorId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export function confirmPayment(tripId, planId, paymentId) {
  return updateDoc(doc(db, 'trips', tripId, 'plans', planId, 'payments', paymentId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
  });
}

// Rechazar (acreedor) o cancelar (deudor, si sigue pendiente).
export function removePayment(tripId, planId, paymentId) {
  return deleteDoc(doc(db, 'trips', tripId, 'plans', planId, 'payments', paymentId));
}
