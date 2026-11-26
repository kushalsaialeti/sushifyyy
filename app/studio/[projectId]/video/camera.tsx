import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreen } from '@/components/AppScreen';
import { Banner } from '@/components/Banner';
import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { CameraBackdrop } from '@/components/MediaTracks';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StudioIcon } from '@/components/StudioIcon';
import { useStudioBack, useStudioMedia } from '@/hooks/useStudioMedia';
import { studioRoute } from '@/navigation/studioRoutes';
import { defaultSync, stepBack, type CameraFacing, type ProjectMedia } from '@/services/projectMedia';
import { MockVideoRecorder, type VideoRecorder } from '@/services/VideoRecorder';
import { formatDuration, useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, icon, motion, radius, spacing, typography } from '@/theme/theme';

function cameraTime(seconds: number) {
  return formatDuration(seconds).padStart(5, '0');
}

function CameraCaptureButton({ recording, onPress }: { recording: boolean; onPress: () => void }) {
  const { reduceMotion } = useMotionPreference();
  const morph = useSharedValue(recording ? 1 : 0);
  useEffect(() => {
    const target = recording ? 1 : 0;
    morph.set(reduceMotion ? target : withTiming(target, { duration: 220, easing: Easing.bezier(0.3, 1.2, 0.5, 1) }));
  }, [morph, recording, reduceMotion]);
  const anim = useAnimatedStyle(() => {
    const progress = morph.get();
    return { width: 64 - 34 * progress, height: 64 - 34 * progress, borderRadius: 32 - 24 * progress };
  });

  return <ButtonSurface accessibilityLabel={recording ? 'Stop video' : 'Record video'} onPress={onPress} faceStyle={styles.record}>
    <Animated.View aria-hidden style={[styles.inner, anim]} />
  </ButtonSurface>;
}

function CameraTimer({ seconds, recording }: { seconds: number; recording: boolean }) {
  const { reduceMotion } = useMotionPreference();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(1);
    if (recording && !reduceMotion) pulse.set(withRepeat(withTiming(motion.recordPulse.minOpacity, { duration: motion.recordPulse.duration / 2 }), -1, true));
    return () => cancelAnimation(pulse);
  }, [pulse, recording, reduceMotion]);
  const dot = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return <View accessibilityLabel={`Video time ${cameraTime(seconds)}`} accessible style={styles.timer}>
    <Animated.View aria-hidden style={[styles.dot, recording && styles.dotRecording, dot]} />
    <Text style={[styles.timerText, recording && styles.recordingText]}>{cameraTime(seconds)}</Text>
  </View>;
}

export default function CameraRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, media, update } = useStudioMedia(projectId);
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(projectId, 'record')} />;
  return <CameraScreen key={projectId} id={projectId} media={media} update={update} />;
}

function CameraScreen({ id, media, update }: { id: string; media: ProjectMedia; update: (fn: (current: ProjectMedia) => ProjectMedia) => boolean }) {
  const router = useRouter();
  const [recorder] = useState<VideoRecorder>(() => new MockVideoRecorder());
  const [facing, setFacing] = useState<CameraFacing>(media.video?.facing ?? 'front');
  const [recording, setRecording] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const headphones = useCreatorStudio((state) => state.headphones);
  const haptics = useCreatorStudio((state) => state.preferences.haptics);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const take = !recording && !retaking ? media.video : null;

  const close = useCallback(() => {
    recorder.discard();
    router.dismissTo(studioRoute(id, stepBack('camera', media)));
  }, [id, media, recorder, router]);
  useStudioBack(close);

  useFocusEffect(useCallback(() => () => { recorder.discard(); setRecording(false); setSeconds(0); }, [recorder]));
  useEffect(() => {
    if (!recording) return;
    const clock = setInterval(() => setSeconds(recorder.elapsed()), motion.waveformTickMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      recorder.discard();
      setRecording(false);
      setSeconds(0);
      setInterrupted(true);
    });
    return () => { clearInterval(clock); subscription.remove(); };
  }, [recorder, recording]);

  function capture() {
    if (haptics) void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    if (recording) {
      const result = recorder.stop(facing);
      if (!result) return;
      update((current) => ({ ...current, video: result, sync: defaultSync }));
      setRecording(false);
      setRetaking(false);
      return;
    }
    recorder.start(facing);
    setInterrupted(false);
    setSeconds(0);
    setRecording(true);
  }

  const guidance = headphones ? (recording ? 'Your mix is playing in your earphones — sing along.' :
    'When you start, your finished mix plays in your earphones so you can perform in sync.') :
    'Connect earphones for the best sync. Without them, the mix plays quietly from your speaker.';
  return <AppScreen scroll withDock compactDock>
    <View style={[styles.page, { minHeight: Math.max(470, height - insets.top - insets.bottom - dims.dock.height) }]}>
      <CameraBackdrop />
      <View style={styles.header}>
        <View style={styles.bar}>
          <ButtonSurface accessibilityLabel="Close camera" onPress={close} faceStyle={styles.iconButton}><StudioIcon name="close" size={icon.button} /></ButtonSurface>
          <CameraTimer recording={recording} seconds={take?.duration ?? seconds} />
          <ButtonSurface accessibilityLabel="Switch camera" onPress={() => setFacing((current) => current === 'front' ? 'back' : 'front')}
            faceStyle={styles.iconButton}><StudioIcon name="flip" size={icon.button} /></ButtonSurface>
        </View>
        <Text style={styles.mode}>Camera preview · {facing === 'front' ? 'Front camera' : 'Back camera'}</Text>
        {interrupted && <Banner message="Camera interrupted. Start again when you're ready." />}
      </View>
      <View style={styles.preview}>
        {take && <View style={styles.recorded}><Text style={styles.recordedText}>Take recorded · {cameraTime(take.duration)}</Text></View>}
      </View>
      <View style={styles.bottom}>
        <Banner icon="headphones" message={guidance} />
        <View style={styles.transport}>
          <SecondaryButton label="Retake" disabled={!take} style={styles.action} onPress={() => { recorder.discard(); setRetaking(true); setSeconds(0); }} />
          <CameraCaptureButton recording={recording} onPress={capture} />
          <PrimaryGlossyButton label="Next" compact disabled={!take} style={styles.action} onPress={() => router.push(studioRoute(id, 'video/sync'))} />
        </View>
      </View>
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.lg, paddingHorizontal: spacing.screenX, paddingBottom: 36, backgroundColor: colors.obsidian },
  header: { gap: spacing.md },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  iconButton: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.scrim },
  mode: { ...creatorText.caption, textAlign: 'center' },
  timer: { minHeight: 34, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.scrim },
  timerText: { ...creatorText.body, fontFamily: typography.family.semibold, fontVariant: ['tabular-nums'] },
  recordingText: { color: colors.electricCoral },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.textTertiary },
  dotRecording: { backgroundColor: colors.signalCrimson },
  preview: { minHeight: 160, flex: 1, alignItems: 'center', justifyContent: 'center' },
  recorded: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.porcelain },
  recordedText: { ...creatorText.body, color: colors.textOnLight, fontSize: typography.size.bodySmall, fontFamily: typography.family.semibold },
  bottom: { gap: spacing.xl },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  record: { width: 84, height: 84, borderRadius: radius.pill, borderWidth: dims.recordButton.ring, borderColor: colors.porcelain,
    alignItems: 'center', justifyContent: 'center' },
  inner: { backgroundColor: colors.signalCrimson },
  action: { width: 80 },
});
