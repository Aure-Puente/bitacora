import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import useCountdown from '../hooks/useCountdown';
import { serif } from '../theme/fonts';

// Cuenta regresiva: días · horas · min · seg.
export default function Countdown({ target, color = '#FFFFFF' }) {
  const { days, hours, minutes, seconds } = useCountdown(target);
  const items = [
    ['días', days],
    ['horas', hours],
    ['min', minutes],
    ['seg', seconds],
  ];

  return (
    <View style={styles.row}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.box}>
          <Text style={[styles.number, { color }]}>{String(value).padStart(2, '0')}</Text>
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  box: { flex: 1, alignItems: 'center' },
  number: { fontFamily: serif, fontWeight: 'bold', fontSize: 44, lineHeight: 52 },
  label: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 },
});
