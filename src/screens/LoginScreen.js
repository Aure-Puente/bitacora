import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { isFirebaseConfigured } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';

const LOGO_LIGHT = require('../../assets/splash-icon.png');
const LOGO_DARK = require('../../assets/splash-icon-dark.png');

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { isDark } = useThemeMode();
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const onLogin = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Completá tu email y tu contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError('');
    setInfo('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setGoogleLoading(false);
    }
  };

  const onForgot = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Escribí tu email y volvé a tocar "¿Olvidaste tu contraseña?".');
      return;
    }
    try {
      await resetPassword(email);
      setInfo('Te enviamos un email para restablecer tu contraseña.');
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image source={isDark ? LOGO_DARK : LOGO_LIGHT} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: theme.colors.primary }]}>Bitácora</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Tu diario de viaje compartido
        </Text>

        {!isFirebaseConfigured ? (
          <HelperText type="error" visible style={styles.warning}>
            Falta configurar Firebase: completá src/config/firebaseConfig.js.
          </HelperText>
        ) : null}

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

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
        {info ? (
          <HelperText type="info" visible>
            {info}
          </HelperText>
        ) : null}

        <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading || googleLoading} style={styles.button}>
          Ingresar
        </Button>
        <Button mode="text" onPress={onForgot} compact>
          ¿Olvidaste tu contraseña?
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
          Continuar con Google
        </Button>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ¿No tenés cuenta?
          </Text>
          <Button mode="text" compact onPress={() => navigation.navigate('Registro')}>
            Crear cuenta
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 120, height: 120, alignSelf: 'center' },
  title: { fontFamily: serif, fontWeight: 'bold', fontSize: 36, textAlign: 'center', marginTop: 4 },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  warning: { textAlign: 'center' },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  divider: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
