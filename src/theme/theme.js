import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { mix, readableOn } from '../utils/color';
import { palettes } from './colors';

// Tema de Paper (claro u oscuro). Si hay un viaje activo, su primary/accent pisan los de la marca.
export function buildTheme(isDark, tripTheme) {
  const base = isDark ? MD3DarkTheme : MD3LightTheme;
  const p = isDark ? palettes.dark : palettes.light;

  // En oscuro, el primary del viaje se aclara para que tenga contraste sobre el fondo.
  const primary = tripTheme && tripTheme.primary
    ? isDark
      ? mix(tripTheme.primary, '#FFFFFF', 0.45)
      : tripTheme.primary
    : p.primary;
  const secondary = tripTheme && tripTheme.accent ? tripTheme.accent : p.secondary;

  const containerTarget = isDark ? p.background : '#FFFFFF';
  const primaryContainer = mix(primary, containerTarget, isDark ? 0.72 : 0.86);
  const secondaryContainer = mix(secondary, containerTarget, isDark ? 0.72 : 0.78);

  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary,
      onPrimary: readableOn(primary),
      primaryContainer,
      onPrimaryContainer: isDark ? '#FFFFFF' : mix(primary, '#000000', 0.45),
      secondary,
      onSecondary: readableOn(secondary),
      secondaryContainer,
      onSecondaryContainer: isDark ? '#FFFFFF' : mix(secondary, '#000000', 0.6),
      tertiary: secondary,
      onTertiary: readableOn(secondary),
      tertiaryContainer: secondaryContainer,
      onTertiaryContainer: isDark ? '#FFFFFF' : mix(secondary, '#000000', 0.6),
      background: p.background,
      onBackground: p.onSurface,
      surface: p.surface,
      onSurface: p.onSurface,
      surfaceVariant: p.surfaceVariant,
      onSurfaceVariant: p.onSurfaceVariant,
      outline: p.outline,
      outlineVariant: p.outlineVariant,
      error: p.error,
      onError: '#FFFFFF',
      success: p.success,
      elevation: isDark
        ? {
            level0: 'transparent',
            level1: '#1A2227',
            level2: '#1F2830',
            level3: '#242F38',
            level4: '#27333C',
            level5: '#2B3842',
          }
        : {
            level0: 'transparent',
            level1: '#FFFFFF',
            level2: '#FFFFFF',
            level3: '#FFFFFF',
            level4: '#FFFFFF',
            level5: '#FFFFFF',
          },
    },
  };
}
