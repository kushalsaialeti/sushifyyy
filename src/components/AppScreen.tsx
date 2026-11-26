import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { colors, dims, spacing } from '@/theme/theme';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  withDock?: boolean;
  compactDock?: boolean;
  keyboardAvoiding?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  scrollContentStyle?: StyleProp<ViewStyle>;
}>;

// Two fine dot layers from the approved prototype's .tex background.
function ScreenTexture() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="porcelainGrain" width={3} height={3} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={0.6} fill={colors.porcelain} opacity={0.045} />
          </Pattern>
          <Pattern id="silverGrain" width={7} height={7} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={3} r={0.5} fill={colors.mutedSilver} opacity={0.035} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#porcelainGrain)" />
        <Rect width="100%" height="100%" fill="url(#silverGrain)" />
      </Svg>
    </View>
  );
}

export function AppScreen({ children, scroll, withDock, compactDock, keyboardAvoiding, header, footer, scrollContentStyle }: AppScreenProps) {
  const scrollBehindDock = scroll && withDock && !compactDock && !footer;
  return (
    <View style={styles.screen}>
      <ScreenTexture />
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView style={styles.fill} behavior={keyboardAvoiding && Platform.OS === 'ios' ? 'padding' : undefined}>
          {header}
          {scroll ? (
            <ScrollView style={styles.fill} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              contentContainerStyle={[scrollContentStyle, scrollBehindDock && styles.scrollDockSpace]}>
              {children}
            </ScrollView>
          ) : (
            <View style={styles.fill}>{children}</View>
          )}
          {footer}
          {withDock && !scrollBehindDock && <View style={footer || compactDock ? styles.dockSpace : styles.dockSpaceWithGutter} />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  fill: { flex: 1 },
  dockSpace: { height: dims.dock.height },
  dockSpaceWithGutter: { height: dims.dock.height + spacing.xxxl + spacing.xs },
  scrollDockSpace: { paddingBottom: dims.dock.height + spacing.xxxl + spacing.xs },
});
