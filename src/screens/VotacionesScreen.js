import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import PollCard from '../components/PollCard';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useActivities from '../hooks/useActivities';
import usePolls from '../hooks/usePolls';

export default function VotacionesScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, members, membersById } = useTrip();
  const { polls, loading, error } = usePolls(currentTrip.id);
  const { activities } = useActivities(currentTrip.id);

  const onAdd = () => navigation.navigate('CrearVotacion');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollectionState loading={loading} error={error}>
          {polls.length === 0 ? (
            <EmptyState
              icon="vote-outline"
              title="Todavía no hay votaciones"
              subtitle="¿Qué bodega visitamos? ¿Dónde cenamos? Armá una pregunta y que vote el grupo."
              actionLabel="Crear votación"
              onAction={onAdd}
            />
          ) : (
            polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                tripId={currentTrip.id}
                myUid={user.uid}
                membersById={membersById}
                memberCount={members.length}
                inItinerary={activities.some((a) => a.pollId === poll.id)}
                onConvert={(option) =>
                  navigation.navigate('AgregarActividad', { title: option.text, pollId: poll.id })
                }
              />
            ))
          )}
        </CollectionState>
      </ScrollView>
      {polls.length > 0 ? (
        <FAB
          icon="plus"
          label="Votación"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={onAdd}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
