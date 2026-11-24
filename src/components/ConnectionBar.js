import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnection } from '../context/ConnectionContext';

const SYNC_DELAY_MS = 2500; // con señal, un cambio se confirma enseguida: no hace falta avisar

function pendingText(pending) {
  if (pending === 1) return '1 cambio sin sincronizar';
  return pending > 1 ? `${pending} cambios sin sincronizar` : 'cambios sin sincronizar';
}

// Aviso al pie: "Sin conexión" o cambios pendientes. Envuelve a la navegación.
export default function ConnectionBar({ children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { online, pending, hasPending } = useConnection();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setSlow(false);
    if (!hasPending) return undefined;
    const timer = setTimeout(() => setSlow(true), SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasPending, online]);

  const visible = !online || (hasPending && slow);
  const text = online
    ? `Sincronizando: ${pendingText(pending)}`
    : `Sin conexión${hasPending ? ` · ${pendingText(pending)}` : ' · ves lo último guardado'}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Con el aviso visible, el margen de abajo lo pone el aviso y no la barra de pestañas. */}
      <SafeAreaInsetsContext.Provider value={visible ? { ...insets, bottom: 0 } : insets}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaInsetsContext.Provider>
      {visible ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.bar,
            { backgroundColor: theme.colors.secondaryContainer, paddingBottom: insets.bottom + 6 },
          ]}
        >
          <Icon
            source={online ? 'cloud-sync-outline' : 'cloud-off-outline'}
            size={18}
            color={theme.colors.onSecondaryContainer}
          />
          <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
            {text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 6,
    paddingHorizontal: 16,
  },
});
