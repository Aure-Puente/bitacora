import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

import DateTimeField from '../components/DateTimeField';
import ScreenContainer from '../components/ScreenContainer';
import { useTrip } from '../context/TripContext';
import { serif } from '../theme/fonts';
import { DEFAULT_TRIP_THEME, TRIP_EMOJIS, TRIP_THEMES } from '../theme/tripThemes';
import { toDate } from '../utils/dates';
import { friendlyError } from '../utils/firebaseErrors';
import { CURRENCIES } from '../utils/money';

function defaultDeparture() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  d.setHours(8, 0, 0, 0);
  return d;
}

// Crea un viaje nuevo o, con params.editing = true, edita el viaje actual.
export default function CrearViajeScreen({ navigation, route }) {
  const theme = useTheme();
  const { currentTrip, createTrip, updateTrip } = useTrip();
  const editing = !!(route.params && route.params.editing && currentTrip);
  const initial = editing ? currentTrip : null;

  const [name, setName] = useState(initial ? initial.name : '');
  const [destination, setDestination] = useState(initial ? initial.destination || '' : '');
  const [emoji, setEmoji] = useState(initial ? initial.emoji || '🧭' : '🧭');
  const [tripTheme, setTripTheme] = useState(initial && initial.theme ? initial.theme : DEFAULT_TRIP_THEME);
  const [currency, setCurrency] = useState(initial ? initial.currency || 'ARS' : 'ARS');
  const [departure, setDeparture] = useState(
    initial ? toDate(initial.departureAt) : defaultDeparture()
  );
  const [returnDate, setReturnDate] = useState(() => {
    if (initial) return toDate(initial.returnAt);
    const d = defaultDeparture();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const previewName = useMemo(() => name.trim() || 'Nombre del viaje', [name]);

  const onSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Poné un nombre al viaje.');
      return;
    }
    if (returnDate.getTime() <= departure.getTime()) {
      setError('El regreso tiene que ser después de la salida.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name,
        destination,
        emoji: emoji.trim() || '🧭',
        theme: tripTheme,
        currency,
        departureAt: departure,
        returnAt: returnDate,
      };
      if (editing) {
        const moved = departure.getTime() !== toDate(initial.departureAt).getTime();
        await updateTrip(currentTrip.id, { ...data, unlinkDeparture: moved && !!initial.departureBookingId });
        navigation.goBack();
      } else {
        await createTrip(data);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      {/* Vista previa con los colores elegidos */}
      <View style={[styles.preview, { backgroundColor: tripTheme.primary }]}>
        <Text style={styles.previewEmoji}>{emoji || '🧭'}</Text>
        <Text style={styles.previewName} numberOfLines={1}>
          {previewName}
        </Text>
        <View style={[styles.previewBar, { backgroundColor: tripTheme.accent }]} />
      </View>

      <TextInput
        label="Nombre del viaje"
        mode="outlined"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Mendoza"
        style={styles.input}
      />
      <TextInput
        label="Destino (opcional)"
        mode="outlined"
        value={destination}
        onChangeText={setDestination}
        placeholder="Ej: Mendoza, Argentina"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        Ícono
      </Text>
      <View style={styles.wrapRow}>
        {TRIP_EMOJIS.map((e) => (
          <Chip key={e} selected={emoji === e} showSelectedOverlay onPress={() => setEmoji(e)}>
            {e}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Colores del viaje
      </Text>
      <View style={styles.wrapRow}>
        {TRIP_THEMES.map((t) => {
          const selected = tripTheme.primary === t.primary;
          return (
            <Pressable key={t.id} onPress={() => setTripTheme({ primary: t.primary, accent: t.accent })} style={styles.swatchWrap}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: t.primary,
                    borderColor: selected ? theme.colors.onSurface : 'transparent',
                  },
                ]}
              >
                <View style={[styles.swatchAccent, { backgroundColor: t.accent }]} />
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Moneda
      </Text>
      <SegmentedButtons
        value={currency}
        onValueChange={setCurrency}
        buttons={CURRENCIES.map((c) => ({ value: c.value, label: c.label, disabled: editing }))}
        style={{ marginBottom: editing ? 4 : 16 }}
      />
      {editing ? (
        <HelperText type="info" visible>
          La moneda no se puede cambiar una vez creado el viaje.
        </HelperText>
      ) : null}

      <DateTimeField label="Salida (vuelo)" value={departure} onChange={setDeparture} />
      {initial && initial.departureBookingId ? (
        <HelperText type="info" visible>
          La salida sigue a un vuelo de Reservas. Si la cambiás acá, deja de seguirlo.
        </HelperText>
      ) : null}
      <DateTimeField label="Regreso" value={returnDate} onChange={setReturnDate} />

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
        {editing ? 'Guardar cambios' : 'Crear viaje'}
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  preview: { borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 20 },
  previewEmoji: { fontSize: 44 },
  previewName: { color: '#FFFFFF', fontFamily: serif, fontWeight: 'bold', fontSize: 26, marginTop: 4 },
  previewBar: { width: 56, height: 5, borderRadius: 3, marginTop: 10 },
  input: { marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  swatchWrap: { alignItems: 'center', gap: 4 },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'flex-end', justifyContent: 'flex-end' },
  swatchAccent: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF' },
});
