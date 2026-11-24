import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { formatDateTimeLong, formatLongDate } from '../utils/dates';

// Campo de fecha (mode="date") o fecha y hora (mode="datetime"). Funciona en Android e iOS.
export default function DateTimeField({ label, value, onChange, mode = 'datetime' }) {
  const theme = useTheme();
  const [showIOS, setShowIOS] = useState(false);
  const text = mode === 'date' ? formatLongDate(value) : formatDateTimeLong(value);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      is24Hour: true,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;
        if (mode === 'date') {
          onChange(picked);
          return;
        }
        DateTimePickerAndroid.open({
          value: picked,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== 'set' || !time) return;
            const merged = new Date(picked);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(merged);
          },
        });
      },
    });
  };

  const onPress = () => {
    if (Platform.OS === 'android') openAndroid();
    else setShowIOS((s) => !s);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Text variant="labelLarge" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      ) : null}
      <Button
        mode="outlined"
        icon={mode === 'date' ? 'calendar' : 'calendar-clock'}
        onPress={onPress}
        contentStyle={{ justifyContent: 'flex-start', paddingVertical: 4 }}
        style={{ alignSelf: 'stretch' }}
      >
        {text}
      </Button>
      {Platform.OS === 'ios' && showIOS ? (
        <DateTimePicker
          value={value}
          mode={mode === 'date' ? 'date' : 'datetime'}
          display="spinner"
          themeVariant={theme.dark ? 'dark' : 'light'}
          onChange={(event, picked) => {
            if (picked) onChange(picked);
          }}
        />
      ) : null}
    </View>
  );
}
