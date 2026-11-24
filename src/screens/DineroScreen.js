import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

import SelectorChips from '../components/SelectorChips';
import CuotasScreen from './CuotasScreen';
import GastosScreen from './GastosScreen';
import SaldosScreen from './SaldosScreen';

const SECTIONS = [
  { value: 'gastos', label: 'Gastos', icon: 'wallet-outline', Screen: GastosScreen },
  { value: 'saldos', label: 'Saldos', icon: 'scale-balance', Screen: SaldosScreen },
  { value: 'cuotas', label: 'Cuotas', icon: 'airplane', Screen: CuotasScreen },
];

// Pestaña Dinero. Con params.seccion se abre directo en una sección.
export default function DineroScreen({ navigation, route }) {
  const theme = useTheme();
  const requested = route.params && route.params.seccion;
  const [section, setSection] = useState(requested || 'gastos');

  useEffect(() => {
    if (requested) setSection(requested);
  }, [route.params, requested]);

  const { Screen } = SECTIONS.find((s) => s.value === section) || SECTIONS[0];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SelectorChips items={SECTIONS} value={section} onChange={setSection} />
      <View style={{ flex: 1 }}>
        <Screen navigation={navigation} />
      </View>
    </View>
  );
}
