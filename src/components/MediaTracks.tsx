import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { GlossFill } from '@/components/GlossFill';
import { StudioIcon } from '@/components/StudioIcon';
import { WaveformTimeline } from '@/components/WaveformTimeline';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function TimelineStrip({ progress, trimFraction = 0, muted, dark, marker, children }: PropsWithChildren<{
  progress: number; trimFraction?: number; muted?: boolean; dark?: boolean; marker?: string;
}>) {
  const trim = Math.max(0, Math.min(1, trimFraction));
  const cursor = Math.max(0, Math.min(99.5, progress * 100));
  return <View aria-hidden style={[styles.strip, muted && styles.silent]}>
    {children}
    {trim > 0 && <View pointerEvents="none" style={[styles.mask, { width: `${trim * 100}%` }]} />}
    <View pointerEvents="none" style={[styles.cursor, { left: `${cursor}%`, backgroundColor: marker ?? (dark ? colors.porcelain : colors.textOnLight) }]} />
  </View>;
}

export function AudioTrack({ title, samples, duration, position, kind, offset = 0, trimFraction, muted, solo, audible = true, onMute, onSolo, height = dims.timeline.trackHeight }: {
  title: string; samples: readonly number[]; duration: number; position: number; kind: 'vocal' | 'karaoke'; offset?: number; trimFraction?: number;
  muted?: boolean; solo?: boolean; audible?: boolean; onMute?: () => void; onSolo?: () => void; height?: number;
}) {
  const dark = kind === 'karaoke';
  return <View style={styles.track}>
    <View style={styles.row}>
      <Text style={[creatorText.detail, styles.trackTitle, (onMute || onSolo) && styles.mixTitle]}>{title}</Text>
      {onMute && <MixSwitch label={`Mute ${title.toLowerCase()}`} letter="M" value={!!muted} onPress={onMute} />}
      {onSolo && <MixSwitch label={`Solo ${title.toLowerCase()}`} letter="S" value={!!solo} onPress={onSolo} />}
    </View>
    <TimelineStrip dark={dark} muted={!audible} progress={duration > 0 ? position / duration : 0} trimFraction={trimFraction}>
      <WaveformTimeline variant={dark ? 'karaoke' : 'playback'} samples={samples} duration={duration}
        strip={{ height, shiftFraction: offset }} />
    </TimelineStrip>
  </View>;
}

function MixSwitch({ letter, label, value, onPress }: { letter: string; label: string; value: boolean; onPress: () => void }) {
  return <ButtonSurface accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={onPress}
    faceStyle={[styles.switch, value && styles.switchOn]}>
    <Text style={[styles.switchText, value && styles.switchTextOn]}>{letter}</Text>
  </ButtonSurface>;
}

export function PlayDisc({ playing = false, label, onPress }: { playing?: boolean; label?: string; onPress?: () => void }) {
  const face = <><GlossFill /><StudioIcon name={playing ? 'pause' : 'play'} size={icon.button} strokeWidth={2.8} color={colors.textOnLight}
    fill={playing ? undefined : colors.textOnLight} /></>;
  if (!onPress) return <View aria-hidden style={styles.play}>{face}</View>;
  return <ButtonSurface accessibilityLabel={label} onPress={onPress} faceStyle={styles.play}>{face}</ButtonSurface>;
}

export function CameraBackdrop({ compact }: { compact?: boolean }) {
  return <View pointerEvents="none" aria-hidden style={styles.silhouette}>
    <View style={[styles.head, compact && styles.headSmall]} />
    <View style={[styles.body, compact && styles.bodySmall]} />
  </View>;
}

const styles = StyleSheet.create({
  track: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trackTitle: { flex: 1 },
  mixTitle: { color: colors.porcelain, fontFamily: typography.family.semibold },
  strip: { borderRadius: radius.control, overflow: 'hidden', backgroundColor: colors.graphiteElevated },
  silent: { opacity: 0.35 },
  mask: { position: 'absolute', top: 0, bottom: 0, backgroundColor: `${colors.obsidian}aa`, borderRightWidth: 3, borderRightColor: colors.porcelain },
  cursor: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  switch: { width: dims.touchTarget, height: dims.touchTarget, borderWidth: 1, borderColor: colors.ashSilver, borderRadius: radius.control,
    backgroundColor: colors.graphite, justifyContent: 'center', alignItems: 'center' },
  switchOn: { backgroundColor: colors.porcelain },
  switchText: { ...creatorText.caption, fontFamily: typography.family.semibold },
  switchTextOn: { color: colors.textOnLight },
  play: { width: dims.playButton, height: dims.playButton, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.porcelain,
    alignItems: 'center', justifyContent: 'center' },
  silhouette: { ...StyleSheet.absoluteFill, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'flex-end' },
  head: { width: 120, height: 120, borderRadius: radius.pill, backgroundColor: colors.graphiteElevated, marginBottom: 14 },
  body: { width: 240, height: '42%', borderTopLeftRadius: 120, borderTopRightRadius: 120, backgroundColor: colors.graphiteElevated },
  headSmall: { width: 70, height: 70, marginBottom: 10 },
  bodySmall: { width: 150, height: '46%', borderTopLeftRadius: 75, borderTopRightRadius: 75 },
});
