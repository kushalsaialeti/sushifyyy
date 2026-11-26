import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Redirect, useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppScreen } from '@/components/AppScreen';
import { creatorText } from '@/components/CreatorScreenElements';
import { ExportForm } from '@/components/ExportForm';
import { ExportProgress } from '@/components/ExportProgress';
import { GlossFill } from '@/components/GlossFill';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StudioMediaFooter, StudioMediaHeader } from '@/components/StudioMediaShell';
import { StudioIcon } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { useStudioBack, useStudioMedia } from '@/hooks/useStudioMedia';
import { studioRoute } from '@/navigation/studioRoutes';
import { describeExport, exportBaseName, type ExportRequest } from '@/services/Exporter';
import { createExporter } from '@/services/MockExporter';
import { exportLocations, stepBack, type ExportSettings, type ProjectMedia } from '@/services/projectMedia';
import { defaultVocalEffects, trimFor } from '@/services/vocalEditor';
import { type Project, useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, motion, radius, spacing, typography } from '@/theme/theme';

const enterBadge = ZoomIn.duration(motion.successPop.duration).withInitialValues({ transform: [{ scale: motion.successPop.fromScale }] });

export default function ExportRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, media, update } = useStudioMedia(projectId);
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(projectId, 'record')} />;
  return <ExportScreen key={projectId} project={project} media={media} update={update} />;
}

