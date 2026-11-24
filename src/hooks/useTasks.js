import { useMemo } from 'react';

import { sortTasks } from '../utils/tasks';
import useTripCollection, { createdMs } from './useTripCollection';

// Tareas previas: pendientes primero.
export default function useTasks(tripId) {
  const { items, loading, error } = useTripCollection(tripId, 'tasks');
  const tasks = useMemo(() => sortTasks(items, createdMs), [items]);
  return { tasks, loading, error };
}
