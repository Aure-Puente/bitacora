import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import ScreenContainer from '../components/ScreenContainer';
import { useTrip } from '../context/TripContext';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';

export default function UnirseViajeScreen({ navigation }) {
  const theme = useTheme();
  const { joinTrip } = useTrip();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onJoin = async () => {
    setError('');
    setLoading(true);
    try {
      await joinTrip(code);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(friendlyError(e));
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Sumate a un viaje</Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Pedile el código de invitación a quien armó el viaje. Lo encuentra en Ajustes.
      </Text>

      <TextInput
        label="Código de invitación"
        mode="outlined"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={10}
        style={styles.input}
        contentStyle={styles.codeInput}
      />

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onJoin} loading={loading} disabled={loading || code.trim().length < 4}>
        Unirme
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: serif, fontWeight: 'bold', fontSize: 28, marginTop: 8 },
  subtitle: { marginTop: 6, marginBottom: 20 },
  input: { marginBottom: 12 },
  codeInput: { fontSize: 22, letterSpacing: 4, textAlign: 'center' },
});
