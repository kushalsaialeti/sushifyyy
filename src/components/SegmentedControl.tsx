import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { GlossFill } from '@/components/GlossFill';
import { colors, dims, radius, typography } from '@/theme/theme';

type SegmentOption<T> = { value: T; label: string; disabled?: boolean };

export function SegmentedControl<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return <View role="radiogroup" accessibilityLabel={label} style={styles.container}>
    {options.map((option) => {
      const selected = option.value === value;
      return <ButtonSurface key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
        accessibilityState={{ checked: selected }} disabled={option.disabled}
        onPress={() => { if (!selected) onChange(option.value); }} style={styles.target}
        faceStyle={[styles.segment, selected && styles.selected, option.disabled && styles.disabled]}>
        {selected && !option.disabled && <GlossFill variant="segment" />}
        <Text style={[styles.label, selected && !option.disabled && styles.selectedText]}>{option.label}</Text>
      </ButtonSurface>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', padding: dims.segmented.padding, gap: dims.segmented.padding,
    backgroundColor: colors.well, borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radius.input },
  target: { flexGrow: 1, flexBasis: dims.touchTarget, minWidth: dims.touchTarget, minHeight: dims.touchTarget, justifyContent: 'center' },
  segment: { minHeight: dims.segmented.height, paddingHorizontal: dims.segmented.padding, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.segmentInner, overflow: 'hidden' },
  selected: { backgroundColor: colors.porcelain },
  disabled: { backgroundColor: colors.graphiteElevated },
  label: { textAlign: 'center', color: colors.mutedSilver, fontFamily: typography.family.medium, fontSize: typography.size.label },
  selectedText: { color: colors.textOnLight, fontFamily: typography.family.semibold },
});
