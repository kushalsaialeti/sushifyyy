import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppScreen } from '@/components/AppScreen';
import { ButtonSurface } from '@/components/ButtonSurface';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { creatorText } from '@/components/CreatorScreenElements';
import { GlossFill } from '@/components/GlossFill';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { MediaStepRail } from '@/components/StudioMediaShell';
import { StudioIcon } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { VocalEffectGroups } from '@/components/VocalEffectGroups';
import { WaveformTimeline } from '@/components/WaveformTimeline';
import { useVocalPreview } from '@/hooks/useVocalPreview';
import { studioRoute } from '@/navigation/studioRoutes';
import { demoPeak } from '@/services/demoWaveform';
import { defaultVocalEffects, enhancedPeaks, trimEdit, trimFor, type Trim, type VocalEffects } from '@/services/vocalEditor';
import { formatDuration, type Project, useCreatorStudio } from '@/store/creatorStudio';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

const compareOptions = [{ value: 'original', label: 'Original' }, { value: 'enhanced', label: 'Enhanced' }] as const;

function EditorIconButton({ label, glyph, disabled, onPress }: {
  label: string;
  glyph: 'undo' | 'redo' | 'plus' | 'minus';
  disabled: boolean;
  onPress: () => void;
}) {
  return <ButtonSurface accessibilityLabel={label} disabled={disabled} onPress={onPress} faceStyle={styles.tool}>
    <StudioIcon name={glyph} color={disabled ? colors.textTertiary : colors.porcelain} size={icon.inline} />
  </ButtonSurface>;
}

export default function EnhanceRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useCreatorStudio((state) => state.projects.find((item) => item.id === projectId));
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(project.id, 'record')} />;
  return <VocalEditor key={project.id} project={project} />;
}

