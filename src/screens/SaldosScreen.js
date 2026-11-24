import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, List, Text, useTheme } from 'react-native-paper';

import EmptyState from '../components/EmptyState';
import MemberAvatar from '../components/MemberAvatar';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { addSettlement, deleteSettlement } from '../services/expenseService';
import { serif } from '../theme/fonts';
import { formatDate } from '../utils/dates';
import { friendlyError } from '../utils/firebaseErrors';
import { formatCents } from '../utils/money';

export default function SaldosScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members, membersById, balances, transfers, settlements, expenses, currency } = useTrip();

  const nameOf = (id) => (membersById[id] && membersById[id].displayName) || 'Alguien';
  const sorted = [...members].sort((a, b) => (balances[b.uid || b.id] || 0) - (balances[a.uid || a.id] || 0));

  const onSettle = (t) => {
    Alert.alert(
      'Registrar pago',
      `¿${nameOf(t.from)} le pagó ${formatCents(t.amount, currency)} a ${nameOf(t.to)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, registrar',
          onPress: async () => {
            try {
              await addSettlement(currentTrip.id, user, { from: t.from, to: t.to, amount: t.amount / 100 });
            } catch (e) {
              Alert.alert('Ups', friendlyError(e));
            }
          },
        },
      ]
    );
  };

  const onUndo = (s) => {
    Alert.alert('Quitar pago', '¿Querés quitar este pago registrado? Los saldos se recalculan.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSettlement(currentTrip.id, s.id);
          } catch (e) {
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  if (expenses.length === 0 && settlements.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="scale-balance"
          title="Todavía no hay nada para saldar"
          subtitle="Cuando se carguen gastos, acá vas a ver quién le debe a quién."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text variant="titleMedium" style={styles.title}>
        Cómo está cada uno
      </Text>
      <Card>
        {sorted.map((m, i) => {
          const id = m.uid || m.id;
          const b = balances[id] || 0;
          const color = b > 0 ? theme.colors.success : b < 0 ? theme.colors.error : theme.colors.onSurfaceVariant;
          return (
            <View key={id}>
              {i > 0 ? <Divider /> : null}
              <List.Item
                title={m.displayName + (id === user.uid ? ' (vos)' : '')}
                description={b > 0 ? 'Le deben' : b < 0 ? 'Debe' : 'Está al día'}
                left={() => (
                  <View style={{ justifyContent: 'center', marginLeft: 12 }}>
                    <MemberAvatar member={m} size={36} />
                  </View>
                )}
                right={() => (
                  <Text variant="titleMedium" style={{ color, alignSelf: 'center' }}>
                    {b === 0 ? '—' : formatCents(Math.abs(b), currency)}
                  </Text>
                )}
              />
            </View>
          );
        })}
      </Card>

      <Text variant="titleMedium" style={styles.title}>
        Para dejar todo en cero
      </Text>
      {transfers.length === 0 ? (
        <Card>
          <Card.Content>
            <Text>Están todos a mano 🎉</Text>
          </Card.Content>
        </Card>
      ) : (
        transfers.map((t) => (
          <Card key={`${t.from}-${t.to}`} style={{ marginBottom: 10 }}>
            <Card.Content>
              <View style={styles.people}>
                <MemberAvatar member={membersById[t.from]} size={28} />
                <Text variant="titleMedium">{nameOf(t.from)} →</Text>
                <MemberAvatar member={membersById[t.to]} size={28} />
                <Text variant="titleMedium">{nameOf(t.to)}</Text>
              </View>
              <Text style={[styles.amount, { color: theme.colors.primary }]}>
                {formatCents(t.amount, currency)}
              </Text>
              <Button mode="contained-tonal" icon="check" onPress={() => onSettle(t)} style={{ alignSelf: 'flex-start' }}>
                Marcar como pagado
              </Button>
            </Card.Content>
          </Card>
        ))
      )}

      {settlements.length > 0 ? (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Pagos registrados
          </Text>
          <Card>
            {settlements.map((s, i) => (
              <View key={s.id}>
                {i > 0 ? <Divider /> : null}
                <List.Item
                  title={`${nameOf(s.from)} le pagó a ${nameOf(s.to)}`}
                  description={formatDate(s.date)}
                  left={() => (
                    <View style={{ justifyContent: 'center', marginLeft: 12 }}>
                      <MemberAvatar member={membersById[s.from]} size={32} />
                    </View>
                  )}
                  right={() => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text variant="titleSmall">{formatCents(Math.round(s.amount * 100), currency)}</Text>
                      <IconButton icon="close" size={18} onPress={() => onUndo(s)} accessibilityLabel="Quitar pago" />
                    </View>
                  )}
                />
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20, marginBottom: 8, fontFamily: serif, fontWeight: 'bold' },
  people: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  amount: { fontFamily: serif, fontWeight: 'bold', fontSize: 28, marginVertical: 6 },
});
