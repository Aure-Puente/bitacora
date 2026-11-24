import { useMemo } from 'react';

import { compareActivities } from '../utils/itinerary';
import useTripCollection from './useTripCollection';

// Actividades del itinerario e ideas (day = null), en el orden manual.
export default function useActivities(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'activities');
  const activities = useMemo(() => items.slice().sort(compareActivities), [items]);
  return { activities, loading, error };
}
