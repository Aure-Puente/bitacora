import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import AvatarPicker from '../components/AvatarPicker';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { friendlyError } from '../utils/firebaseErrors';

// Mi perfil: foto y nombre. Se ven en todos los viajes.
export default function PerfilScreen({ navigation }) {
  const theme = useTheme();
  const { user, displayName, changeAvatar, changeName } = useAuth();
  const { membersById } = useTrip();
  const [name, setName] = useState(displayName);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const me = { ...membersById[user.uid], displayName, photoURL: user.photoURL };

  const onAvatar = async (uri) => {
    setUploading(true);
    try {
      await changeAvatar(uri);
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Escribí tu nombre.');
      return;
    }
    setSaving(true);
    try {
      await changeName(name);
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <AvatarPicker member={me} busy={uploading} onChange={onAvatar} />
      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        {uploading ? 'Guardando la foto…' : 'Tocá la foto para cambiarla. La ven tus compañeros de viaje.'}
      </Text>

      <TextInput
        label="Tu nombre"
        mode="outlined"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        maxLength={60}
        style={styles.input}
      />
      <TextInput label="Email" mode="outlined" value={user.email || ''} disabled style={styles.input} />

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button
        mode="contained"
        onPress={onSave}
        loading={saving}
        disabled={saving || uploading || name.trim() === displayName}
      >
        Guardar nombre
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: { textAlign: 'center', marginTop: 12, marginBottom: 20 },
  input: { marginBottom: 12 },
});
