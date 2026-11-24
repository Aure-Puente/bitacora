import React from 'react';
import { Image, View } from 'react-native';
import { ActivityIndicator, Icon, useTheme } from 'react-native-paper';

import useLocalFile from '../hooks/useLocalFile';

// Imagen guardada en Storage (se baja a la caché del celular).
export default function StorageImage({ path, style, resizeMode = 'cover' }) {
  const theme = useTheme();
  const { uri, error } = useLocalFile(path);

  if (uri) return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
  return (
    <View
      style={[
        style,
        { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      {error ? (
        <Icon source="image-off-outline" size={24} color={theme.colors.onSurfaceVariant} />
      ) : (
        <ActivityIndicator size="small" />
      )}
    </View>
  );
}
