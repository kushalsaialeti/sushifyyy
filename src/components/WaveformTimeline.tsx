import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Canvas, Circle, Group, Line, Path, Rect, Text as CanvasText, useFont, usePathValue, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { StudioIcon } from '@/components/StudioIcon';
import { TrimHandle, type TrimActions } from '@/components/TrimHandle';
import type { AudioFrame } from '@/services/AudioEngine';
import { recordingWindowSeconds } from '@/services/MockAudioEngine';
import { minimumTrimLength, type Trim } from '@/services/vocalEditor';
import { formatDuration } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, icon, motion, radius, shadows, spacing, typography } from '@/theme/theme';

type Variant = 'live' | 'playback' | 'trimmed' | 'karaoke' | 'mini';
type Window = { start: number; duration: number };
type Bar = { x: number; peak: number; tone: 'normal' | 'highlight' | 'dim' };

const livePlayhead = 0.72;
const liveBuckets = recordingWindowSeconds * 1000 / motion.waveformTickMs;
const noSamples: readonly number[] = [];

function selectWindow(duration: number, playhead: number, zoom: number): Window {
  const span = duration / Math.max(1, zoom);
  const start = Math.max(0, Math.min(duration - span, playhead - span / 2));
  return { start, duration: span };
}

function makeStaticBars(samples: readonly number[], width: number, total: number, window: Window,
  played: number, trim: { start: number; end: number } | undefined): Bar[] {
  if (!samples.length || width <= 0 || total <= 0 || window.duration <= 0) return [];
  const count = Math.max(1, Math.min(samples.length, Math.floor(width / 4)));
  return Array.from({ length: count }, (_, index) => {
    const from = window.start + index / count * window.duration;
    const to = window.start + (index + 1) / count * window.duration;
    const first = Math.min(samples.length - 1, Math.floor(from / total * samples.length));
    const last = Math.min(samples.length, Math.max(first + 1, Math.ceil(to / total * samples.length)));
    let peak = 0;
    for (let i = first; i < last; i += 1) peak = Math.max(peak, samples[i]);
    const middle = (from + to) / 2;
    return { x: (index + 0.5) * width / count, peak, tone: trim && (middle < trim.start || middle > trim.end) ? 'dim' : middle <= played ? 'highlight' : 'normal' };
  });
}

