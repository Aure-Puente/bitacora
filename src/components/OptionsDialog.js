import React from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, List, Portal, useTheme } from 'react-native-paper';

// Diálogo para elegir una opción. options: [{ value, label, icon? }]
export default function OptionsDialog({ visible, title, options, selected, onSelect, onDismiss }) {
  const theme = useTheme();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 360, paddingHorizontal: 0 }}>
          <ScrollView>
            {options.map((o) => (
              <List.Item
                key={o.value}
                title={o.label}
                titleNumberOfLines={2}
                left={o.icon ? (props) => <List.Icon {...props} icon={o.icon} /> : undefined}
                right={
                  o.value === selected
                    ? (props) => <List.Icon {...props} icon="check" color={theme.colors.primary} />
                    : undefined
                }
                onPress={() => onSelect(o.value)}
              />
            ))}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
