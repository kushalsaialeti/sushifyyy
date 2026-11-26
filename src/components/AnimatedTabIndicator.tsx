import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, dims, gradients, motion } from '@/theme/theme';

const { indicatorHeight, indicatorRadius, indicatorWidth, rowTop } = dims.dock;
const { damping, stiffness, mass } = motion.tabIndicator;
const { duration, opacity, scaleX } = motion.tabIndicatorCross;
const centerSlot = 2;

type AnimatedTabIndicatorProps = {
  slot: number | null;
  slotWidth: number;
  visible: boolean;
  reduceMotion: boolean;
};

export function AnimatedTabIndicator({ slot, slotWidth, visible, reduceMotion }: AnimatedTabIndicatorProps) {
  const lastSlot = useRef(slot ?? 0);
  const position = useSharedValue(slot ?? 0);
  const contraction = useSharedValue(0);

  useEffect(() => {
    if (slot === null) {
      position.value = lastSlot.current;
      contraction.value = 0;
      return;
    }

    const crossedCenter = (lastSlot.current < centerSlot) !== (slot < centerSlot);
    lastSlot.current = slot;

    if (reduceMotion || !visible) {
      position.value = slot;
      contraction.value = 0;
      return;
    }

    position.value = withSpring(slot, { damping, stiffness, mass });
    if (crossedCenter) {
      contraction.value = withSequence(
        withTiming(1, { duration: duration / 2 }),
        withTiming(0, { duration: duration / 2 }),
      );
    } else {
      contraction.value = withTiming(0, { duration: duration / 2 });
    }
  }, [contraction, position, reduceMotion, slot, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    // Keep the capsule narrow at the notch even when a quick tap interrupts the spring.
    const nearCenter = Math.max(0, 1 - Math.max(0, Math.abs(position.value - centerSlot) - 0.25) / 0.5);
    const crossing = Math.max(contraction.value, nearCenter);
    return {
      opacity: visible ? 1 - crossing * (1 - opacity) : 0,
      transform: [
        { translateX: (position.value + 0.5) * slotWidth - indicatorWidth / 2 },
        { scaleX: 1 - crossing * (1 - scaleX) },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" aria-hidden style={[styles.capsule, animatedStyle]}>
      <Svg width={indicatorWidth} height={indicatorHeight}>
        <Defs>
          <LinearGradient id="dockGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset={0} stopColor={gradients.porcelainGloss[0]} />
            <Stop offset={0.48} stopColor={gradients.porcelainGloss[1]} />
            <Stop offset={1} stopColor={gradients.porcelainGloss[2]} />
          </LinearGradient>
        </Defs>
        <Rect width={indicatorWidth} height={indicatorHeight} rx={indicatorRadius} fill="url(#dockGloss)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    top: rowTop,
    left: 0,
    zIndex: 1,
    width: indicatorWidth,
    height: indicatorHeight,
    borderRadius: indicatorRadius,
    backgroundColor: colors.porcelain,
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  },
});
