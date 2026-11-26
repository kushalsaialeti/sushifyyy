import { StyleSheet, Text, View } from 'react-native';

import { CreatorIconButton, creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { PreviewWaveform } from '@/components/PreviewWaveform';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { StudioIcon } from '@/components/StudioIcon';
import { formatDuration, type Project } from '@/store/creatorStudio';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

export function ProjectBadge({ status, withDot }: { status: Project['status']; withDot?: boolean }) {
  const completed = status === 'Completed';
  return <View style={styles.badge}>
    {withDot && <View aria-hidden style={[styles.dot, { backgroundColor: completed ? colors.signalCrimson : colors.textTertiary }]} />}
    <Text style={[styles.badgeLabel, completed && styles.completed]}>{status}</Text>
  </View>;
}

export function ProjectCard({ project, onOpen, onMenu }: { project: Project; onOpen: () => void; onMenu: () => void }) {
  return <MatteCard padding={14} style={styles.card}>
    <View style={styles.row}>
      <View aria-hidden style={styles.media}><StudioIcon name={project.media === 'video' ? 'video' : 'mic'} size={icon.button} /></View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={creatorText.cardTitle}>{project.name}</Text>
        <Text style={creatorText.caption}>{project.date} · {formatDuration(project.dur)} · {project.media === 'video' ? 'Audio + video' : 'Audio'}</Text>
      </View>
      <CreatorIconButton label={`More options for ${project.name}`} glyph="more" plain onPress={onMenu} />
    </View>
    <View style={styles.row}>
      <ProjectBadge status={project.status} withDot />
      <View style={styles.wave}><PreviewWaveform seed={project.seed} variant="project" /></View>
      <PrimaryGlossyButton label="Open" compact onPress={onOpen} />
    </View>
  </MatteCard>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  media: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.input,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphiteElevated },
  copy: { flex: 1, gap: spacing.xxs },
  wave: { flex: 1, minWidth: 0 },
  badge: { borderRadius: spacing.sm, borderWidth: 1, borderColor: colors.ashSilver,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  badgeLabel: { color: colors.mutedSilver, fontFamily: typography.family.medium, fontSize: 11 },
  completed: { color: colors.porcelain },
});
