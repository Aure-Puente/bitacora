import React, { useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  IconButton,
  List,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import MemberAvatar from '../components/MemberAvatar';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useDownloads } from '../context/DownloadContext';
import { useThemeMode } from '../context/ThemeContext';
import { useTrip } from '../context/TripContext';
import { serif } from '../theme/fonts';
import { formatSize } from '../utils/files';

export default function AjustesScreen({ navigation }) {
  const theme = useTheme();
  const { user, displayName, logout } = useAuth();
  const { mode, setMode } = useThemeMode();
  const { currentTrip, members } = useTrip();
  const { hasPending, backups } = useConnection();
  const downloads = useDownloads();
  const [snack, setSnack] = useState('');

  const isOwner = currentTrip.ownerId === user.uid;
  const me = members.find((m) => (m.uid || m.id) === user.uid);

  const copyCode = async () => {
    await Clipboard.setStringAsync(currentTrip.code);
    setSnack('Código copiado');
  };

  const shareCode = () => {
    Share.share({
      message: `Sumate a nuestro viaje "${currentTrip.name}" en Bitácora con el código: ${currentTrip.code}`,
    }).catch(() => {});
  };

  const onLogout = () => {
    const unsynced = hasPending || backups.length > 0;
    Alert.alert(
      'Cerrar sesión',
      unsynced
        ? 'Tenés cambios sin sincronizar. Quedan en este celular y se envían cuando vuelvas a entrar con tu cuenta.'
        : '¿Querés cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const onClearDownloads = () => {
    Alert.alert(
      'Borrar del celular',
      downloads.auto
        ? 'Se borran las copias guardadas. Los documentos se vuelven a bajar solos mientras la opción esté activada.'
        : 'Se borran las copias guardadas. Siguen estando en el viaje.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: downloads.clear },
      ]
    );
  };

  return (
    <>
      <ScreenContainer>
        {/* Perfil */}
        <Card onPress={() => navigation.navigate('Perfil')} accessibilityLabel="Editar mi perfil">
          <Card.Content style={styles.profile}>
            <MemberAvatar member={{ color: theme.colors.primary, ...me, displayName, photoURL: user.photoURL }} size={52} />
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium">{displayName}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {user.email}
              </Text>
            </View>
            <List.Icon icon="pencil-outline" color={theme.colors.onSurfaceVariant} />
          </Card.Content>
        </Card>

        {/* Apariencia */}
        <Text variant="titleMedium" style={styles.title}>
          Apariencia
        </Text>
        <SegmentedButtons
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: 'system', label: 'Sistema', icon: 'theme-light-dark' },
            { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
            { value: 'dark', label: 'Oscuro', icon: 'weather-night' },
          ]}
        />

        {/* Sin conexión */}
        <Text variant="titleMedium" style={styles.title}>
          Sin conexión
        </Text>
        <Card>
          <List.Item
            title="Guardar documentos y reservas"
            description="Los adjuntos se bajan solos para verlos sin internet."
            descriptionNumberOfLines={3}
            right={() => (
              <View style={{ justifyContent: 'center' }}>
                <Switch
                  value={downloads.auto}
                  onValueChange={downloads.setAuto}
                  accessibilityLabel="Guardar documentos y reservas"
                />
              </View>
            )}
          />
          <Divider />
          <List.Item
            title={
              downloads.summary.files === 1
                ? '1 archivo guardado'
                : `${downloads.summary.files} archivos guardados`
            }
            description={downloads.progress ? 'Descargando…' : formatSize(downloads.summary.bytes)}
            right={() =>
              downloads.summary.files ? (
                <Button compact mode="text" onPress={onClearDownloads}>
                  Borrar
                </Button>
              ) : null
            }
          />
        </Card>

        {/* Viaje actual */}
        <Text variant="titleMedium" style={styles.title}>
          {currentTrip.emoji || '🧭'} {currentTrip.name}
        </Text>
        <Card>
          <Card.Content>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Código de invitación
            </Text>
            <View style={styles.codeRow}>
              <Text style={[styles.code, { color: theme.colors.primary }]}>{currentTrip.code}</Text>
              <IconButton icon="content-copy" onPress={copyCode} accessibilityLabel="Copiar código" />
              <IconButton icon="share-variant" onPress={shareCode} accessibilityLabel="Compartir código" />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pasáselo a quien quieras sumar: lo ingresa en "Unirme con un código".
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.title}>
          Integrantes ({members.length})
        </Text>
        <Card>
          {members.map((m, i) => {
            const id = m.uid || m.id;
            return (
              <View key={id}>
                {i > 0 ? <Divider /> : null}
                <List.Item
                  title={m.displayName + (id === user.uid ? ' (vos)' : '')}
                  description={id === currentTrip.ownerId ? 'Organizó el viaje' : m.email || undefined}
                  left={() => (
                    <View style={{ justifyContent: 'center', marginLeft: 12 }}>
                      <MemberAvatar member={m} size={36} />
                    </View>
                  )}
                />
              </View>
            );
          })}
        </Card>

        <View style={{ marginTop: 20, gap: 10 }}>
          {isOwner ? (
            <Button
              mode="outlined"
              icon="pencil-outline"
              onPress={() => navigation.navigate('CrearViaje', { editing: true })}
            >
              Editar viaje (fechas, colores, nombre)
            </Button>
          ) : null}
          <Button mode="outlined" icon="swap-horizontal" onPress={() => navigation.navigate('Viajes')}>
            Cambiar de viaje
          </Button>
          <Button mode="text" icon="logout" textColor={theme.colors.error} onPress={onLogout}>
            Cerrar sesión
          </Button>
        </View>
      </ScreenContainer>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { marginTop: 24, marginBottom: 10, fontFamily: serif, fontWeight: 'bold' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  code: { flex: 1, fontFamily: serif, fontWeight: 'bold', fontSize: 34, letterSpacing: 6 },
});
