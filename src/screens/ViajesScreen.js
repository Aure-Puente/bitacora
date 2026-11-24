import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import EmptyState from '../components/EmptyState';
import MemberAvatar from '../components/MemberAvatar';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { DEFAULT_TRIP_THEME } from '../theme/tripThemes';
import { formatDate } from '../utils/dates';

export default function ViajesScreen({ navigation }) {
  const theme = useTheme();
  const { user, displayName, logout } = useAuth();
  const { trips, selectTrip, currentTripId } = useTrip();

  const firstName = (displayName || '').split(' ')[0];

  const openTrip = (trip) => {
    selectTrip(trip.id);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const onLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.greetingRow}>
        <Text variant="headlineSmall" style={styles.greeting}>
          {firstName ? `Hola, ${firstName} 👋` : 'Hola 👋'}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Perfil')}
          accessibilityRole="button"
          accessibilityLabel="Editar mi perfil"
        >
          <MemberAvatar member={{ displayName, photoURL: user && user.photoURL }} size={48} />
        </Pressable>
      </View>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
        Elegí un viaje o armá uno nuevo.
      </Text>

      {trips.length === 0 ? (
        <EmptyState
          icon="map-marker-path"
          title="Todavía no tenés viajes"
          subtitle="Creá el primero o unite con el código que te pasó alguien del grupo."
        />
      ) : (
        trips.map((trip) => {
          const tripTheme = trip.theme || DEFAULT_TRIP_THEME;
          const selected = trip.id === currentTripId;
          return (
            <Card key={trip.id} style={styles.card} onPress={() => openTrip(trip)}>
              <View style={styles.cardRow}>
                <View style={[styles.badge, { backgroundColor: tripTheme.primary }]}>
                  <Text style={styles.badgeEmoji}>{trip.emoji || '🧭'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {trip.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                    {trip.destination ? `${trip.destination} · ` : ''}
                    {formatDate(trip.departureAt)} → {formatDate(trip.returnAt)}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {(trip.memberIds || []).length} integrantes{selected ? ' · viaje actual' : ''}
                  </Text>
                </View>
                <View style={[styles.accentDot, { backgroundColor: tripTheme.accent }]} />
              </View>
            </Card>
          );
        })
      )}

      <Button
        mode="contained"
        icon="plus"
        onPress={() => navigation.navigate('CrearViaje')}
        style={styles.button}
      >
        Crear viaje nuevo
      </Button>
      <Button
        mode="outlined"
        icon="ticket-confirmation-outline"
        onPress={() => navigation.navigate('UnirseViaje')}
        style={styles.button}
      >
        Unirme con un código
      </Button>
      <Button mode="text" onPress={onLogout} style={styles.button}>
        Cerrar sesión
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { flex: 1, marginTop: 4 },
  card: { marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 26 },
  accentDot: { width: 12, height: 12, borderRadius: 6 },
  button: { marginTop: 10 },
});
