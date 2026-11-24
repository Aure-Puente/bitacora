import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import * as ExpoSplash from 'expo-splash-screen';

import { useThemeMode } from '../context/ThemeContext';
import { palettes } from '../theme/colors';
import { serif } from '../theme/fonts';

const LOGO_LIGHT = require('../../assets/splash-icon.png');
const LOGO_DARK = require('../../assets/splash-icon-dark.png');

// Splash de la app (dura 2 segundos, ver App.js). Usa el mismo fondo e ícono que el splash nativo,
// así el pasaje de uno al otro no se nota.
export default function SplashScreen() {
  const { isDark } = useThemeMode();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }).start();
    // Respaldo por si la imagen tarda en cargar: igual ocultamos el splash nativo.
    const t = setTimeout(() => ExpoSplash.hideAsync().catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [opacity]);

  const palette = isDark ? palettes.dark : palettes.light;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Image
        source={isDark ? LOGO_DARK : LOGO_LIGHT}
        style={styles.logo}
        resizeMode="contain"
        onLoad={() => ExpoSplash.hideAsync().catch(() => {})}
      />
      <Animated.View style={[styles.textWrap, { opacity }]}>
        <Text style={[styles.title, { color: palette.primary }]}>Bitácora</Text>
        <Text style={[styles.subtitle, { color: palette.primary }]}>DIARIO DE VIAJE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 200 },
  textWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: 120,
    alignItems: 'center',
  },
  title: { fontFamily: serif, fontWeight: 'bold', fontSize: 34 },
  subtitle: { marginTop: 4, fontSize: 12, letterSpacing: 4, opacity: 0.8 },
});
