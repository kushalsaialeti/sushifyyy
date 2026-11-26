import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StudioIcon } from '@/components/StudioIcon';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, icon, motion, radius, shadows, spacing, typography } from '@/theme/theme';

type ToastKind = 'success' | 'warn';
type ToastContent = { message: string; kind: ToastKind };
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast | null>(null);
const enterToast = ZoomIn.duration(motion.toast.duration).withInitialValues({ transform: [{ scale: motion.successPop.fromScale }] });
const exitToast = FadeOut.duration(motion.toast.duration);

export function StatusToast({ message, kind }: ToastContent) {
  const { reduceMotion } = useMotionPreference();
  const warning = kind === 'warn';

  return <Animated.View entering={reduceMotion ? undefined : enterToast} exiting={reduceMotion ? undefined : exitToast}
    accessibilityLiveRegion="polite" style={styles.toast}>
    <View aria-hidden style={[styles.badge, warning && styles.badgeWarning]}>
      <StudioIcon name={warning ? 'alert' : 'check'} color={warning ? colors.electricCoral : colors.textOnLight} size={14} strokeWidth={2.6} />
    </View>
    <Text style={styles.message}>{message}</Text>
  </Animated.View>;
}

export function StatusToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const latestId = useRef(0);
  const [toast, setToast] = useState<(ToastContent & { id: number }) | null>(null);
  const push = useCallback<ShowToast>((message, kind = 'success') => {
    latestId.current += 1;
    setToast({ id: latestId.current, message, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.message);
    const timeout = setTimeout(() => {
      setToast((current) => current?.id === toast.id ? null : current);
    }, motion.toast.visibleMs);
    return () => clearTimeout(timeout);
  }, [toast]);

  return <ToastContext.Provider value={push}>
    {children}
    <View pointerEvents="none" style={[styles.placement, {
      top: insets.top + 14, left: insets.left + spacing.screenX, right: insets.right + spacing.screenX,
    }]}>
      {toast && <StatusToast message={toast.message} kind={toast.kind} />}
    </View>
  </ToastContext.Provider>;
}

export function useStatusToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useStatusToast requires a StatusToastProvider.');
  return showToast;
}

const styles = StyleSheet.create({
  placement: { position: 'absolute', zIndex: 60 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: spacing.md, paddingHorizontal: 14,
    borderRadius: radius.button, borderWidth: 1, borderColor: colors.ashSilver, backgroundColor: colors.graphiteElevated,
    boxShadow: `0 ${shadows.toast.offsetY}px ${shadows.toast.radius}px rgba(0,0,0,${shadows.toast.opacity})` },
  badge: { width: icon.hero, height: icon.hero, borderRadius: radius.pill, backgroundColor: colors.porcelain, alignItems: 'center', justifyContent: 'center' },
  badgeWarning: { backgroundColor: colors.deepBurgundy },
  message: { flex: 1, color: colors.porcelain, fontFamily: typography.family.regular, fontSize: typography.size.bodySmall },
});
