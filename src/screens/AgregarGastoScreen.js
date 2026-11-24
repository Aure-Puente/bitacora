import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';

import DateTimeField from '../components/DateTimeField';
import MemberChip from '../components/MemberChip';
import ScreenContainer from '../components/ScreenContainer';
import SourceDialog from '../components/SourceDialog';
import StorageImage from '../components/StorageImage';
import { CATEGORIES } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useTrip } from '../context/TripContext';
import useFiles from '../hooks/useFiles';
import { deleteExpense, saveExpense } from '../services/expenseService';
import { deleteFile, uploadFile } from '../services/fileService';
import { toDate } from '../utils/dates';
import { friendlyError } from '../utils/firebaseErrors';
import { formatCents, parseAmount } from '../utils/money';
import { toCents } from '../utils/settle';

// Crea un gasto o, si recibe params.expenseId, lo edita.
export default function AgregarGastoScreen({ navigation, route }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members, expenses, currency } = useTrip();

  const expenseId = route.params && route.params.expenseId;
  const existing = useMemo(
    () => expenses.find((e) => e.id === expenseId) || null,
    [expenses, expenseId]
  );
  const allIds = useMemo(() => members.map((m) => m.uid || m.id), [members]);

  const [description, setDescription] = useState(existing ? existing.description : '');
  const [amountText, setAmountText] = useState(existing ? String(existing.amount).replace('.', ',') : '');
  const [paidBy, setPaidBy] = useState(existing ? existing.paidBy : user.uid);
  // null = "todos los integrantes" (se adapta si alguien se suma después)
  const [splitIds, setSplitIds] = useState(existing ? existing.splitBetween : null);
  const [category, setCategory] = useState(existing ? existing.category : 'comida');
  const [date, setDate] = useState(existing ? toDate(existing.date) || new Date() : new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Ticket: el guardado (receiptId) o uno recién elegido, que se sube al guardar el gasto.
  const { files } = useFiles(currentTrip.id, user.uid);
  const [receiptId, setReceiptId] = useState((existing && existing.receiptId) || null);
  const [newReceipt, setNewReceipt] = useState(null);
  const [choosingReceipt, setChoosingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadedRef = useRef(null); // si el gasto falla después de subirlo, no lo sube dos veces
  const receipt = files.find((f) => f.id === receiptId);
  const { online } = useConnection();

  const effectiveSplit = splitIds || allIds;
  const amount = parseAmount(amountText);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const perPerson =
    validAmount && effectiveSplit.length ? Math.round(toCents(amount) / effectiveSplit.length) : 0;

  const toggleSplit = (id) => {
    const set = new Set(effectiveSplit);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = allIds.filter((m) => set.has(m));
    setSplitIds(next.length === allIds.length ? null : next);
  };

  const onSave = async () => {
    setError('');
    if (!description.trim()) {
      setError('Escribí una descripción (ej: Cena).');
      return;
    }
    if (!validAmount) {
      setError('Ingresá un monto mayor a cero.');
      return;
    }
    if (!effectiveSplit.length) {
      setError('Elegí entre quiénes se divide el gasto.');
      return;
    }
    setSaving(true);
    try {
      let finalReceiptId = receiptId;
      if (newReceipt && (online || uploadedRef.current)) {
        if (!uploadedRef.current) {
          uploadedRef.current = await uploadFile(
            currentTrip.id,
            user,
            newReceipt,
            { kind: 'ticket', visibility: 'group', name: `Ticket: ${description.trim()}` },
            setUploadProgress
          );
        }
        finalReceiptId = uploadedRef.current;
      }
      await saveExpense(
        currentTrip.id,
        user,
        { description, amount, paidBy, splitBetween: effectiveSplit, category, date, receiptId: finalReceiptId },
        existing ? existing.id : undefined
      );
      // Si se cambió o quitó un ticket mío, se borra el anterior (el de otra persona queda en Documentos).
      const oldId = existing && existing.receiptId;
      const old = oldId && oldId !== finalReceiptId && files.find((f) => f.id === oldId);
      if (old && old.ownerId === user.uid) deleteFile(currentTrip.id, old).catch(() => {});
      if (newReceipt && finalReceiptId === receiptId) {
        Alert.alert('Gasto guardado', 'Sin conexión no se puede subir el ticket. Agregalo después, editando el gasto.');
      }
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const onReceiptPicked = ([file]) => {
    uploadedRef.current = null;
    setNewReceipt(file);
  };

  const onReceiptRemove = () => {
    uploadedRef.current = null;
    setNewReceipt(null);
    setReceiptId(null);
  };

  const onDelete = () => {
    Alert.alert('Eliminar gasto', '¿Seguro que querés eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(currentTrip.id, existing.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <TextInput
        label="¿Qué se pagó?"
        mode="outlined"
        value={description}
        onChangeText={setDescription}
        placeholder="Ej: Cena en el centro"
        style={styles.input}
      />
      <TextInput
        label="Monto"
        mode="outlined"
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        left={<TextInput.Affix text={currency === 'ARS' ? '$' : currency} />}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        ¿Quién pagó?
      </Text>
      <View style={styles.wrapRow}>
        {members.map((m) => {
          const id = m.uid || m.id;
          return (
            <MemberChip key={id} member={m} selected={paidBy === id} onPress={() => setPaidBy(id)} />
          );
        })}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        ¿Entre quiénes se divide?
      </Text>
      <View style={styles.wrapRow}>
        <Chip selected={splitIds === null} showSelectedOverlay icon="account-group" onPress={() => setSplitIds(null)}>
          Todos
        </Chip>
        {members.map((m) => {
          const id = m.uid || m.id;
          return (
            <MemberChip
              key={id}
              member={m}
              selected={effectiveSplit.includes(id)}
              onPress={() => toggleSplit(id)}
            />
          );
        })}
      </View>
      {validAmount && effectiveSplit.length ? (
        <HelperText type="info" visible>
          Aprox. {formatCents(perPerson, currency)} por persona ({effectiveSplit.length}{' '}
          {effectiveSplit.length === 1 ? 'persona' : 'personas'}).
        </HelperText>
      ) : null}

      <Text variant="labelLarge" style={styles.label}>
        Categoría
      </Text>
      <View style={styles.wrapRow}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            icon={c.icon}
            selected={category === c.id}
            showSelectedOverlay
            onPress={() => setCategory(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        <DateTimeField label="Fecha" mode="date" value={date} onChange={setDate} />
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Ticket (opcional)
      </Text>
      {newReceipt || receipt ? (
        <View style={styles.receiptRow}>
          {newReceipt ? (
            <Image source={{ uri: newReceipt.uri }} style={styles.receipt} />
          ) : (
            <Pressable
              onPress={() => navigation.navigate('VerArchivo', { fileId: receipt.id })}
              accessibilityRole="imagebutton"
              accessibilityLabel="Ver ticket"
            >
              <StorageImage path={receipt.thumbPath} style={styles.receipt} />
            </Pressable>
          )}
          <View style={{ alignItems: 'flex-start' }}>
            <Button mode="text" icon="camera-outline" disabled={saving} onPress={() => setChoosingReceipt(true)}>
              Cambiar
            </Button>
            <Button mode="text" icon="close" disabled={saving} onPress={onReceiptRemove}>
              Quitar
            </Button>
          </View>
        </View>
      ) : (
        <Button
          mode="outlined"
          icon="camera-outline"
          disabled={saving}
          onPress={() => setChoosingReceipt(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          Adjuntar foto del ticket
        </Button>
      )}
      <SourceDialog
        visible={choosingReceipt}
        onPicked={onReceiptPicked}
        onDismiss={() => setChoosingReceipt(false)}
      />
      {saving && newReceipt ? <ProgressBar progress={uploadProgress} style={styles.progress} /> : null}

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
        {existing ? 'Guardar cambios' : 'Guardar gasto'}
      </Button>
      {existing ? (
        <Button
          mode="text"
          textColor={theme.colors.error}
          icon="delete-outline"
          onPress={onDelete}
          disabled={saving}
          style={{ marginTop: 8 }}
        >
          Eliminar gasto
        </Button>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  receipt: { width: 96, height: 96, borderRadius: 12 },
  progress: { height: 8, borderRadius: 4, marginTop: 12 },
  input: { marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
});
