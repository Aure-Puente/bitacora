import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';

import EmptyState from '../components/EmptyState';
import PlanCard from '../components/PlanCard';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import usePlans from '../hooks/usePlans';

export default function CuotasScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip, membersById, currency } = useTrip();
  const { plans, loading } = usePlans(currentTrip.id);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 48 }} />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="airplane"
            title="Sin planes de cuotas"
            subtitle="Si alguien pagó algo por todos (por ejemplo los vuelos), creá un plan y vayan marcando cada cuota que devuelven."
            actionLabel="Crear plan"
            onAction={() => navigation.navigate('CrearCuotas')}
          />
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              tripId={currentTrip.id}
              currency={currency}
              membersById={membersById}
              myUid={user.uid}
            />
          ))
        )}
      </ScrollView>
      {plans.length > 0 ? (
        <FAB
          icon="plus"
          label="Plan"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('CrearCuotas')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
