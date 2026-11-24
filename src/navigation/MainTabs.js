import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import LoadingView from '../components/LoadingView';
import { useTrip } from '../context/TripContext';
import AjustesScreen from '../screens/AjustesScreen';
import DineroScreen from '../screens/DineroScreen';
import InicioScreen from '../screens/InicioScreen';
import PlanScreen from '../screens/PlanScreen';
import ReservasScreen from '../screens/ReservasScreen';
import { serif } from '../theme/fonts';

const Tab = createBottomTabNavigator();

// [ícono activo, ícono inactivo]
const ICONS = {
  Inicio: ['home-variant', 'home-variant-outline'],
  Plan: ['map', 'map-outline'],
  Dinero: ['wallet', 'wallet-outline'],
  Reservas: ['ticket-confirmation', 'ticket-confirmation-outline'],
  Ajustes: ['cog', 'cog-outline'],
};

export default function MainTabs({ navigation }) {
  const theme = useTheme();
  const { currentTrip, currentTripId } = useTrip();

  // Si el viaje abierto dejó de existir (o ya no soy parte), vuelve a la lista de viajes.
  useEffect(() => {
    if (!currentTripId) navigation.reset({ index: 0, routes: [{ name: 'Viajes' }] });
  }, [currentTripId, navigation]);

  // Si el viaje todavía está llegando (por ejemplo, recién me uní), muestra un loader.
  if (!currentTrip) return <LoadingView />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontFamily: serif, fontWeight: 'bold' },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name][focused ? 0 : 1]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Dinero" component={DineroScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} />
    </Tab.Navigator>
  );
}
