// Pegá acá los datos de la app web de Firebase:
// Consola de Firebase → Configuración del proyecto → Tus apps → App web → SDK (Config).
export const firebaseConfig = {
  apiKey: 'AIzaSyAF1V1aG1CzQZ3MS7e4Tx68QptZMjTWQZc',
  authDomain: 'bitacora-edbca.firebaseapp.com',
  projectId: 'bitacora-edbca',
  storageBucket: 'bitacora-edbca.firebasestorage.app',
  messagingSenderId: '686485695483',
  appId: '1:686485695483:web:3f5fecc822f4b216a7795e',
};

// ID de cliente OAuth de tipo "Web" (Firebase → Authentication → Google → Configuración del SDK web).
// Es el que usa Google Sign-In para devolver el idToken que Firebase necesita.
export const GOOGLE_WEB_CLIENT_ID = '686485695483-cb5rhrgaig3b11u42iq76ikfo7aa2t2v.apps.googleusercontent.com';

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'TU_API_KEY';