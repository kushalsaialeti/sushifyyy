import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AnimatedTabIndicator } from '@/components/AnimatedTabIndicator';
import { ElevatedCreateButton } from '@/components/ElevatedCreateButton';
import { colors, dims, icon, shadows, typography } from '@/theme/theme';

const tabs = [
  { id: 'home', label: 'Home', path: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { id: 'projects', label: 'Projects', path: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  null,
  { id: 'exports', label: 'Exports', path: 'M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2' },
  { id: 'profile', label: 'Profile', path: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
] as const;

type Tab = NonNullable<(typeof tabs)[number]>;
export type CreatorTab = Tab['id'];

const { height, rowHeight, rowTop } = dims.dock;
const { notchSize, notchVisible } = dims.createButton;
const notchRadius = notchSize / 2;
const notchHeight = notchVisible + 1;
const notchHalfChord = Math.sqrt(notchRadius ** 2 - (notchRadius - notchHeight) ** 2);
const notchLeft = notchRadius - notchHalfChord;
const notchRight = notchRadius + notchHalfChord;
const notchArc = `M${notchLeft} ${notchHeight} A${notchRadius} ${notchRadius} 0 0 1 ${notchRight} ${notchHeight}`;

type BottomNavigationProps = {
  active: CreatorTab | null;
  onTab: (tab: CreatorTab) => void;
  onCreate: () => void;
  inStudio: boolean;
  createDisabled: boolean;
  tabsDisabled?: boolean;
  haptics: boolean;
  reduceMotion: boolean;
};

function TabButton({ tab, selected, reduceMotion, onPress, disabled }: {
  tab: Tab;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const lift = useSharedValue(selected ? -1.5 : 0);
  useEffect(() => {
    const offset = selected ? -1.5 : 0;
    lift.value = reduceMotion ? offset : withTiming(offset, { duration: 300 });
  }, [lift, reduceMotion, selected]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const color = selected ? colors.textOnLight : colors.mutedSilver;

  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={styles.tab}>
      <Animated.View style={iconStyle} aria-hidden>
        <Svg width={icon.nav} height={icon.nav} viewBox="0 0 24 24">
          <Path d={tab.path} fill="none" stroke={color} strokeWidth={icon.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, {
        color,
        fontFamily: selected ? typography.family.semibold : typography.family.medium,
      }]}>{tab.label}</Text>
    </Pressable>
  );
}

export function BottomNavigation({ active, onTab, onCreate, inStudio, createDisabled, tabsDisabled, haptics, reduceMotion }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);
  const activeSlot = active === null ? null : tabs.findIndex((tab) => tab?.id === active);
  const showIndicator = activeSlot !== null && rowWidth > 0;

  return (
    <View pointerEvents="box-none" style={[styles.dock, { height: notchVisible + height + insets.bottom }]}>
      <View aria-hidden style={styles.background} />
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { left: insets.left, right: insets.right }]}>
        <View pointerEvents="none" style={styles.indicatorLayer}>
          <AnimatedTabIndicator slot={activeSlot} slotWidth={rowWidth / tabs.length} visible={showIndicator} reduceMotion={reduceMotion} />
        </View>
        <View
          role="tablist"
          accessibilityLabel="Main navigation"
          pointerEvents="box-none"
          onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
          style={styles.row}
        >
          {tabs.map((tab) => tab ? (
            <TabButton key={tab.id} tab={tab} selected={showIndicator && active === tab.id} reduceMotion={reduceMotion}
              disabled={tabsDisabled} onPress={() => onTab(tab.id)} />
          ) : <View key="create-slot" aria-hidden pointerEvents="none" style={styles.tab} />)}
        </View>
        <View pointerEvents="none" aria-hidden style={styles.notch}>
          <Svg width={notchSize} height={notchHeight}>
            <Path d={`${notchArc} Z`} fill={colors.graphite} />
            <Path d={notchArc} stroke={colors.dockBorder} strokeWidth={2} fill="none" />
          </Svg>
        </View>
        <ElevatedCreateButton onPress={onCreate} haptics={haptics} inStudio={inStudio} disabled={createDisabled} reduceMotion={reduceMotion} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20 },
  background: {
    ...StyleSheet.absoluteFill,
    top: notchVisible,
    borderTopWidth: 1,
    borderTopColor: colors.dockBorder,
    backgroundColor: colors.graphite,
    boxShadow: `0 ${shadows.dock.offsetY}px ${shadows.dock.radius}px rgba(0,0,0,${shadows.dock.opacity})`,
  },
  indicatorLayer: { position: 'absolute', top: notchVisible, left: 0, right: 0, height, zIndex: 1 },
  row: { position: 'absolute', top: notchVisible + rowTop, left: 0, right: 0, height: rowHeight, flexDirection: 'row', zIndex: 2 },
  tab: { flex: 1, minHeight: dims.touchTarget, minWidth: dims.touchTarget, justifyContent: 'center', alignItems: 'center', gap: 3 },
  label: { maxWidth: '100%', textAlign: 'center', fontSize: typography.size.nav, letterSpacing: typography.size.nav * 0.01 },
  notch: { position: 'absolute', top: 0, left: '50%', marginLeft: -notchRadius, zIndex: 3 },
});