export function WaveformTimeline({ variant, samples = noSamples, liveFrame, elapsed = 0, duration = 0,
  playhead = 0, highlightUntil = playhead, trim, trimActions, zoom = 1, onSeek, state, liveRecording, strip }: {
  variant: Variant;
  samples?: readonly number[];
  liveFrame?: SharedValue<AudioFrame>;
  elapsed?: number;
  duration?: number;
  playhead?: number;
  highlightUntil?: number;
  trim?: Trim;
  trimActions?: TrimActions;
  zoom?: number;
  onSeek?: (seconds: number) => void;
  state?: 'idle' | 'processing' | 'finished';
  liveRecording?: boolean;
  strip?: { height: number; shiftFraction?: number };
}) {
  const { reduceMotion } = useMotionPreference();
  const [width, setWidth] = useState(0);
  const markerFont = useFont(Inter_500Medium, 10);
  const live = variant === 'live';
  const karaoke = variant === 'karaoke';
  const mini = variant === 'mini';
  const compact = mini || !!strip;
  const height = strip?.height ?? (live ? dims.timeline.recorderHeight : karaoke || mini ? dims.timeline.trackHeight : dims.timeline.editorHeight);
  const markerBand = compact ? 0 : dims.timeline.markerBand;
  const center = markerBand + (height - markerBand) / 2;
  const window = live ? { start: Math.max(0, elapsed - recordingWindowSeconds), duration: recordingWindowSeconds / livePlayhead }
    : selectWindow(duration, playhead, zoom);
  const staticBars = live ? [] : makeStaticBars(samples, width, duration, window, highlightUntil, trim);
  const bars = useDerivedValue<Bar[]>(() => {
    if (!live) return staticBars;
    const peaks = liveFrame?.get().peaks ?? samples;
    const step = width * livePlayhead / liveBuckets;
    return peaks.map((peak, index) => ({ x: (index + 0.5) * step, peak,
      tone: liveRecording && index >= peaks.length - 5 ? 'highlight' : 'normal' }));
  });

  const amplitude = (height - markerBand) * 0.44;
  const normalPath = usePathValue((path) => {
    'worklet';
    for (const bar of bars.get()) if (bar.tone === 'normal') path.moveTo(bar.x, center).lineTo(bar.x, center - bar.peak * amplitude);
  });
  const highlightedPath = usePathValue((path) => {
    'worklet';
    for (const bar of bars.get()) if (bar.tone === 'highlight') path.moveTo(bar.x, center).lineTo(bar.x, center - bar.peak * amplitude);
  });
  const dimmedPath = usePathValue((path) => {
    'worklet';
    for (const bar of bars.get()) if (bar.tone === 'dim') path.moveTo(bar.x, center + bar.peak * amplitude * 0.72).lineTo(bar.x, center - bar.peak * amplitude);
  });
  const reflectedPath = usePathValue((path) => {
    'worklet';
    for (const bar of bars.get()) if (bar.tone !== 'dim') path.moveTo(bar.x, center + 1).lineTo(bar.x, center + bar.peak * amplitude * 0.72);
  });

  const cursor = useDerivedValue(() => {
    const relative = live ? Math.min(1, (liveFrame?.get().seconds ?? elapsed) / recordingWindowSeconds) * livePlayhead
      : (playhead - window.start) / (window.duration || 1);
    return Math.max(0, Math.min(width, relative * width));
  });
  const cursorStart = useDerivedValue(() => ({ x: cursor.get(), y: markerBand - 4 }));
  const cursorEnd = useDerivedValue(() => ({ x: cursor.get(), y: height }));
  const stride = live ? width * livePlayhead / liveBuckets : width / Math.max(1, staticBars.length);
  const strokeWidth = Math.max(1.2, stride * 0.56);

  const span = window.duration;
  const baseInterval = span > 60 ? 30 : span > 20 ? 10 : span > 8 ? 2 : 1;
  const markerCapacity = Math.max(1, Math.floor(width / 40));
  const markerInterval = live ? 1 : baseInterval * Math.max(1, Math.ceil(span / (baseInterval * markerCapacity)));
  const markers: { x: number; time: number }[] = [];
  if (!compact && width > 0 && window.duration > 0) {
    for (let time = Math.ceil(window.start / markerInterval) * markerInterval; time < window.start + window.duration; time += markerInterval) {
      markers.push({ x: (time - window.start) / window.duration * width, time });
    }
  }
  const grid = markers.map(({ x }) => `M${x} ${markerBand}V${height}`).join('');
  const tap = Gesture.Tap().enabled(!!onSeek && !live && window.duration > 0).maxDistance(8).onEnd(({ x }, success) => {
    if (success && onSeek && width > 0) scheduleOnRN(onSeek, window.start + Math.max(0, Math.min(1, x / width)) * window.duration);
  });
  const trimLeft = trim ? Math.max(0, Math.min(width, (trim.start - window.start) / (span || 1) * width)) : 0;
  const trimRight = trim ? Math.max(0, Math.min(width, (trim.end - window.start) / (span || 1) * width)) : width;
  const shortest = Math.min(minimumTrimLength, duration);
  const splitHitArea = trimRight - trimLeft < dims.touchTarget * 2;

  return <View onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)} style={[styles.container, { height }, (karaoke || mini) && styles.dark, strip && styles.track]}>
    <GestureDetector gesture={tap}>
    <View collapsable={false} style={StyleSheet.absoluteFill}
      accessible={!!onSeek} accessibilityRole={onSeek ? 'adjustable' : undefined} accessibilityLabel={onSeek ? 'Playback position' : undefined}
      accessibilityValue={onSeek ? { text: formatDuration(playhead) } : undefined}
      accessibilityActions={onSeek ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'increment') onSeek?.(Math.min(duration, playhead + 1));
        if (nativeEvent.actionName === 'decrement') onSeek?.(Math.max(0, playhead - 1));
      }}>
      {width > 0 && <Canvas aria-hidden style={StyleSheet.absoluteFill}>
        {!!grid && <Path path={grid} color={karaoke ? colors.ashSilver : colors.timelineGrid} style="stroke" strokeWidth={1} />}
        {!compact && <Line p1={vec(0, center)} p2={vec(width, center)} color={karaoke ? colors.ashSilver : colors.timelineGrid} strokeWidth={1} />}
        <Group transform={strip?.shiftFraction ? [{ translateX: strip.shiftFraction * width }] : undefined}>
        <Path path={reflectedPath} color={karaoke ? colors.karaokeWaveShade : colors.deepBurgundy} opacity={0.55} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
        <Path path={normalPath} color={karaoke ? colors.karaokeWave : colors.signalCrimson} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
        <Path path={highlightedPath} color={karaoke ? colors.porcelain : colors.electricCoral} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
        <Path path={dimmedPath} color={karaoke ? colors.karaokeWaveShade : colors.timelineDim} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
        </Group>
        {trim && <>
          <Rect x={0} y={0} width={trimLeft} height={height} color={colors.textOnLight} opacity={0.10} />
          <Rect x={trimRight} y={0} width={width - trimRight} height={height} color={colors.textOnLight} opacity={0.10} />
        </>}
        {!compact && <>
          <Line p1={cursorStart} p2={cursorEnd} color={colors.signalCrimson} strokeWidth={2} />
          <Circle cx={cursor} cy={markerBand + 1} r={5} color={colors.signalCrimson} />
        </>}
        {markerFont && markers.filter(({ x }) => x < width - 24).map(({ x, time }) =>
          <CanvasText key={time} x={x + spacing.xs} y={15} text={formatDuration(time)} font={markerFont} color={karaoke ? colors.mutedSilver : colors.timelineLabel} />)}
      </Canvas>}
      {state === 'idle' && <View pointerEvents="none" style={styles.hint}><Text style={styles.hintText}>Tap the red button to start recording</Text></View>}
      {(state === 'processing' || state === 'finished') && <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.overlay}>
        {state === 'processing' ? !reduceMotion && <ActivityIndicator color={colors.signalCrimson} /> :
          <View style={styles.check}><StudioIcon name="check" size={icon.nav} strokeWidth={2.4} /></View>}
        <Text style={styles.overlayText}>{state === 'processing' ? 'Processing your take…' : `Take saved · ${formatDuration(elapsed)}`}</Text>
      </View>}
    </View>
    </GestureDetector>
    {trim && trimActions && width >= dims.touchTarget && span > 0 && <>
      <TrimHandle edge="start" position={trim.start} min={0} max={trim.end - shortest} windowStart={window.start}
        windowDuration={span} width={width} splitHitArea={splitHitArea} actions={trimActions} />
      <TrimHandle edge="end" position={trim.end} min={trim.start + shortest} max={duration} windowStart={window.start}
        windowDuration={span} width={width} splitHitArea={splitHitArea} actions={trimActions} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.timelineWhite, borderRadius: radius.panel, overflow: 'hidden',
    boxShadow: `0 ${shadows.timeline.offsetY}px ${shadows.timeline.radius}px rgba(0,0,0,${shadows.timeline.opacity})` },
  dark: { backgroundColor: colors.graphite },
  track: { borderRadius: 0, boxShadow: 'none' },
  hint: { ...StyleSheet.absoluteFill, top: dims.timeline.markerBand, alignItems: 'center', justifyContent: 'center' },
  hintText: { textAlign: 'center', color: colors.timelineLabel, fontFamily: typography.family.regular, fontSize: typography.size.label },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: `${colors.timelineWhite}e6` },
  overlayText: { color: colors.textOnLight, fontFamily: typography.family.semibold, fontSize: typography.size.bodySmall },
  check: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.pill, backgroundColor: colors.textOnLight, alignItems: 'center', justifyContent: 'center' },
});
