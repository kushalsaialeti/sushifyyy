import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { EffectSlider } from '@/components/EffectSlider';
import { MatteCard } from '@/components/MatteCard';
import { AudioTrack, CameraBackdrop, PlayDisc, TimelineStrip } from '@/components/MediaTracks';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StudioMediaFooter, StudioMediaHeader } from '@/components/StudioMediaShell';
import { useStatusToast } from '@/components/StatusToast';
import { useProjectVocalTrack, useStudioBack, useStudioMedia } from '@/hooks/useStudioMedia';
import { useVocalPreview } from '@/hooks/useVocalPreview';
import { studioRoute } from '@/navigation/studioRoutes';
import { autoSyncOffsetMs, isInSync, stepBack, type ProjectMedia, type VideoSync } from '@/services/projectMedia';
import { formatDuration, type Project } from '@/store/creatorStudio';
import { colors, radius, spacing } from '@/theme/theme';

const filmFrames = [0, 1, 2, 3, 4, 5, 6, 7];
const stripHeight = 48;
const ms = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)} ms`;
const seconds = (value: number) => `${value.toFixed(1)} s`;

export default function SyncRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, media, update } = useStudioMedia(projectId);
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(projectId, 'record')} />;
  if (!media.video) return <Redirect href={studioRoute(projectId, 'video')} />;
  return <SyncScreen key={projectId} project={project} videoDuration={media.video.duration} media={media} update={update} />;
}

function SyncScreen({ project, videoDuration, media, update }: {
  project: Project; videoDuration: number; media: ProjectMedia; update: (fn: (current: ProjectMedia) => ProjectMedia) => boolean;
}) {
  const id = project.id;
  const router = useRouter();
  const toast = useStatusToast();
  const vocal = useProjectVocalTrack(project);
  const duration = Math.min(vocal.duration, videoDuration);
  const maxTrim = Math.min(10, Math.max(0, duration - 0.1));
  const trim = Math.min(maxTrim, media.sync.trimSeconds);
  const [preview, setPreview] = useState<Partial<VideoSync> | null>(null);
  const offset = preview?.offsetMs ?? media.sync.offsetMs;
  const displayedTrim = Math.min(maxTrim, preview?.trimSeconds ?? trim);
  const { playing, position, pause, toggle } = useVocalPreview({ start: trim, end: duration }, duration, trim);
  const synced = isInSync(offset);
  const audioPeaks = useMemo(() => vocal.peaks.slice(0, Math.max(1, Math.ceil(duration / (vocal.duration || 1) * vocal.peaks.length))),
    [duration, vocal.duration, vocal.peaks]);

  const back = useCallback(() => router.dismissTo(studioRoute(id, stepBack('sync', media))), [id, media, router]);
  useStudioBack(back);

  function save(patch: Partial<VideoSync>) {
    update((current) => ({ ...current, sync: { ...current.sync, ...patch } }));
  }

  return <AppScreen scroll withDock compactDock
    header={<StudioMediaHeader id={id} title="Sync & preview" subtitle="Line up video with your song" backLabel="Back to camera" onBack={back} />}
    footer={<StudioMediaFooter><PrimaryGlossyButton label="Continue to export" style={styles.fill} onPress={() => {
      pause(); update((current) => ({ ...current, exportKind: 'video' })); router.push(studioRoute(id, 'export'));
    }} /></StudioMediaFooter>}>
    <View style={styles.page}>
      <ButtonSurface accessibilityLabel={`${playing ? 'Pause preview' : 'Play preview'}. ${synced ? 'In sync' : 'Check sync'}`} onPress={toggle} faceStyle={styles.preview}>
        <CameraBackdrop compact />
        {!playing && <PlayDisc />}
        <View style={styles.previewInfo} pointerEvents="none">
          <Text style={styles.pill}>{formatDuration(position)} / {formatDuration(duration)}</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.pill, !synced && styles.warning]}>{synced ? 'In sync' : 'Check sync'}</Text>
        </View>
      </ButtonSurface>
      <View style={styles.track}>
        <Text style={creatorText.caption}>Video</Text>
        <TimelineStrip dark progress={duration > 0 ? position / duration : 0} trimFraction={duration > 0 ? displayedTrim / duration : 0} marker={colors.signalCrimson}>
          <View style={styles.film}>{filmFrames.map((frame) => <View key={frame} style={[styles.frame, frame % 2 === 1 && styles.frameAlt]} />)}</View>
        </TimelineStrip>
      </View>
      <AudioTrack title="Audio" kind="vocal" samples={audioPeaks} duration={duration} position={position}
        height={stripHeight} offset={Math.max(-1, Math.min(1, offset / 1000 / (duration || 1) * 6))} />
      <MatteCard style={styles.sliders}>
        <EffectSlider label="Audio offset" hint="Move the audio earlier (−) or later (+)." min={-500} max={500} step={10}
          value={media.sync.offsetMs} format={ms} onPreview={(value) => setPreview(value === null ? null : { offsetMs: value })}
          onChange={(value) => save({ offsetMs: value })} />
        <EffectSlider label="Trim video start" hint="Cut the moment before you begin." min={0} max={maxTrim} step={0.1}
          value={trim} format={seconds} onPreview={(value) => setPreview(value === null ? null : { trimSeconds: value })}
          onChange={(value) => save({ trimSeconds: value })} />
        <SecondaryButton label="Auto-sync" onPress={() => { setPreview(null); save({ offsetMs: autoSyncOffsetMs }); toast('Synced — audio moved +80 ms'); }} />
      </MatteCard>
      <Text style={styles.hint}>Bluetooth earphones and some phones add a small delay. If your lips look early or late, nudge the audio offset until it feels right.</Text>
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xs, paddingBottom: spacing.lg, gap: spacing.md },
  preview: { height: 270, borderRadius: radius.panel, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairlineStrong,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite },
  previewInfo: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  pill: { ...creatorText.caption, color: colors.porcelain, backgroundColor: colors.obsidian, overflow: 'hidden', borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: spacing.xs, fontVariant: ['tabular-nums'] },
  warning: { color: colors.electricCoral },
  track: { gap: 6 },
  film: { height: stripHeight, flexDirection: 'row', gap: spacing.xxs, backgroundColor: colors.obsidian },
  frame: { flex: 1, backgroundColor: colors.graphiteElevated },
  frameAlt: { backgroundColor: colors.hairlineStrong },
  sliders: { gap: 10, borderRadius: 18 },
  hint: { ...creatorText.caption, paddingHorizontal: spacing.xs, lineHeight: 18 },
});
