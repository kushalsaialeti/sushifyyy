import { StyleSheet, Text, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { CreatorIconButton, creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { StudioIcon } from '@/components/StudioIcon';
import { formatDuration, type StudioExport } from '@/store/creatorStudio';
import { colors, gradients, radius, spacing, typography } from '@/theme/theme';

export function ExportCard({ export: item, playing, position, onToggle, onInfo, onShare }: {
  export: StudioExport;
  playing: boolean;
  position: number;
  onToggle: () => void;
  onInfo: () => void;
  onShare: () => void;
}) {
  const percentage = item.dur > 0 ? Math.round(Math.min(1, position / item.dur) * 100) : 0;
  return <MatteCard padding={14} style={styles.card}>
    <View style={styles.row}>
      <ButtonSurface accessibilityLabel={`${playing ? 'Pause preview' : 'Play preview'} for ${item.name}`} onPress={onToggle} faceStyle={styles.play}>
        <StudioIcon name={playing ? 'pause' : 'play'} strokeWidth={2.6} color={gradients.porcelainGloss[0]} />
      </ButtonSurface>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text style={creatorText.caption}>{item.date} · {formatDuration(item.dur)} · {item.size}</Text>
        {item.result.kind === 'simulated' && <Text style={creatorText.caption}>Simulated · no file</Text>}
      </View>
      <Text style={styles.format}>{item.fmtShort}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.timer}>{formatDuration(position)}</Text>
      <View accessible accessibilityRole="progressbar" accessibilityLabel="Preview position" accessibilityValue={{ min: 0, max: 100, now: percentage }} style={styles.track}>
        <View style={[styles.progress, { width: `${percentage}%` }]} />
      </View>
      <CreatorIconButton label={`File information for ${item.name}`} glyph="info" onPress={onInfo} />
      <CreatorIconButton label={`Save or share ${item.name}`} glyph="share" onPress={onShare} />
    </View>
  </MatteCard>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  play: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.signalCrimson,
    boxShadow: '0 4px 14px rgba(239,51,73,0.3)', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: spacing.xxs },
  name: { ...creatorText.body, fontFamily: typography.family.semibold },
  format: { ...creatorText.caption, color: colors.porcelain, fontSize: 11, fontFamily: typography.family.semibold,
    backgroundColor: colors.graphiteElevated, borderRadius: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  timer: { ...creatorText.caption, fontSize: 11, minWidth: 34, fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: spacing.xs, overflow: 'hidden', borderRadius: radius.pill, backgroundColor: colors.hairlineStrong },
  progress: { height: '100%', backgroundColor: colors.electricCoral },
});
