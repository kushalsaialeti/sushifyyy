import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

export function MatteCard({ padding = spacing.lg, elevated, inset, style, children }: PropsWithChildren<{
  padding?: number;
  elevated?: boolean;
  inset?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  return <View style={[styles.card, elevated && styles.elevated, inset && styles.inset, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.card },
  elevated: { backgroundColor: colors.graphiteElevated, borderColor: colors.ashSilver },
  inset: { backgroundColor: colors.well, borderColor: colors.hairlineStrong },
});
