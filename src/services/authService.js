import NetInfo from '@react-native-community/netinfo';

import { GOOGLE_WEB_CLIENT_ID } from '../config/firebaseConfig';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from './sdk/auth';
import { doc, serverTimestamp, setDoc } from './sdk/firestore';

// Guarda/actualiza el perfil básico del usuario en Firestore.
export async function ensureUserDoc(user) {
  if (!user) return;
  // Es una copia de cortesía: sin señal se saltea, para no contarla como un cambio pendiente.
  const { isConnected } = await NetInfo.fetch();
  if (isConnected === false) return;
  await setDoc(
    doc(db, 'users', user.uid),
    {
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function registerWithEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  return auth.currentUser || cred.user; // el SDK nativo deja acá el nombre recién guardado
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function sendReset(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

// --- Google Sign-In ---------------------------------------------------------
// @react-native-google-signin es un módulo nativo: no existe en Expo Go, solo en un development build.
// Se carga recién al apretar el botón para que la app abra igual en Expo Go (con email y contraseña).
let GoogleSignin = null;

function loadGoogleSignin() {
  if (GoogleSignin) return GoogleSignin;
  try {
    // eslint-disable-next-line global-require
    const mod = require('@react-native-google-signin/google-signin');
    mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    GoogleSignin = mod.GoogleSignin;
    return GoogleSignin;
  } catch (e) {
    return null;
  }
}

// Devuelve el usuario de Firebase, o null si la persona canceló.
export async function loginWithGoogle() {
  const GS = loadGoogleSignin();
  if (!GS) {
    throw new Error(
      'Google Sign-In necesita un development build (no funciona en Expo Go). Mirá el README.'
    );
  }
  try {
    await GS.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch (e) {
    // En iOS no aplica; si falla en Android, signIn() devuelve el error real.
  }
  const response = await GS.signIn();
  if (!response || response.type !== 'success') return null;
  const idToken = response.data && response.data.idToken;
  if (!idToken) {
    throw new Error('Google no devolvió el idToken. Revisá el Web Client ID en firebaseConfig.js.');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function logout() {
  const GS = loadGoogleSignin();
  if (GS) {
    try {
      await GS.signOut();
    } catch (e) {
      // ignorar: puede no haber sesión de Google
    }
  }
  await signOut(auth);
}
