import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { GlossFill } from '@/components/GlossFill';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, icon, radius, shadows, spacing, typography } from '@/theme/theme';

export type PrimaryGlossyButtonProps = {
  label: string;
  icon?: StudioIconName;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryGlossyButton({ label, icon: glyph, loading, disabled, onPress, compact, style }: PrimaryGlossyButtonProps) {
  const { reduceMotion } = useMotionPreference();

  return <ButtonSurface style={style} faceStyle={[styles.face, compact && styles.compact, disabled && styles.disabled]}
    accessibilityLabel={label} disabled={loading || disabled} accessibilityState={{ busy: loading }} onPress={onPress}>
    {!disabled && <GlossFill />}
    {loading && !reduceMotion && <ActivityIndicator accessibilityElementsHidden importantForAccessibility="no" color={disabled ? colors.mutedSilver : colors.textOnLight} />}
    {!loading && glyph && <StudioIcon name={glyph} size={icon.button} color={disabled ? colors.mutedSilver : colors.textOnLight} />}
    <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
  </ButtonSurface>;
}

const styles = StyleSheet.create({
  face: {
    minHeight: dims.primaryButton.height,
    minWidth: dims.touchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    overflow: 'hidden',
    backgroundColor: colors.porcelain,
    boxShadow: `0 ${shadows.glossButton.offsetY}px ${shadows.glossButton.radius}px rgba(0,0,0,${shadows.glossButton.opacity})`,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  compact: { minHeight: dims.primaryButton.heightCompact },
  disabled: { backgroundColor: colors.graphiteElevated, boxShadow: 'none' },
  label: { flexShrink: 1, textAlign: 'center', color: colors.textOnLight, fontFamily: typography.family.semibold, fontSize: typography.size.body },
  disabledLabel: { color: colors.mutedSilver },
});
