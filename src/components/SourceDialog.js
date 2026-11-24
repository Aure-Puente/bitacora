import React from 'react';
import { Alert } from 'react-native';

import { pickImages, pickPdf, takePhoto } from '../services/imageService';
import { friendlyError } from '../utils/firebaseErrors';
import OptionsDialog from './OptionsDialog';

// Elige de dónde sale el archivo. onPicked recibe [{ uri, name, contentType }], nunca vacía.
export default function SourceDialog({ visible, allowPdf = false, multiple = false, onPicked, onDismiss }) {
  const sources = {
    camara: () => takePhoto(),
    galeria: () => pickImages({ multiple }),
    pdf: () => pickPdf(),
  };

  const onSelect = async (source) => {
    onDismiss();
    try {
      const picked = await sources[source]();
      if (picked.length) onPicked(picked);
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    }
  };

  return (
    <OptionsDialog
      visible={visible}
      title="¿De dónde?"
      options={[
        { value: 'camara', label: 'Sacar una foto', icon: 'camera-outline' },
        { value: 'galeria', label: multiple ? 'Elegir fotos' : 'Elegir una foto', icon: 'image-outline' },
        ...(allowPdf ? [{ value: 'pdf', label: 'Elegir un PDF', icon: 'file-pdf-box' }] : []),
      ]}
      onSelect={onSelect}
      onDismiss={onDismiss}
    />
  );
}
