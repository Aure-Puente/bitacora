import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import AgregarActividadScreen from '../screens/AgregarActividadScreen';
import AgregarContactoScreen from '../screens/AgregarContactoScreen';
import AgregarGastoScreen from '../screens/AgregarGastoScreen';
import AgregarReservaScreen from '../screens/AgregarReservaScreen';
import AgregarTareaScreen from '../screens/AgregarTareaScreen';
import CrearCuotasScreen from '../screens/CrearCuotasScreen';
import CrearViajeScreen from '../screens/CrearViajeScreen';
import CrearVotacionScreen from '../screens/CrearVotacionScreen';
import LoginScreen from '../screens/LoginScreen';
import PerfilScreen from '../screens/PerfilScreen';
import RegistroScreen from '../screens/RegistroScreen';
import SubirArchivoScreen from '../screens/SubirArchivoScreen';
import UnirseViajeScreen from '../screens/UnirseViajeScreen';
import VerArchivoScreen from '../screens/VerArchivoScreen';
import ViajesScreen from '../screens/ViajesScreen';
import { serif } from '../theme/fonts';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();

  const screenOptions = {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.onSurface,
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: serif, fontWeight: 'bold' },
    contentStyle: { backgroundColor: theme.colors.background },
  };

  // Sin sesión: login / registro
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
      </Stack.Navigator>
    );
  }

  // Con sesión: si ya hay un viaje elegido arranca en las tabs, si no en la lista de viajes
  return (
    <Stack.Navigator initialRouteName={currentTrip ? 'Main' : 'Viajes'} screenOptions={screenOptions}>
      <Stack.Screen name="Viajes" component={ViajesScreen} options={{ title: 'Mis viajes' }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="CrearViaje"
        component={CrearViajeScreen}
        options={({ route }) => ({ title: route.params && route.params.editing ? 'Editar viaje' : 'Nuevo viaje' })}
      />
      <Stack.Screen name="UnirseViaje" component={UnirseViajeScreen} options={{ title: 'Unirme a un viaje' }} />
      <Stack.Screen
        name="AgregarGasto"
        component={AgregarGastoScreen}
        options={({ route }) => ({
          title: route.params && route.params.expenseId ? 'Editar gasto' : 'Nuevo gasto',
        })}
      />
      <Stack.Screen name="CrearCuotas" component={CrearCuotasScreen} options={{ title: 'Nuevo plan de cuotas' }} />
      <Stack.Screen
        name="AgregarActividad"
        component={AgregarActividadScreen}
        options={({ route }) => ({
          title: route.params && route.params.activityId ? 'Editar actividad' : 'Nueva actividad',
        })}
      />
      <Stack.Screen name="CrearVotacion" component={CrearVotacionScreen} options={{ title: 'Nueva votación' }} />
      <Stack.Screen
        name="AgregarTarea"
        component={AgregarTareaScreen}
        options={({ route }) => ({
          title: route.params && route.params.taskId ? 'Editar tarea' : 'Nueva tarea',
        })}
      />
      <Stack.Screen
        name="AgregarReserva"
        component={AgregarReservaScreen}
        options={({ route }) => ({
          title: route.params && route.params.bookingId ? 'Editar reserva' : 'Nueva reserva',
        })}
      />
      <Stack.Screen
        name="AgregarContacto"
        component={AgregarContactoScreen}
        options={({ route }) => ({
          title: route.params && route.params.contactId ? 'Editar contacto' : 'Nuevo contacto',
        })}
      />
      <Stack.Screen
        name="SubirArchivo"
        component={SubirArchivoScreen}
        options={({ route }) => ({
          title: route.params && route.params.fileId ? 'Editar archivo' : 'Subir documento',
        })}
      />
      <Stack.Screen name="VerArchivo" component={VerArchivoScreen} options={{ title: '' }} />
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi perfil' }} />
    </Stack.Navigator>
  );
}
