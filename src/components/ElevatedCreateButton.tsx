import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors, dims, gradients, icon, motion, shadows } from '@/theme/theme';

const { size, elevation, notchVisible } = dims.createButton;
const ringSize = 70;
const [gradientX, gradientY] = gradients.crimsonButton.center.split(' ');
const glowAlpha = Math.round(shadows.createButtonGlow.opacity * 255).toString(16).padStart(2, '0');

type ElevatedCreateButtonProps = {
  onPress: () => void;
  haptics: boolean;
  inStudio: boolean;
  disabled?: boolean;
  reduceMotion: boolean;
};

export function ElevatedCreateButton({ onPress, haptics, inStudio, disabled, reduceMotion }: ElevatedCreateButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: reduceMotion ? 1 : scale.value }] }));

  function updatePressScale(pressed: boolean) {
    scale.set(reduceMotion ? 1 : withTiming(pressed ? motion.buttonPress.scale : 1, {
      duration: motion.buttonPress.duration,
    }));
  }

  function create() {
    if (haptics) void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  }

  return (
    <View pointerEvents="box-none" style={styles.position}>
      {inStudio && <View pointerEvents="none" aria-hidden style={styles.ring} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New recording"
        disabled={disabled}
        onPress={create}
        onPressIn={() => updatePressScale(true)}
        onPressOut={() => updatePressScale(false)}
        style={styles.hitArea}
      >
        <Animated.View pointerEvents="none" style={[styles.disc, animatedStyle]}>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="createGloss" cx={gradientX} cy={gradientY} rx="72%" ry="72%">
                {gradients.crimsonButton.stops.map((color, index) => (
                  <Stop key={color} offset={gradients.crimsonButton.at[index]} stopColor={color} />
                ))}
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#createGloss)" />
            <Circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} stroke={colors.porcelain} strokeOpacity={0.22} fill="none" />
          </Svg>
          <Svg width={icon.hero} height={icon.hero} viewBox="0 0 24 24" aria-hidden>
            <Path d="M12 5v14M5 12h14" stroke={gradients.porcelainGloss[0]} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: 'absolute', top: notchVisible - elevation, left: '50%', marginLeft: -size / 2, zIndex: 4 },
  hitArea: { width: size, height: size, borderRadius: dims.createButton.size / 2 },
  disc: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size / 2,
    backgroundColor: colors.signalCrimson,
    boxShadow: [
      { offsetX: 0, offsetY: shadows.createButtonGlow.offsetY, blurRadius: shadows.createButtonGlow.radius, color: `${shadows.createButtonGlow.color}${glowAlpha}` },
      { offsetX: 0, offsetY: shadows.createButtonDrop.offsetY, blurRadius: shadows.createButtonDrop.radius, color: `rgba(0,0,0,${shadows.createButtonDrop.opacity})` },
    ],
  },
  ring: {
    position: 'absolute',
    width: ringSize,
    height: ringSize,
    left: (size - ringSize) / 2,
    top: (size - ringSize) / 2,
    borderRadius: ringSize / 2,
    borderWidth: 2,
    borderColor: colors.porcelain,
    opacity: 0.85,
  },
});
