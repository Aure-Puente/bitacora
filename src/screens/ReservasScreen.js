import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

import SelectorChips from '../components/SelectorChips';
import AlbumScreen from './AlbumScreen';
import ContactosScreen from './ContactosScreen';
import DocumentosScreen from './DocumentosScreen';
import ListaReservasScreen from './ListaReservasScreen';

const SECTIONS = [
  { value: 'reservas', label: 'Reservas', icon: 'ticket-confirmation-outline', Screen: ListaReservasScreen },
  { value: 'documentos', label: 'Documentos', icon: 'file-document-outline', Screen: DocumentosScreen },
  { value: 'contactos', label: 'Contactos', icon: 'phone-outline', Screen: ContactosScreen },
  { value: 'album', label: 'Álbum', icon: 'image-multiple-outline', Screen: AlbumScreen },
];

// Pestaña Reservas.
export default function ReservasScreen({ navigation }) {
  const theme = useTheme();
  const [section, setSection] = useState('reservas');
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
