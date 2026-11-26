import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, dims, radius, spacing, typography } from '@/theme/theme';

const steps = [
  { id: 'record', label: 'Record' },
  { id: 'enhance', label: 'Enhance' },
  { id: 'karaoke', label: 'Karaoke' },
  { id: 'video', label: 'Video' },
  { id: 'export', label: 'Export' },
] as const;

export type StudioStep = (typeof steps)[number]['id'];

export function StepRail({ current, reached, onStep, locked }: {
  current: StudioStep;
  reached: StudioStep;
  onStep: (step: StudioStep) => void;
  locked?: boolean;
}) {
  const reachedIndex = steps.findIndex((step) => step.id === reached);

  return <View role="tablist" accessibilityLabel="Studio steps" style={styles.rail}>
    {steps.map((step, index) => {
      const selected = step.id === current;
      const reachedStep = index <= reachedIndex;
      const disabled = locked || selected || !reachedStep;
      const barColor = selected ? colors.signalCrimson : reachedStep ? colors.mutedSilver : colors.hairlineStrong;
      const textColor = selected ? colors.porcelain : reachedStep ? colors.mutedSilver : colors.textTertiary;

      return <Pressable key={step.id} accessibilityRole="tab" accessibilityLabel={step.label}
        accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => onStep(step.id)} style={styles.step}>
        <View aria-hidden style={[styles.bar, { backgroundColor: barColor }]} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: textColor }]}>{step.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  rail: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, minWidth: dims.touchTarget, minHeight: dims.touchTarget, paddingTop: 6, alignItems: 'stretch', gap: 6 },
  bar: { height: 3, borderRadius: radius.pill },
  label: { fontSize: typography.size.nav, textAlign: 'center', fontFamily: typography.family.medium, marginBottom: spacing.xs },
});
