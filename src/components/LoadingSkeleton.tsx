import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, type SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

function SkeletonBlock({ progress, style }: { progress: SharedValue<number>; style: StyleProp<ViewStyle> }) {
  const { reduceMotion } = useMotionPreference();
  const shimmerStyle = useAnimatedStyle(() => ({ left: `${progress.get()}%` as const }));

  return <View style={[styles.block, style]}>
    {!reduceMotion && <Animated.View style={[styles.shimmer, shimmerStyle]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="skeletonShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset={0} stopColor={colors.graphite} stopOpacity={0} />
            <Stop offset={0.5} stopColor={colors.ashSilver} stopOpacity={0.55} />
            <Stop offset={1} stopColor={colors.graphite} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#skeletonShimmer)" />
      </Svg>
    </Animated.View>}
  </View>;
}

export function LoadingSkeleton({ variant }: { variant: 'projects' | 'home' | 'waveform' }) {
  const { reduceMotion } = useMotionPreference();
  const progress = useSharedValue(-100);

  useEffect(() => {
    progress.set(-100);
    if (!reduceMotion) progress.set(withRepeat(withTiming(100, { duration: 1400, easing: Easing.linear }), -1));
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  if (variant === 'waveform') {
    return <View accessibilityRole="progressbar" accessibilityLabel="Loading waveform" accessibilityState={{ busy: true }} accessible>
      <SkeletonBlock progress={progress} style={styles.waveform} />
    </View>;
  }

  const isHome = variant === 'home';
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={isHome ? 'Loading studio' : 'Loading projects'}
    accessibilityState={{ busy: true }} style={styles.list}>
    {(isHome ? [0, 1] : [0, 1, 2]).map((item) => <View key={item} style={styles.row}>
      <SkeletonBlock progress={progress} style={styles.thumbnail} />
      <View style={styles.lines}>
        <SkeletonBlock progress={progress} style={styles.title} />
        <SkeletonBlock progress={progress} style={styles.caption} />
      </View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
    backgroundColor: colors.graphite, borderColor: colors.hairline, borderWidth: 1, borderRadius: radius.card },
  lines: { flex: 1, gap: spacing.sm },
  block: { backgroundColor: colors.graphiteElevated, borderRadius: radius.pill, overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: '100%' },
  thumbnail: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.input },
  title: { width: '70%', height: typography.size.caption },
  caption: { width: '45%', height: 10 },
  waveform: { height: dims.timeline.editorHeight, borderRadius: radius.card },
});
