import { useMemo } from 'react';

import useTripCollection from './useTripCollection';

// Contactos útiles del viaje, por nombre.
export default function useContacts(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'contacts');
  const contacts = useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    [items]
  );
  return { contacts, loading, error };
}
