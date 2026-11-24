import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import MemberAvatar from '../components/MemberAvatar';
import ZoomableImage from '../components/ZoomableImage';
import { useAuth } from '../context/AuthContext';
import { useDownloads } from '../context/DownloadContext';
import { useTrip } from '../context/TripContext';
import useFiles from '../hooks/useFiles';
import useLocalFile from '../hooks/useLocalFile';
import { forgetLocal, shareFile } from '../services/fileCache';
import { deleteFile } from '../services/fileService';
import { formatDate, formatTime } from '../utils/dates';
import { albumOf } from '../utils/files';
import { friendlyError } from '../utils/firebaseErrors';

// Visor de imágenes con zoom. Las del álbum se recorren con las flechas.
export default function VerArchivoScreen({ navigation, route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentTrip, membersById } = useTrip();
  const { files, loading, error } = useFiles(currentTrip && currentTrip.id, user.uid);
  const [fileId, setFileId] = useState(route.params.fileId);
  const [busy, setBusy] = useState(false);
  const downloads = useDownloads();

  const file = files.find((f) => f.id === fileId);
  const { uri, error: downloadError } = useLocalFile(file && file.path);

  const album = file && file.kind === 'album' ? albumOf(files) : [];
  const index = album.findIndex((f) => f.id === fileId);
  const owner = file && membersById[file.ownerId];
  const kept = !!file && downloads.isDownloaded(file);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar', `¿Eliminar "${file.name}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await deleteFile(currentTrip.id, file);
            forgetLocal(file.path);
            forgetLocal(file.thumbPath);
            navigation.goBack();
          }),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CollectionState loading={loading} error={error}>
        {!file ? (
          <EmptyState icon="image-off-outline" title="Este archivo ya no existe" />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {uri ? (
                <ZoomableImage key={uri} uri={uri} />
              ) : downloadError ? (
                <EmptyState
                  icon="image-off-outline"
                  title="No pudimos bajar la imagen"
                  subtitle={friendlyError(downloadError)}
                />
              ) : (
                <View style={styles.center}>
                  <ActivityIndicator size="large" />
                </View>
              )}
            </View>
            <View
              style={[
                styles.footer,
                { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 8 },
              ]}
            >
              <MemberAvatar member={owner} size={36} />
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" numberOfLines={1}>
                  {file.kind === 'album' ? (owner && owner.displayName) || 'Alguien' : file.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {file.createdAt ? `${formatDate(file.createdAt)} · ${formatTime(file.createdAt)} hs` : ''}
                </Text>
              </View>
              {index > 0 ? (
                <IconButton
                  icon="chevron-left"
                  onPress={() => setFileId(album[index - 1].id)}
                  accessibilityLabel="Foto anterior"
                />
              ) : null}
              {index >= 0 && index < album.length - 1 ? (
                <IconButton
                  icon="chevron-right"
                  onPress={() => setFileId(album[index + 1].id)}
                  accessibilityLabel="Foto siguiente"
                />
              ) : null}
              <IconButton
                icon={kept ? 'cellphone-check' : 'cellphone-arrow-down'}
                iconColor={kept ? theme.colors.success : undefined}
                disabled={busy || !uri}
                onPress={() =>
                  run(async () => {
                    if (kept) downloads.remove(file);
                    else if (await downloads.save([file])) throw new Error('No pudimos guardarlo. Revisá tu internet.');
                  })
                }
                accessibilityLabel={kept ? 'Dejar de guardar en el celular' : 'Guardar para ver sin internet'}
              />
              <IconButton
                icon="share-variant-outline"
                disabled={busy || !uri}
                onPress={() => run(() => shareFile(file))}
                accessibilityLabel="Compartir"
              />
              {file.ownerId === user.uid ? (
                <IconButton
                  icon="delete-outline"
                  disabled={busy}
                  onPress={onDelete}
                  accessibilityLabel="Eliminar"
                />
              ) : null}
            </View>
          </>
        )}
      </CollectionState>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
});
