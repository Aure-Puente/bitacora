import { Platform } from 'react-native';

// Serif del sistema para títulos y números grandes (da el aire de "diario de viaje").
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
