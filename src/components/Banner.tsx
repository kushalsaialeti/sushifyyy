import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function Banner({ title, message, icon: glyph = 'alert', tone = 'warning', dismissible, onDismiss }: {
  title?: string;
  message: string;
  icon?: StudioIconName;
  tone?: 'warning' | 'neutral';
} & ({ dismissible: true; onDismiss: () => void } | { dismissible?: false; onDismiss?: never })) {
  const warning = tone === 'warning';
  return <View style={[styles.banner, warning && styles.warning]}>
    <StudioIcon name={glyph} size={icon.button} color={warning ? colors.electricCoral : colors.mutedSilver} />
    <View accessibilityLiveRegion="polite" style={styles.copy}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={[styles.message, !title && styles.standalone]}>{message}</Text>
    </View>
    {dismissible && <ButtonSurface accessibilityLabel="Dismiss banner" onPress={onDismiss} style={styles.dismissTarget} faceStyle={styles.dismiss}>
      <StudioIcon name="close" color={colors.mutedSilver} />
    </ButtonSurface>}
  </View>;
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radius.button,
    borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.graphite },
  warning: { borderColor: colors.ashSilver, backgroundColor: colors.graphiteElevated },
  copy: { flex: 1, gap: spacing.xs },
  title: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.bodySmall },
  message: { color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.label, lineHeight: typography.size.label * typography.lineHeight.body },
  standalone: { color: colors.porcelain, fontSize: typography.size.bodySmall },
  dismissTarget: { marginVertical: -spacing.sm, marginRight: -spacing.sm },
  dismiss: { width: dims.touchTarget, height: dims.touchTarget, justifyContent: 'center', alignItems: 'center' },
});
