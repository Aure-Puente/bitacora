import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Avatar } from 'react-native-paper';

import { brand, onMemberColor } from '../theme/colors';
import { initials } from '../utils/code';

// Foto de perfil o, si no tiene (o no carga), las iniciales sobre su color.
export default function MemberAvatar({ member, size = 40, style }) {
  const photoURL = member && member.photoURL;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoURL]);

  const background = { backgroundColor: (member && member.color) || brand.primary };

  if (photoURL && !failed) {
    return (
      <Image
        source={{ uri: photoURL }}
        onError={() => setFailed(true)}
        style={[background, style, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <Avatar.Text
      size={size}
      label={initials(member && member.displayName)}
      color={onMemberColor}
      style={[background, style]}
    />
  );
}