function VocalEditor({ project }: { project: Project }) {
  const { id, dur: duration, seed } = project;
  const router = useRouter();
  const toast = useStatusToast();
  const take = useCreatorStudio((state) => state.takes[id]);
  const history = useCreatorStudio((state) => state.editorHistories[id]);
  const editVocals = useCreatorStudio((state) => state.editVocals);
  const moveHistory = useCreatorStudio((state) => state.moveVocalHistory);
  const restoreEffects = useCreatorStudio((state) => state.restoreVocalEffects);
  const updateMedia = useCreatorStudio((state) => state.updateProjectMedia);
  const [compare, setCompare] = useState<(typeof compareOptions)[number]['value']>('enhanced');
  const [zoom, setZoom] = useState(1);
  const [preview, setPreview] = useState<Partial<VocalEffects> | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const demo = id === 'p1' && !take;
  const fallbackEffects = useMemo(() => ({ ...defaultVocalEffects, noise: take?.noise ?? defaultVocalEffects.noise }), [take?.noise]);
  const committed = history?.snapshots[history.index] ?? fallbackEffects;
  const effects = useMemo(() => preview ? { ...committed, ...preview } : committed, [committed, preview]);
  const committedTrim = useMemo(() => trimFor(committed, duration), [committed, duration]);
  const trim = useMemo(() => trimFor(effects, duration), [effects, duration]);
  const { position, playing, pause, seek, toggle } = useVocalPreview(committedTrim, duration, demo ? 52 : committedTrim.start);

  const originalPeaks = useMemo(() => take?.peaks.length ? take.peaks :
    Array.from({ length: Math.ceil(duration * 4) }, (_, index) => demoPeak(index, seed)), [duration, seed, take]);
  const peaks = useMemo(() => compare === 'enhanced' ? enhancedPeaks(originalPeaks, duration, effects) : originalPeaks,
    [compare, duration, effects, originalPeaks]);

  const backToRecorder = useCallback(() => {
    pause();
    router.dismissTo(studioRoute(id, 'record'));
  }, [id, pause, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { backToRecorder(); return true; });
    return () => subscription.remove();
  }, [backToRecorder]));

  const previewEffects = useCallback((patch: Partial<VocalEffects> | null) => {
    if (patch && ('trimStart' in patch || 'trimEnd' in patch)) pause();
    setPreview(patch);
  }, [pause]);

  const commit = useCallback((patch: Partial<VocalEffects>) => {
    if ('trimStart' in patch || 'trimEnd' in patch) pause();
    editVocals(id, patch);
    setPreview(null);
  }, [editVocals, id, pause]);

  const previewHandle = useCallback((edge: keyof Trim, seconds: number) => {
    setPreview(trimEdit(edge, seconds, committedTrim, duration));
  }, [committedTrim, duration]);
  const commitHandle = useCallback((edge: keyof Trim, seconds: number) => {
    commit(trimEdit(edge, seconds, committedTrim, duration));
  }, [commit, committedTrim, duration]);
  const cancelHandle = useCallback(() => setPreview(null), []);

  function openNext(step: 'video' | 'karaoke') {
    pause();
    if (step === 'video') updateMedia(id, (media) => ({ ...media, includeKaraoke: false }));
    router.push(studioRoute(id, step));
  }

  return <AppScreen scroll withDock compactDock header={<View style={styles.header}>
    <AppHeader title={project.name} subtitle="Enhance your vocals" onBack={backToRecorder} backLabel="Back to recorder" fitActions
      right={<View style={styles.tools}>
        <EditorIconButton label="Undo" glyph="undo" disabled={!history || history.index === 0} onPress={() => {
          setPreview(null);
          moveHistory(id, -1);
        }} />
        <EditorIconButton label="Redo" glyph="redo" disabled={!history || history.index === history.snapshots.length - 1} onPress={() => {
          setPreview(null);
          moveHistory(id, 1);
        }} />
      </View>} />
    <MediaStepRail id={id} current="enhance" />
  </View>} footer={<View style={styles.footer}>
    <SecondaryButton label="Skip to Video" style={styles.skip} onPress={() => openNext('video')} />
    <PrimaryGlossyButton label="Continue to Karaoke" style={styles.continue} onPress={() => openNext('karaoke')} />
  </View>}>
    <View style={styles.page}>
      <View style={styles.compareRow}>
        <View style={styles.flex}><SegmentedControl label="Compare" options={compareOptions} value={compare} onChange={setCompare} /></View>
        <View style={styles.zoomTools}>
          <EditorIconButton label="Zoom out" glyph="minus" disabled={zoom === 1} onPress={() => setZoom((value) => Math.max(1, value / 2))} />
          <EditorIconButton label="Zoom in" glyph="plus" disabled={zoom === 8} onPress={() => setZoom((value) => Math.min(8, value * 2))} />
        </View>
      </View>

      <WaveformTimeline variant="trimmed" samples={peaks} duration={duration} playhead={position} zoom={zoom}
        trim={trim} onSeek={seek} trimActions={{ onStart: pause, onPreview: previewHandle, onCommit: commitHandle, onCancel: cancelHandle }} />

      <View style={styles.transport}>
        <Text style={styles.position}>{formatDuration(position)}</Text>
        <ButtonSurface accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={toggle} faceStyle={styles.play}>
          <GlossFill />
          <StudioIcon name={playing ? 'pause' : 'play'} size={icon.button} strokeWidth={2.8} color={colors.textOnLight}
            fill={playing ? undefined : colors.textOnLight} />
        </ButtonSurface>
        <View style={styles.flex}>
          <Text style={styles.info}>Length {formatDuration(trim.end - trim.start)} of {formatDuration(duration)}{compare === 'original' ? ' · hearing original' : ''}</Text>
          <Text style={styles.info}>Zoom {zoom}× · Original stays safe</Text>
        </View>
      </View>

      <View style={styles.effectsHeading}>
        <Text accessibilityRole="header" style={creatorText.section}>Effects</Text>
        <ButtonSurface onPress={() => { pause(); setPreview(null); setRestoreOpen(true); }} faceStyle={styles.restore}>
          <Text style={creatorText.detail}>Restore defaults</Text>
        </ButtonSurface>
      </View>
      <VocalEffectGroups committed={committed} effects={effects} trim={trim} committedTrim={committedTrim} duration={duration}
        initiallyOpen={demo ? 'space' : 'volume'} onPreview={previewEffects} onCommit={commit} />
    </View>
    <ConfirmationDialog visible={restoreOpen} title="Restore default effects?"
      body="Resets level, reverb, tone, smoothing, fades and cleanup. Your trim is kept, and you can undo this."
      confirmLabel="Restore" onCancel={() => setRestoreOpen(false)} onConfirm={() => {
        restoreEffects(id);
        setRestoreOpen(false);
        toast('Effects restored to defaults');
      }} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screenX, paddingTop: 14, gap: spacing.sm },
  page: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.lg, gap: spacing.md },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  tools: { flexDirection: 'row', gap: spacing.sm },
  zoomTools: { flexDirection: 'row', gap: spacing.xs },
  tool: { width: dims.touchTarget, height: dims.touchTarget, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.control, borderWidth: 1, borderColor: colors.dockBorder, backgroundColor: colors.graphite },
  transport: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  position: { ...creatorText.detail, color: colors.porcelain, minWidth: 46, fontVariant: ['tabular-nums'] },
  play: { width: dims.playButton, height: dims.playButton, borderRadius: radius.pill, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.porcelain },
  info: { ...creatorText.caption, lineHeight: typography.size.caption * 1.4 },
  effectsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  restore: { minHeight: dims.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'stretch', gap: 10, paddingHorizontal: spacing.screenX, paddingTop: spacing.md, paddingBottom: 14,
    backgroundColor: colors.footer, borderTopColor: colors.hairline, borderTopWidth: 1 },
  skip: { flex: 1, justifyContent: 'center', minHeight: dims.input.height },
  continue: { flex: 1.4, justifyContent: 'center' },
});
