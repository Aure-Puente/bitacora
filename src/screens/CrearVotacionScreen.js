import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, IconButton, Text, TextInput } from 'react-native-paper';

import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { createPoll } from '../services/pollService';
import { friendlyError } from '../utils/firebaseErrors';
import { cleanOptions, MAX_OPTIONS, MIN_OPTIONS } from '../utils/polls';

export default function CrearVotacionScreen({ navigation }) {
  const { user } = useAuth();
  const { currentTrip } = useTrip();
  const [question, setQuestion] = useState('');
  const [texts, setTexts] = useState(['', '']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setText = (index, text) => setTexts(texts.map((t, i) => (i === index ? text : t)));

  const onSave = async () => {
    setError('');
    if (!question.trim()) {
      setError('Escribí la pregunta (ej: ¿Qué bodega visitamos?).');
      return;
    }
    const options = cleanOptions(texts);
    if (options.length < MIN_OPTIONS) {
      setError('Cargá al menos dos opciones distintas.');
      return;
    }
    setSaving(true);
    try {
      await createPoll(currentTrip.id, user, { question, options });
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <TextInput
        label="Pregunta"
        mode="outlined"
        value={question}
        onChangeText={setQuestion}
        placeholder="Ej: ¿Qué bodega visitamos?"
        maxLength={200}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        Opciones
      </Text>
      {texts.map((text, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <View key={i} style={styles.optionRow}>
          <TextInput
            label={`Opción ${i + 1}`}
            mode="outlined"
            value={text}
            onChangeText={(t) => setText(i, t)}
            maxLength={100}
            style={{ flex: 1 }}
          />
          {texts.length > MIN_OPTIONS ? (
            <IconButton
              icon="close"
              onPress={() => setTexts(texts.filter((_, j) => j !== i))}
              accessibilityLabel={`Quitar opción ${i + 1}`}
            />
          ) : null}
        </View>
      ))}
      {texts.length < MAX_OPTIONS ? (
        <Button mode="text" icon="plus" onPress={() => setTexts([...texts, ''])} style={styles.add}>
          Agregar opción
        </Button>
      ) : null}
      <HelperText type="info" visible>
        Después de crearla, la pregunta y las opciones no se pueden cambiar. Los votos se ven con nombre.
      </HelperText>

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
        Crear votación
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
  label: { marginTop: 4, marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  add: { alignSelf: 'flex-start' },
});
