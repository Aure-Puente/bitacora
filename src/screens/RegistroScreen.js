import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import AvatarPicker from '../components/AvatarPicker';
import { useAuth } from '../context/AuthContext';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';

export default function RegistroScreen({ navigation }) {
  const theme = useTheme();
  const { register, loginWithGoogle } = useAuth();

  const [photoUri, setPhotoUri] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const onRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Completá todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, photoUri);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.primary }]}>Crear cuenta</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Sumate para armar y compartir tus viajes
        </Text>

        <AvatarPicker
          member={{ displayName: name, photoURL: photoUri, color: theme.colors.primary }}
          size={96}
          busy={loading}
          onChange={setPhotoUri}
        />
        <Text variant="bodySmall" style={[styles.photoHint, { color: theme.colors.onSurfaceVariant }]}>
          Foto de perfil (opcional)
        </Text>

        <TextInput
          label="Tu nombre"
          mode="outlined"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          left={<TextInput.Icon icon="account-outline" />}
          style={styles.input}
        />
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
        />
        <TextInput
          label="Contraseña"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setShowPassword((s) => !s)}
            />
          }
          style={styles.input}
        />
        <TextInput
          label="Repetir contraseña"
          mode="outlined"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          left={<TextInput.Icon icon="lock-check-outline" />}
          style={styles.input}
        />

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button mode="contained" onPress={onRegister} loading={loading} disabled={loading || googleLoading} style={styles.button}>
          Crear cuenta
        </Button>

        <View style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            o
          </Text>
          <Divider style={styles.divider} />
        </View>

        <Button
          mode="outlined"
          icon="google"
          onPress={onGoogle}
          loading={googleLoading}
          disabled={loading || googleLoading}
          style={styles.button}
        >
          Registrarme con Google
        </Button>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ¿Ya tenés cuenta?
          </Text>
          <Button mode="text" compact onPress={() => navigation.navigate('Login')}>
            Ingresar
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  photoHint: { textAlign: 'center', marginTop: 8, marginBottom: 16 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontFamily: serif, fontWeight: 'bold', fontSize: 32, textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  divider: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
