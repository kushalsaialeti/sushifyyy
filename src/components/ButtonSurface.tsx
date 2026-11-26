import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useMotionPreference } from '@/theme/MotionProvider';
import { motion } from '@/theme/theme';

type ButtonSurfaceProps = PropsWithChildren<Pick<PressableProps, 'onPress' | 'disabled' | 'accessibilityLabel' | 'accessibilityState' | 'accessibilityRole'> & {
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
}>;

export function ButtonSurface({ children, style, faceStyle, disabled, accessibilityRole = 'button', ...props }: ButtonSurfaceProps) {
  const { reduceMotion } = useMotionPreference();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: reduceMotion || disabled ? 1 : scale.get() }] }));

  function press(pressed: boolean) {
    scale.set(reduceMotion ? 1 : withTiming(pressed ? motion.buttonPress.scale : 1, { duration: motion.buttonPress.duration }));
  }

  return <Pressable {...props} accessibilityRole={accessibilityRole} disabled={disabled} style={style} onPressIn={() => press(true)} onPressOut={() => press(false)}>
    <Animated.View style={[faceStyle, animatedStyle]}>{children}</Animated.View>
  </Pressable>;
}
