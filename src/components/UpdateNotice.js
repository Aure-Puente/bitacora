import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as Updates from 'expo-updates';

import { useUploads } from '../context/UploadContext';

const CHECK_EVERY_MS = 30 * 60 * 1000;

// Avisa cuando se bajó una versión nueva (EAS Update) y ofrece reiniciar para usarla.
// Si no se reinicia, se aplica sola la próxima vez que se abra la app.
export default function UpdateNotice() {
  const { isUpdatePending } = Updates.useUpdates();
  const { active: uploading } = useUploads();
  const [dismissed, setDismissed] = useState(false);

  // Además de al abrir, busca al volver a la app después de un rato.
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return undefined;
    let last = Date.now();
    const subscription = AppState.addEventListener('change', async (status) => {
      if (status !== 'active' || Date.now() - last < CHECK_EVERY_MS) return;
      last = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          setDismissed(false);
        }
      } catch (e) {
        // sin señal: se prueba la próxima vez
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <Snackbar
      visible={isUpdatePending && !dismissed && !uploading}
      onDismiss={() => setDismissed(true)}
      duration={15000}
      action={{ label: 'Reiniciar', onPress: () => Updates.reloadAsync().catch(() => {}) }}
    >
      Hay una versión nueva de Bitácora.
    </Snackbar>
  );
}
