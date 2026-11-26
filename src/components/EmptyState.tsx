import { StyleSheet, Text, View } from 'react-native';

import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { colors, icon, radius, spacing, typography } from '@/theme/theme';

export function EmptyState({ icon: glyph, title, body, action }: {
  icon: StudioIconName;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return <View style={styles.container}>
    <View aria-hidden style={styles.icon}><StudioIcon name={glyph} size={icon.hero} color={colors.signalCrimson} /></View>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
    {action && <PrimaryGlossyButton compact label={action.label} onPress={action.onPress} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10, paddingHorizontal: spacing.sm, paddingVertical: spacing.lg },
  icon: { width: 60, height: 60, borderRadius: radius.card, backgroundColor: colors.graphite, borderWidth: 1,
    borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontSize: typography.size.section, fontFamily: typography.family.semibold, color: colors.porcelain },
  body: { textAlign: 'center', fontSize: typography.size.label, lineHeight: typography.size.label * typography.lineHeight.body,
    fontFamily: typography.family.regular, color: colors.mutedSilver },
});
