import { useMemo } from 'react';

import { compareBookings } from '../utils/bookings';
import useTripCollection from './useTripCollection';

// Reservas del viaje en orden cronológico.
export default function useBookings(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'bookings');
  const bookings = useMemo(() => items.slice().sort(compareBookings), [items]);
  return { bookings, loading, error };
}
