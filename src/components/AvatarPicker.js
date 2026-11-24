import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, useTheme } from 'react-native-paper';

import { pickAvatar } from '../services/imageService';
import { friendlyError } from '../utils/firebaseErrors';
import MemberAvatar from './MemberAvatar';
import OptionsDialog from './OptionsDialog';

// Foto de perfil que se puede tocar para cambiarla. onChange recibe la ruta local nueva o null (quitar).
export default function AvatarPicker({ member, size = 112, busy = false, onChange }) {
  const theme = useTheme();
  const [choosing, setChoosing] = useState(false);

  const onSelect = async (option) => {
    setChoosing(false);
    if (option === 'quitar') {
      onChange(null);
      return;
    }
    try {
      const [picked] = await pickAvatar(option);
      if (picked) onChange(picked.uri);
    } catch (e) {
      Alert.alert('Ups', friendlyError(e));
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setChoosing(true)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={member.photoURL ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
        style={{ width: size, height: size, alignSelf: 'center' }}
      >
        <MemberAvatar member={member} size={size} />
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
          ]}
        >
          {busy ? (
            <ActivityIndicator size={18} color={theme.colors.onPrimary} />
          ) : (
            <Icon source="camera" size={18} color={theme.colors.onPrimary} />
          )}
        </View>
      </Pressable>
      <OptionsDialog
        visible={choosing}
        title="Foto de perfil"
        options={[
          { value: 'camara', label: 'Sacar una foto', icon: 'camera-outline' },
          { value: 'galeria', label: 'Elegir de la galería', icon: 'image-outline' },
          ...(member.photoURL ? [{ value: 'quitar', label: 'Quitar la foto', icon: 'delete-outline' }] : []),
        ]}
        onSelect={onSelect}
        onDismiss={() => setChoosing(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
