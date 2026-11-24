import React from 'react';
import { View } from 'react-native';
import { ProgressBar, useTheme } from 'react-native-paper';

// Barra segmentada: un casillero por cuota. Lleno = confirmada, acento = pendiente de confirmar.
export default function InstallmentBar({ total, confirmed, pending = 0, height = 12 }) {
  const theme = useTheme();

  if (total > 24) {
    return <ProgressBar progress={total ? confirmed / total : 0} style={{ height, borderRadius: 6 }} />;
  }

  const segments = Array.from({ length: total }, (_, i) => i);
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {segments.map((i) => {
        let color = theme.colors.outlineVariant;
        if (i < confirmed) color = theme.colors.primary;
        else if (i < confirmed + pending) color = theme.colors.secondary;
        return (
          <View key={i} style={{ flex: 1, height, borderRadius: 4, backgroundColor: color }} />
        );
      })}
    </View>
  );
}
