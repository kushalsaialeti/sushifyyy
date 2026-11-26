import { StyleSheet, Text } from 'react-native';

import type { RecorderStatus } from '@/services/AudioEngine';
import { colors, typography } from '@/theme/theme';

export function RecordingTimer({ seconds, state }: { seconds: number; state: RecorderStatus }) {
  const tenths = Math.floor(Math.max(0, seconds) * 10);
  const minutes = String(Math.floor(tenths / 600)).padStart(2, '0');
  const wholeSeconds = String(Math.floor(tenths / 10) % 60).padStart(2, '0');
  const fraction = tenths % 10;
  const color = state === 'recording' ? colors.porcelain : state === 'paused' ? colors.electricCoral : colors.mutedSilver;

  return <Text accessibilityLabel={`Recording time ${minutes}:${wholeSeconds}.${fraction}`} adjustsFontSizeToFit numberOfLines={1}
    style={[styles.timer, { color }]}>{minutes}:{wholeSeconds}<Text style={styles.fraction}>.{fraction}</Text></Text>;
}

const styles = StyleSheet.create({
  timer: { textAlign: 'center', fontSize: typography.size.timer, fontFamily: typography.family.semibold,
    letterSpacing: typography.size.timer * typography.letterSpacing.display, fontVariant: ['tabular-nums'] },
  fraction: { color: colors.textTertiary, fontSize: typography.size.timerFraction },
});
