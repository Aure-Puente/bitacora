import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Divider, FAB, Text, useTheme } from 'react-native-paper';

import EmptyState from '../components/EmptyState';
import ExpenseRow from '../components/ExpenseRow';
import UnconfirmedExpenses from '../components/UnconfirmedExpenses';
import { useTrip } from '../context/TripContext';
import { serif } from '../theme/fonts';
import { formatCents } from '../utils/money';

export default function GastosScreen({ navigation }) {
  const theme = useTheme();
  const { expenses, totalCents, currency } = useTrip();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={
          <>
            <UnconfirmedExpenses />
            <Card style={styles.summary}>
              <Card.Content>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Total del viaje
                </Text>
                <Text style={[styles.total, { color: theme.colors.primary }]}>
                  {formatCents(totalCents, currency)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} cargados
                </Text>
              </Card.Content>
            </Card>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-text-outline"
            title="Todavía no hay gastos"
            subtitle="Cargá lo que va pagando cada uno y la app calcula quién le debe a quién."
            actionLabel="Agregar el primero"
            onAction={() => navigation.navigate('AgregarGasto')}
          />
        }
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            onPress={() => navigation.navigate('AgregarGasto', { expenseId: item.id })}
          />
        )}
      />
      <FAB
        icon="plus"
        label="Gasto"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('AgregarGasto')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { margin: 16 },
  total: { fontFamily: serif, fontWeight: 'bold', fontSize: 34, marginVertical: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
