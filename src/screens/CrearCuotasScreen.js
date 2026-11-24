import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import MemberChip from '../components/MemberChip';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { createPlan } from '../services/planService';
import { friendlyError } from '../utils/firebaseErrors';
import { formatMoney, parseAmount } from '../utils/money';

// Plan de cuotas: quien pagó (por ej. Valentín los vuelos) y cuánto le devuelve cada uno, en N cuotas.
export default function CrearCuotasScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members, currency } = useTrip();

  const [title, setTitle] = useState('Vuelos');
  const [totalText, setTotalText] = useState('');
  const [installmentsText, setInstallmentsText] = useState('12');
  const [creditorId, setCreditorId] = useState(user.uid);
  const [participantIds, setParticipantIds] = useState(null); // null = todos
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allIds = useMemo(() => members.map((m) => m.uid || m.id), [members]);
  const ids = useMemo(
    () => Array.from(new Set([creditorId, ...(participantIds || allIds)])),
    [creditorId, participantIds, allIds]
  );
  const debtorIds = ids.filter((id) => id !== creditorId);

  const total = parseAmount(totalText);
  const installments = parseInt(installmentsText, 10);
  const validTotal = Number.isFinite(total) && total > 0;
  const validInstallments = Number.isInteger(installments) && installments >= 1 && installments <= 60;
  const share = validTotal && ids.length ? Math.round((total / ids.length) * 100) / 100 : 0;

  const toggleParticipant = (id) => {
    if (id === creditorId) return;
    const set = new Set(ids);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = allIds.filter((m) => set.has(m));
    setParticipantIds(next.length === allIds.length ? null : next);
  };

  const onSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Poné un nombre al plan (ej: Vuelos).');
      return;
    }
    if (!validTotal) {
      setError('Ingresá el total que se pagó.');
      return;
    }
    if (!validInstallments) {
      setError('La cantidad de cuotas debe ser entre 1 y 60.');
      return;
    }
    if (!debtorIds.length) {
      setError('Tiene que haber al menos una persona que devuelva.');
      return;
    }
    setSaving(true);
    try {
      await createPlan(currentTrip.id, {
        title,
        totalAmount: total,
        installments,
        creditorId,
        debtors: debtorIds.map((uid) => ({ uid, owed: share })),
        createdBy: user.uid,
      });
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <TextInput
        label="Nombre del plan"
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Total que se pagó"
        mode="outlined"
        value={totalText}
        onChangeText={setTotalText}
        keyboardType="decimal-pad"
        left={<TextInput.Affix text={currency === 'ARS' ? '$' : currency} />}
        style={styles.input}
      />
      <TextInput
        label="Cantidad de cuotas"
        mode="outlined"
        value={installmentsText}
        onChangeText={setInstallmentsText}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        ¿Quién pagó?
      </Text>
      <View style={styles.wrapRow}>
        {members.map((m) => {
          const id = m.uid || m.id;
          return (
            <MemberChip key={id} member={m} selected={creditorId === id} onPress={() => setCreditorId(id)} />
          );
        })}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        ¿Quiénes participan?
      </Text>
      <View style={styles.wrapRow}>
        {members.map((m) => {
          const id = m.uid || m.id;
          return (
            <MemberChip
              key={id}
              member={m}
              selected={ids.includes(id)}
              disabled={id === creditorId}
              onPress={() => toggleParticipant(id)}
            />
          );
        })}
      </View>
      <HelperText type="info" visible>
        El total se reparte en partes iguales entre los que participan (incluyendo a quien pagó).
      </HelperText>

      {validTotal && validInstallments && debtorIds.length ? (
        <Card style={{ marginTop: 8, backgroundColor: theme.colors.primaryContainer }}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
              Cada uno que devuelve paga {formatMoney(share, currency)} en {installments} cuotas de{' '}
              {formatMoney(share / installments, currency)}.
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 16 }}>
        Crear plan
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
});
