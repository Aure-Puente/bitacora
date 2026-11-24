import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import SelectorChips from '../components/SelectorChips';
import TimeField from '../components/TimeField';
import { ACTIVITY_STATUS } from '../constants/activityStatus';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useActivities from '../hooks/useActivities';
import { deleteActivity, saveActivity } from '../services/activityService';
import { friendlyError } from '../utils/firebaseErrors';
import { formatDayShort, insertOrder, normalizeUrl, tripDays } from '../utils/itinerary';

const NO_DAY = 'ideas';

// Crea o edita (params.activityId) una actividad.
// Opcionales al crear: params.day, params.title y params.pollId (si viene de una votación).
export default function AgregarActividadScreen({ navigation, route }) {
  const { currentTrip } = useTrip();
  const { activities, loading, error } = useActivities(currentTrip && currentTrip.id);
  const params = route.params || {};
  const existing = params.activityId ? activities.find((a) => a.id === params.activityId) : null;

  // El formulario se arma cuando ya está el dato a editar.
  return (
    <ScreenContainer>
      <CollectionState loading={loading} error={error}>
        {params.activityId && !existing ? (
          <EmptyState icon="map-marker-off-outline" title="Esta actividad ya no existe" />
        ) : (
          <ActivityForm navigation={navigation} params={params} existing={existing} activities={activities} />
        )}
      </CollectionState>
    </ScreenContainer>
  );
}

function ActivityForm({ navigation, params, existing, activities }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();

  const [title, setTitle] = useState(existing ? existing.title : params.title || '');
  const [day, setDay] = useState((existing ? existing.day : params.day) || null);
  const [time, setTime] = useState(existing ? existing.time : null);
  const [place, setPlace] = useState(existing ? existing.place : '');
  const [mapsUrl, setMapsUrl] = useState(existing ? existing.mapsUrl : '');
  const [notes, setNotes] = useState(existing ? existing.notes : '');
  const [status, setStatus] = useState(existing ? existing.status : 'idea');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dayItems = useMemo(() => {
    const days = tripDays(currentTrip.departureAt, currentTrip.returnAt);
    // Si quedó fuera de las fechas del viaje, su día igual aparece en la lista.
    if (existing && existing.day && !days.includes(existing.day)) days.push(existing.day);
    return [
      { value: NO_DAY, label: 'Sin día (idea)', icon: 'lightbulb-outline' },
      ...days.map((d) => ({ value: d, label: formatDayShort(d) })),
    ];
  }, [currentTrip.departureAt, currentTrip.returnAt, existing]);

  const onSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Poné un título (ej: Bodega Catena).');
      return;
    }
    const url = normalizeUrl(mapsUrl);
    if (url === null) {
      setError('El link de Maps no es válido. Dejalo vacío para buscar por el lugar.');
      return;
    }
    // Se reubica solo si es nueva o si cambió de día u hora; si no, conserva el orden manual.
    const keepOrder = existing && existing.day === day && existing.time === time;
    const sameDay = activities.filter((a) => (a.day || null) === day && (!existing || a.id !== existing.id));
    const order = keepOrder ? existing.order : insertOrder(sameDay, time);

    setSaving(true);
    try {
      await saveActivity(
        currentTrip.id,
        user,
        { title, day, time, place, mapsUrl: url, notes, status, order, pollId: params.pollId },
        existing ? existing.id : undefined
      );
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar actividad', `¿Seguro que querés eliminar "${existing.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteActivity(currentTrip.id, existing.id);
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
      <TextInput
        label="¿Qué van a hacer?"
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Almuerzo en la bodega"
        maxLength={120}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        Día
      </Text>
      <SelectorChips
        items={dayItems}
        value={day || NO_DAY}
        onChange={(v) => setDay(v === NO_DAY ? null : v)}
        style={styles.days}
      />
      <TimeField label="Hora (opcional)" value={time} onChange={setTime} />

      <TextInput
        label="Lugar (opcional)"
        mode="outlined"
        value={place}
        onChangeText={setPlace}
        placeholder="Ej: Parque General San Martín"
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
        Si no ponés un link, Maps busca por el texto del lugar.
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

      <Text variant="labelLarge" style={styles.label}>
        Estado
      </Text>
      <SegmentedButtons
        value={status}
        onValueChange={setStatus}
        buttons={ACTIVITY_STATUS.map((s) => ({ value: s.id, label: s.label }))}
      />

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 16 }}>
        {existing ? 'Guardar cambios' : 'Guardar'}
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
          Eliminar
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
  label: { marginTop: 4, marginBottom: 4 },
  days: { marginHorizontal: -16, marginBottom: 8 },
});
