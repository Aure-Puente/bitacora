import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Checkbox, Divider, FAB, List, Text, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import MemberAvatar from '../components/MemberAvatar';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useTasks from '../hooks/useTasks';
import { setTaskDone } from '../services/taskService';
import { friendlyError } from '../utils/firebaseErrors';
import { taskSummary } from '../utils/tasks';

export default function TareasScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, membersById } = useTrip();
  const { tasks, loading, error } = useTasks(currentTrip.id);
  const { done, total } = taskSummary(tasks, user.uid);

  const assigneeLabel = (uid) => {
    if (!uid) return 'Sin responsable';
    if (uid === user.uid) return 'Te toca a vos';
    return (membersById[uid] && membersById[uid].displayName) || 'Alguien';
  };

  const onToggle = (task) =>
    setTaskDone(currentTrip.id, task.id, !task.done, user.uid).catch((e) => Alert.alert('Ups', friendlyError(e)));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollectionState loading={loading} error={error}>
          {tasks.length === 0 ? (
            <EmptyState
              icon="format-list-checks"
              title="Todavía no hay tareas"
              subtitle="Repartan lo que hay que resolver antes de salir: reservar el auto, sacar las entradas, comprar el seguro."
              actionLabel="Agregar tarea"
              onAction={() => navigation.navigate('AgregarTarea')}
            />
          ) : (
            <>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                {done} de {total} {total === 1 ? 'tarea hecha' : 'tareas hechas'}
              </Text>
              <Card>
                {tasks.map((task, i) => (
                  <View key={task.id}>
                    {i > 0 ? <Divider /> : null}
                    <List.Item
                      title={task.title}
                      titleNumberOfLines={3}
                      titleStyle={
                        task.done
                          ? { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }
                          : null
                      }
                      description={assigneeLabel(task.assigneeId)}
                      onPress={() => navigation.navigate('AgregarTarea', { taskId: task.id })}
                      left={() => (
                        <View style={styles.checkbox}>
                          <Checkbox.Android
                            status={task.done ? 'checked' : 'unchecked'}
                            onPress={() => onToggle(task)}
                            accessibilityLabel={task.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                          />
                        </View>
                      )}
                      right={
                        task.assigneeId
                          ? () => (
                              <View style={styles.avatar}>
                                <MemberAvatar member={membersById[task.assigneeId]} size={32} />
                              </View>
                            )
                          : undefined
                      }
                    />
                  </View>
                ))}
              </Card>
            </>
          )}
        </CollectionState>
      </ScrollView>
      {tasks.length > 0 ? (
        <FAB
          icon="plus"
          label="Tarea"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('AgregarTarea')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  checkbox: { justifyContent: 'center', marginLeft: 8 },
  avatar: { justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
