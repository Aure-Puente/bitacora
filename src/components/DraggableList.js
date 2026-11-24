import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { dragTargetIndex, moveItem } from '../utils/reorder';

// Lista corta que se reordena arrastrando la manija. No usa librerías: PanResponder + Animated.
// La pantalla que la contiene tiene que frenar su scroll mientras onDragChange sea true.
//
// items: [{ id, ... }]
// renderItem(item, handle): `handle` es la manija, para ubicarla dentro de la tarjeta
// onReorder(items): recibe la lista en el orden nuevo
export default function DraggableList({ items, renderItem, onReorder, onDragChange, gap = 10 }) {
  // Orden provisorio desde que se suelta hasta que Firestore devuelve la lista (evita un salto).
  const [override, setOverride] = useState(null);
  const [drag, setDrag] = useState(null); // { id, target }
  const dragY = useRef(new Animated.Value(0)).current;
  const heights = useRef({});

  useEffect(() => {
    setOverride(null);
  }, [items]);

  const list = useMemo(() => {
    if (!override) return items;
    const byId = new Map(items.map((i) => [i.id, i]));
    const sorted = override.map((id) => byId.get(id)).filter(Boolean);
    return sorted.length === items.length ? sorted : items;
  }, [items, override]);

  const from = drag ? list.findIndex((i) => i.id === drag.id) : -1;

  const commit = (fromIndex, toIndex) => {
    if (fromIndex < 0 || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return;
    const next = moveItem(list, fromIndex, toIndex);
    setOverride(next.map((i) => i.id));
    onReorder(next);
  };

  const targetFor = (id, dy) => {
    const index = list.findIndex((i) => i.id === id);
    const sizes = list.map((i) => heights.current[i.id] || 0);
    return { index, target: dragTargetIndex(sizes, index, dy, gap) };
  };

  const onStart = (id) => {
    dragY.setValue(0);
    setDrag({ id, target: list.findIndex((i) => i.id === id) });
    if (onDragChange) onDragChange(true);
  };
  const onMove = (id, dy) => {
    dragY.setValue(dy);
    const { target } = targetFor(id, dy);
    setDrag((d) => (d && d.target !== target ? { id, target } : d));
  };
  const onEnd = (id, dy, cancelled) => {
    const { index, target } = targetFor(id, dy);
    setDrag(null);
    dragY.setValue(0);
    if (onDragChange) onDragChange(false);
    if (!cancelled) commit(index, target);
  };

  // Si la lista desaparece en pleno arrastre, la pantalla tiene que recuperar el scroll.
  const dragChangeRef = useRef(onDragChange);
  dragChangeRef.current = onDragChange;
  useEffect(
    () => () => {
      if (dragChangeRef.current) dragChangeRef.current(false);
    },
    []
  );

  const shiftOf = (index) => {
    if (from < 0 || index === from) return 0;
    const size = (heights.current[drag.id] || 0) + gap;
    if (from < index && index <= drag.target) return -size;
    if (drag.target <= index && index < from) return size;
    return 0;
  };

  return (
    <View>
      {list.map((item, index) => (
        <DraggableRow
          key={item.id}
          id={item.id}
          gap={gap}
          dragging={from >= 0}
          active={index === from}
          shift={shiftOf(index)}
          dragY={dragY}
          onHeight={(h) => {
            heights.current[item.id] = h;
          }}
          onStart={onStart}
          onMove={onMove}
          onEnd={onEnd}
          onStep={(step) => commit(index, index + step)}
          render={(handle) => renderItem(item, handle)}
        />
      ))}
    </View>
  );
}

function DraggableRow({ id, gap, dragging, active, shift, dragY, onHeight, onStart, onMove, onEnd, onStep, render }) {
  const theme = useTheme();
  const shiftY = useRef(new Animated.Value(0)).current;

  // El PanResponder se crea una sola vez: siempre llama a la última versión de las funciones.
  const latest = useRef({});
  latest.current = { onStart, onMove, onEnd };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => latest.current.onStart(id),
      onPanResponderMove: (e, g) => latest.current.onMove(id, g.dy),
      onPanResponderRelease: (e, g) => latest.current.onEnd(id, g.dy, false),
      onPanResponderTerminate: (e, g) => latest.current.onEnd(id, g.dy, true),
    })
  ).current;

  useEffect(() => {
    if (!dragging) {
      shiftY.setValue(0);
      return undefined;
    }
    const animation = Animated.timing(shiftY, { toValue: shift, duration: 140, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [dragging, shift, shiftY]);

  const handle = (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Reordenar"
      accessibilityHint="Arrastrá hacia arriba o hacia abajo"
      accessibilityActions={[
        { name: 'increment', label: 'Bajar' },
        { name: 'decrement', label: 'Subir' },
      ]}
      onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ padding: 12, justifyContent: 'center' }}
    >
      <Icon source="drag-horizontal-variant" size={24} color={theme.colors.onSurfaceVariant} />
    </View>
  );

  return (
    <Animated.View
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
      style={[
        { marginBottom: gap },
        dragging ? { transform: [{ translateY: active ? dragY : shiftY }] } : null,
        active ? { zIndex: 10, elevation: 6, opacity: 0.95 } : null,
      ]}
    >
      {render(handle)}
    </Animated.View>
  );
}
