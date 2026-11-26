import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, motion, radius } from '@/theme/theme';

const { width, height, knob } = dims.toggle;
const gap = (height - knob) / 2;

export function ToggleSwitch({ label, value, disabled, onChange }: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const { reduceMotion } = useMotionPreference();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    const next = value ? 1 : 0;
    progress.set(reduceMotion ? next : withTiming(next, {
      duration: motion.toggleKnob.duration,
      easing: Easing.bezier(0.3, 1.3, 0.5, 1),
    }));
  }, [progress, reduceMotion, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.ashSilver, colors.signalCrimson]),
  }));
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (width - height) * progress.get() }] }));

  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }}
    disabled={disabled} onPress={() => onChange(!value)} style={styles.target}>
    <View style={disabled && styles.disabled} aria-hidden>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  target: { width, minHeight: dims.touchTarget, justifyContent: 'center' },
  track: { width, height, borderRadius: radius.pill, padding: gap },
  knob: { width: knob, height: knob, borderRadius: radius.pill, backgroundColor: colors.porcelain, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' },
  disabled: { opacity: 0.45 },
});
