import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text, useTheme } from 'react-native-paper';

import { bookingTypeById } from '../constants/bookingTypes';
import { bookingMapsLink, flightSummary } from '../utils/bookings';

// Una reserva: tocarla la edita; el código se copia y la dirección se abre en Maps.
// isDeparture: es el vuelo de la cuenta regresiva | attachments: cantidad de adjuntos
export default function BookingCard({ booking, isDeparture, attachments = 0, onPress, onCopy }) {
  const theme = useTheme();
  const type = bookingTypeById(booking.type);
  const maps = bookingMapsLink(booking);
  const flight = flightSummary(booking.flight);
  const muted = { color: theme.colors.onSurfaceVariant };

  const openMaps = () => {
    Linking.openURL(maps).catch(() => Alert.alert('Ups', 'No pudimos abrir Maps.'));
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source={type.icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.body}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {type.label}
            {booking.time ? ` · ${booking.time} hs` : ''}
          </Text>
          <Text variant="titleMedium">{booking.title}</Text>
          {flight ? (
            <Text variant="bodyMedium" style={muted}>
              {flight}
            </Text>
          ) : null}
          {isDeparture ? (
            <View style={styles.tag}>
              <Icon source="timer-sand" size={16} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Vuelo de salida
              </Text>
            </View>
          ) : null}
          {booking.address ? (
            <Text variant="bodyMedium" style={muted}>
              {booking.address}
            </Text>
          ) : null}
          {booking.notes ? (
            <Text variant="bodySmall" numberOfLines={3} style={[styles.notes, muted]}>
              {booking.notes}
            </Text>
          ) : null}
          {attachments ? (
            <View style={styles.tag}>
              <Icon source="paperclip" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelMedium" style={muted}>
                {attachments === 1 ? '1 adjunto' : `${attachments} adjuntos`}
              </Text>
            </View>
          ) : null}
          {booking.code || maps ? (
            <View style={styles.actions}>
              {booking.code ? (
                <Button
                  compact
                  mode="contained-tonal"
                  icon="content-copy"
                  onPress={() => onCopy(booking.code)}
                  accessibilityLabel={`Copiar código ${booking.code}`}
                >
                  {booking.code}
                </Button>
              ) : null}
              {maps ? (
                <Button compact mode="text" icon="map-marker-outline" onPress={openMaps}>
                  Abrir en Maps
                </Button>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, padding: 14 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  notes: { marginTop: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
});
