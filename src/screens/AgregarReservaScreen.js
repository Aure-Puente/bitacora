import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, HelperText, Switch, Text, TextInput, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import DateTimeField from '../components/DateTimeField';
import EmptyState from '../components/EmptyState';
import FileRow from '../components/FileRow';
import ScreenContainer from '../components/ScreenContainer';
import TimeField from '../components/TimeField';
import { BOOKING_TYPES } from '../constants/bookingTypes';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useBookings from '../hooks/useBookings';
import useFiles from '../hooks/useFiles';
import { deleteBooking, saveBooking } from '../services/bookingService';
import { bookingDate } from '../utils/bookings';
import { toDate } from '../utils/dates';
import { filesOfBooking } from '../utils/files';
import { friendlyError } from '../utils/firebaseErrors';
import { dayKey, dayKeyToDate, normalizeUrl } from '../utils/itinerary';

const EMPTY_FLIGHT = { airline: '', number: '', terminal: '', gate: '' };

// Crea o edita (params.bookingId) una reserva.
export default function AgregarReservaScreen({ navigation, route }) {
  const { currentTrip } = useTrip();
  const { bookings, loading, error } = useBookings(currentTrip && currentTrip.id);
  const bookingId = route.params && route.params.bookingId;
  const existing = bookingId ? bookings.find((b) => b.id === bookingId) : null;

  return (
    <ScreenContainer>
      <CollectionState loading={loading} error={error}>
        {bookingId && !existing ? (
          <EmptyState icon="ticket-confirmation-outline" title="Esta reserva ya no existe" />
        ) : (
          <BookingForm navigation={navigation} existing={existing} />
        )}
      </CollectionState>
    </ScreenContainer>
  );
}

