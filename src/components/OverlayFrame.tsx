import { type ComponentRef, type PropsWithChildren, useRef } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, motion, radius, spacing, typography } from '@/theme/theme';

const enterScrim = FadeIn.duration(motion.modal.duration);
const enterSheet = SlideInDown.duration(motion.bottomSheet.duration).easing(Easing.bezier(0.2, 0.9, 0.25, 1));
const enterDialog = ZoomIn.duration(motion.modal.duration).withInitialValues({ transform: [{ scale: motion.modal.fromScale }] });

export function OverlayFrame({ visible, title, onClose, kind, children }: PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  kind: 'sheet' | 'dialog';
}>) {
  const heading = useRef<ComponentRef<typeof Text>>(null);
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useMotionPreference();
  const sheet = kind === 'sheet';

  if (!visible) return null;

  return <Modal transparent animationType="none" visible statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}
    onShow={() => { if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus'); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.overlay, sheet ? styles.sheetOverlay : styles.dialogOverlay, { paddingTop: insets.top + spacing.lg }]}>
      <Animated.View pointerEvents="none" aria-hidden entering={reduceMotion ? undefined : enterScrim} style={styles.scrim} />
      {sheet && <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" style={StyleSheet.absoluteFill} onPress={onClose} />}
      <Animated.View accessibilityViewIsModal onAccessibilityEscape={onClose}
        entering={reduceMotion ? undefined : sheet ? enterSheet : enterDialog}
        style={[styles.panel, sheet ? styles.sheet : styles.dialog, sheet ? {
          paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.sm,
          paddingLeft: Math.max(insets.left, spacing.screenX),
          paddingRight: Math.max(insets.right, spacing.screenX),
        } : { marginLeft: insets.left, marginRight: insets.right, marginBottom: insets.bottom }]}>
        {sheet && <View aria-hidden style={styles.handle} />}
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} style={styles.scroll} contentContainerStyle={styles.content}>
          <Text ref={heading} accessibilityRole="header" style={[styles.title, sheet && styles.sheetTitle]}>{title}</Text>
          {children}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  sheetOverlay: { justifyContent: 'flex-end' },
  dialogOverlay: { justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  panel: { backgroundColor: colors.graphite, borderColor: colors.hairlineStrong, maxHeight: '100%', flexShrink: 1 },
  sheet: { borderTopWidth: 1, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingTop: 10 },
  dialog: { borderWidth: 1, borderRadius: radius.dialog, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' },
  scroll: { flexGrow: 0 },
  content: { gap: 10 },
  handle: { width: 40, height: 5, borderRadius: radius.pill, alignSelf: 'center', marginBottom: spacing.sm, backgroundColor: colors.ashSilver },
  title: { fontFamily: typography.family.semibold, fontSize: 20, color: colors.porcelain },
  sheetTitle: { paddingHorizontal: spacing.xs, fontSize: typography.size.section },
});
