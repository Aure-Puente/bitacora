import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

export default function LoadingView() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
