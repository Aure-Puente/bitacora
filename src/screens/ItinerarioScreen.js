import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { FAB, Text, useTheme } from 'react-native-paper';

import ActivityCard from '../components/ActivityCard';
import CollectionState from '../components/CollectionState';
import DraggableList from '../components/DraggableList';
import EmptyState from '../components/EmptyState';
import OptionsDialog from '../components/OptionsDialog';
import SelectorChips from '../components/SelectorChips';
import { ACTIVITY_STATUS } from '../constants/activityStatus';
import { useTrip } from '../context/TripContext';
import useActivities from '../hooks/useActivities';
import { saveActivityOrder, setActivityDay, setActivityStatus } from '../services/activityService';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';
import {
  dayKey,
  formatDayLong,
  formatDayShort,
  groupActivities,
  insertOrder,
  orderUpdates,
  tripDays,
} from '../utils/itinerary';

const IDEAS = 'ideas';
const OUTSIDE = 'fuera';

const showError = (e) => Alert.alert('Ups', friendlyError(e));

export default function ItinerarioScreen({ navigation }) {
  const theme = useTheme();
  const { currentTrip } = useTrip();
  const tripId = currentTrip.id;
  const { activities, loading, error } = useActivities(tripId);

  const days = useMemo(
    () => tripDays(currentTrip.departureAt, currentTrip.returnAt),
    [currentTrip.departureAt, currentTrip.returnAt]
  );
  const { ideas, byDay, outOfRange } = useMemo(() => groupActivities(activities, days), [activities, days]);

  // Arranca en el día de hoy si ya estamos de viaje; si no, en el primero.
  const [selected, setSelected] = useState(() => {
    const today = dayKey(new Date());
    return days.includes(today) ? today : days[0] || IDEAS;
  });
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState(null); // { type: 'status' | 'day', activity }

  // Si cambian las fechas del viaje, el día elegido puede dejar de existir.
  const view =
    selected === IDEAS || byDay[selected] || (selected === OUTSIDE && outOfRange.length)
      ? selected
      : days[0] || IDEAS;

  const selectorItems = [
    { value: IDEAS, label: ideas.length ? `Ideas (${ideas.length})` : 'Ideas', icon: 'lightbulb-outline' },
    ...days.map((d) => ({ value: d, label: formatDayShort(d) })),
    ...(outOfRange.length
      ? [{ value: OUTSIDE, label: `Fuera de las fechas (${outOfRange.length})`, icon: 'calendar-alert' }]
      : []),
  ];

  const isDay = view !== IDEAS && view !== OUTSIDE;
  const list = view === IDEAS ? ideas : view === OUTSIDE ? outOfRange : byDay[view];

  const onAdd = () => navigation.navigate('AgregarActividad', { day: isDay ? view : null });

  const onReorder = useCallback(
    (next) => {
      const updates = orderUpdates(next);
      if (updates.length) saveActivityOrder(tripId, updates).catch(showError);
    },
    [tripId]
  );

  const onSelectOption = (value) => {
    const { type, activity } = dialog;
    setDialog(null);
    if (type === 'status') {
      setActivityStatus(tripId, activity.id, value).catch(showError);
    } else {
      setActivityDay(tripId, activity.id, value, insertOrder(byDay[value] || [], activity.time)).catch(showError);
    }
  };

  const renderCard = (activity, handle) => (
    <ActivityCard
      activity={activity}
      destination={currentTrip.destination}
      handle={handle}
      showDay={view === OUTSIDE}
      onPress={() => navigation.navigate('AgregarActividad', { activityId: activity.id })}
      onStatus={() => setDialog({ type: 'status', activity })}
      onAssign={isDay ? undefined : () => setDialog({ type: 'day', activity })}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <SelectorChips items={selectorItems} value={view} onChange={setSelected} />
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!dragging}>
        <Text variant="titleMedium" style={styles.title}>
          {view === IDEAS ? 'Lista de deseos' : view === OUTSIDE ? 'Fuera de las fechas del viaje' : formatDayLong(view)}
        </Text>
        <CollectionState loading={loading} error={error}>
          {list.length === 0 ? (
            <EmptyState
              icon={isDay ? 'map-marker-plus-outline' : 'lightbulb-outline'}
              title={isDay ? 'Nada planeado para este día' : 'Todavía no hay ideas'}
              subtitle={
                isDay
                  ? 'Agregá una actividad o asignale este día a una idea.'
                  : 'Anotá lugares y bodegas que quieran conocer. Después les asignan un día.'
              }
              actionLabel={isDay ? 'Agregar actividad' : 'Agregar idea'}
              onAction={onAdd}
            />
          ) : view === OUTSIDE ? (
            <View style={{ gap: 10 }}>
              {list.map((a) => (
                <View key={a.id}>{renderCard(a)}</View>
              ))}
            </View>
          ) : (
            <DraggableList
              key={view}
              items={list}
              renderItem={renderCard}
              onReorder={onReorder}
              onDragChange={setDragging}
            />
          )}
        </CollectionState>
      </ScrollView>

      {list.length > 0 && view !== OUTSIDE ? (
        <FAB
          icon="plus"
          label={isDay ? 'Actividad' : 'Idea'}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={onAdd}
        />
      ) : null}

      <OptionsDialog
        visible={!!dialog}
        title={dialog && dialog.type === 'day' ? '¿Para qué día?' : 'Estado'}
        options={
          dialog && dialog.type === 'day'
            ? days.map((d) => ({ value: d, label: formatDayLong(d) }))
            : ACTIVITY_STATUS.map((s) => ({ value: s.id, label: s.label, icon: s.icon }))
        }
        selected={dialog && dialog.type === 'status' ? dialog.activity.status : undefined}
        onSelect={onSelectOption}
        onDismiss={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  title: { marginTop: 4, marginBottom: 10, fontFamily: serif, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
