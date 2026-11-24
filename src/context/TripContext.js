import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from '../services/sdk/firestore';
import {
  createTrip as createTripService,
  joinTripByCode,
  updateTrip as updateTripService,
} from '../services/tripService';
import { toDate } from '../utils/dates';
import { computeBalances, simplifyDebts, totalSpentCents } from '../utils/settle';
import { useAuth } from './AuthContext';

const TripContext = createContext(null);
const lastTripKey = (uid) => `@bitacora/lastTripId/${uid}`;

const byDateDesc = (a, b) =>
  (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0);

export function TripProvider({ children }) {
  const { user } = useAuth();
  const uid = user ? user.uid : null;

  const [trips, setTrips] = useState([]);
  const [tripsLoadedFor, setTripsLoadedFor] = useState(null);
  // El servidor confirmó la lista (sin señal, Firestore entrega una lista vacía desde la caché).
  const [tripsConfirmedFor, setTripsConfirmedFor] = useState(null);
  const [restoredFor, setRestoredFor] = useState(null);
  const [currentTripId, setCurrentTripId] = useState(null);
  // Viaje recién creado o al que me acabo de unir: puede tardar un instante en llegar a la lista.
  const pendingTripRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // 1) Último viaje abierto (por usuario)
  useEffect(() => {
    if (!uid) {
      setCurrentTripId(null);
      setRestoredFor(null);
      return undefined;
    }
    let cancelled = false;
    AsyncStorage.getItem(lastTripKey(uid))
      .then((saved) => {
        if (!cancelled && saved) setCurrentTripId(saved);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoredFor(uid);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // 2) Viajes de los que soy integrante
  useEffect(() => {
    if (!uid) {
      setTrips([]);
      setTripsLoadedFor(null);
      setTripsConfirmedFor(null);
      return undefined;
    }
    const q = query(collection(db, 'trips'), where('memberIds', 'array-contains', uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) =>
            (toDate(a.departureAt)?.getTime() || 0) - (toDate(b.departureAt)?.getTime() || 0)
        );
        setTrips(list);
        setTripsLoadedFor(uid);
        if (!snap.metadata.fromCache) setTripsConfirmedFor(uid);
      },
      (error) => {
        console.warn('No se pudieron leer los viajes:', error);
        setTrips([]);
        setTripsLoadedFor(uid);
      }
    );
    return unsubscribe;
  }, [uid]);

  // Si el viaje guardado ya no existe (o ya no soy parte), lo descarto. Solo si lo dice el servidor.
  useEffect(() => {
    if (!uid || tripsConfirmedFor !== uid || !currentTripId) return;
    if (trips.some((t) => t.id === currentTripId)) {
      if (pendingTripRef.current === currentTripId) pendingTripRef.current = null;
      return;
    }
    if (pendingTripRef.current === currentTripId) return; // todavía no llegó: esperamos
    setCurrentTripId(null);
    AsyncStorage.removeItem(lastTripKey(uid)).catch(() => {});
  }, [uid, tripsConfirmedFor, trips, currentTripId]);

  // 3) Datos del viaje activo
  useEffect(() => {
    setMembers([]);
    setExpenses([]);
    setSettlements([]);
    if (!uid || !currentTripId) return undefined;

    const base = ['trips', currentTripId];
    const warn = (name) => (error) => console.warn(`Error leyendo ${name}:`, error);

    const unsubMembers = onSnapshot(
      collection(db, ...base, 'members'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        setMembers(list);
      },
      warn('integrantes')
    );
    const unsubExpenses = onSnapshot(
      collection(db, ...base, 'expenses'),
      { includeMetadataChanges: true }, // para saber cuándo un gasto quedó sincronizado
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          pending: d.metadata.hasPendingWrites,
        }));
        list.sort(byDateDesc);
        setExpenses(list);
      },
      warn('gastos')
    );
    const unsubSettlements = onSnapshot(
      collection(db, ...base, 'settlements'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(byDateDesc);
        setSettlements(list);
      },
      warn('pagos')
    );

    return () => {
      unsubMembers();
      unsubExpenses();
      unsubSettlements();
    };
  }, [uid, currentTripId]);

  const selectTrip = useCallback(
    (tripId) => {
      setCurrentTripId(tripId);
      if (uid) AsyncStorage.setItem(lastTripKey(uid), tripId).catch(() => {});
    },
    [uid]
  );

  const clearTrip = useCallback(() => {
    setCurrentTripId(null);
    if (uid) AsyncStorage.removeItem(lastTripKey(uid)).catch(() => {});
  }, [uid]);

  const createTrip = useCallback(
    async (data) => {
      const id = await createTripService(user, data);
      pendingTripRef.current = id;
      selectTrip(id);
      return id;
    },
    [user, selectTrip]
  );

  const joinTrip = useCallback(
    async (code) => {
      const myIds = trips.map((t) => t.id);
      const id = await joinTripByCode(user, code, myIds);
      if (!myIds.includes(id)) pendingTripRef.current = id;
      selectTrip(id);
      return id;
    },
    [user, trips, selectTrip]
  );

  const currentTrip = useMemo(
    () => trips.find((t) => t.id === currentTripId) || null,
    [trips, currentTripId]
  );

  const membersById = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      map[m.uid || m.id] = m;
    });
    return map;
  }, [members]);

  const balances = useMemo(
    () => computeBalances(members.map((m) => m.uid || m.id), expenses, settlements),
    [members, expenses, settlements]
  );
  const transfers = useMemo(() => simplifyDebts(balances), [balances]);
  const totalCents = useMemo(() => totalSpentCents(expenses), [expenses]);

  const loading = !!uid && (tripsLoadedFor !== uid || restoredFor !== uid);

  const value = useMemo(
    () => ({
      loading,
      trips,
      currentTripId,
      currentTrip,
      currency: (currentTrip && currentTrip.currency) || 'ARS',
      members,
      membersById,
      expenses,
      settlements,
      balances,
      transfers,
      totalCents,
      selectTrip,
      clearTrip,
      createTrip,
      joinTrip,
      updateTrip: updateTripService,
    }),
    [
      loading,
      trips,
      currentTripId,
      currentTrip,
      members,
      membersById,
      expenses,
      settlements,
      balances,
      transfers,
      totalCents,
      selectTrip,
      clearTrip,
      createTrip,
      joinTrip,
    ]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip debe usarse dentro de TripProvider');
  return ctx;
}
