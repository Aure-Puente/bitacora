import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useContacts from '../hooks/useContacts';
import { deleteContact, saveContact } from '../services/contactService';
import { phoneLink } from '../utils/bookings';
import { friendlyError } from '../utils/firebaseErrors';

// Crea o edita (params.contactId) un contacto útil.
export default function AgregarContactoScreen({ navigation, route }) {
  const { currentTrip } = useTrip();
  const { contacts, loading, error } = useContacts(currentTrip && currentTrip.id);
  const contactId = route.params && route.params.contactId;
  const existing = contactId ? contacts.find((c) => c.id === contactId) : null;

  return (
    <ScreenContainer>
      <CollectionState loading={loading} error={error}>
        {contactId && !existing ? (
          <EmptyState icon="phone-off-outline" title="Este contacto ya no existe" />
        ) : (
          <ContactForm navigation={navigation} existing={existing} />
        )}
      </CollectionState>
    </ScreenContainer>
  );
}

function ContactForm({ navigation, existing }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();

  const [name, setName] = useState(existing ? existing.name : '');
  const [phone, setPhone] = useState(existing ? existing.phone : '');
  const [note, setNote] = useState(existing ? existing.note : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Poné un nombre (ej: Hotel Aconcagua).');
      return;
    }
    if (!phoneLink(phone)) {
      setError('El teléfono no es válido. Usá solo números, espacios y el + del principio.');
      return;
    }
    setSaving(true);
    try {
      await saveContact(currentTrip.id, user, { name, phone, note }, existing ? existing.id : undefined);
      navigation.goBack();
    } catch (e) {
      setError(friendlyError(e));
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar contacto', `¿Seguro que querés eliminar a "${existing.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(currentTrip.id, existing.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Ups', friendlyError(e));
          }
        },
      },
    ]);
  };

  return (
    <View>
      <TextInput
        label="Nombre"
        mode="outlined"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Hospital Central"
        maxLength={100}
        style={styles.input}
      />
      <TextInput
        label="Teléfono"
        mode="outlined"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Ej: +54 261 555 1234"
        maxLength={40}
        style={styles.input}
      />
      <TextInput
        label="Nota (opcional)"
        mode="outlined"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        maxLength={500}
        style={styles.input}
      />

      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={onSave} loading={saving} disabled={saving} style={{ marginTop: 8 }}>
        {existing ? 'Guardar cambios' : 'Guardar contacto'}
      </Button>
      {existing ? (
        <Button
          mode="text"
          textColor={theme.colors.error}
          icon="delete-outline"
          onPress={onDelete}
          disabled={saving}
          style={{ marginTop: 8 }}
        >
          Eliminar contacto
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
});
