import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Icon, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActivityCard from '../components/ActivityCard';
import Countdown from '../components/Countdown';
import ExpenseRow from '../components/ExpenseRow';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useActivities from '../hooks/useActivities';
import useTasks from '../hooks/useTasks';
import { serif } from '../theme/fonts';
import { daysBetween, formatDateTimeLong, toDate } from '../utils/dates';
import { formatDayRelative, nextActivity } from '../utils/itinerary';
import { formatCents } from '../utils/money';
import { taskSummary } from '../utils/tasks';

export default function InicioScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentTrip, expenses, totalCents, balances, currency, members } = useTrip();
  const { activities } = useActivities(currentTrip.id);
  const { tasks } = useTasks(currentTrip.id);

  // Para detectar cuándo pasamos de "antes" a "durante" a "después" del viaje
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const departure = toDate(currentTrip.departureAt) || new Date();
  const returnDate = toDate(currentTrip.returnAt) || departure;
  const phase =
    now < departure.getTime() ? 'before' : now <= returnDate.getTime() ? 'during' : 'after';
  const dayNumber = daysBetween(departure, new Date(now)) + 1;
  const totalDays = daysBetween(departure, returnDate) + 1;

  const next = nextActivity(activities, new Date(now));
  const todo = taskSummary(tasks, user.uid);

  const onPrimary = theme.colors.onPrimary;
  const myBalance = balances[user.uid] || 0;
  const balanceColor =
    myBalance > 0 ? theme.colors.success : myBalance < 0 ? theme.colors.error : theme.colors.onSurfaceVariant;
  const balanceLabel = myBalance > 0 ? 'Te deben' : myBalance < 0 ? 'Debés' : 'Estás al día';

  const quickActions = [
    { icon: 'plus-circle-outline', label: 'Agregar gasto', onPress: () => navigation.navigate('AgregarGasto') },
    { icon: 'scale-balance', label: 'Ver saldos', onPress: () => navigation.navigate('Dinero', { seccion: 'saldos' }) },
    { icon: 'airplane', label: 'Cuotas', onPress: () => navigation.navigate('Dinero', { seccion: 'cuotas' }) },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Portada del viaje con la cuenta regresiva */}
      <View style={[styles.hero, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 12 }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tripName, { color: onPrimary }]} numberOfLines={2}>
              {currentTrip.emoji || '🧭'} {currentTrip.name}
            </Text>
            {currentTrip.destination ? (
              <Text style={{ color: onPrimary, opacity: 0.85 }}>{currentTrip.destination}</Text>
            ) : null}
          </View>
          <IconButton
            icon="swap-horizontal"
            iconColor={onPrimary}
            accessibilityLabel="Cambiar de viaje"
            onPress={() => navigation.navigate('Viajes')}
          />
        </View>

        {phase === 'before' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.heroLabel, { color: onPrimary }]}>Faltan para el vuelo</Text>
            <Countdown target={departure} color={onPrimary} />
            <Text style={[styles.heroDate, { color: onPrimary }]}>{formatDateTimeLong(departure)}</Text>
          </View>
        ) : null}

        {phase === 'during' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.heroLabel, { color: onPrimary }]}>¡Estamos de viaje!</Text>
            <Text style={[styles.dayText, { color: onPrimary }]}>
              Día {dayNumber} de {totalDays}
            </Text>
            <Text style={[styles.heroDate, { color: onPrimary }]}>
              Regreso: {formatDateTimeLong(returnDate)}
            </Text>
          </View>
        ) : null}

        {phase === 'after' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.heroLabel, { color: onPrimary }]}>El viaje terminó</Text>
            <Text style={[styles.heroDate, { color: onPrimary }]}>
              Revisá los saldos para dejar las cuentas en cero.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {/* Resumen */}
        <View style={styles.row}>
          <Card style={styles.stat}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Gastado
              </Text>
              <Text variant="titleMedium" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCents(totalCents, currency)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.stat}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {balanceLabel}
              </Text>
              <Text
                variant="titleMedium"
                style={[styles.statValue, { color: balanceColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {myBalance === 0 ? '—' : formatCents(Math.abs(myBalance), currency)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.stat}>
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Viajan
              </Text>
              <Text variant="titleMedium" style={styles.statValue}>
                {members.length}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Accesos rápidos */}
        <View style={[styles.row, { marginTop: 16 }]}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={[styles.action, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <Icon source={a.icon} size={26} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 6 }}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Próxima actividad */}
        {phase !== 'after' ? (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {next ? `Lo próximo · ${formatDayRelative(next.day, new Date(now))}` : 'Lo próximo'}
            </Text>
            {next ? (
              <ActivityCard
                activity={next}
                destination={currentTrip.destination}
                onPress={() => navigation.navigate('AgregarActividad', { activityId: next.id })}
              />
            ) : (
              <Card onPress={() => navigation.navigate('Plan', { seccion: 'itinerario' })}>
                <Card.Content>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    No hay actividades por venir. Tocá para armar el itinerario.
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        ) : null}

        {/* Tareas */}
        {todo.total > 0 && phase !== 'after' ? (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tareas
            </Text>
            <Card onPress={() => navigation.navigate('Plan', { seccion: 'tareas' })}>
              <Card.Content>
                <Text variant="titleMedium">
                  {todo.pending === 0
                    ? '¡Todo listo!'
                    : `${todo.pending} ${todo.pending === 1 ? 'pendiente' : 'pendientes'} de ${todo.total}`}
                </Text>
                {todo.mine > 0 ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    {todo.mine === 1 ? 'Una te toca a vos' : `${todo.mine} te tocan a vos`}
                  </Text>
                ) : null}
                <ProgressBar progress={todo.done / todo.total} style={styles.progress} />
              </Card.Content>
            </Card>
          </>
        ) : null}

        {/* Últimos gastos */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Últimos gastos
        </Text>
        <Card>
          {expenses.length === 0 ? (
            <Card.Content>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Todavía no hay gastos cargados. ¡Cargá el primero!
              </Text>
            </Card.Content>
          ) : (
            expenses.slice(0, 3).map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <Divider /> : null}
                <ExpenseRow
                  expense={e}
                  onPress={() => navigation.navigate('AgregarGasto', { expenseId: e.id })}
                />
              </View>
            ))
          )}
        </Card>
        {expenses.length > 3 ? (
          <Button mode="text" onPress={() => navigation.navigate('Dinero', { seccion: 'gastos' })} style={{ alignSelf: 'flex-end' }}>
            Ver todos
          </Button>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  tripName: { fontFamily: serif, fontWeight: 'bold', fontSize: 30, lineHeight: 36 },
  heroLabel: { fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 },
  heroDate: { marginTop: 12, textAlign: 'center', opacity: 0.9 },
  dayText: { fontFamily: serif, fontWeight: 'bold', fontSize: 40, marginTop: 8 },
  body: { padding: 16 },
  row: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1 },
  statValue: { fontFamily: serif, fontWeight: 'bold', marginTop: 4 },
  action: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  progress: { height: 8, borderRadius: 4, marginTop: 10 },
  sectionTitle: { marginTop: 24, marginBottom: 8, fontFamily: serif, fontWeight: 'bold' },
});
