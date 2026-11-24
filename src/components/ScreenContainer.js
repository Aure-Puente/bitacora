import React, { useContext } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { HeaderHeightContext } from '@react-navigation/elements';
import { useTheme } from 'react-native-paper';

// Contenedor base: fondo del tema + padding. scroll=false para pantallas con FlatList propio.
export default function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  refreshControl,
}) {
  const theme = useTheme();
  const headerHeight = useContext(HeaderHeightContext) || 0;
  const background = { flex: 1, backgroundColor: theme.colors.background };

  if (!scroll) {
    return <View style={[background, style]}>{children}</View>;
  }
  // Android dibuja de borde a borde: la ventana ya no se achica con el teclado, hay que esquivarlo acá.
  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight} style={[background, style]}>
      <ScrollView
        contentContainerStyle={[{ padding: 16, paddingBottom: 96 }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
