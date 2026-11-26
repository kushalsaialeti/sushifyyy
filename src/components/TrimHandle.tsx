import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Trim } from '@/services/vocalEditor';
import { colors, dims, radius } from '@/theme/theme';

export type TrimActions = {
  onStart: () => void;
  onPreview: (edge: keyof Trim, seconds: number) => void;
  onCommit: (edge: keyof Trim, seconds: number) => void;
  onCancel: () => void;
};

const hitWidth = dims.touchTarget;
const gripHeight = 32;

export function TrimHandle({ edge, position, min, max, windowStart, windowDuration, width, splitHitArea, actions }: {
  edge: keyof Trim;
  position: number;
  min: number;
  max: number;
  windowStart: number;
  windowDuration: number;
  width: number;
  splitHitArea: boolean;
  actions: TrimActions;
}) {
  const secondsPerPixel = windowDuration / width;
  const visibleMin = Math.max(min, windowStart);
  const visibleMax = Math.min(max, windowStart + windowDuration);
  const inputs = useSharedValue({ position, min: visibleMin, max: visibleMax, secondsPerPixel });
  const gestureInputs = useSharedValue({ position, min: visibleMin, max: visibleMax, secondsPerPixel });
  const dragging = useSharedValue(false);
  const lastPreview = useSharedValue(position);
  const { onStart, onPreview, onCommit, onCancel } = actions;
  const x = Math.max(0, Math.min(width, (position - windowStart) / secondsPerPixel));
  const enabled = visibleMax > visibleMin && position >= windowStart && position <= windowStart + windowDuration;

  useEffect(() => {
    inputs.set({ position, min: visibleMin, max: visibleMax, secondsPerPixel });
  }, [inputs, position, secondsPerPixel, visibleMax, visibleMin]);

  const pan = useMemo(() => {
    function timeAt(translationX: number) {
      'worklet';
      const { position: start, secondsPerPixel: scale, min: lower, max: upper } = gestureInputs.get();
      const translated = start + translationX * scale;
      return Math.max(lower, Math.min(upper, Math.round(translated * 10) / 10));
    }

    return Gesture.Pan().enabled(enabled).maxPointers(1).activeOffsetX([-4, 4]).failOffsetY([-10, 10])
      .onStart(() => {
        gestureInputs.set(inputs.get());
        lastPreview.set(gestureInputs.get().position);
        dragging.set(true);
        scheduleOnRN(onStart);
      })
      .onUpdate(({ translationX }) => {
        const next = timeAt(translationX);
        if (next !== lastPreview.get()) {
          lastPreview.set(next);
          scheduleOnRN(onPreview, edge, next);
        }
      })
      .onEnd(({ translationX }, success) => {
        if (success) scheduleOnRN(onCommit, edge, timeAt(translationX));
      })
      .onFinalize((_event, success) => {
        if (!success && dragging.get()) scheduleOnRN(onCancel);
        dragging.set(false);
      });
  }, [dragging, edge, enabled, gestureInputs, inputs, lastPreview, onCancel, onCommit, onPreview, onStart]);

  return <>
    <View pointerEvents="none" aria-hidden style={[styles.line, { left: x - 2 }]} />
    <View pointerEvents="none" aria-hidden style={[styles.grip, { left: x - 6 }, splitHitArea && (edge === 'start' ? styles.upperGrip : styles.lowerGrip)]} />
    {enabled && <GestureDetector gesture={pan}>
      <View collapsable={false} accessible accessibilityRole="adjustable" accessibilityLabel={edge === 'start' ? 'Trim start' : 'Trim end'}
        accessibilityValue={{ text: `${position.toFixed(1)} seconds` }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) => {
          const change = nativeEvent.actionName === 'increment' ? 0.1 : -0.1;
          onCommit(edge, Math.max(min, Math.min(max, Math.round((position + change) * 10) / 10)));
        }}
        style={[styles.target, { left: Math.max(0, Math.min(width - hitWidth, x - hitWidth / 2)) },
          splitHitArea && (edge === 'start' ? styles.upperTarget : styles.lowerTarget)]} />
    </GestureDetector>}
  </>;
}

const styles = StyleSheet.create({
  line: { position: 'absolute', top: 0, bottom: 0, width: 4, borderRadius: radius.pill, backgroundColor: colors.textOnLight },
  grip: { position: 'absolute', top: '50%', marginTop: -gripHeight / 2, width: 12, height: gripHeight, borderRadius: radius.pill, backgroundColor: colors.textOnLight },
  upperGrip: { top: '25%' },
  lowerGrip: { top: '75%' },
  target: { position: 'absolute', top: 0, bottom: 0, width: hitWidth },
  upperTarget: { bottom: '50%' },
  lowerTarget: { top: '50%' },
});
