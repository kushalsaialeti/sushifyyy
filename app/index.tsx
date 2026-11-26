import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { AppScreen } from '@/components/AppScreen';
import { useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

const barHeights = [14, 26, 38, 22, 44, 30, 18, 34, 12];

function SplashBar({ index, height, reduceMotion }: { index: number; height: number; reduceMotion: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) scale.set(1);
    else scale.set(withDelay(index * 90, withRepeat(withSequence(
      withTiming(0.35, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
    ), -1)));
    return () => cancelAnimation(scale);
  }, [index, reduceMotion, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.get() }] }));

  return <Animated.View style={[styles.bar, { height, backgroundColor: index === 4 ? colors.electricCoral : colors.signalCrimson }, animated]} />;
}

export default function LaunchRoute() {
  const router = useRouter();
  const signedIn = useCreatorStudio((state) => state.email !== null);
  const { reduceMotion } = useMotionPreference();
  const didContinue = useRef(false);
  const next = useCallback(() => {
    if (didContinue.current) return;
    didContinue.current = true;
    router.replace(signedIn ? '/(tabs)/home' : '/(auth)/login');
  }, [router, signedIn]);

  useEffect(() => {
    const timer = setTimeout(next, signedIn ? 0 : 1800);
    return () => clearTimeout(timer);
  }, [next, signedIn]);

  return <AppScreen>
    <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={next} style={styles.launch}>
      <View aria-hidden style={styles.bars}>
        {barHeights.map((height, index) => <SplashBar key={height} index={index} height={height} reduceMotion={reduceMotion} />)}
      </View>
      <Text style={styles.wordmark}>Sushifyyyy</Text>
      <Text style={styles.tagline}>Your Voice. Your Vibe. Your Stage.</Text>
    </Pressable>
  </AppScreen>;
}

const styles = StyleSheet.create({
  launch: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingHorizontal: spacing.screenX },
  bars: { height: dims.touchTarget, flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  bar: { width: spacing.xs, borderRadius: radius.pill },
  wordmark: {
    color: colors.porcelain,
    fontFamily: typography.family.semibold,
    fontSize: 32,
    letterSpacing: typography.letterSpacing.display * 32,
  },
  tagline: { textAlign: 'center', color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.label },
});
