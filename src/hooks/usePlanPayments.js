import { useEffect, useState } from 'react';

import { db } from '../services/firebase';
import { collection, onSnapshot } from '../services/sdk/firestore';
import { toDate } from '../utils/dates';

// Pagos (cuotas) de un plan: { id, debtorId, status: 'pending' | 'confirmed' }.
export default function usePlanPayments(tripId, planId) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments([]);
    if (!tripId || !planId) return undefined;
    return onSnapshot(
      collection(db, 'trips', tripId, 'plans', planId, 'payments'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) => (toDate(a.createdAt)?.getTime() || Date.now()) - (toDate(b.createdAt)?.getTime() || Date.now())
        );
        setPayments(list);
      },
      (error) => console.warn('Error leyendo pagos de cuotas:', error)
    );
  }, [tripId, planId]);

  return payments;
}
