import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { GlossFill } from '@/components/GlossFill';
import { OverlayFrame } from '@/components/OverlayFrame';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

export function ConfirmationDialog({ visible, title, body, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm, onCancel }: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return <OverlayFrame kind="dialog" visible={visible} title={title} onClose={onCancel}>
    <Text style={styles.body}>{body}</Text>
    <View style={styles.actions}>
      <ButtonSurface accessibilityLabel={cancelLabel} onPress={onCancel} style={styles.target} faceStyle={[styles.action, styles.cancel]}>
        <Text style={styles.cancelLabel}>{cancelLabel}</Text>
      </ButtonSurface>
      <ButtonSurface accessibilityLabel={confirmLabel} onPress={onConfirm} style={styles.target}
        faceStyle={[styles.action, destructive ? styles.destructive : styles.confirm]}>
        {!destructive && <GlossFill />}
        <Text style={[styles.confirmLabel, destructive && styles.destructiveLabel]}>{confirmLabel}</Text>
      </ButtonSurface>
    </View>
  </OverlayFrame>;
}

const styles = StyleSheet.create({
  body: { fontFamily: typography.family.regular, fontSize: typography.size.bodySmall,
    lineHeight: typography.size.bodySmall * typography.lineHeight.body, color: colors.mutedSilver },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  target: { flex: 1, minWidth: dims.touchTarget },
  action: { minHeight: 50, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, flex: 1,
    borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cancel: { backgroundColor: colors.graphiteElevated, borderWidth: 1, borderColor: colors.ashSilver },
  confirm: { backgroundColor: colors.porcelain },
  destructive: { backgroundColor: colors.signalCrimson },
  cancelLabel: { textAlign: 'center', color: colors.porcelain, fontFamily: typography.family.medium, fontSize: typography.size.body },
  confirmLabel: { textAlign: 'center', color: colors.textOnLight, fontFamily: typography.family.semibold, fontSize: typography.size.body },
  destructiveLabel: { color: colors.obsidian },
});
