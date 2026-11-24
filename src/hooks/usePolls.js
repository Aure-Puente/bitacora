import { useMemo } from 'react';

import useTripCollection, { createdMs } from './useTripCollection';

const closedRank = (poll) => Number(poll.status === 'closed');

// Votaciones: primero las abiertas; dentro de cada grupo, las más nuevas.
export default function usePolls(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'polls');
  const polls = useMemo(
    () => items.slice().sort((a, b) => closedRank(a) - closedRank(b) || createdMs(b) - createdMs(a)),
    [items]
  );
  return { polls, loading, error };
}
