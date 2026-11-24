import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, IconButton, Text, useTheme } from 'react-native-paper';

import usePlanPayments from '../hooks/usePlanPayments';
import { addPayment, confirmPayment, deletePlan, removePayment } from '../services/planService';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';
import { formatMoney } from '../utils/money';
import InstallmentBar from './InstallmentBar';
import MemberAvatar from './MemberAvatar';

// Un plan de cuotas: alguien pagó por todos y los demás le devuelven de a poco.
// Flujo: el deudor toca "Pagué una cuota" (queda pendiente) y quien cobró la confirma.
export default function PlanCard({ plan, tripId, currency, membersById, myUid }) {
  const theme = useTheme();
  const payments = usePlanPayments(tripId, plan.id);
  const [busy, setBusy] = useState(false);

  const creditor = membersById[plan.creditorId];
  const creditorName = (creditor && creditor.displayName) || 'quien pagó';
  const iAmCreditor = plan.creditorId === myUid;
  const canDelete = iAmCreditor || plan.createdBy === myUid;
  const debtors = plan.debtors || [];
  const nameOf = (id) => (membersById[id] && membersById[id].displayName) || 'Alguien';

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const stats = debtors.map((d) => {
    const mine = payments.filter((p) => p.debtorId === d.uid);
    const confirmed = mine.filter((p) => p.status === 'confirmed').length;
    const pending = mine.filter((p) => p.status === 'pending');
    const perInstallment = d.owed / plan.installments;
    return {
      debtor: d,
      confirmed,
      pending,
      perInstallment,
      remaining: Math.max(0, d.owed - confirmed * perInstallment),
    };
  });
  const allDone =
    stats.length > 0 && stats.every((s) => s.confirmed >= plan.installments);
  const pendingToConfirm = iAmCreditor
    ? payments.filter((p) => p.status === 'pending')
    : [];

  const onDelete = () => {
    Alert.alert(
      'Eliminar plan',
      `¿Eliminar "${plan.title}" y todas sus cuotas registradas? No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => run(() => deletePlan(tripId, plan.id)) },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>{plan.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pagó {creditorName} · total {formatMoney(plan.totalAmount, currency)} · {plan.installments} cuotas
            </Text>
          </View>
          {canDelete ? (
            <IconButton icon="delete-outline" onPress={onDelete} disabled={busy} accessibilityLabel="Eliminar plan" />
          ) : null}
        </View>

        {allDone ? (
          <Chip icon="party-popper" style={styles.doneChip}>
            ¡Todo devuelto!
          </Chip>
        ) : null}

        {stats.map(({ debtor, confirmed, pending, perInstallment, remaining }) => {
          const isMe = debtor.uid === myUid;
          const completed = confirmed >= plan.installments;
          const canPay = isMe && confirmed + pending.length < plan.installments;
          return (
            <View key={debtor.uid} style={styles.debtor}>
              <Divider style={{ marginBottom: 12 }} />
              <View style={styles.debtorHeader}>
                <MemberAvatar member={membersById[debtor.uid]} size={32} />
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall">
                    {nameOf(debtor.uid)}
                    {isMe ? ' (vos)' : ''}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Debe {formatMoney(debtor.owed, currency)} · {formatMoney(perInstallment, currency)} por cuota
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <InstallmentBar total={plan.installments} confirmed={confirmed} pending={pending.length} />
              </View>
              <Text variant="bodySmall" style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}>
                {confirmed}/{plan.installments} confirmadas
                {pending.length ? ` · ${pending.length} esperando confirmación` : ''}
                {completed ? ' · ¡completo!' : ` · restan ${formatMoney(remaining, currency)}`}
              </Text>

              {isMe ? (
                <View style={styles.actions}>
                  {canPay ? (
                    <Button
                      mode="contained-tonal"
                      icon="plus"
                      disabled={busy}
                      onPress={() => run(() => addPayment(tripId, plan.id, debtor.uid))}
                    >
                      Pagué una cuota
                    </Button>
                  ) : null}
                  {pending.length > 0 ? (
                    <Button
                      mode="text"
                      disabled={busy}
                      onPress={() => run(() => removePayment(tripId, plan.id, pending[pending.length - 1].id))}
                    >
                      Deshacer
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        {pendingToConfirm.length > 0 ? (
          <View style={styles.debtor}>
            <Divider style={{ marginBottom: 12 }} />
            <Text variant="titleSmall" style={{ marginBottom: 8 }}>
              Para confirmar
            </Text>
            {pendingToConfirm.map((p) => {
              const owed = (debtors.find((d) => d.uid === p.debtorId) || {}).owed || 0;
              return (
                <View key={p.id} style={styles.pendingRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{nameOf(p.debtorId)} avisó que pagó una cuota</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatMoney(owed / plan.installments, currency)}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    compact
                    disabled={busy}
                    onPress={() => run(() => confirmPayment(tripId, plan.id, p.id))}
                  >
                    OK
                  </Button>
                  <Button
                    mode="text"
                    compact
                    textColor={theme.colors.error}
                    disabled={busy}
                    onPress={() => run(() => removePayment(tripId, plan.id, p.id))}
                  >
                    Rechazar
                  </Button>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontFamily: serif, fontWeight: 'bold', fontSize: 24 },
  doneChip: { alignSelf: 'flex-start', marginTop: 8 },
  debtor: { marginTop: 14 },
  debtorHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
});
