// Única puerta de entrada a Firestore (@react-native-firebase).
// En el celular guarda una copia local de lo leído y una cola con lo escrito sin conexión.
export {
  arrayUnion,
  collection,
  deleteDoc,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