function BookingForm({ navigation, existing }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();

  const [type, setType] = useState(existing ? existing.type : 'vuelo');
  const [title, setTitle] = useState(existing ? existing.title : '');
  const [code, setCode] = useState(existing ? existing.code : '');
  const [day, setDay] = useState(
    existing ? existing.day : dayKey(currentTrip.departureAt) || dayKey(new Date())
  );
  const [time, setTime] = useState(existing ? existing.time : null);
  const [address, setAddress] = useState(existing ? existing.address : '');
  const [mapsUrl, setMapsUrl] = useState(existing ? existing.mapsUrl : '');
  const [notes, setNotes] = useState(existing ? existing.notes : '');
  const [flight, setFlight] = useState((existing && existing.flight) || EMPTY_FLIGHT);
  const wasDeparture = !!existing && currentTrip.departureBookingId === existing.id;
  const [isDeparture, setIsDeparture] = useState(wasDeparture);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { files } = useFiles(currentTrip.id, user.uid);
  const attachments = existing ? filesOfBooking(files, existing.id) : [];

  const isFlight = type === 'vuelo';
  const setFlightField = (field) => (text) => setFlight((f) => ({ ...f, [field]: text }));

  const onSave = async () => {
    setError('');
    if (!title.trim()) {
      setError(isFlight ? 'Poné un título (ej: Vuelo de ida).' : 'Poné un título (ej: Hotel Aconcagua).');
      return;
    }
    const url = normalizeUrl(mapsUrl);
    if (url === null) {
      setError('El link de Maps no es válido. Dejalo vacío para buscar por la dirección.');
      return;
    }
    let departure = wasDeparture ? 'unlink' : null;
    if (isFlight && isDeparture) {
      if (!time) {
        setError('Para la cuenta regresiva, cargá la hora del vuelo.');
        return;
      }
      const date = bookingDate(day, time);
      const returnDate = toDate(currentTrip.returnAt);
      if (returnDate && date.getTime() >= returnDate.getTime()) {
        setError('El vuelo de salida tiene que ser antes del regreso del viaje.');
        return;
      }
      departure = { date };
    }
    setSaving(true);
    try {
      await saveBooking(
        currentTrip.id,
        user,
        { type, title, code, day, time, address, mapsUrl: url, notes, flight, departure },
        existing ? existing.id : undefined
      );
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar reserva', `¿Seguro que querés eliminar "${existing.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBooking(currentTrip.id, existing.id, wasDeparture);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  return (
    <View>
      <View style={styles.wrapRow}>
        {BOOKING_TYPES.map((t) => (
          <Chip key={t.id} icon={t.icon} selected={type === t.id} showSelectedOverlay onPress={() => setType(t.id)}>
            {t.label}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Título"
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        placeholder={isFlight ? 'Ej: Vuelo de ida' : 'Ej: Hotel Aconcagua'}
        maxLength={120}
        style={styles.input}
      />
      <TextInput
        label="Código de reserva (opcional)"
        mode="outlined"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={60}
        style={styles.input}
      />

      <DateTimeField
        label="Fecha"
        mode="date"
        value={dayKeyToDate(day)}
        onChange={(date) => setDay(dayKey(date))}
      />
      <TimeField label="Hora local (opcional)" value={time} onChange={setTime} />

      {isFlight ? (
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall">Es el vuelo de salida</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              La cuenta regresiva de Inicio usa su fecha y hora.
            </Text>
          </View>
          <Switch value={isDeparture} onValueChange={setIsDeparture} accessibilityLabel="Es el vuelo de salida" />
        </View>
      ) : null}

      {isFlight ? (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Datos del vuelo (opcional)
          </Text>
          <TextInput
            label="Aerolínea"
            mode="outlined"
            value={flight.airline}
            onChangeText={setFlightField('airline')}
            maxLength={60}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Vuelo"
              mode="outlined"
              value={flight.number}
              onChangeText={setFlightField('number')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={styles.third}
            />
            <TextInput
              label="Terminal"
              mode="outlined"
              value={flight.terminal}
              onChangeText={setFlightField('terminal')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={styles.third}
            />
            <TextInput
              label="Puerta"
              mode="outlined"
              value={flight.gate}
              onChangeText={setFlightField('gate')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={styles.third}
            />
          </View>
        </>
      ) : null}

      <TextInput
        label={isFlight ? 'Aeropuerto o dirección (opcional)' : 'Dirección (opcional)'}
        mode="outlined"
        value={address}
        onChangeText={setAddress}
        placeholder={isFlight ? 'Ej: Aeroparque Jorge Newbery' : 'Ej: San Lorenzo 545, Mendoza'}
        maxLength={200}
        style={styles.input}
      />
      <TextInput
        label="Link de Maps (opcional)"
        mode="outlined"
        value={mapsUrl}
        onChangeText={setMapsUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        maxLength={1000}
      />
      <HelperText type="info" visible>
        Si no ponés un link, Maps busca por la dirección.
      </HelperText>
      <TextInput
        label="Notas (opcional)"
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        maxLength={2000}
        style={styles.input}
      />

      {existing ? (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Adjuntos
          </Text>
          {attachments.length ? (
            <Card style={styles.input}>
              {attachments.map((f, i) => (
                <View key={f.id}>
                  {i > 0 ? <Divider /> : null}
                  <FileRow file={f} navigation={navigation} />
                </View>
              ))}
            </Card>
          ) : null}
          <Button
            mode="outlined"
            icon="paperclip"
            onPress={() => navigation.navigate('SubirArchivo', { bookingId: existing.id })}
            style={styles.attach}
          >
            Adjuntar foto o PDF
          </Button>
        </>
      ) : (
        <HelperText type="info" visible>
          Después de guardarla vas a poder adjuntarle fotos y PDF.
        </HelperText>
      )}

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
        {existing ? 'Guardar cambios' : 'Guardar reserva'}
      </Button>
      {existing ? (
        <Button
          mode="text"
          textColor={theme.colors.error}
          icon="delete-outline"
          onPress={onDelete}
          disabled={saving}
          style={{ marginTop: 8 }}
        >
          Eliminar reserva
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  attach: { alignSelf: 'flex-start', marginBottom: 8 },
  input: { marginBottom: 12 },
  label: { marginTop: 4, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  third: { flex: 1, minWidth: 0 },
});
