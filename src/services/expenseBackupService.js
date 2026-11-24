import AsyncStorage from '@react-native-async-storage/async-storage';

import { confirmEntry, decideEntry, dropEntry, failEntry, putEntry } from '../utils/expenseBackup';

// Respaldo de gastos en el celular, uno por cuenta. Ver src/utils/expenseBackup.js.
const keyOf = (uid) => `@bitacora/expenseBackup/${uid}`;

const lists = {}; // uid -> entradas
const listeners = new Set();
let queue = Promise.resolve(); // de a un cambio por vez, para no pisar el archivo

async function load(uid) {
  if (!lists[uid]) {
    const raw = await AsyncStorage.getItem(keyOf(uid));
    lists[uid] = raw ? JSON.parse(raw) : [];
  }
  return lists[uid];
}

function change(uid, fn) {
  const run = queue.then(async () => {
    const next = fn(await load(uid));
    await AsyncStorage.setItem(keyOf(uid), JSON.stringify(next));
    lists[uid] = next;
    listeners.forEach((listener) => listener(uid, next));
  });
  queue = run.catch(() => {}); // un error no frena a los siguientes
  return run;
}

export const getBackups = (uid) => queue.then(() => load(uid));

export function subscribeBackups(uid, fn) {
  const listener = (changedUid, list) => {
    if (changedUid === uid) fn(list);
  };
  listeners.add(listener);
  getBackups(uid)
    .then(fn)
    .catch(() => {});
  return () => listeners.delete(listener);
}

export const putBackup = (uid, entry) => change(uid, (list) => putEntry(list, entry));
export const confirmBackup = (uid, expenseId, writeId) =>
  change(uid, (list) => confirmEntry(list, expenseId, writeId));
export const failBackup = (uid, expenseId, writeId, error) =>
  change(uid, (list) => failEntry(list, expenseId, writeId, error));
export const dropBackup = (uid, expenseId) => change(uid, (list) => dropEntry(list, expenseId));

// Revisa lo que quedó sin confirmar de antes. read(entry) devuelve lo que hay en el servidor
// (o null) y write(entry) lo vuelve a guardar con el mismo id, así que no puede duplicarse.
export async function recoverBackups(uid, { read, write, skip, isRejection, rejectedMessage, missingMessage }) {
  const pending = (await getBackups(uid)).filter((e) => e.status === 'pending' && !skip(e));
  for (let i = 0; i < pending.length; i += 1) {
    const entry = pending[i];
    try {
      // eslint-disable-next-line no-await-in-loop
      const decision = decideEntry(entry, await read(entry));
      if (decision === 'rewrite') {
        // eslint-disable-next-line no-await-in-loop
        await write(entry);
      } else if (decision === 'missing') {
        // eslint-disable-next-line no-await-in-loop
        await failBackup(uid, entry.expenseId, entry.writeId, missingMessage);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await confirmBackup(uid, entry.expenseId, entry.writeId);
      }
    } catch (e) {
      if (isRejection(e)) {
        // eslint-disable-next-line no-await-in-loop
        await failBackup(uid, entry.expenseId, entry.writeId, rejectedMessage);
      } else {
        console.warn('No se pudo revisar un gasto pendiente:', e); // se reintenta la próxima vez
      }
    }
  }
}
