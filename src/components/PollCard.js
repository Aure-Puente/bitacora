import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Icon, IconButton, Text, useTheme } from 'react-native-paper';

import { closePoll, deletePoll, votePoll } from '../services/pollService';
import { serif } from '../theme/fonts';
import { friendlyError } from '../utils/firebaseErrors';
import { tallyPoll } from '../utils/polls';
import MemberAvatar from './MemberAvatar';
import OptionsDialog from './OptionsDialog';

const showError = (e) => Alert.alert('Ups', friendlyError(e));

// Una votación: cada integrante vota una opción (puede cambiarla) y quien la creó la cierra.
export default function PollCard({ poll, tripId, myUid, membersById, memberCount, inItinerary, onConvert }) {
  const theme = useTheme();
  const [choosing, setChoosing] = useState(false);

  const { options, total, winners } = tallyPoll(poll);
  const closed = poll.status === 'closed';
  const mine = poll.createdBy === myUid;
  const myVote = (poll.votes || {})[myUid];
  const nameOf = (uid) => (membersById[uid] && membersById[uid].displayName) || 'Alguien';

  const onVote = (optionId) => {
    if (optionId !== myVote) votePoll(tripId, poll.id, myUid, optionId).catch(showError);
  };

  const onClose = () => {
    Alert.alert('Cerrar votación', 'Nadie más va a poder votar ni cambiar su voto. No se puede reabrir.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar votación', onPress: () => closePoll(tripId, poll.id).catch(showError) },
    ]);
  };

  const onDelete = () => {
    Alert.alert('Eliminar votación', `¿Eliminar "${poll.question}" con todos sus votos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deletePoll(tripId, poll.id).catch(showError) },
    ]);
  };

  const convert = () => {
    if (winners.length === 1) onConvert(winners[0]);
    else setChoosing(true);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.question, { color: theme.colors.primary }]}>{poll.question}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {closed ? 'Cerrada' : 'Abierta'} · {total}/{memberCount} votaron · la creó {nameOf(poll.createdBy)}
            </Text>
          </View>
          {mine ? (
            <IconButton icon="delete-outline" onPress={onDelete} accessibilityLabel="Eliminar votación" />
          ) : null}
        </View>

        {options.map((o) => {
          const chosen = o.id === myVote;
          const won = closed && winners.some((w) => w.id === o.id);
          return (
            <Pressable
              key={o.id}
              onPress={() => onVote(o.id)}
              disabled={closed}
              accessibilityRole="radio"
              accessibilityState={{ selected: chosen, disabled: closed }}
              accessibilityLabel={`${o.text}, ${o.voters.length} ${o.voters.length === 1 ? 'voto' : 'votos'}`}
              style={[
                styles.option,
                { borderColor: chosen || won ? theme.colors.primary : theme.colors.outlineVariant },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: won ? theme.colors.secondaryContainer : theme.colors.primaryContainer,
                    width: `${total ? Math.round((o.voters.length / total) * 100) : 0}%`,
                  },
                ]}
              />
              <View style={styles.optionRow}>
                <Icon
                  source={won ? 'trophy-outline' : chosen ? 'radiobox-marked' : 'radiobox-blank'}
                  size={20}
                  color={chosen || won ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text variant="bodyLarge" style={{ flex: 1 }}>
                  {o.text}
                </Text>
                <Text variant="titleSmall">{o.voters.length}</Text>
              </View>
              {o.voters.length ? (
                <View style={styles.voters}>
                  {o.voters.map((uid) => (
                    <MemberAvatar key={uid} member={membersById[uid]} size={22} />
                  ))}
                  <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
                    {o.voters.map((uid) => (uid === myUid ? 'Vos' : nameOf(uid))).join(', ')}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {!closed ? (
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            {myVote ? 'Podés cambiar tu voto hasta que se cierre.' : 'Tocá una opción para votar.'}
          </Text>
        ) : winners.length > 1 ? (
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            Hubo empate.
          </Text>
        ) : null}

        <View style={styles.actions}>
          {!closed && mine ? (
            <Button mode="contained-tonal" icon="lock-outline" onPress={onClose}>
              Cerrar votación
            </Button>
          ) : null}
          {closed && inItinerary ? <Chip icon="check">Ya está en el plan</Chip> : null}
          {closed && !inItinerary && winners.length ? (
            <Button mode="contained" icon="calendar-plus" onPress={convert}>
              Llevar al itinerario
            </Button>
          ) : null}
        </View>
      </Card.Content>

      <OptionsDialog
        visible={choosing}
        title="Hubo empate: ¿cuál va?"
        options={winners.map((w) => ({ value: w.id, label: w.text }))}
        onSelect={(id) => {
          setChoosing(false);
          onConvert(winners.find((w) => w.id === id));
        }}
        onDismiss={() => setChoosing(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  question: { fontFamily: serif, fontWeight: 'bold', fontSize: 20, marginBottom: 2 },
  option: { borderWidth: 1, borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  voters: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingBottom: 10 },
  hint: { marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
