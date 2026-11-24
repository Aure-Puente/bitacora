import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useTrip } from '../context/TripContext';
import { discardExpense, retryExpense } from '../services/expenseService';
import { failedOf } from '../utils/expenseBackup';
import { friendlyError } from '../utils/firebaseErrors';
import { formatMoney } from '../utils/money';

// Gastos que el servidor rechazó. Quedan guardados en el celular hasta reintentar o descartar.
export default function UnconfirmedExpenses() {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, currency } = useTrip();
  const { backups, online } = useConnection();
  const [busy, setBusy] = useState(false);

  const failed = failedOf(backups, currentTrip.id);
  if (!failed.length) return null;

  const onRetry = async (entry) => {
    setBusy(true);
    try {
      await retryExpense(user.uid, entry);
    } catch (e) {
      Alert.alert('Sigue sin poder guardarse', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const onDiscard = (entry) => {
    Alert.alert('Descartar gasto', `¿Descartar "${entry.payload.description}"? No se puede recuperar.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => discardExpense(user.uid, entry) },
    ]);
  };

  return (
    <View style={styles.wrap}>
      {failed.map((entry) => (
        <Card key={entry.expenseId} style={{ backgroundColor: theme.colors.secondaryContainer }}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: theme.colors.onSecondaryContainer }}>
              No se pudo guardar: {entry.payload.description} · {formatMoney(entry.payload.amount, currency)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
              {entry.error} Quedó guardado en este celular.
            </Text>
            <View style={styles.actions}>
              <Button compact mode="contained" disabled={busy || !online} onPress={() => onRetry(entry)}>
                Reintentar
              </Button>
              <Button compact mode="text" disabled={busy} onPress={() => onDiscard(entry)}>
                Descartar
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
