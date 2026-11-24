import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { subscribeBackups } from '../services/expenseBackupService';
import { recoverExpenses } from '../services/expenseService';
import {
  checkOldPending,
  getSyncState,
  startConnection,
  subscribeLateErrors,
  subscribeSync,
} from '../services/syncService';
import { friendlyError } from '../utils/firebaseErrors';
import { useAuth } from './AuthContext';

const ConnectionContext = createContext(null);

// Conexión, cambios pendientes de sincronizar y gastos sin confirmar.
export function ConnectionProvider({ children }) {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [sync, setSync] = useState(getSyncState());
  const [backups, setBackups] = useState([]);

  useEffect(() => {
    const stopState = subscribeSync(setSync);
    const stopErrors = subscribeLateErrors((e) =>
      Alert.alert('Un cambio no se pudo guardar', friendlyError(e))
    );
    const stopConnection = startConnection();
    return () => {
      stopState();
      stopErrors();
      stopConnection();
    };
  }, []);

  useEffect(() => {
    setBackups([]);
    if (!uid) return undefined;
    checkOldPending();
    return subscribeBackups(uid, setBackups);
  }, [uid]);

  // Al abrir la app con señal o al recuperarla, revisa los gastos que quedaron sin confirmar.
  useEffect(() => {
    if (!uid || !sync.online) return;
    recoverExpenses(uid).catch((e) => console.warn('Recuperando gastos:', e));
  }, [uid, sync.online]);

  const value = useMemo(
    () => ({
      online: sync.online,
      pending: sync.oldPending ? null : sync.pending, // null: hay de antes y no se sabe cuántos
      hasPending: sync.pending > 0 || sync.oldPending,
      backups,
    }),
    [sync, backups]
  );
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection debe usarse dentro de ConnectionProvider');
  return ctx;
}
