import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function SecondaryButton({ label, tone = 'neutral', icon: glyph, onPress, disabled, style }: {
  label: string;
  tone?: 'neutral' | 'danger';
  icon?: StudioIconName;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = disabled ? colors.mutedSilver : tone === 'danger' ? colors.electricCoral : colors.porcelain;

  return <ButtonSurface style={style} faceStyle={[styles.face, disabled && styles.disabled]} accessibilityLabel={label} disabled={disabled} onPress={onPress}>
    {glyph && <StudioIcon name={glyph} size={icon.button} color={color} />}
    <Text style={[styles.label, { color }]}>{label}</Text>
  </ButtonSurface>;
}

const styles = StyleSheet.create({
  face: {
    minHeight: dims.touchTarget,
    minWidth: dims.touchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.graphiteElevated,
    borderWidth: 1,
    borderColor: colors.ashSilver,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  disabled: { backgroundColor: colors.graphite },
  label: { flexShrink: 1, textAlign: 'center', fontSize: typography.size.body, fontFamily: typography.family.medium },
});
