import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { formatTime } from '../utils/dates';

const DEFAULT_TIME = '10:00';

function timeToDate(time) {
  const [h, m] = (time || DEFAULT_TIME).split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// Hora opcional, como texto 'HH:MM' o null.
export default function TimeField({ label, value, onChange }) {
  const theme = useTheme();
  const [showIOS, setShowIOS] = useState(false);

  const onPress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeToDate(value),
        mode: 'time',
        is24Hour: true,
        onChange: (event, picked) => {
          if (event.type === 'set' && picked) onChange(formatTime(picked));
        },
      });
      return;
    }
    if (!value) onChange(DEFAULT_TIME);
    setShowIOS((s) => !s);
  };

  const onClear = () => {
    setShowIOS(false);
    onChange(null);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text variant="labelLarge" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <View style={styles.row}>
        <Button
          mode="outlined"
          icon="clock-outline"
          onPress={onPress}
          contentStyle={styles.buttonContent}
          style={{ flex: 1 }}
        >
          {value ? `${value} hs` : 'Sin hora'}
        </Button>
        {value ? <IconButton icon="close" onPress={onClear} accessibilityLabel="Quitar hora" /> : null}
      </View>
      {Platform.OS === 'ios' && showIOS && value ? (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display="spinner"
          themeVariant={theme.dark ? 'dark' : 'light'}
          onChange={(event, picked) => {
            if (picked) onChange(formatTime(picked));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  buttonContent: { justifyContent: 'flex-start', paddingVertical: 4 },
});
