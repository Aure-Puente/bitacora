import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper';

import { statusById } from '../constants/activityStatus';
import { formatDayLong, mapsLink } from '../utils/itinerary';

// Una actividad o idea. `handle` es la manija para arrastrarla (opcional).
export default function ActivityCard({ activity, destination, handle, showDay, onPress, onStatus, onAssign }) {
  const theme = useTheme();
  const status = statusById(activity.status);
  const done = activity.status === 'hecho';
  const maps = mapsLink(activity, destination);
  const when = [
    showDay && activity.day ? formatDayLong(activity.day) : '',
    activity.time ? `${activity.time} hs` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  // Abre la app de Maps o, si no está instalada, el navegador.
  const openMaps = () => {
    Linking.openURL(maps).catch(() => Alert.alert('Ups', 'No pudimos abrir Maps.'));
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.body}>
          {when ? (
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
              {when}
            </Text>
          ) : null}
          <Text
            variant="titleMedium"
            style={done ? { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' } : null}
          >
            {activity.title}
          </Text>
          {activity.place ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {activity.place}
            </Text>
          ) : null}
          {activity.notes ? (
            <Text
              variant="bodySmall"
              numberOfLines={3}
              style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}
            >
              {activity.notes}
            </Text>
          ) : null}
          <View style={styles.actions}>
            {onStatus ? (
              <Chip compact icon={status.icon} onPress={onStatus} accessibilityLabel={`Estado: ${status.label}`}>
                {status.label}
              </Chip>
            ) : null}
            {onAssign ? (
              <Button compact mode="contained-tonal" icon="calendar-plus" onPress={onAssign}>
                Asignar día
              </Button>
            ) : null}
            {maps ? (
              <Button compact mode="text" icon="map-marker-outline" onPress={openMaps}>
                Abrir en Maps
              </Button>
            ) : null}
          </View>
        </View>
        {handle}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  body: { flex: 1, paddingLeft: 16, paddingVertical: 12, paddingRight: 8 },
  notes: { marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
});
