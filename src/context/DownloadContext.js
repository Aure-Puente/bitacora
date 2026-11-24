import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import useFiles from '../hooks/useFiles';
import { isSaved, saveLocal, unsaveLocal } from '../services/fileCache';
import {
  addToIndex,
  indexSummary,
  isDownloaded as isDownloadedIn,
  pathsOf,
  planDownloads,
  removeFromIndex,
} from '../utils/downloads';
import { useAuth } from './AuthContext';
import { useConnection } from './ConnectionContext';
import { useTrip } from './TripContext';

const DownloadContext = createContext(null);
const indexKey = (uid) => `@bitacora/downloads/${uid}`;
const AUTO_KEY = '@bitacora/autoDownload';

// Archivos guardados en el celular para verlos sin internet.
export function DownloadProvider({ children }) {
  const { user } = useAuth();
  const { currentTripId } = useTrip();
  const { online } = useConnection();
  const uid = user ? user.uid : null;
  const { files, synced } = useFiles(currentTripId, uid);

  const [index, setIndex] = useState({});
  const [loadedFor, setLoadedFor] = useState(null);
  const [auto, setAutoState] = useState(true);
  const [progress, setProgress] = useState(null); // { done, total }

  // El índice vigente, también para lo que sigue corriendo entre un render y otro.
  const indexRef = useRef({});
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const commit = useCallback((next) => {
    indexRef.current = next;
    setIndex(next);
    if (uidRef.current) AsyncStorage.setItem(indexKey(uidRef.current), JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    indexRef.current = {};
    setIndex({});
    setLoadedFor(null);
    if (!uid) return undefined;
    let cancelled = false;
    Promise.all([AsyncStorage.getItem(indexKey(uid)), AsyncStorage.getItem(AUTO_KEY)])
      .then(([raw, autoValue]) => {
        if (cancelled) return;
        const stored = raw ? JSON.parse(raw) : {};
        // Descarta lo que ya no está en el celular.
        const missing = Object.keys(stored).filter((p) => !isSaved(p));
        indexRef.current = removeFromIndex(stored, missing);
        setIndex(indexRef.current);
        setAutoState(autoValue !== 'no');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadedFor(uid);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Guarda de a uno. Devuelve cuántos no se pudieron bajar.
  const queue = useRef(Promise.resolve());
  const saveMany = useCallback(
    (list, tripId) => {
      const owner = uidRef.current;
      const run = queue.current.then(async () => {
        const todo = list.filter((f) => !isDownloadedIn(indexRef.current, f));
        let failed = 0;
        for (let i = 0; i < todo.length; i += 1) {
          if (uidRef.current !== owner) break; // se cerró la sesión
          setProgress({ done: i, total: todo.length });
          try {
            // eslint-disable-next-line no-await-in-loop
            await Promise.all(pathsOf(todo[i]).map(saveLocal));
            if (uidRef.current === owner) commit(addToIndex(indexRef.current, todo[i], tripId));
          } catch (e) {
            console.warn('No se pudo guardar', todo[i].name, e);
            failed += 1;
          }
        }
        setProgress(null);
        return failed;
      });
      queue.current = run.catch(() => setProgress(null));
      return run;
    },
    [commit]
  );

  const removePaths = useCallback(
    (paths) => {
      paths.forEach(unsaveLocal);
      commit(removeFromIndex(indexRef.current, paths));
    },
    [commit]
  );

  // Descarga automática de documentos y limpieza de lo que se borró.
  useEffect(() => {
    if (!uid || loadedFor !== uid || !currentTripId) return;
    const plan = planDownloads({ files, index: indexRef.current, tripId: currentTripId, auto, synced });
    if (plan.remove.length) removePaths(plan.remove);
    if (online && plan.download.length) saveMany(plan.download, currentTripId).catch(() => {});
  }, [uid, loadedFor, currentTripId, files, auto, synced, online, saveMany, removePaths]);

  const setAuto = useCallback((value) => {
    setAutoState(value);
    AsyncStorage.setItem(AUTO_KEY, value ? 'si' : 'no').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      auto,
      setAuto,
      progress,
      summary: indexSummary(index),
      isDownloaded: (file) => isDownloadedIn(index, file),
      save: (list) => saveMany(list, currentTripId),
      remove: (file) => removePaths(pathsOf(file)),
      clear: () => removePaths(Object.keys(indexRef.current)),
    }),
    [auto, setAuto, progress, index, saveMany, removePaths, currentTripId]
  );
  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error('useDownloads debe usarse dentro de DownloadProvider');
  return ctx;
}
