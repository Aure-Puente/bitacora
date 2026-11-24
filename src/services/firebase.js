import { getAuth } from './sdk/auth';
import { getFirestore } from './sdk/firestore';

// La configuración sale de google-services.json (la lee la app nativa al compilar).
export const auth = getAuth();
export const db = getFirestore();
