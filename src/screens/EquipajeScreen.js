import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  List,
  ProgressBar,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import SelectorChips from '../components/SelectorChips';
import { PACKING_TEMPLATES } from '../constants/packingTemplates';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useChecklist from '../hooks/useChecklist';
import { addChecklistItems, deleteChecklistItem, setChecklistItemDone } from '../services/checklistService';
import { itemsOfList, missingFromTemplate, progressOf } from '../utils/checklist';
import { friendlyError } from '../utils/firebaseErrors';

const SHARED = 'shared';
const showError = (e) => Alert.alert('Ups', friendlyError(e));

// Equipaje: lista compartida (la editan todos) y una personal por integrante
// (el grupo la ve, pero solo la edita su dueño).
export default function EquipajeScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members, membersById } = useTrip();
  const tripId = currentTrip.id;
  const { items, loading, error } = useChecklist(tripId);

  const [listId, setListId] = useState(user.uid);
  const [text, setText] = useState('');
  const [snack, setSnack] = useState('');

  const idOf = (m) => m.uid || m.id;
  const nameOf = (uid) => (membersById[uid] && membersById[uid].displayName) || 'alguien';

  const list = useMemo(() => itemsOfList(items, listId), [items, listId]);
  const { done, total, ratio } = progressOf(list);
  const canEdit = listId === SHARED || listId === user.uid;

  const selectorItems = [
    { value: SHARED, label: 'Compartida', icon: 'account-group-outline' },
    { value: user.uid, label: 'La mía', member: membersById[user.uid] },
    ...members
      .filter((m) => idOf(m) !== user.uid)
      .map((m) => ({ value: idOf(m), label: m.displayName || 'Viajero', member: m })),
  ];

  const onAdd = () => {
    if (!text.trim()) return;
    addChecklistItems(tripId, user, listId, [text]).catch(showError);
    setText('');
  };

  const onTemplate = (template) => {
    const missing = missingFromTemplate(template.items, list);
    if (!missing.length) {
      setSnack(`Ya tenés todo lo de ${template.label}`);
      return;
    }
    addChecklistItems(tripId, user, listId, missing).catch(showError);
    setSnack(`${template.label}: ${missing.length === 1 ? 'se agregó 1 cosa' : `se agregaron ${missing.length} cosas`}`);
  };

  const onDelete = (item) => {
    Alert.alert('Quitar de la lista', `¿Quitar "${item.text}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => deleteChecklistItem(tripId, item.id).catch(showError),
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <SelectorChips items={selectorItems} value={listId} onChange={setListId} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <CollectionState loading={loading} error={error}>
          <View style={styles.progressRow}>
            <Text variant="titleMedium">
              {done}/{total}
            </Text>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={ratio} style={styles.bar} />
            </View>
          </View>
          {!canEdit ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Es la lista de {nameOf(listId)}: podés verla, pero no cambiarla.
            </Text>
          ) : null}
          {listId === user.uid ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              El grupo puede ver tu lista, pero solo vos podés cambiarla.
            </Text>
          ) : null}

          {canEdit ? (
            <>
              <TextInput
                label="Agregar a la lista"
                mode="outlined"
                value={text}
                onChangeText={setText}
                onSubmitEditing={onAdd}
                submitBehavior="submit"
                returnKeyType="done"
                maxLength={100}
                right={<TextInput.Icon icon="plus" onPress={onAdd} accessibilityLabel="Agregar" />}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templates}
                keyboardShouldPersistTaps="handled"
              >
                {PACKING_TEMPLATES.map((t) => (
                  <Chip key={t.id} icon={t.icon} onPress={() => onTemplate(t)}>
                    {t.label}
                  </Chip>
                ))}
              </ScrollView>
            </>
          ) : null}

          {list.length === 0 ? (
            <EmptyState
              icon="bag-suitcase-outline"
              title="La lista está vacía"
              subtitle={
                canEdit
                  ? 'Agregá cosas a mano o tocá una plantilla para arrancar.'
                  : 'Todavía no cargó nada.'
              }
            />
          ) : (
            <Card>
              {list.map((item, i) => (
                <View key={item.id}>
                  {i > 0 ? <Divider /> : null}
                  <List.Item
                    title={item.text}
                    titleNumberOfLines={2}
                    titleStyle={
                      item.done
                        ? { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }
                        : null
                    }
                    description={
                      item.scope === SHARED && item.done && item.doneBy
                        ? item.doneBy === user.uid
                          ? 'Lo tildaste vos'
                          : `Lo tildó ${nameOf(item.doneBy)}`
                        : undefined
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!item.done, disabled: !canEdit }}
                    onPress={
                      canEdit
                        ? () => setChecklistItemDone(tripId, item.id, !item.done, user.uid).catch(showError)
                        : undefined
                    }
                    left={() => (
                      <View style={styles.checkbox}>
                        <Checkbox.Android status={item.done ? 'checked' : 'unchecked'} disabled={!canEdit} />
                      </View>
                    )}
                    right={
                      canEdit
                        ? () => (
                            <IconButton
                              icon="close"
                              size={18}
                              onPress={() => onDelete(item)}
                              accessibilityLabel={`Quitar ${item.text}`}
                            />
                          )
                        : undefined
                    }
                  />
                </View>
              ))}
            </Card>
          )}
        </CollectionState>
      </ScrollView>
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2200}>
        {snack}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 8 },
  bar: { height: 10, borderRadius: 5 },
  templates: { gap: 8, paddingVertical: 12 },
  checkbox: { justifyContent: 'center', marginLeft: 8 },
});
