import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Redirect, useFocusEffect, useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { AppHeader } from '@/components/AppHeader';
import { AppScreen } from '@/components/AppScreen';
import { AudioLevelMeter } from '@/components/AudioLevelMeter';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { ButtonSurface } from '@/components/ButtonSurface';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CreatorActionRow, creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { RecorderTransport } from '@/components/RecorderTransport';
import { RecordingTimer } from '@/components/RecordingTimer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { MediaStepRail } from '@/components/StudioMediaShell';
import { StudioIcon } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { WaveformTimeline } from '@/components/WaveformTimeline';
import { studioRoute } from '@/navigation/studioRoutes';
import type { NoiseProfile, RecorderStatus } from '@/services/AudioEngine';
import { demoPeak } from '@/services/demoWaveform';
import { minimumTakeSeconds, MockAudioEngine } from '@/services/MockAudioEngine';
import { noiseOptions, type Project, useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, icon, motion, radius, spacing, typography } from '@/theme/theme';

const statusLabels: Record<RecorderStatus, string> = {
  idle: 'Ready to record', preparing: 'Preparing microphone…', recording: 'Recording', paused: 'Paused',
  processing: 'Processing', finished: 'Take saved', denied: 'Microphone blocked',
};
const noiseDescriptions: Record<NoiseProfile, string> = {
  natural: 'Natural keeps your voice untouched with very light cleanup.',
  clean: 'Clean gently reduces hiss and room hum.',
  strong: 'Strong Clean works harder on noisy rooms.',
};

function RecordingStatus({ status }: { status: RecorderStatus }) {
  const { reduceMotion } = useMotionPreference();
  const pulse = useSharedValue(1);
  const pulsing = status === 'recording' || status === 'preparing';
  useEffect(() => {
    pulse.set(1);
    if (pulsing && !reduceMotion) pulse.set(withRepeat(withSequence(
      withTiming(motion.recordPulse.minOpacity, { duration: motion.recordPulse.duration / 2 }),
      withTiming(1, { duration: motion.recordPulse.duration / 2 }),
    ), -1));
    return () => cancelAnimation(pulse);
  }, [pulse, pulsing, reduceMotion]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  const color = status === 'recording' ? colors.signalCrimson : status === 'paused' || status === 'denied'
    ? colors.electricCoral : status === 'finished' ? colors.porcelain : colors.textTertiary;

  return <View accessibilityLiveRegion="polite" style={styles.chip}>
    <Animated.View aria-hidden style={[styles.dot, { backgroundColor: color }, animated]} />
    <Text style={styles.chipLabel}>{statusLabels[status]}</Text>
  </View>;
}

export default function RecordRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useCreatorStudio((state) => state.projects.find((item) => item.id === projectId));
  if (!project) return <Redirect href="/(tabs)/projects" />;
  return <Recorder key={project.id} project={project} />;
}

