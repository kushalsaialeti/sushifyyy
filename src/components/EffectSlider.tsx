import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GlossFill } from '@/components/GlossFill';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, motion, radius, shadows, spacing, typography } from '@/theme/theme';

const { knob, trackHeight, hitHeight } = dims.slider;
const halfKnob = knob / 2;
const touchHeight = Math.max(hitHeight, dims.touchTarget);
const adjustableActions = [{ name: 'increment' }, { name: 'decrement' }];

export function snapSliderValue(value: number, min: number, max: number, step: number) {
  'worklet';
  if (value <= min) return min;
  if (value >= max) return max;
  if (step <= 0) return value;
  const snapped = min + Math.round((value - min) / step) * step;
  return Math.min(max, Number(snapped.toFixed(10)));
}

export function EffectSlider({ label, hint, min, max, step, value, format = String, onChange, onPreview, disabled }: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  onPreview?: (value: number | null) => void;
  disabled?: boolean;
}) {
  const { reduceMotion } = useMotionPreference();
  const [preview, setPreview] = useState<number | null>(null);
  const selected = snapSliderValue(value, min, max, step);
  const selectedOnUI = useSharedValue(selected);
  const position = useSharedValue(selected);
  const width = useSharedValue(0);
  const dragging = useSharedValue(false);

  useEffect(() => {
    selectedOnUI.set(selected);
    position.set(selected);
  }, [position, selected, selectedOnUI]);

  function commit(next: number) {
    if (next !== selected) onChange(next);
    previewValue(null);
  }

  function previewValue(next: number | null) {
    setPreview(next);
    onPreview?.(next);
  }

  function updateAt(x: number) {
    'worklet';
    const trackWidth = width.get() - knob;
    if (trackWidth <= 0) return position.get();
    const fraction = Math.max(0, Math.min(1, (x - halfKnob) / trackWidth));
    const next = snapSliderValue(min + fraction * (max - min), min, max, step);
    if (next !== position.get()) {
      position.set(next);
      scheduleOnRN(previewValue, next);
    }
    return next;
  }

  const enabled = !disabled && max > min;
  const pan = Gesture.Pan().enabled(enabled).maxPointers(1).activeOffsetX([-4, 4]).failOffsetY([-8, 8])
    .onStart((event) => {
      dragging.set(true);
      updateAt(event.x);
    })
    .onUpdate((event) => { updateAt(event.x); })
    .onEnd((event, success) => {
      if (success) scheduleOnRN(commit, updateAt(event.x));
    })
    .onFinalize((_event, success) => {
      if (dragging.get() && !success) {
        position.set(selectedOnUI.get());
        scheduleOnRN(previewValue, null);
      }
      dragging.set(false);
    });
  const tap = Gesture.Tap().enabled(enabled).maxDistance(8).onEnd((event, success) => {
    if (success) scheduleOnRN(commit, updateAt(event.x));
  });

  const range = max - min || 1;
  const fillStyle = useAnimatedStyle(() => ({ width: Math.max(0, width.get() - knob) * ((position.get() - min) / range) }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(0, width.get() - knob) * ((position.get() - min) / range) }],
  }));
  const readoutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : withTiming(dragging.get() ? 1.04 : 1, { duration: motion.buttonPress.duration }) }],
  }));

  return <View>
    <View style={styles.labelRow} aria-hidden>
      <Text style={styles.label}>{label}</Text>
      <Animated.Text style={[styles.readout, readoutStyle]}>{format(preview ?? selected)}</Animated.Text>
    </View>
    {hint && <Text style={styles.hint} aria-hidden>{hint}</Text>}
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityHint={hint}
        accessibilityState={{ disabled: !enabled }} accessibilityValue={{ text: format(preview ?? selected) }}
        accessibilityActions={enabled ? adjustableActions : undefined}
        onAccessibilityAction={({ nativeEvent }) => {
          if (!enabled) return;
          const increment = step > 0 ? step : range / 10;
          if (nativeEvent.actionName === 'increment') commit(snapSliderValue(selected + increment, min, max, step));
          if (nativeEvent.actionName === 'decrement') commit(snapSliderValue(selected - increment, min, max, step));
        }}
        onLayout={({ nativeEvent }) => width.set(nativeEvent.layout.width)} style={styles.target}>
        <View pointerEvents="none" style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]}><GlossFill variant="slider" /></Animated.View>
        </View>
        <Animated.View pointerEvents="none" style={[styles.knob, !enabled && styles.disabledKnob, knobStyle]} />
      </View>
    </GestureDetector>
  </View>;
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
  label: { flexShrink: 1, color: colors.porcelain, fontSize: typography.size.label, fontFamily: typography.family.medium },
  readout: { color: colors.porcelain, fontSize: typography.size.label, fontFamily: typography.family.semibold,
    fontVariant: ['tabular-nums'], transformOrigin: 'right center' },
  hint: { marginTop: spacing.xxs, fontSize: typography.size.caption, color: colors.mutedSilver, fontFamily: typography.family.regular },
  target: { height: touchHeight, justifyContent: 'center' },
  track: { marginHorizontal: halfKnob, height: trackHeight, borderRadius: radius.pill, backgroundColor: colors.ashSilver, overflow: 'hidden' },
  fill: { height: trackHeight, borderRadius: radius.pill, backgroundColor: colors.signalCrimson, overflow: 'hidden' },
  knob: { position: 'absolute', left: 0, top: (touchHeight - knob) / 2, width: knob, height: knob, borderRadius: radius.pill, backgroundColor: colors.porcelain,
    boxShadow: `0 ${shadows.knob.offsetY}px ${shadows.knob.radius}px rgba(0,0,0,${shadows.knob.opacity})` },
  disabledKnob: { backgroundColor: colors.mutedSilver },
});
