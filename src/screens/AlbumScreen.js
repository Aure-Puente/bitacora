import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, FAB, HelperText, Portal, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import MemberAvatar from '../components/MemberAvatar';
import SourceDialog from '../components/SourceDialog';
import StorageImage from '../components/StorageImage';
import { useAuth } from '../context/AuthContext';
import { useDownloads } from '../context/DownloadContext';
import { useTrip } from '../context/TripContext';
import { useUploads } from '../context/UploadContext';
import useFiles from '../hooks/useFiles';
import { exportToFolder } from '../services/fileCache';
import { setAlbumUrl } from '../services/fileService';
import { albumOf, chunk } from '../utils/files';
import { friendlyError } from '../utils/firebaseErrors';
import { normalizeUrl } from '../utils/itinerary';

const COLUMNS = 3;

// Álbum del viaje: fotos compartidas y link a Drive o Google Photos.
export default function AlbumScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, membersById } = useTrip();
  const { files, loading, error } = useFiles(currentTrip.id, user.uid);
  const uploads = useUploads();
  const downloads = useDownloads();

  const [choosing, setChoosing] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [exporting, setExporting] = useState(null); // { done, total }

  const photos = useMemo(() => albumOf(files), [files]);
  const rows = useMemo(() => chunk(photos, COLUMNS), [photos]);
  const toKeep = photos.filter((f) => !downloads.isDownloaded(f));
  const showUploads = uploads.total > 0 && uploads.tripId === currentTrip.id;

  const onKeep = async () => {
    const failed = await downloads.save(toKeep);
    if (failed) Alert.alert('Faltaron algunas', `${failed} no se pudieron guardar. Probá con mejor señal.`);
  };

  const onPicked = (list) =>
    uploads.enqueue(currentTrip.id, user, list, { kind: 'album', visibility: 'group' });

  const startExport = async () => {
    setExporting({ done: 0, total: photos.length });
    const result = await exportToFolder(photos, (done, total) => setExporting({ done, total }));
    setExporting(null);
    if (!result) return;
    Alert.alert(
      result.failed ? 'Se guardaron algunas' : 'Listo',
      result.failed
        ? `Se copiaron ${result.copied} fotos y ${result.failed} no se pudieron copiar. Probá de nuevo con buena señal.`
        : `Se copiaron ${result.copied} fotos a la carpeta que elegiste.`
    );
  };

  const onExport = () => {
    Alert.alert(
      'Guardar todas las fotos',
      Platform.OS === 'android'
        ? 'Elegí o creá una carpeta (por ejemplo, dentro de Imágenes) para que aparezcan en tu galería. Después podés subirlas a Drive o Google Photos.'
        : 'Elegí una carpeta de la app Archivos. Después podés subirlas a Drive o Google Photos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Elegir carpeta', onPress: startExport },
      ]
    );
  };

  const onOpenLink = () => {
    const url = normalizeUrl(currentTrip.albumUrl);
    if (url) Linking.openURL(url).catch(() => Alert.alert('Ups', 'No pudimos abrir el link.'));
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.actions}>
        {currentTrip.albumUrl ? (
          <Button mode="contained-tonal" icon="open-in-new" onPress={onOpenLink}>
            Abrir álbum externo
          </Button>
        ) : null}
        <Button mode="text" icon="link-variant" onPress={() => setLinkOpen(true)}>
          {currentTrip.albumUrl ? 'Cambiar link' : 'Agregar link a Drive o Google Photos'}
        </Button>
        {photos.length ? (
          <Button mode="text" icon="download-outline" onPress={onExport} disabled={!!exporting}>
            Guardar todas
          </Button>
        ) : null}
        {photos.length ? (
          <Button
            mode="text"
            icon={toKeep.length ? 'cellphone-arrow-down' : 'cellphone-check'}
            onPress={onKeep}
            disabled={!toKeep.length || !!downloads.progress}
          >
            {downloads.progress
              ? `Guardando ${downloads.progress.done + 1} de ${downloads.progress.total}`
              : toKeep.length
                ? 'Ver sin internet'
                : 'Disponible sin internet'}
          </Button>
        ) : null}
      </View>

      {showUploads ? (
        <Card style={styles.status} onPress={uploads.active ? undefined : uploads.dismiss}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleSmall">
              {uploads.active
                ? `Subiendo ${uploads.done + 1} de ${uploads.total}…`
                : uploads.failed
                  ? `${uploads.failed} de ${uploads.total} no se pudieron subir`
                  : `${uploads.total === 1 ? 'Se subió 1 foto' : `Se subieron ${uploads.total} fotos`}`}
            </Text>
            <ProgressBar progress={(uploads.done + uploads.progress) / uploads.total} style={styles.bar} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {uploads.active
                ? 'Podés seguir usando la app, pero no la cierres.'
                : `${uploads.lastError ? `${uploads.lastError} ` : ''}Tocá para cerrar este aviso.`}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {exporting ? (
        <Card style={styles.status}>
          <Card.Content style={{ gap: 6 }}>
            <Text variant="titleSmall">
              Guardando {exporting.done} de {exporting.total}…
            </Text>
            <ProgressBar progress={exporting.done / exporting.total} style={styles.bar} />
          </Card.Content>
        </Card>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <CollectionState loading={loading} error={error}>
        <FlatList
          data={rows}
          keyExtractor={(row) => row[0].id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="image-multiple-outline"
              title="Todavía no hay fotos"
              subtitle="Suban acá las mejores fotos del viaje para tenerlas todas juntas."
              actionLabel="Agregar fotos"
              onAction={() => setChoosing(true)}
            />
          }
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              {row.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => navigation.navigate('VerArchivo', { fileId: photo.id })}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Foto de ${
                    (membersById[photo.ownerId] && membersById[photo.ownerId].displayName) || 'alguien'
                  }`}
                  style={styles.cell}
                >
                  <StorageImage path={photo.thumbPath} style={styles.photo} />
                  <MemberAvatar member={membersById[photo.ownerId]} size={24} style={styles.owner} />
                </Pressable>
              ))}
              {Array.from({ length: COLUMNS - row.length }, (_, i) => (
                <View key={`vacio-${i}`} style={styles.cell} />
              ))}
            </View>
          )}
        />
      </CollectionState>

      {photos.length > 0 ? (
        <FAB
          icon="plus"
          label="Fotos"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => setChoosing(true)}
        />
      ) : null}

      <SourceDialog visible={choosing} multiple onPicked={onPicked} onDismiss={() => setChoosing(false)} />
      {linkOpen ? <LinkDialog trip={currentTrip} onDismiss={() => setLinkOpen(false)} /> : null}
    </View>
  );
}

function LinkDialog({ trip, onDismiss }) {
  const [url, setUrl] = useState(trip.albumUrl || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const clean = normalizeUrl(url);
    if (clean === null) {
      setError('El link no es válido.');
      return;
    }
    setSaving(true);
    try {
      await setAlbumUrl(trip.id, clean);
      onDismiss();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>Álbum externo</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Link a Drive o Google Photos"
            mode="outlined"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            maxLength={1000}
          />
          <HelperText type={error ? 'error' : 'info'} visible>
            {error || 'Lo ve todo el grupo. Dejalo vacío para quitarlo.'}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={onSave} loading={saving} disabled={saving}>
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  header: { marginBottom: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  status: { marginTop: 8 },
  bar: { height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  cell: { flex: 1, aspectRatio: 1 },
  photo: { width: '100%', height: '100%', borderRadius: 10 },
  owner: { position: 'absolute', left: 6, bottom: 6 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
