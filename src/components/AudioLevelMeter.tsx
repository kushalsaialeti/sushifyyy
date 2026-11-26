import { Canvas, Path, usePathValue } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { colors, dims, spacing, typography } from '@/theme/theme';

const height = 12;
const gap = 3;

export function AudioLevelMeter({ level, reading, recording }: {
  level: number | SharedValue<number>; reading: number; recording: boolean;
}) {
  const size = useSharedValue({ width: 0, height });
  const backgroundPath = usePathValue((path) => {
    'worklet';
    const step = size.get().width / dims.meterSegments;
    for (let index = 0; index < dims.meterSegments; index += 1) {
      path.addRRect({ rect: { x: index * step, y: 0, width: Math.max(0, step - gap), height }, rx: 2, ry: 2 });
    }
  });

  return <View style={styles.row} accessible accessibilityLabel="Microphone input level" accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(reading * 100) }}>
    <Text style={[styles.label, styles.input]}>Input</Text>
    <Canvas aria-hidden onSize={size} style={styles.meter}>
      <Path path={backgroundPath} color={colors.graphiteElevated} />
      <MeterBand level={level} size={size} first={0} end={19} color={colors.porcelain} />
      <MeterBand level={level} size={size} first={19} end={24} color={colors.electricCoral} />
      <MeterBand level={level} size={size} first={24} end={dims.meterSegments} color={colors.signalCrimson} />
    </Canvas>
    <Text style={[styles.label, styles.readout]}>{recording ? `${Math.round(-40 + reading * 37)} dB` : '—'}</Text>
  </View>;
}

function MeterBand({ level, size, first, end, color }: {
  level: number | SharedValue<number>; size: SharedValue<{ width: number; height: number }>; first: number; end: number; color: string;
}) {
  const band = usePathValue((path) => {
    'worklet';
    const step = size.get().width / dims.meterSegments;
    const lit = Math.round((typeof level === 'number' ? level : level.get()) * dims.meterSegments);
    for (let index = first; index < Math.min(lit, end); index += 1) {
      path.addRRect({ rect: { x: index * step, y: 0, width: Math.max(0, step - gap), height }, rx: 2, ry: 2 });
    }
  });
  return <Path path={band} color={color} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  meter: { flex: 1, height },
  label: { color: colors.mutedSilver, fontSize: 11, fontFamily: typography.family.regular, fontVariant: ['tabular-nums'] },
  input: { minWidth: 34 },
  readout: { minWidth: dims.touchTarget, textAlign: 'right' },
});