function Recorder({ project }: { project: Project }) {
  const router = useRouter();
  const toast = useStatusToast();
  const headphones = useCreatorStudio((state) => state.headphones);
  const setHeadphones = useCreatorStudio((state) => state.setHeadphones);
  const preferences = useCreatorStudio((state) => state.preferences);
  const saved = useCreatorStudio((state) => state.takes[project.id]);
  const saveTake = useCreatorStudio((state) => state.saveTake);
  const [engine] = useState(() => new MockAudioEngine({
    noise: preferences.noise,
    monitoring: headphones && preferences.monitor,
    take: saved ?? (project.dur > 0 ? {
      duration: project.dur, noise: preferences.noise,
      peaks: Array.from({ length: Math.floor(project.dur * 1000 / motion.waveformTickMs) }, (_, index) => demoPeak(index, project.seed)),
    } : undefined),
  }));
  const { status, monitoring, noise, interrupted } = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const [displayFrame, setDisplayFrame] = useState(engine.getFrame);
  const frame = useSharedValue(displayFrame);
  const level = useDerivedValue(() => frame.get().level);
  const [statesOpen, setStatesOpen] = useState(false);
  const [storageLow, setStorageLow] = useState(false);
  const [headphoneWarningDismissed, setHeadphoneWarningDismissed] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingExit = useRef<{ repeat: () => void; resume: boolean } | null>(null);
  const [openEditorWhenFinished, setOpenEditorWhenFinished] = useState(false);

  const recording = status === 'recording';
  const activeTake = recording || status === 'paused';
  const processing = status === 'processing';
  const denied = status === 'denied';
  const monitoringOn = headphones && monitoring;

  useEffect(() => {
    let lastTenth = -1;
    const unsubscribe = engine.onFrame((next) => {
      frame.set(next);
      const tenth = Math.floor(next.seconds * 10);
      if (tenth !== lastTenth || next.level === 0) {
        lastTenth = tenth;
        setDisplayFrame(next);
      }
    });
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') engine.interrupt(); });
    return () => { unsubscribe(); subscription.remove(); engine.dispose(); };
  }, [engine, frame]);

  useEffect(() => {
    engine.setMonitoring(headphones && preferences.monitor);
  }, [engine, headphones, preferences.monitor]);

  const goEditor = useCallback(() => {
    setOpenEditorWhenFinished(false);
    router.push(studioRoute(project.id, 'enhance'));
  }, [project.id, router]);

  useEffect(() => {
    if (!openEditorWhenFinished || status !== 'finished') return;
    const timeout = setTimeout(goEditor, 1000);
    return () => clearTimeout(timeout);
  }, [goEditor, openEditorWhenFinished, status]);

  const disablePrevention = usePreventRemove(activeTake || processing, ({ repeat }) => {
    if (engine.getSnapshot().status === 'processing') {
      toast('Wait for your take to finish', 'warn');
      return;
    }
    if (pendingExit.current) return;
    const resume = engine.getSnapshot().status === 'recording';
    if (resume) engine.pause();
    pendingExit.current = { repeat, resume };
    setLeaveOpen(true);
  });

  const goBack = useCallback(() => {
    if (engine.getSnapshot().status === 'finished') goEditor();
    else if (router.canGoBack()) router.back();
    else router.dismissTo('/(tabs)/home');
  }, [engine, goEditor, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => subscription.remove();
  }, [goBack]));

  function captureDraft() {
    const take = engine.getTake();
    if (take.duration > 0) saveTake(project.id, take);
    toast('Draft saved on this phone');
  }

  function confirmLeave() {
    const pending = pendingExit.current;
    if (!pending) return;
    captureDraft();
    pendingExit.current = null;
    setLeaveOpen(false);
    disablePrevention();
    pending.repeat();
  }

  function keepRecording() {
    const pending = pendingExit.current;
    pendingExit.current = null;
    setLeaveOpen(false);
    if (pending?.resume) engine.start();
  }

  function pressRecord() {
    if (preferences.haptics) void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    if (status === 'idle') engine.prepare();
    else if (recording) engine.pause();
    else if (status === 'paused') engine.start();
    else if (status === 'finished') goEditor();
  }

  function stop() {
    if (!engine.stop()) return;
    saveTake(project.id, engine.getTake());
    setOpenEditorWhenFinished(true);
  }

  function toggleHeadphones() {
    const connected = !headphones;
    setHeadphones(connected);
    setHeadphoneWarningDismissed(false);
    setStatesOpen(false);
    if (connected) toast('Wired earphones connected');
  }

  const monitoringDetail = !headphones
    ? "Connect wired earphones to hear yourself while you sing. It's off without them to avoid echo and feedback."
    : monitoringOn ? "You'll hear your voice in your earphones as you sing." : 'Turn on to hear yourself in your earphones.';
  const waveformState = status === 'idle' || status === 'processing' || status === 'finished' ? status : undefined;
  const quality = preferences.quality === '48' ? '48 kHz' : '44.1 kHz';
  const noiseLabel = noiseOptions.find((option) => option.value === noise)?.label;

  return <AppScreen scroll withDock compactDock>
    <View style={styles.page}>
      <AppHeader title={project.name} subtitle="Record your voice" onBack={goBack}
        right={<ButtonSurface accessibilityLabel="Save draft" onPress={captureDraft} disabled={processing} faceStyle={styles.save}>
          <Text style={styles.saveLabel}>Save draft</Text>
        </ButtonSurface>} />
      <MediaStepRail id={project.id} current="record" minimum={status === 'finished' ? 'enhance' : 'record'} locked={activeTake || processing} />
      <View style={styles.statusRow}>
        <RecordingStatus status={status} />
        {__DEV__ && <ButtonSurface accessibilityLabel="Prototype states" onPress={() => setStatesOpen(true)} faceStyle={styles.statesButton}>
          <Text style={creatorText.caption}>Prototype states</Text>
        </ButtonSurface>}
      </View>

      {!headphones && !headphoneWarningDismissed && <Banner icon="headphones" dismissible onDismiss={() => setHeadphoneWarningDismissed(true)}
        message="Earphones disconnected. Live monitoring is off so your speaker doesn't leak into the mic." />}
      {interrupted && <Banner message="Recording paused — a call or another app took the microphone. Your take is safe. Resume when you're ready." />}
      {storageLow && <Banner message="Storage almost full — about 9 minutes of recording left. Free up space to record longer takes." />}

      {denied ? <MatteCard padding={spacing.xl} style={styles.denied}>
        <View style={styles.deniedIcon}><StudioIcon name="micOff" size={icon.hero} color={colors.electricCoral} /></View>
        <Text accessibilityRole="header" style={styles.deniedTitle}>Microphone access is off</Text>
        <Text style={styles.deniedCopy}>Sushifyyyy needs your microphone to record. Turn it on in Settings › Apps › Sushifyyyy › Permissions.</Text>
        <PrimaryGlossyButton label="Open phone settings" style={styles.fullWidth} onPress={() => { engine.reset(); toast('Microphone allowed (simulated)'); }} />
        <ButtonSurface onPress={goBack} faceStyle={styles.notNow}><Text style={creatorText.detail}>Not now</Text></ButtonSurface>
      </MatteCard> : <>
        <View style={styles.timerBlock}>
          <RecordingTimer seconds={displayFrame.seconds} state={status} />
          <Text style={creatorText.caption}>{quality} · Mono · {noiseLabel}</Text>
        </View>
        <WaveformTimeline variant="live" liveFrame={frame} elapsed={displayFrame.seconds} state={waveformState} liveRecording={recording} />
        <AudioLevelMeter level={level} reading={displayFrame.level} recording={recording} />
        <RecorderTransport status={status} monitoring={monitoringOn} monitorDisabled={!headphones}
          stopDisabled={!activeTake || displayFrame.seconds < minimumTakeSeconds}
          onMonitor={() => engine.setMonitoring(!monitoring)} onRecord={pressRecord} onStop={stop} />

        <MatteCard style={styles.monitorCard}>
          <View style={styles.monitorRow}>
            <View style={styles.copy}>
              <Text style={styles.panelTitle}>Live monitoring</Text>
              <Text style={styles.description}>{monitoringDetail}</Text>
            </View>
            <ToggleSwitch label="Live monitoring" value={monitoringOn} disabled={!headphones} onChange={(value) => engine.setMonitoring(value)} />
          </View>
          <View style={styles.divider} />
          <View style={styles.noise}>
            <Text style={styles.panelTitle}>Noise reduction</Text>
            <SegmentedControl label="Noise reduction" options={noiseOptions} value={noise} onChange={(value) => engine.setNoiseProfile(value)} />
            <Text style={styles.description}>{`${noiseDescriptions[noise]} Results depend on your phone and room — it softens steady background noise but can't remove everything.`}</Text>
          </View>
        </MatteCard>
      </>}
    </View>

    <BottomSheet visible={statesOpen} title="Prototype recorder states" onClose={() => setStatesOpen(false)}>
      <CreatorActionRow label="Microphone permission denied" glyph="micOff" detail="Shows the blocked state" disabled={processing}
        onPress={() => { setStatesOpen(false); engine.denyPermission(); }} />
      <CreatorActionRow label={headphones ? 'Unplug earphones' : 'Plug in earphones'} glyph="headphones"
        detail={headphones ? 'Monitoring turns off' : 'Monitoring becomes available'} onPress={toggleHeadphones} />
      <CreatorActionRow label="Audio interruption" glyph="alert" detail="Like an incoming call" disabled={!activeTake}
        onPress={() => { setStatesOpen(false); engine.interrupt(); }} />
      <CreatorActionRow label={storageLow ? 'Clear storage warning' : 'Storage almost full'} glyph="folder"
        onPress={() => { setStorageLow(!storageLow); setStatesOpen(false); }} />
      <CreatorActionRow label="Reset recorder" glyph="undo" detail="Back to idle"
        onPress={() => { setOpenEditorWhenFinished(false); setStatesOpen(false); engine.reset(); }} />
    </BottomSheet>
    <ConfirmationDialog visible={leaveOpen} title="Leave this take?"
      body="You have an unsaved recording. Save it as a draft so you can finish it later."
      confirmLabel="Save draft" cancelLabel="Keep recording" onConfirm={confirmLeave} onCancel={keepRecording} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingTop: 14, paddingBottom: spacing.xxl, gap: spacing.sm },
  save: { minHeight: dims.touchTarget, minWidth: dims.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md,
    borderRadius: radius.control, borderColor: colors.dockBorder, borderWidth: 1, backgroundColor: colors.graphite },
  saveLabel: { ...creatorText.detail, color: colors.porcelain, fontFamily: typography.family.medium, textAlign: 'center' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  chip: { minHeight: 30, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.graphite, borderColor: colors.hairlineStrong, borderWidth: 1 },
  chipLabel: { ...creatorText.caption, color: colors.porcelain, fontFamily: typography.family.medium },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill },
  statesButton: { minHeight: dims.touchTarget, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.ashSilver, justifyContent: 'center', paddingHorizontal: 10 },
  timerBlock: { paddingTop: 10, paddingBottom: 6, alignItems: 'center', gap: spacing.sm },
  monitorCard: { borderRadius: radius.panel, gap: 14 },
  monitorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xxs },
  panelTitle: { ...creatorText.body, fontFamily: typography.family.semibold },
  description: { ...creatorText.caption, lineHeight: typography.size.caption * typography.lineHeight.body },
  divider: { height: 1, backgroundColor: colors.graphiteElevated },
  noise: { gap: 10 },
  denied: { alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, borderRadius: spacing.xxl, borderColor: colors.hairlineStrong },
  deniedIcon: { width: dims.createButton.size, height: dims.createButton.size, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphiteElevated },
  deniedTitle: { ...creatorText.section, textAlign: 'center', fontSize: 20 },
  deniedCopy: { ...creatorText.caption, textAlign: 'center', fontSize: typography.size.bodySmall, lineHeight: typography.size.bodySmall * typography.lineHeight.body },
  fullWidth: { alignSelf: 'stretch' },
  notNow: { minHeight: dims.touchTarget, minWidth: dims.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
});
