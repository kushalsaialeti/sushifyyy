import { getDocumentAsync } from 'expo-document-picker';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CreatorIconButton, creatorText } from '@/components/CreatorScreenElements';
import { EffectSlider } from '@/components/EffectSlider';
import { MatteCard } from '@/components/MatteCard';
import { AudioTrack, PlayDisc } from '@/components/MediaTracks';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StudioMediaFooter, StudioMediaHeader } from '@/components/StudioMediaShell';
import { StudioIcon } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { useProjectVocalTrack, useStudioBack, useStudioMedia } from '@/hooks/useStudioMedia';
import { useVocalPreview } from '@/hooks/useVocalPreview';
import { studioRoute } from '@/navigation/studioRoutes';
import { demoPeak } from '@/services/demoWaveform';
import { copyKaraokeFile, discardKaraokeCopy, discardUnreferencedKaraokeCopy } from '@/services/karaokeFiles';
import { audibleTracks, defaultMix, karaokeExtension, stepBack, type KaraokeMix, type ProjectMedia } from '@/services/projectMedia';
import { formatDuration, type Project } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, radius, spacing, typography } from '@/theme/theme';

const demoInstrumentalPeaks = Array.from({ length: 80 }, (_, index) => 0.35 + demoPeak(index, 9) * 0.5);
type MixSliderKey = 'vocalGain' | 'karaokeGain' | 'offsetSeconds' | 'introSeconds';
const signed = (value: number, unit: string, digits: number) => `${value > 0 ? '+' : ''}${value.toFixed(digits)} ${unit}`;
const mixSliders: { key: MixSliderKey; label: string; hint: string; min: number; max: number; step: number; format: (value: number) => string }[] = [
  { key: 'vocalGain', label: 'Vocal level', hint: 'Your voice in the mix.', min: -12, max: 6, step: 0.5, format: (v) => signed(v, 'dB', 1) },
  { key: 'karaokeGain', label: 'Karaoke level', hint: 'Keep it a little under your voice.', min: -18, max: 6, step: 0.5, format: (v) => signed(v, 'dB', 1) },
  { key: 'offsetSeconds', label: 'Align track', hint: 'Slide the karaoke earlier or later to match your timing.', min: -2, max: 2, step: 0.05, format: (v) => signed(v, 's', 2) },
  { key: 'introSeconds', label: 'Trim intro', hint: 'Skip the start of the instrumental.', min: 0, max: 20, step: 0.5, format: formatDuration },
];

function applyGain(peaks: readonly number[], gain: number) {
  const scale = Math.pow(10, gain / 40);
  return peaks.map((peak) => Math.min(1, peak * scale));
}

export default function KaraokeRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, media, update } = useStudioMedia(projectId);
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(projectId, 'record')} />;
  return <KaraokeScreen key={projectId} project={project} media={media} update={update} />;
}

