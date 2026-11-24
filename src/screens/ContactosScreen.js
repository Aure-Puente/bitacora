import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, FAB, IconButton, List, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import { useTrip } from '../context/TripContext';
import useContacts from '../hooks/useContacts';
import { phoneLink } from '../utils/bookings';

// Contactos útiles: tocar uno llama; el lápiz lo edita.
export default function ContactosScreen({ navigation }) {
  const theme = useTheme();
  const { currentTrip } = useTrip();
  const { contacts, loading, error } = useContacts(currentTrip.id);

  const onCall = (contact) => {
    const link = phoneLink(contact.phone);
    const fail = () => Alert.alert('Ups', `No pudimos llamar al ${contact.phone}.`);
    if (link) Linking.openURL(link).catch(fail);
    else fail();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollectionState loading={loading} error={error}>
          {contacts.length === 0 ? (
            <EmptyState
              icon="phone-plus-outline"
              title="Todavía no hay contactos"
              subtitle="Guardá el teléfono del alojamiento, las emergencias y el hospital más cercano."
              actionLabel="Agregar contacto"
              onAction={() => navigation.navigate('AgregarContacto')}
            />
          ) : (
            <Card>
              {contacts.map((c, i) => (
                <View key={c.id}>
                  {i > 0 ? <Divider /> : null}
                  <List.Item
                    title={c.name}
                    description={c.note ? `${c.phone}\n${c.note}` : c.phone}
                    descriptionNumberOfLines={4}
                    accessibilityLabel={`Llamar a ${c.name}`}
                    onPress={() => onCall(c)}
                    left={(props) => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
                    right={() => (
                      <IconButton
                        icon="pencil-outline"
                        onPress={() => navigation.navigate('AgregarContacto', { contactId: c.id })}
                        accessibilityLabel={`Editar ${c.name}`}
                      />
                    )}
                  />
                </View>
              ))}
            </Card>
          )}
        </CollectionState>
      </ScrollView>
      {contacts.length > 0 ? (
        <FAB
          icon="plus"
          label="Contacto"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('AgregarContacto')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
