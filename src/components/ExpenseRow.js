import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, List, Text, useTheme } from 'react-native-paper';

import { categoryById } from '../constants/categories';
import { useTrip } from '../context/TripContext';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import MemberAvatar from './MemberAvatar';

export default function ExpenseRow({ expense, onPress }) {
  const theme = useTheme();
  const { membersById, currency } = useTrip();
  const category = categoryById(expense.category);
  const payer = membersById[expense.paidBy];

  return (
    <List.Item
      title={expense.description}
      description={`Pagó ${payer ? payer.displayName : 'alguien'} · ${formatDate(expense.date)}`}
      left={(props) => <List.Icon {...props} icon={category.icon} />}
      right={() => (
        <View style={styles.right}>
          {expense.pending ? (
            <Icon source="cloud-upload-outline" size={16} color={theme.colors.onSurfaceVariant} />
          ) : null}
          {expense.receiptId ? (
            <Icon source="paperclip" size={16} color={theme.colors.onSurfaceVariant} />
          ) : null}
          <Text variant="titleMedium">{formatMoney(expense.amount, currency)}</Text>
          <MemberAvatar member={payer} size={24} />
        </View>
      )}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
