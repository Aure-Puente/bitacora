// Única puerta de entrada a Firebase Storage (@react-native-firebase).
import { deleteObject, getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';

// Sube un archivo local (file://). onProgress recibe un número de 0 a 1.
export async function uploadLocalFile(path, uri, contentType, onProgress) {
  const task = putFile(ref(getStorage(), path), uri, { contentType });
  const stop = task.on(
    'state_changed',
    (snap) => {
      if (onProgress && snap.totalBytes) onProgress(snap.bytesTransferred / snap.totalBytes);
    },
    () => {} // el error llega por la promesa de abajo
  );
  try {
    await task;
  } finally {
    if (typeof stop === 'function') stop();
  }
}

// Link de descarga: las reglas deciden si corresponde.
export function downloadUrl(path) {
  return getDownloadURL(ref(getStorage(), path));
}

// Borrar algo que ya no está no es un error.
export async function removeObject(path) {
  if (!path) return;
  try {
    await deleteObject(ref(getStorage(), path));
  } catch (e) {
    if (e.code !== 'storage/object-not-found') throw e;
  }
}
