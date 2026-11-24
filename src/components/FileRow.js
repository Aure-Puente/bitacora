import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, IconButton, List, useTheme } from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { useDownloads } from '../context/DownloadContext';
import { useTrip } from '../context/TripContext';
import { openFile } from '../services/fileCache';
import { formatSize, isImage } from '../utils/files';
import { friendlyError } from '../utils/firebaseErrors';
import StorageImage from './StorageImage';

// Un documento o ticket. Las fotos se abren con zoom y los PDF con el visor del celular.
export default function FileRow({ file, navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { membersById } = useTrip();
  const { isDownloaded } = useDownloads();
  const [opening, setOpening] = useState(false);

  const mine = file.ownerId === user.uid;
  const owner = membersById[file.ownerId];
  const details = [
    file.visibility === 'private' ? 'Solo vos' : 'Grupo',
    mine ? 'lo subiste vos' : `lo subió ${(owner && owner.displayName) || 'alguien'}`,
    formatSize(file.size),
  ].join(' · ');

  const onOpen = async () => {
    if (isImage(file)) {
      navigation.navigate('VerArchivo', { fileId: file.id });
      return;
    }
    setOpening(true);
    try {
      await openFile(file);
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    } finally {
      setOpening(false);
    }
  };

  return (
    <List.Item
      title={file.name}
      titleNumberOfLines={2}
      description={details}
      descriptionNumberOfLines={2}
      onPress={onOpen}
      left={() => (
        <View style={styles.left}>
          {file.thumbPath ? (
            <StorageImage path={file.thumbPath} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="file-pdf-box" size={26} color={theme.colors.primary} />
            </View>
          )}
        </View>
      )}
      right={() => (
        <View style={styles.right}>
          {opening ? <ActivityIndicator size={20} /> : null}
          {isDownloaded(file) ? (
            <Icon source="cellphone-check" size={20} color={theme.colors.success} />
          ) : null}
          <Icon
            source={file.visibility === 'private' ? 'lock-outline' : 'account-group-outline'}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          {mine ? (
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => navigation.navigate('SubirArchivo', { fileId: file.id })}
              accessibilityLabel={`Editar ${file.name}`}
            />
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  left: { justifyContent: 'center', marginLeft: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