function KaraokeScreen({ project, media, update }: { project: Project; media: ProjectMedia; update: (fn: (current: ProjectMedia) => ProjectMedia) => boolean }) {
  const id = project.id;
  const router = useRouter();
  const toast = useStatusToast();
  const { reduceMotion } = useMotionPreference();
  const vocal = useProjectVocalTrack(project);
  const { position, pause, playing, toggle } = useVocalPreview({ start: 0, end: vocal.duration }, vocal.duration, 0);
  const [reading, setReading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [preview, setPreview] = useState<Partial<KaraokeMix> | null>(null);
  const attempt = useRef(0);
  const picking = useRef(false);
  const track = media.karaoke;
  const mix = { ...media.mix, ...preview };
  const { vocals, karaoke, label } = audibleTracks(mix);
  const vocalPeaks = useMemo(() => applyGain(vocal.peaks, mix.vocalGain), [mix.vocalGain, vocal.peaks]);
  const karaokePeaks = useMemo(() => applyGain(demoInstrumentalPeaks, mix.karaokeGain), [mix.karaokeGain]);

  const back = useCallback(() => router.dismissTo(studioRoute(id, stepBack('karaoke', media))), [id, media, router]);
  useStudioBack(back);
  useFocusEffect(useCallback(() => () => {
    attempt.current += 1;
    picking.current = false;
    setBusy(false);
    setReading(null);
    setPreview(null);
    setRemoveOpen(false);
  }, []));

  async function chooseFile() {
    if (picking.current) return;
    picking.current = true;
    setBusy(true);
    const request = ++attempt.current;
    try {
      const result = await getDocumentAsync({ type: 'audio/*', multiple: false, copyToCacheDirectory: true });
      if (result.canceled || request !== attempt.current) return;
      const asset = result.assets[0];
      if (!asset || !karaokeExtension(asset.name, asset.mimeType)) {
        toast('Unsupported file. Choose an MP3, M4A or WAV.', 'warn');
        return;
      }
      setReading(asset.name);
      const readyAt = Date.now() + 1200;
      const copy = await copyKaraokeFile(asset);
      await new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, readyAt - Date.now())));
      if (request !== attempt.current || !update((current) => ({ ...current, karaoke: copy, mix: defaultMix, includeKaraoke: true }))) {
        discardKaraokeCopy(copy.localUri);
        return;
      }
      toast('Karaoke track added');
    } catch {
      if (request === attempt.current) toast('Could not read this file. Try another track.', 'warn');
    } finally {
      if (request === attempt.current) {
        picking.current = false;
        setBusy(false);
        setReading(null);
      }
    }
  }

  function goNext(includeKaraoke: boolean) {
    pause();
    update((current) => ({ ...current, includeKaraoke: includeKaraoke && !!current.karaoke }));
    router.push(studioRoute(id, 'video'));
  }

  function remove() {
    pause();
    setRemoveOpen(false);
    if (!track) return;
    update((current) => ({ ...current, karaoke: null, includeKaraoke: false, mix: defaultMix }));
    discardUnreferencedKaraokeCopy(track.localUri);
  }

  const toggleMix = (key: 'vocalMute' | 'vocalSolo' | 'karaokeMute' | 'karaokeSolo') => {
    update((current) => ({ ...current, mix: { ...current.mix, [key]: !current.mix[key] } }));
  };

  return <AppScreen scroll withDock compactDock
    header={<StudioMediaHeader id={id} title="Karaoke" subtitle="Optional · add your instrumental" step="karaoke"
      onBack={back} backLabel="Back to editor" right={<SecondaryButton label="Skip" onPress={() => goNext(false)} />} />}
    footer={<StudioMediaFooter>{track ? <>
      <SecondaryButton label="Skip Karaoke" style={styles.fill} onPress={() => goNext(false)} />
      <PrimaryGlossyButton label="Continue" style={styles.continue} onPress={() => goNext(true)} />
    </> : <PrimaryGlossyButton label="Skip Karaoke" style={styles.fill} onPress={() => goNext(false)} />}</StudioMediaFooter>}>
    <View style={styles.page}>
      {reading ? <MatteCard style={styles.importing}>
        {!reduceMotion && <ActivityIndicator size={30} color={colors.porcelain} />}
        <Text style={creatorText.body} accessibilityLiveRegion="polite">Reading your file…</Text>
        <Text style={styles.centerCaption}>{reading}</Text>
      </MatteCard> : !track ? <>
        <MatteCard inset style={styles.importBox}>
          <View style={styles.importIcon}><StudioIcon name="music" size={28} /></View>
          <Text style={styles.title}>Sing over your own track</Text>
          <Text style={styles.copy}>Pick a karaoke or instrumental file from your phone. MP3, M4A or WAV. It stays on your device.</Text>
          <PrimaryGlossyButton label="Choose a file" disabled={busy} onPress={() => { void chooseFile(); }} />
        </MatteCard>
        <MatteCard style={styles.note}><Text style={styles.noteText}>{"No backing track? That's fine — skip this step and export your voice on its own, or add video next."}</Text></MatteCard>
      </> : <>
        <MatteCard padding={spacing.md} style={styles.fileRow}>
          <View style={styles.fileIcon}><StudioIcon name="music" color={colors.mutedSilver} /></View>
          <View style={styles.fill}><Text style={creatorText.body} numberOfLines={1}>{track.name}</Text>
            <Text style={creatorText.caption}>Local file · simulated preview</Text></View>
          <CreatorIconButton label="Remove karaoke track" glyph="trash" onPress={() => setRemoveOpen(true)} />
        </MatteCard>
        <AudioTrack title="Your vocals" kind="vocal" samples={vocalPeaks} duration={vocal.duration} position={position}
          muted={mix.vocalMute} solo={mix.vocalSolo} audible={vocals} onMute={() => toggleMix('vocalMute')} onSolo={() => toggleMix('vocalSolo')} />
        <AudioTrack title="Karaoke track" kind="karaoke" samples={karaokePeaks} duration={vocal.duration} position={position}
          offset={mix.offsetSeconds / (vocal.duration || 1)} trimFraction={mix.introSeconds / (vocal.duration || 1)}
          muted={mix.karaokeMute} solo={mix.karaokeSolo} audible={karaoke} onMute={() => toggleMix('karaokeMute')} onSolo={() => toggleMix('karaokeSolo')} />
        <View style={styles.preview}>
          <PlayDisc label={playing ? 'Pause mix preview' : 'Play mix preview'} playing={playing} onPress={toggle} />
          <View style={styles.fill}><Text style={creatorText.body}>Preview mix</Text>
            <Text style={styles.readout}>{formatDuration(position)} / {formatDuration(vocal.duration)} · {label}</Text></View>
        </View>
        <MatteCard style={styles.sliders}>
          {mixSliders.map(({ key, ...slider }) => <EffectSlider key={key} {...slider} value={media.mix[key]}
            onPreview={(value) => setPreview(value === null ? null : { [key]: value })}
            onChange={(value) => update((current) => ({ ...current, mix: { ...current.mix, [key]: value } }))} />)}
        </MatteCard>
      </>}
    </View>
    <ConfirmationDialog visible={removeOpen} title="Remove karaoke track?"
      body="Your vocals stay as they are. The file on your phone isn't deleted."
      confirmLabel="Remove" cancelLabel="Keep" destructive onCancel={() => setRemoveOpen(false)} onConfirm={remove} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.lg, gap: spacing.md },
  fill: { flex: 1, justifyContent: 'center' },
  continue: { flex: 1.3, justifyContent: 'center' },
  importBox: { alignItems: 'center', gap: spacing.md, paddingVertical: 30, paddingHorizontal: spacing.xl, borderRadius: spacing.xxl,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.ashSilver },
  importIcon: { width: 64, height: 64, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphiteElevated },
  title: { ...creatorText.section, fontSize: 20, textAlign: 'center' },
  copy: { ...creatorText.detail, fontSize: typography.size.bodySmall, lineHeight: typography.size.bodySmall * typography.lineHeight.body, textAlign: 'center' },
  note: { borderRadius: 18 },
  noteText: { ...creatorText.detail, lineHeight: typography.size.label * typography.lineHeight.body },
  importing: { alignItems: 'center', gap: 14, paddingVertical: 28 },
  centerCaption: { ...creatorText.caption, textAlign: 'center' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.button },
  fileIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control, backgroundColor: colors.graphiteElevated },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  readout: { ...creatorText.caption, fontVariant: ['tabular-nums'] },
  sliders: { gap: 10, borderRadius: 18 },
});
