import { useMemo } from 'react';

import useTripCollection, { createdMs } from './useTripCollection';

// Equipaje de todo el viaje (compartido y personal de cada integrante), por orden de carga.
export default function useChecklist(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'checklistItems');
  const sorted = useMemo(
    () =>
      items.slice().sort((a, b) => createdMs(a) - createdMs(b) || (a.position || 0) - (b.position || 0)),
    [items]
  );
  return { items: sorted, loading, error };
}
