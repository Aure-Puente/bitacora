import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Icon source={icon} size={56} color={theme.colors.outline} />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel ? (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { marginTop: 16, textAlign: 'center' },
  subtitle: { marginTop: 6, textAlign: 'center' },
  button: { marginTop: 20 },
});
