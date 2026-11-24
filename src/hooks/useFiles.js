import { useEffect, useMemo, useState } from 'react';

import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from '../services/sdk/firestore';
import { mergeFiles } from '../utils/files';
import { createdMs } from './useTripCollection';

const EMPTY = { scope: null, group: null, mine: null, groupSynced: false, mineSynced: false, error: null };

// Archivos que puedo ver: los del grupo y los míos (más nuevos primero).
// Son dos consultas porque las reglas no dejan pedir los privados de los demás.
export default function useFiles(tripId, uid) {
  const scope = `${tripId}/${uid}`;
  const [stored, setState] = useState(EMPTY);
  // Al cambiar de viaje, lo guardado es del anterior hasta que llega lo nuevo: no hay que usarlo.
  const state = stored.scope === scope ? stored : EMPTY;

  useEffect(() => {
    setState({ ...EMPTY, scope });
    if (!tripId || !uid) return undefined;
    const base = collection(db, 'trips', tripId, 'files');
    const listen = (key, condition) =>
      onSnapshot(
        query(base, condition),
        { includeMetadataChanges: true },
        (snap) =>
          setState((s) => ({
            ...s,
            [key]: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
            [`${key}Synced`]: !snap.metadata.fromCache,
          })),
        (error) => {
          console.warn('Error leyendo archivos:', error);
          setState((s) => ({ ...s, error }));
        }
      );
    const unsubGroup = listen('group', where('visibility', '==', 'group'));
    const unsubMine = listen('mine', where('ownerId', '==', uid));
    return () => {
      unsubGroup();
      unsubMine();
    };
  }, [tripId, uid, scope]);

  const files = useMemo(
    () =>
      mergeFiles(state.group || [], state.mine || []).sort(
        (a, b) => createdMs(b) - createdMs(a) || a.id.localeCompare(b.id)
      ),
    [state.group, state.mine]
  );

  return {
    files,
    loading: !state.error && (!state.group || !state.mine),
    error: state.error,
    synced: state.groupSynced && state.mineSynced, // la lista vino del servidor, no de la copia local
  };
}
