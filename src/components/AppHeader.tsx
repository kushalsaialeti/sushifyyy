import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon } from '@/components/StudioIcon';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function AppHeader({ title, subtitle, onBack, right, fitActions, backLabel = 'Back', backDisabled }: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  fitActions?: boolean;
  backLabel?: string;
  backDisabled?: boolean;
}) {
  return <View style={styles.header}>
    <View style={[styles.left, !!right && styles.sideWithAction, fitActions && styles.leftFit]}>
      {onBack && <ButtonSurface accessibilityLabel={backLabel} onPress={onBack} disabled={backDisabled} faceStyle={styles.back}>
        <StudioIcon name="back" size={icon.button} color={backDisabled ? colors.textTertiary : colors.porcelain} />
      </ButtonSurface>}
    </View>
    <View style={styles.copy}>
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text>
      {subtitle && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <View style={[styles.right, !!right && styles.sideWithAction, fitActions && styles.rightFit]}>{right}</View>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: dims.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  left: { flex: 1, minWidth: dims.touchTarget, alignItems: 'flex-start' },
  right: { flex: 1, minWidth: dims.touchTarget, alignItems: 'flex-end' },
  sideWithAction: { minWidth: 88 },
  leftFit: { flex: 0, minWidth: dims.touchTarget },
  rightFit: { flex: 0, minWidth: 0 },
  copy: { flex: 2, alignItems: 'center' },
  back: { width: dims.touchTarget, height: dims.touchTarget, backgroundColor: colors.graphite,
    borderRadius: radius.control, borderWidth: 1, borderColor: colors.dockBorder, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.porcelain, textAlign: 'center', fontSize: typography.size.body, fontFamily: typography.family.semibold },
  subtitle: { color: colors.mutedSilver, textAlign: 'center', fontSize: typography.size.caption, fontFamily: typography.family.regular },
});
