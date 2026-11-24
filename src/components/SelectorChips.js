import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

import MemberAvatar from './MemberAvatar';

// Fila deslizable para elegir una sección, un día o una lista.
// items: [{ value, label, icon?, member? }]  (member muestra la foto de la persona)
export default function SelectorChips({ items, value, onChange, style }) {
  const theme = useTheme();
  const scrollRef = useRef(null);
  const positions = useRef({});

  // Deja a la vista el elegido (por ejemplo, el día de hoy en un viaje largo).
  const reveal = (animated) => {
    const x = positions.current[value];
    if (x !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, x - 32), animated });
    }
  };
  useEffect(() => {
    reveal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View style={style}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => reveal(false)}
      >
        {items.map((item) => {
          const selected = item.value === value;
          const color = selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              onLayout={(e) => {
                positions.current[item.value] = e.nativeEvent.layout.x;
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                },
              ]}
            >
              {item.member ? <MemberAvatar member={item.member} size={24} /> : null}
              {item.icon ? <Icon source={item.icon} size={18} color={color} /> : null}
              <Text variant="labelLarge" style={{ color }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
});
