import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import MemberChip from '../components/MemberChip';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useTasks from '../hooks/useTasks';
import { deleteTask, saveTask } from '../services/taskService';
import { friendlyError } from '../utils/firebaseErrors';

// Crea o edita (params.taskId) una tarea previa al viaje.
export default function AgregarTareaScreen({ navigation, route }) {
  const { currentTrip } = useTrip();
  const { tasks, loading, error } = useTasks(currentTrip && currentTrip.id);
  const taskId = route.params && route.params.taskId;
  const existing = taskId ? tasks.find((t) => t.id === taskId) : null;

  return (
    <ScreenContainer>
      <CollectionState loading={loading} error={error}>
        {taskId && !existing ? (
          <EmptyState icon="format-list-checks" title="Esta tarea ya no existe" />
        ) : (
          <TaskForm navigation={navigation} existing={existing} />
        )}
      </CollectionState>
    </ScreenContainer>
  );
}

function TaskForm({ navigation, existing }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members } = useTrip();

  const [title, setTitle] = useState(existing ? existing.title : '');
  const [assigneeId, setAssigneeId] = useState(existing ? existing.assigneeId : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Escribí la tarea (ej: Reservar el auto).');
      return;
    }
    setSaving(true);
    try {
      await saveTask(currentTrip.id, user, { title, assigneeId }, existing ? existing.id : undefined);
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar tarea', `¿Seguro que querés eliminar "${existing.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(currentTrip.id, existing.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  return (
    <View>
      <TextInput
        label="¿Qué hay que hacer?"
        mode="outlined"
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Reservar el auto"
        maxLength={200}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>
        ¿Quién se encarga?
      </Text>
      <View style={styles.wrapRow}>
        <Chip selected={!assigneeId} showSelectedOverlay onPress={() => setAssigneeId(null)}>
          Sin responsable
        </Chip>
        {members.map((m) => {
          const id = m.uid || m.id;
          return (
            <MemberChip key={id} member={m} selected={assigneeId === id} onPress={() => setAssigneeId(id)} />
          );
        })}
      </View>

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 16 }}>
        {existing ? 'Guardar cambios' : 'Guardar tarea'}
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
          Eliminar tarea
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
  label: { marginTop: 4, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
