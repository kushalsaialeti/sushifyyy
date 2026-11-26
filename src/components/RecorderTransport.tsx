import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { ButtonSurface } from '@/components/ButtonSurface';
import { StudioIcon } from '@/components/StudioIcon';
import type { RecorderStatus } from '@/services/AudioEngine';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, gradients, icon, motion, radius, spacing, typography } from '@/theme/theme';

const labels: Record<RecorderStatus, string> = {
  idle: 'Tap to record', preparing: 'Getting your mic ready…', recording: 'Tap to pause · square to finish',
  paused: 'Tap to resume · square to finish', processing: '', finished: 'Opening the editor…', denied: '',
};
const [gradientX, gradientY] = gradients.crimsonButton.center.split(' ');
const disc = dims.recordButton.size - dims.recordButton.ring * 2;

function RecordingHalo({ visible }: { visible: boolean }) {
  const { reduceMotion } = useMotionPreference();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(0);
    if (visible && !reduceMotion) progress.set(withRepeat(withTiming(1, { duration: motion.recordHalo.duration }), -1));
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion, visible]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - progress.get()), transform: [{ scale: 1 + (motion.recordHalo.toScale - 1) * progress.get() }],
  }));
  return visible && !reduceMotion ? <Animated.View pointerEvents="none" aria-hidden style={[styles.halo, haloStyle]} /> : null;
}

export function RecorderTransport({ status, monitoring, monitorDisabled, stopDisabled, onMonitor, onRecord, onStop }: {
  status: RecorderStatus;
  monitoring: boolean;
  monitorDisabled: boolean;
  stopDisabled: boolean;
  onMonitor: () => void;
  onRecord: () => void;
  onStop: () => void;
}) {
  const { reduceMotion } = useMotionPreference();
  const recording = status === 'recording';
  const busy = status === 'preparing' || status === 'processing';
  const action = recording ? 'Pause' : status === 'paused' ? 'Resume' : status === 'finished' ? 'Open editor' : 'Start recording';
  const glyph = recording ? 'pause' : status === 'finished' ? 'check' : 'mic';

  return <View style={styles.transport}>
    <View style={styles.row}>
      <ButtonSurface accessibilityLabel="Live monitoring" accessibilityState={{ selected: monitoring }}
        disabled={monitorDisabled} onPress={onMonitor} faceStyle={[styles.secondary, monitoring && styles.monitorOn, monitorDisabled && styles.disabled]}>
        <StudioIcon name="headphones" size={icon.nav} color={monitoring ? colors.textOnLight : colors.mutedSilver} />
      </ButtonSurface>
      <View>
        <RecordingHalo visible={recording} />
        <ButtonSurface accessibilityLabel={action} accessibilityState={{ busy }} disabled={busy} onPress={onRecord} faceStyle={styles.record}>
          <Svg width={disc} height={disc} style={StyleSheet.absoluteFill} aria-hidden>
            <Defs>
              <RadialGradient id="recordGloss" cx={gradientX} cy={gradientY} rx="72%" ry="72%">
                {gradients.crimsonButton.stops.map((color, index) => <Stop key={color} offset={gradients.crimsonButton.at[index]} stopColor={color} />)}
              </RadialGradient>
            </Defs>
            <Circle cx={disc / 2} cy={disc / 2} r={disc / 2} fill="url(#recordGloss)" />
          </Svg>
          {busy && !reduceMotion ? <ActivityIndicator size={icon.hero} color={gradients.porcelainGloss[0]} /> :
            <StudioIcon name={glyph} size={typography.size.display} strokeWidth={3} color={gradients.porcelainGloss[0]} />}
        </ButtonSurface>
      </View>
      <ButtonSurface accessibilityLabel="Stop and finish take" disabled={stopDisabled} onPress={onStop}
        faceStyle={[styles.secondary, stopDisabled && styles.disabled]}><View style={styles.stop} /></ButtonSurface>
    </View>
    <Text style={styles.hint}>{labels[status]}</Text>
  </View>;
}

const styles = StyleSheet.create({
  transport: { paddingTop: 22, paddingBottom: 14, alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30 },
  secondary: { width: dims.transportSecondary, height: dims.transportSecondary, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.ashSilver, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  monitorOn: { backgroundColor: colors.porcelain },
  disabled: { opacity: 0.45 },
  record: { width: dims.recordButton.size, height: dims.recordButton.size, borderWidth: dims.recordButton.ring, borderRadius: radius.pill,
    borderColor: colors.hairlineStrong, backgroundColor: colors.signalCrimson, alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(239,51,73,0.35), 0 10px 22px rgba(0,0,0,0.6)' },
  halo: { ...StyleSheet.absoluteFill, borderWidth: 2, borderColor: colors.signalCrimson, borderRadius: radius.pill },
  stop: { width: icon.inline, height: icon.inline, borderRadius: spacing.xs, backgroundColor: colors.porcelain },
  hint: { color: colors.mutedSilver, textAlign: 'center', fontFamily: typography.family.regular, fontSize: typography.size.caption },
});
