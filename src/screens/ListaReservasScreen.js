import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FAB, Snackbar, Text, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import BookingCard from '../components/BookingCard';
import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useBookings from '../hooks/useBookings';
import useFiles from '../hooks/useFiles';
import { serif } from '../theme/fonts';
import { splitBookings } from '../utils/bookings';
import { filesOfBooking } from '../utils/files';
import { dayKey, formatDayRelative } from '../utils/itinerary';

export default function ListaReservasScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();
  const { files } = useFiles(currentTrip.id, user.uid);
  const { bookings, loading, error } = useBookings(currentTrip.id);
  const [snack, setSnack] = useState('');

  const now = new Date();
  const today = dayKey(now);
  const { upcoming, past } = useMemo(() => splitBookings(bookings, today), [bookings, today]);

  const onCopy = async (code) => {
    await Clipboard.setStringAsync(code);
    setSnack('Código copiado');
  };

  const renderGroup = (group) => (
    <View key={group.day} style={styles.group}>
      <Text variant="titleMedium" style={styles.title}>
        {formatDayRelative(group.day, now)}
      </Text>
      {group.items.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          isDeparture={currentTrip.departureBookingId === b.id}
          attachments={filesOfBooking(files, b.id).length}
          onCopy={onCopy}
          onPress={() => navigation.navigate('AgregarReserva', { bookingId: b.id })}
        />
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollectionState loading={loading} error={error}>
          {bookings.length === 0 ? (
            <EmptyState
              icon="ticket-confirmation-outline"
              title="Todavía no hay reservas"
              subtitle="Cargá los vuelos, el alojamiento y las excursiones para tener los códigos a mano."
              actionLabel="Agregar reserva"
              onAction={() => navigation.navigate('AgregarReserva')}
            />
          ) : (
            <>
              {upcoming.map(renderGroup)}
              {past.length ? (
                <>
                  <Text variant="labelLarge" style={[styles.past, { color: theme.colors.onSurfaceVariant }]}>
                    Ya pasaron
                  </Text>
                  {past.map(renderGroup)}
                </>
              ) : null}
            </>
          )}
        </CollectionState>
      </ScrollView>
      {bookings.length > 0 ? (
        <FAB
          icon="plus"
          label="Reserva"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('AgregarReserva')}
        />
      ) : null}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  group: { gap: 10, marginBottom: 16 },
  title: { marginTop: 4, fontFamily: serif, fontWeight: 'bold' },
  past: { marginTop: 8, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
