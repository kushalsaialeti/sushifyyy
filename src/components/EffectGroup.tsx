import { type PropsWithChildren, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon } from '@/components/StudioIcon';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, motion, spacing, typography } from '@/theme/theme';

const enterDetails = FadeIn.duration(motion.modal.duration);

export function EffectGroup({ title, description, summary, open, onToggle, children }: PropsWithChildren<{
  title: string;
  description: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
}>) {
  const { reduceMotion } = useMotionPreference();
  const angle = useSharedValue(open ? 90 : 0);
  useEffect(() => {
    const next = open ? 90 : 0;
    angle.set(reduceMotion ? next : withTiming(next, { duration: motion.toggleKnob.duration }));
  }, [angle, open, reduceMotion]);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));

  return <View style={styles.card}>
    <ButtonSurface accessibilityLabel={[title, description, summary].filter(Boolean).join(', ')}
      accessibilityState={{ expanded: open }} faceStyle={styles.header} onPress={onToggle}>
      <View style={styles.labels}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.summary}>{summary}</Text>
      <Animated.View style={chevronStyle} aria-hidden><StudioIcon name="chevron" color={colors.mutedSilver} /></Animated.View>
    </ButtonSurface>
    {open && <Animated.View entering={reduceMotion ? undefined : enterDetails} style={styles.contents}>{children}</Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.graphite, borderColor: colors.hairline, borderWidth: 1, borderRadius: dims.dock.indicatorRadius, overflow: 'hidden' },
  header: { minHeight: dims.transportSecondary, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  labels: { flex: 1, gap: spacing.xxs },
  title: { color: colors.porcelain, fontSize: typography.size.body, fontFamily: typography.family.semibold },
  description: { color: colors.mutedSilver, fontSize: typography.size.caption, fontFamily: typography.family.regular },
  summary: { color: colors.electricCoral, fontSize: typography.size.label, fontFamily: typography.family.semibold, fontVariant: ['tabular-nums'], flexShrink: 1, maxWidth: '40%' },
  contents: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
});
