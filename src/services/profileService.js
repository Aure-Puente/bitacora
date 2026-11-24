import { auth, db } from './firebase';
import { prepareAvatar } from './imageService';
import { updateProfile } from './sdk/auth';
import { collection, doc, getDocs, query, serverTimestamp, where } from './sdk/firestore';
import { downloadUrl, removeObject, uploadLocalFile } from './sdk/storage';
import { ensureOnline, writeBatch } from './syncService';

// Copia nombre y foto a users/{uid} y a mi ficha de integrante en cada viaje.
async function syncProfile() {
  const user = auth.currentUser; // updateProfile deja acá los datos nuevos
  const trips = await getDocs(
    query(collection(db, 'trips'), where('memberIds', 'array-contains', user.uid))
  );
  const data = { displayName: user.displayName || null, photoURL: user.photoURL || null };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  trips.forEach((t) => {
    const member = data.displayName ? data : { photoURL: data.photoURL };
    batch.set(doc(db, 'trips', t.id, 'members', user.uid), { uid: user.uid, ...member }, { merge: true });
  });
  await batch.commitNow();
}

// Borra la foto anterior, si era una subida desde la app (no la de Google).
async function removeOldAvatar(user, oldUrl) {
  const prefix = `avatars/${user.uid}/`;
  const path = decodeURIComponent(((oldUrl || '').match(/\/o\/([^?]+)/) || [])[1] || '');
  if (path.startsWith(prefix)) await removeObject(path).catch(() => {});
}

export async function saveName(user, name) {
  ensureOnline('cambiar tu nombre');
  await updateProfile(user, { displayName: name.trim() });
  await syncProfile();
}

// Sube una foto de perfil nueva (uri local) o la quita (uri = null).
export async function saveAvatar(user, uri) {
  ensureOnline('cambiar tu foto');
  const oldUrl = user.photoURL;
  let photoURL = null;
  if (uri) {
    const path = `avatars/${user.uid}/${Date.now()}.jpg`;
    await uploadLocalFile(path, await prepareAvatar(uri), 'image/jpeg');
    photoURL = await downloadUrl(path);
  }
  await updateProfile(user, { photoURL });
  await syncProfile();
  await removeOldAvatar(user, oldUrl);
}
