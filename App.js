import React, { useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as ExpoSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ConnectionBar from './src/components/ConnectionBar';
import LoadingView from './src/components/LoadingView';
import UpdateNotice from './src/components/UpdateNotice';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConnectionProvider } from './src/context/ConnectionContext';
import { DownloadProvider } from './src/context/DownloadContext';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { TripProvider, useTrip } from './src/context/TripContext';
import { UploadProvider } from './src/context/UploadContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { buildTheme } from './src/theme/theme';

// Mantiene visible el splash nativo hasta que SplashScreen (JS) se monte.
ExpoSplash.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 2000; // duración mínima del splash
const SPLASH_MAX_MS = 8000; // tope por si Firebase no responde

// Tema de React Navigation a partir del tema de Paper.
function buildNavTheme(theme) {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.secondary,
    },
  };
}

function Root() {
  const paperTheme = useTheme();
  const { user, initializing } = useAuth();
  const { loading } = useTrip();

  const [minDone, setMinDone] = useState(false);
  const [maxDone, setMaxDone] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMinDone(true), SPLASH_MS);
    const t2 = setTimeout(() => setMaxDone(true), SPLASH_MAX_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (minDone && ((!initializing && !loading) || maxDone)) setBooted(true);
  }, [minDone, maxDone, initializing, loading]);

  const navTheme = useMemo(() => buildNavTheme(paperTheme), [paperTheme]);

  if (!booted) return <SplashScreen />;
  // Después de iniciar sesión, mientras se cargan los viajes
  if (user && loading) return <LoadingView />;

  return (
    <ConnectionBar>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </ConnectionBar>
  );
}

// Aplica el tema claro/oscuro y, si hay un viaje activo, sus colores.
function ThemedApp() {
  const { isDark } = useThemeMode();
  const { currentTrip } = useTrip();

  const primary = currentTrip && currentTrip.theme ? currentTrip.theme.primary : null;
  const accent = currentTrip && currentTrip.theme ? currentTrip.theme.accent : null;
  const theme = useMemo(
    () => buildTheme(isDark, primary && accent ? { primary, accent } : null),
    [isDark, primary, accent]
  );

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Root />
      <UpdateNotice />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ConnectionProvider>
              <TripProvider>
                <DownloadProvider>
                  <UploadProvider>
                    <ThemedApp />
                  </UploadProvider>
                </DownloadProvider>
              </TripProvider>
            </ConnectionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
