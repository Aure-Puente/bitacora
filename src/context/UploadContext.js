import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { uploadFile } from '../services/fileService';
import { friendlyError } from '../utils/firebaseErrors';

const UploadContext = createContext(null);
const IDLE = { tripId: null, total: 0, done: 0, failed: 0, progress: 0, lastError: '' };

// Cola de fotos del álbum: sigue subiendo aunque cambies de pantalla (con la app abierta).
export function UploadProvider({ children }) {
  const [state, setState] = useState(IDLE);
  const queue = useRef([]);
  const working = useRef(false);

  const work = useCallback(async () => {
    if (working.current) return;
    working.current = true;
    while (queue.current.length) {
      const { tripId, user, picked, options } = queue.current.shift();
      try {
        // De a una: no satura la memoria ni la conexión.
        // eslint-disable-next-line no-await-in-loop
        await uploadFile(tripId, user, picked, options, (progress) => setState((s) => ({ ...s, progress })));
      } catch (e) {
        console.warn('No se pudo subir una foto:', e);
        setState((s) => ({ ...s, failed: s.failed + 1, lastError: friendlyError(e) }));
      }
      setState((s) => ({ ...s, done: s.done + 1, progress: 0 }));
    }
    working.current = false;
  }, []);

  const enqueue = useCallback(
    (tripId, user, pickedList, options) => {
      pickedList.forEach((picked) => queue.current.push({ tripId, user, picked, options }));
      setState((s) =>
        s.done < s.total
          ? { ...s, total: s.total + pickedList.length }
          : { ...IDLE, tripId, total: pickedList.length }
      );
      work();
    },
    [work]
  );

  const dismiss = useCallback(() => setState((s) => (s.done < s.total ? s : IDLE)), []);

  const value = useMemo(
    () => ({ ...state, active: state.done < state.total, enqueue, dismiss }),
    [state, enqueue, dismiss]
  );
  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads debe usarse dentro de UploadProvider');
  return ctx;
}
