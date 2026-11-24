// Paleta base de Bitácora. Cada viaje puede sobrescribir primary y accent (ver tripThemes.js).
export const brand = {
  primary: '#14586B', // azul petróleo
  accent: '#E8A33D', // ámbar
  paper: '#FAF6EE', // crema
  ink: '#1F2933',
};

export const palettes = {
  light: {
    primary: brand.primary,
    secondary: brand.accent,
    background: brand.paper,
    surface: '#FFFFFF',
    surfaceVariant: '#EFE9DC',
    onSurface: brand.ink,
    onSurfaceVariant: '#52606D',
    outline: '#B9B2A3',
    outlineVariant: '#E3DCCB',
    error: '#C8463C',
    success: '#2E9E6B',
  },
  dark: {
    primary: '#6FB7CC',
    secondary: '#F0B35A',
    background: '#12181C', // azul noche
    surface: '#1A2227',
    surfaceVariant: '#26323A',
    onSurface: '#E8EEF1',
    onSurfaceVariant: '#A9B6BE',
    outline: '#5C6B75',
    outlineVariant: '#2F3C45',
    error: '#E57368',
    success: '#4CC38A',
  },
};

// Texto sobre los colores de los avatares.
export const onMemberColor = '#FFFFFF';

// Colores para los avatares de cada integrante (texto blanco encima).
export const memberColors = [
  '#14586B',
  '#C8553D',
  '#6B1E3A',
  '#2E9E6B',
  '#5B4B8A',
  '#E07A3F',
  '#2F5D8A',
  '#8A6D1F',
];
