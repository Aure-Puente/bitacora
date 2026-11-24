import { baseName, storagePaths } from '../utils/files';
import { db } from './firebase';
import { prepareFile } from './imageService';
import { collection, doc, serverTimestamp } from './sdk/firestore';
import { removeObject, uploadLocalFile } from './sdk/storage';
import { deleteDoc, ensureOnline, setDoc, updateDoc } from './syncService';

const fileRef = (tripId, id) => doc(db, 'trips', tripId, 'files', id);

// Sube un archivo elegido y guarda sus datos. Devuelve el id.
// kind: 'documento' | 'ticket' | 'album' | visibility: 'group' | 'private'
export async function uploadFile(tripId, user, picked, { kind, visibility, name, bookingId }, onProgress) {
  ensureOnline('subir archivos');
  const prepared = await prepareFile(picked, kind);
  const target = doc(collection(db, 'trips', tripId, 'files'));
  const { path, thumbPath } = storagePaths({
    tripId,
    visibility,
    uid: user.uid,
    fileId: target.id,
    contentType: prepared.contentType,
    withThumb: !!prepared.thumbUri,
  });

  try {
    if (thumbPath) await uploadLocalFile(thumbPath, prepared.thumbUri, 'image/jpeg');
    await uploadLocalFile(path, prepared.uri, prepared.contentType, onProgress);
    await setDoc(target, {
      name: ((name || '').trim() || baseName(picked.name) || 'Archivo').slice(0, 120),
      contentType: prepared.contentType,
      size: prepared.size,
      width: prepared.width,
      height: prepared.height,
      path,
      thumbPath,
      kind,
      visibility,
      bookingId: bookingId || null,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Si algo falló a mitad de camino, no deja archivos sueltos en Storage.
    await Promise.all([removeObject(path), removeObject(thumbPath)]).catch(() => {});
    throw e;
  }
  return target.id;
}

// Lo único que se puede cambiar de un archivo ya subido.
export function updateFile(tripId, id, { name, bookingId }) {
  return updateDoc(fileRef(tripId, id), { name: name.trim(), bookingId: bookingId || null });
}

// Borra el archivo de Storage y sus datos (solo quien lo subió, lo controlan las reglas).
export async function deleteFile(tripId, file) {
  ensureOnline('borrar archivos');
  await removeObject(file.thumbPath);
  await removeObject(file.path);
  await deleteDoc(fileRef(tripId, file.id));
}

// Link al álbum de Drive o Google Photos.
export function setAlbumUrl(tripId, albumUrl) {
  return updateDoc(doc(db, 'trips', tripId), { albumUrl });
}
