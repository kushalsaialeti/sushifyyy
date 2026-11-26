import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { creatorText } from '@/components/CreatorScreenElements';
import { SecondaryButton } from '@/components/SecondaryButton';
import type { ExportPhase } from '@/services/Exporter';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, spacing, typography } from '@/theme/theme';

const RingStroke = Animated.createAnimatedComponent(Circle);
const ringSize = 180;
const center = ringSize / 2;
const ringRadius = 80;
const circumference = 2 * Math.PI * ringRadius;
const phaseLabels: Record<ExportPhase, string> = {
  rendering: 'Rendering your mix…', encoding: 'Encoding…', saving: 'Saving to your phone…',
};

export function ExportProgress({ progress, phase, cancellable, detail, onCancel }: {
  progress: number; phase: ExportPhase; cancellable: boolean; detail: string; onCancel: () => void;
}) {
  const { reduceMotion } = useMotionPreference();
  const value = useSharedValue(progress);
  useEffect(() => {
    value.set(reduceMotion ? progress : withTiming(progress, { duration: 120, easing: Easing.linear }));
  }, [progress, reduceMotion, value]);
  const animated = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - value.get() / 100) }));
  const percent = Math.floor(progress);

  return <View style={styles.page}>
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Export progress" accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.ring}>
      <Svg aria-hidden width={ringSize} height={ringSize} style={styles.svg}>
        <Circle cx={center} cy={center} r={ringRadius} fill="none" stroke={colors.graphiteElevated} strokeWidth={8} />
        <RingStroke cx={center} cy={center} r={ringRadius} fill="none" stroke={colors.signalCrimson} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={[circumference, circumference]} animatedProps={animated} />
      </Svg>
      <Text aria-hidden style={styles.percent}>{percent}%</Text>
    </View>
    <View style={styles.summary}>
      <Text accessibilityLiveRegion="polite" style={styles.label}>{phaseLabels[phase]}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
    {cancellable ? <SecondaryButton label="Cancel" onPress={onCancel} /> : <Text style={styles.keepOpen}>Almost done — keep the app open</Text>}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  ring: { width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' },
  svg: { ...StyleSheet.absoluteFill, transform: [{ rotate: '-90deg' }] },
  percent: { ...creatorText.section, fontSize: typography.size.exportPercent, fontVariant: ['tabular-nums'] },
  summary: { gap: 6, alignItems: 'center' },
  label: { ...creatorText.section, textAlign: 'center' },
  detail: { ...creatorText.detail, textAlign: 'center' },
  keepOpen: { ...creatorText.caption, color: colors.textTertiary, textAlign: 'center' },
});
