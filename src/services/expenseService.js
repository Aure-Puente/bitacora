import { friendlyError } from '../utils/firebaseErrors';
import {
  confirmBackup,
  dropBackup,
  failBackup,
  getBackups,
  putBackup,
  recoverBackups,
} from './expenseBackupService';
import { auth, db } from './firebase';
import * as sdk from './sdk/firestore';
import { addDoc, deleteDoc, track } from './syncService';

const { collection, doc, serverTimestamp, Timestamp } = sdk;

const expenseRef = (tripId, id) => doc(db, 'trips', tripId, 'expenses', id);

// Escrituras de esta sesión que todavía esperan al servidor (no hace falta recuperarlas).
const inFlight = new Set();

function toData(entry) {
  return {
    ...entry.payload,
    date: Timestamp.fromDate(new Date(entry.payload.date)),
    writeId: entry.writeId, // permite saber si el servidor tiene esta versión
    updatedAt: serverTimestamp(),
  };
}

// Guarda en Firestore una entrada que ya está respaldada.
// keep: si el servidor la rechaza, queda en la lista de gastos sin confirmar.
async function writeEntry(uid, entry, keep = false) {
  const { tripId, expenseId, writeId } = entry;
  const data = toData(entry);
  const ref = expenseRef(tripId, expenseId);
  const promise = entry.isNew
    ? sdk.setDoc(ref, { ...data, createdBy: uid, createdAt: serverTimestamp() })
    : sdk.updateDoc(ref, data);

  let released = keep; // la pantalla ya siguió: un rechazo se guarda en vez de mostrarse ahí
  inFlight.add(writeId);
  promise
    .then(
      () => confirmBackup(uid, expenseId, writeId),
      (e) =>
        released
          ? failBackup(uid, expenseId, writeId, friendlyError(e))
          : confirmBackup(uid, expenseId, writeId) // el error lo ve la persona en el formulario
    )
    .catch((e) => console.warn('Respaldo de gastos:', e))
    .finally(() => inFlight.delete(writeId));

  await track(promise);
  released = true;
}

// Crea o edita un gasto. Si viene `id`, edita. Antes de enviarlo lo respalda en el celular.
export async function saveExpense(
  tripId,
  user,
  { description, amount, paidBy, splitBetween, category, date, receiptId },
  id
) {
  const entry = {
    tripId,
    expenseId: id || doc(collection(db, 'trips', tripId, 'expenses')).id,
    writeId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    isNew: !id,
    payload: {
      description: description.trim(),
      amount,
      paidBy,
      splitBetween,
      category,
      date: date.toISOString(),
      receiptId: receiptId || null, // foto del ticket (trips/{id}/files)
    },
    savedAt: Date.now(),
  };
  await putBackup(user.uid, entry);
  // Editar un gasto que el servidor todavía no confirmó es, para el servidor, crearlo.
  const stored = (await getBackups(user.uid)).find((e) => e.writeId === entry.writeId) || entry;
  await writeEntry(user.uid, stored);
  return entry.expenseId;
}

export async function deleteExpense(tripId, id) {
  const uid = auth.currentUser && auth.currentUser.uid;
  // Primero el respaldo: si no, un gasto borrado podría "recuperarse" después.
  if (uid) await dropBackup(uid, id);
  await deleteDoc(expenseRef(tripId, id));
}

// --- Gastos sin confirmar -----------------------------------------------------

// Al volver la conexión, revisa los respaldos que quedaron de una vez anterior.
export async function recoverExpenses(uid) {
  await sdk.waitForPendingWrites(db); // primero, que Firestore envíe su propia cola
  await recoverBackups(uid, {
    skip: (entry) => inFlight.has(entry.writeId),
    read: async (entry) => {
      const snap = await sdk.getDocFromServer(expenseRef(entry.tripId, entry.expenseId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return { writeId: data.writeId, updatedAtMs: data.updatedAt ? data.updatedAt.toMillis() : 0 };
    },
    write: (entry) => writeEntry(uid, entry, true),
    isRejection: (e) => String(e.code || '').endsWith('permission-denied'),
    rejectedMessage: friendlyError({ code: 'permission-denied' }),
    missingMessage: 'Otra persona borró este gasto antes de que se guardara tu cambio.',
  });
}

// Vuelve a guardar un gasto rechazado, con el mismo id.
export async function retryExpense(uid, entry) {
  const next = { ...entry, isNew: true, savedAt: Date.now() };
  await putBackup(uid, next);
  await writeEntry(uid, next, true);
}

export const discardExpense = (uid, entry) => dropBackup(uid, entry.expenseId);

// --- Pagos para saldar --------------------------------------------------------

// Registra que `from` le pagó `amount` a `to` (para saldar deudas).
export function addSettlement(tripId, user, { from, to, amount }) {
  return addDoc(collection(db, 'trips', tripId, 'settlements'), {
    from,
    to,
    amount,
    date: Timestamp.now(),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
}

export function deleteSettlement(tripId, id) {
  return deleteDoc(doc(db, 'trips', tripId, 'settlements', id));
}
