import React from 'react';
import { Chip } from 'react-native-paper';

import MemberAvatar from './MemberAvatar';

// Chip para elegir a una persona, con su foto.
export default function MemberChip({ member, ...props }) {
  return (
    <Chip avatar={<MemberAvatar member={member} size={24} />} showSelectedOverlay {...props}>
      {member.displayName}
    </Chip>
  );
}
