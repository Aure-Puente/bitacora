import { useEffect, useState } from 'react';

import { db } from '../services/firebase';
import { collection, onSnapshot } from '../services/sdk/firestore';
import { toDate } from '../utils/dates';

// Planes de cuotas del viaje (más nuevos primero).
export default function usePlans(tripId) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPlans([]);
    setLoading(true);
    if (!tripId) return undefined;
    return onSnapshot(
      collection(db, 'trips', tripId, 'plans'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) => (toDate(b.createdAt)?.getTime() || Date.now()) - (toDate(a.createdAt)?.getTime() || Date.now())
        );
        setPlans(list);
        setLoading(false);
      },
      (error) => {
        console.warn('Error leyendo cuotas:', error);
        setLoading(false);
      }
    );
  }, [tripId]);

  return { plans, loading };
}