function ExportScreen({ project, media, update }: {
  project: Project; media: ProjectMedia; update: (update: (current: ProjectMedia) => ProjectMedia) => boolean;
}) {
  const { id, name, dur } = project;
  const router = useRouter();
  const toast = useStatusToast();
  const { reduceMotion } = useMotionPreference();
  const preferences = useCreatorStudio((state) => state.preferences);
  const history = useCreatorStudio((state) => state.editorHistories[id]);
  const beginExport = useCreatorStudio((state) => state.beginExport);
  const releaseExport = useCreatorStudio((state) => state.releaseExport);
  const completeExport = useCreatorStudio((state) => state.completeExport);
  const [exporter] = useState(createExporter);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const activeJob = useRef<string | null>(null);
  const snapshot = useSyncExternalStore(exporter.subscribe, exporter.getSnapshot);
  const running = snapshot.state === 'running';
  const form = snapshot.state === 'form';

  const initialSettings: ExportSettings = { name, format: preferences.format, quality: 'high', resolution: '1080', location: exportLocations[0] };
  const settings = media.exportSettings ?? initialSettings;
  const kind = media.video ? media.exportKind : 'audio';
  const description = describeExport(kind, settings, dur);
  const trim = trimFor(history?.snapshots[history.index] ?? defaultVocalEffects, dur);
  const duration = trim.end - trim.start;

  useEffect(() => () => {
    exporter.dispose();
    if (activeJob.current) {
      releaseExport(activeJob.current);
      activeJob.current = null;
    }
  }, [exporter, releaseExport]);

  const back = useCallback(() => {
    if (exporter.getSnapshot().state !== 'running') router.dismissTo(studioRoute(id, stepBack('export', media)));
  }, [exporter, id, media, router]);
  useStudioBack(back);
  usePreventRemove(running, () => toast('Wait for the export to finish', 'warn'));

  function start() {
    const jobId = beginExport(id);
    if (!jobId) return;
    activeJob.current = jobId;
    Keyboard.dismiss();
    if (preferences.haptics) void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    const request: ExportRequest = {
      id: jobId, projectId: id, kind, duration, description, settings: { ...settings, name: exportBaseName(settings.name, name) },
      simulateFailure: __DEV__ && simulateFailure,
    };
    const started = exporter.start(request, (settlement) => {
      if (settlement.state === 'complete') completeExport(settlement.request, settlement.result);
      else releaseExport(settlement.request.id);
      activeJob.current = null;
    });
    if (!started) {
      releaseExport(jobId);
      activeJob.current = null;
    }
  }

  return <AppScreen scroll withDock compactDock keyboardAvoiding scrollContentStyle={styles.scroll}
    header={<StudioMediaHeader id={id} title="Export" step="export" onBack={back} locked={running} />}
    footer={form && <StudioMediaFooter><PrimaryGlossyButton label={kind === 'video' ? 'Export video' : 'Export audio'} style={styles.fill} onPress={start} /></StudioMediaFooter>}>
    {form && <ExportForm settings={settings} kind={kind} hasVideo={!!media.video} duration={duration} description={description}
      simulateFailure={simulateFailure} onSimulateFailure={() => setSimulateFailure((value) => !value)}
      onSettings={(patch) => update((current) => ({ ...current, exportSettings: { ...(current.exportSettings ?? initialSettings), ...patch } }))}
      onKind={(value) => update((current) => value === 'video' && !current.video ? current : { ...current, exportKind: value })} />}
    {snapshot.state === 'running' && <ExportProgress progress={snapshot.progress} phase={snapshot.phase} cancellable={snapshot.phase !== 'saving'}
      detail={`${snapshot.request.settings.name}.${snapshot.request.description.extension} · ${snapshot.request.description.estimatedSize}`}
      onCancel={() => { if (exporter.cancel()) toast('Export cancelled', 'warn'); }} />}
    {snapshot.state === 'complete' && <View style={styles.result}>
      <Animated.View entering={reduceMotion ? undefined : enterBadge} style={styles.successBadge} aria-hidden>
        <GlossFill /><StudioIcon name="check" size={38} strokeWidth={2.4} color={colors.textOnLight} />
      </Animated.View>
      <Text accessibilityRole="header" style={styles.title}>Export complete</Text>
      <Text accessibilityLiveRegion="polite" style={styles.copy}>{snapshot.result.kind === 'simulated'
        ? `${snapshot.request.settings.name}.${snapshot.request.description.extension} would now be in ${snapshot.request.settings.location}. This is a simulated export — no file was created by the prototype.`
        : `${snapshot.request.settings.name}.${snapshot.request.description.extension} was saved to ${snapshot.request.settings.location}.`}</Text>
      <PrimaryGlossyButton label="View in Exports" style={styles.primaryResult} onPress={() => router.dismissTo('/(tabs)/exports')} />
      <SecondaryButton label="Back to Home" style={styles.fullWidth} onPress={() => router.dismissTo('/(tabs)/home')} />
    </View>}
    {snapshot.state === 'failed' && <View style={styles.result}>
      <Animated.View entering={reduceMotion ? undefined : enterBadge} style={styles.failureBadge} aria-hidden>
        <StudioIcon name="alert" size={36} color={colors.electricCoral} />
      </Animated.View>
      <Text accessibilityRole="header" style={styles.title}>{"Export didn't finish"}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.copy}>Something interrupted saving at {snapshot.progress}%. Your project is safe and nothing was lost.</Text>
      <PrimaryGlossyButton label="Try again" style={styles.primaryResult} onPress={start} />
      <SecondaryButton label="Change settings" style={styles.fullWidth} onPress={() => exporter.reset()} />
    </View>}
  </AppScreen>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  fill: { flex: 1 },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xxl },
  successBadge: { width: 84, height: 84, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.porcelain,
    alignItems: 'center', justifyContent: 'center' },
  failureBadge: { width: 84, height: 84, borderRadius: radius.pill, borderColor: colors.ashSilver, borderWidth: 1,
    backgroundColor: colors.graphiteElevated, alignItems: 'center', justifyContent: 'center' },
  title: { ...creatorText.title, fontSize: 26, textAlign: 'center' },
  copy: { ...creatorText.detail, fontSize: typography.size.bodySmall, lineHeight: typography.size.bodySmall * typography.lineHeight.body,
    maxWidth: 300, textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  primaryResult: { alignSelf: 'stretch', marginTop: spacing.sm },
});
