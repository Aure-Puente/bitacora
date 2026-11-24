import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  HelperText,
  Icon,
  ProgressBar,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import SourceDialog from '../components/SourceDialog';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useBookings from '../hooks/useBookings';
import useFiles from '../hooks/useFiles';
import { forgetLocal } from '../services/fileCache';
import { deleteFile, updateFile, uploadFile } from '../services/fileService';
import { baseName, isPdf } from '../utils/files';
import { friendlyError } from '../utils/firebaseErrors';

// Sube un documento o, con params.fileId, edita uno propio.
// Con params.bookingId queda asociado a esa reserva y arranca visible para el grupo.
export default function SubirArchivoScreen({ navigation, route }) {
  const { user } = useAuth();
  const { currentTrip } = useTrip();
  const params = route.params || {};
  const { files, loading, error } = useFiles(currentTrip && currentTrip.id, user.uid);
  const existing = params.fileId ? files.find((f) => f.id === params.fileId) : null;

  return (
    <ScreenContainer>
      <CollectionState loading={loading} error={error}>
        {params.fileId && !existing ? (
          <EmptyState icon="file-remove-outline" title="Este archivo ya no existe" />
        ) : (
          <FileForm navigation={navigation} existing={existing} initialBookingId={params.bookingId} />
        )}
      </CollectionState>
    </ScreenContainer>
  );
}

function FileForm({ navigation, existing, initialBookingId }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();
  const { bookings } = useBookings(currentTrip.id);

  const [picked, setPicked] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [name, setName] = useState(existing ? existing.name : '');
  // Los documentos arrancan privados; los de una reserva, visibles para el grupo.
  const [visibility, setVisibility] = useState(initialBookingId ? 'group' : 'private');
  const [bookingId, setBookingId] = useState((existing ? existing.bookingId : initialBookingId) || null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isTicket = !!existing && existing.kind === 'ticket';

  const onPicked = ([file]) => {
    setPicked(file);
    setError('');
    if (!name.trim() && isPdf(file)) setName(baseName(file.name));
  };

  const onSave = async () => {
    setError('');
    if (!existing && !picked) {
      setError('Elegí una foto o un PDF.');
      return;
    }
    if (!name.trim()) {
      setError('Poné un nombre (ej: DNI, Voucher del hotel).');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateFile(currentTrip.id, existing.id, { name, bookingId });
      } else {
        await uploadFile(
          currentTrip.id,
          user,
          picked,
          { kind: 'documento', visibility, name, bookingId },
          setProgress
        );
      }
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
      setProgress(0);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar archivo', `¿Eliminar "${existing.name}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await deleteFile(currentTrip.id, existing);
            forgetLocal(existing.path);
            forgetLocal(existing.thumbPath);
            navigation.goBack();
          } catch (e) {
            setSaving(false);
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  return (
    <View>
      {existing ? null : (
        <Card style={styles.picker} onPress={saving ? undefined : () => setChoosing(true)}>
          <Card.Content style={styles.pickerContent}>
            {picked && !isPdf(picked) ? (
              <Image source={{ uri: picked.uri }} style={styles.preview} resizeMode="contain" />
            ) : (
              <Icon
                source={picked ? 'file-pdf-box' : 'paperclip'}
                size={44}
                color={picked ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            )}
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {picked ? 'Tocá para cambiarlo' : 'Tocá para elegir una foto o un PDF (hasta 10 MB)'}
            </Text>
          </Card.Content>
        </Card>
      )}

      <TextInput
        label="Nombre"
        mode="outlined"
        value={name}
        onChangeText={setName}
        placeholder="Ej: DNI"
        maxLength={120}
        style={styles.input}
      />

      {existing ? null : (
        <>
          <Text variant="labelLarge" style={styles.label}>
            ¿Quién lo ve?
          </Text>
          <SegmentedButtons
            value={visibility}
            onValueChange={setVisibility}
            buttons={[
              { value: 'private', label: 'Solo yo', icon: 'lock-outline' },
              { value: 'group', label: 'El grupo', icon: 'account-group-outline' },
            ]}
          />
          <HelperText type="info" visible>
            {visibility === 'private'
              ? 'Tus compañeros de viaje no lo ven. Quien administra el proyecto en Firebase podría acceder, porque no está cifrado de punta a punta.'
              : 'Lo ven todos los integrantes del viaje. Solo vos podés borrarlo.'}
          </HelperText>
          <HelperText type="info" visible>
            Esto no se puede cambiar después: habría que borrarlo y subirlo de nuevo.
          </HelperText>
        </>
      )}

      {bookings.length && !isTicket ? (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Reserva (opcional)
          </Text>
          <View style={styles.wrapRow}>
            <Chip selected={!bookingId} showSelectedOverlay onPress={() => setBookingId(null)}>
              Ninguna
            </Chip>
            {bookings.map((b) => (
              <Chip
                key={b.id}
                selected={bookingId === b.id}
                showSelectedOverlay
                onPress={() => setBookingId(b.id)}
              >
                {b.title}
              </Chip>
            ))}
          </View>
        </>
      ) : null}

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}
      {saving && !existing ? (
        <View style={styles.progress}>
          <ProgressBar progress={progress} style={styles.bar} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {progress > 0 ? `Subiendo… ${Math.round(progress * 100)}%` : 'Preparando…'}
          </Text>
        </View>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 16 }}>
        {existing ? 'Guardar cambios' : 'Subir'}
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
          Eliminar archivo
        </Button>
      ) : null}

      <SourceDialog visible={choosing} allowPdf onPicked={onPicked} onDismiss={() => setChoosing(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { marginBottom: 16 },
  pickerContent: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  preview: { width: '100%', height: 200 },
  input: { marginBottom: 12 },
  label: { marginTop: 4, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  progress: { marginTop: 12, gap: 6 },
  bar: { height: 8, borderRadius: 4 },
});
