import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function ScreenTitle({ title, description }: { title: string; description?: string }) {
  return <View style={styles.heading}>
    <Text accessibilityRole="header" style={creatorText.title}>{title}</Text>
    {description && <Text style={creatorText.detail}>{description}</Text>}
  </View>;
}

export function CreatorIconButton({ label, glyph, onPress, plain }: {
  label: string;
  glyph: StudioIconName;
  onPress: () => void;
  plain?: boolean;
}) {
  return <ButtonSurface accessibilityLabel={label} onPress={onPress} faceStyle={[styles.iconButton, plain && styles.plain]}>
    <StudioIcon name={glyph} size={plain ? icon.button : icon.inline} color={plain ? colors.mutedSilver : colors.porcelain}
      strokeWidth={glyph === 'more' ? 2.6 : undefined} />
  </ButtonSurface>;
}

export function CreatorActionRow({ label, glyph, detail, onPress, danger, chevron, divider, disabled }: {
  label: string;
  glyph: StudioIconName;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
  chevron?: boolean;
  divider?: boolean;
  disabled?: boolean;
}) {
  const color = disabled ? colors.mutedSilver : danger ? colors.electricCoral : colors.porcelain;
  return <ButtonSurface accessibilityLabel={detail ? `${label}, ${detail}` : label} onPress={onPress} disabled={disabled}
    faceStyle={[styles.row, divider && styles.divider, chevron && styles.profileRow]}>
    <StudioIcon name={glyph} size={icon.button} color={chevron ? colors.mutedSilver : color} />
    <View style={styles.copy}>
      <Text style={[creatorText.body, { color }]}>{label}</Text>
      {detail && <Text style={creatorText.caption}>{detail}</Text>}
    </View>
    {chevron && <StudioIcon name="chevron" color={colors.mutedSilver} />}
  </ButtonSurface>;
}

export const creatorText = StyleSheet.create({
  title: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.screenTitle,
    letterSpacing: typography.letterSpacing.title * typography.size.screenTitle },
  section: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.section },
  cardTitle: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.cardTitle },
  body: { color: colors.porcelain, fontFamily: typography.family.medium, fontSize: typography.size.body },
  detail: { color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.label },
  caption: { color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.caption },
  input: { minHeight: dims.input.height, borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radius.input,
    paddingHorizontal: spacing.lg, color: colors.porcelain, backgroundColor: colors.graphite,
    fontFamily: typography.family.regular, fontSize: typography.size.cardTitle },
});

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  iconButton: { width: dims.touchTarget, height: dims.touchTarget, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.graphiteElevated, borderRadius: radius.control },
  plain: { backgroundColor: 'transparent' },
  row: { minHeight: dims.input.height, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileRow: { minHeight: dims.transportSecondary, paddingHorizontal: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.graphiteElevated },
  copy: { flex: 1, gap: spacing.xxs },
});
