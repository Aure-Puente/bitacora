import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { friendlyError } from '../utils/firebaseErrors';
import EmptyState from './EmptyState';

// Muestra "cargando" o el error de una colección; si no hay ninguno, muestra el contenido.
export default function CollectionState({ loading, error, children }) {
  if (loading) {
    return (
      <View style={{ paddingVertical: 48 }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="No pudimos cargar esta sección"
        subtitle={friendlyError(error)}
      />
    );
  }
  return children;
}
