import NetInfo from '@react-native-community/netinfo';

import { createWriteTracker } from '../utils/writeTracker';
import { db } from './firebase';
import * as sdk from './sdk/firestore';

// Conexión y cambios pendientes. Las pantallas lo usan a través de ConnectionContext.
let state = { online: true, pending: 0, oldPending: false };
const stateListeners = new Set();
const errorListeners = new Set();

function update(patch) {
  state = { ...state, ...patch };
  stateListeners.forEach((fn) => fn(state));
}

const tracker = createWriteTracker({
  isOnline: () => state.online,
  onChange: (pending) => update({ pending }),
  onLateError: (error) => errorListeners.forEach((fn) => fn(error)),
});

export const getSyncState = () => state;

export function subscribeSync(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

// Cambios que el servidor rechazó cuando la persona ya había seguido con otra cosa.
export function subscribeLateErrors(fn) {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

// --- Conexión -----------------------------------------------------------------

let networkEnabled = true; // Firestore arranca con la red activada
let networkQueue = Promise.resolve();

// Solo cuando cambia: pedirlo de más interrumpe las escrituras en curso.
function setNetwork(enabled) {
  if (enabled === networkEnabled) return;
  networkEnabled = enabled;
  networkQueue = networkQueue.then(() => (enabled ? sdk.enableNetwork(db) : sdk.disableNetwork(db))).catch(() => {});
}

export function startConnection() {
  return NetInfo.addEventListener((info) => {
    update({ online: info.isConnected !== false && info.isInternetReachable !== false });
    // Avisarle a Firestore que no hay red lo hace responder enseguida desde la copia local.
    // Solo si el celular está desconectado: la otra señal a veces falla con internet andando.
    setNetwork(info.isConnected !== false);
  });
}

export function ensureOnline(action) {
  if (!state.online) throw new Error(`Necesitás conexión para ${action}.`);
}

// Cambios que quedaron en la cola de una vez anterior que se usó la app.
export async function checkOldPending() {
  const timer = setTimeout(() => update({ oldPending: true }), 2000);
  try {
    await sdk.waitForPendingWrites(db);
  } catch (e) {
    // cambió de usuario: no hay nada que esperar
  } finally {
    clearTimeout(timer);
    update({ oldPending: false });
  }
}

// --- Escrituras que funcionan sin conexión ------------------------------------
// Igual que las de Firestore, pero no dejan esperando si no hay señal.

export const track = (promise) => tracker.track(promise);

export const setDoc = (...args) => track(sdk.setDoc(...args));
export const updateDoc = (...args) => track(sdk.updateDoc(...args));
export const deleteDoc = (...args) => track(sdk.deleteDoc(...args));

// El id se genera en el celular, así que está disponible aunque no haya señal.
export async function addDoc(collectionRef, data) {
  const ref = sdk.doc(collectionRef);
  await setDoc(ref, data);
  return ref;
}

export function writeBatch(database) {
  const batch = sdk.writeBatch(database);
  return {
    set: (...args) => batch.set(...args),
    update: (...args) => batch.update(...args),
    delete: (...args) => batch.delete(...args),
    commit: () => track(batch.commit()),
    // Espera la confirmación del servidor (crear un viaje, unirse, perfil).
    commitNow: () => batch.commit(),
  };
}
