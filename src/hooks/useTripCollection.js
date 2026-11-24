import { useEffect, useState } from 'react';

import { db } from '../services/firebase';
import { collection, onSnapshot } from '../services/sdk/firestore';
import { toDate } from '../utils/dates';

// Milisegundos de creación. Si todavía no llegó del servidor, cuenta como recién creado.
export const createdMs = (item) => toDate(item.createdAt)?.getTime() || Number.MAX_SAFE_INTEGER;

// Escucha en tiempo real una subcolección de trips/{tripId}.
// Si varias pantallas escuchan la misma, Firestore comparte la conexión.
export default function useTripCollection(tripId, name) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    setState({ items: [], loading: true, error: null });
    if (!tripId) return undefined;
    return onSnapshot(
      collection(db, 'trips', tripId, name),
      (snap) =>
        setState({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: null }),
      (error) => {
        console.warn(`Error leyendo ${name}:`, error);
        setState((s) => ({ ...s, loading: false, error }));
      }
    );
  }, [tripId, name]);

  return state;
}
