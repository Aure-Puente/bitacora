import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

import SelectorChips from '../components/SelectorChips';
import EquipajeScreen from './EquipajeScreen';
import ItinerarioScreen from './ItinerarioScreen';
import TareasScreen from './TareasScreen';
import VotacionesScreen from './VotacionesScreen';

const SECTIONS = [
  { value: 'itinerario', label: 'Itinerario', icon: 'map-marker-path', Screen: ItinerarioScreen },
  { value: 'votaciones', label: 'Votaciones', icon: 'vote-outline', Screen: VotacionesScreen },
  { value: 'equipaje', label: 'Equipaje', icon: 'bag-suitcase-outline', Screen: EquipajeScreen },
  { value: 'tareas', label: 'Tareas', icon: 'format-list-checks', Screen: TareasScreen },
];

// Pestaña Plan. Con params.seccion se abre directo en una sección.
export default function PlanScreen({ navigation, route }) {
  const theme = useTheme();
  const requested = route.params && route.params.seccion;
  const [section, setSection] = useState(requested || 'itinerario');

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
