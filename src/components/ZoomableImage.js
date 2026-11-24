import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;

// Imagen con zoom: pellizcar, arrastrar cuando está ampliada y doble toque.
export default function ZoomableImage({ uri }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // No deja que la imagen se escape de la pantalla.
  const limit = (value, length, s) => {
    'worklet';

    const max = (length * (s - 1)) / 2;
    return Math.min(max, Math.max(-max, value));
  };
  const settle = () => {
    'worklet';

    if (scale.value <= 1) {
      scale.value = withTiming(1);
      x.value = withTiming(0);
      y.value = withTiming(0);
      return;
    }
    x.value = withTiming(limit(x.value, size.width, scale.value));
    y.value = withTiming(limit(y.value, size.height, scale.value));
  };

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';

      startScale.value = scale.value;
    },
    onUpdate: (e) => {
      'worklet';

      scale.value = Math.min(MAX_SCALE, Math.max(0.8, startScale.value * e.scale));
    },
    onDeactivate: () => {
      'worklet';

      settle();
    },
  });

  const pan = usePanGesture({
    maxPointers: 2,
    onActivate: () => {
      'worklet';

      startX.value = x.value;
      startY.value = y.value;
    },
    onUpdate: (e) => {
      'worklet';

      if (scale.value <= 1) return;
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
    },
    onDeactivate: () => {
      'worklet';

      settle();
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onDeactivate: (e) => {
      'worklet';

      if (e.canceled) return;
      if (scale.value > 1) {
        scale.value = withTiming(1);
        x.value = withTiming(0);
        y.value = withTiming(0);
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
      }
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.container}
        collapsable={false}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ width, height });
        }}
      >
        <Animated.Image source={{ uri }} resizeMode="contain" style={[styles.image, animatedStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
