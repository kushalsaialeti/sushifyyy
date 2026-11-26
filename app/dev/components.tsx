import { useRouter } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppScreen } from '@/components/AppScreen';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { EffectGroup } from '@/components/EffectGroup';
import { EffectSlider } from '@/components/EffectSlider';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { MatteCard } from '@/components/MatteCard';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useStatusToast } from '@/components/StatusToast';
import { StepRail, type StudioStep } from '@/components/StepRail';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { WaveformTimeline } from '@/components/WaveformTimeline';
import { demoPeak } from '@/services/demoWaveform';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

const noiseOptions = [
  { value: 'natural', label: 'Natural' },
  { value: 'clean', label: 'Clean' },
  { value: 'strong', label: 'Strong Clean', disabled: true },
] as const;
const demoPeaks = Array.from({ length: 90 }, (_, index) => demoPeak(index, 3));

function GallerySection({ title, children }: PropsWithChildren<{ title: string }>) {
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>;
}

export default function ComponentGalleryRoute() {
  const router = useRouter();
  const toast = useStatusToast();
  const { preference, setPreference } = useMotionPreference();
  const [monitoring, setMonitoring] = useState(true);
  const [noise, setNoise] = useState<(typeof noiseOptions)[number]['value']>('clean');
  const [openEffect, setOpenEffect] = useState<'level' | 'reverb' | null>('level');
  const [level, setLevel] = useState(0);
  const [reverb, setReverb] = useState(12);
  const [playhead, setPlayhead] = useState(2);
  const [step, setStep] = useState<StudioStep>('enhance');
  const [locked, setLocked] = useState(false);
  const [monitorWarning, setMonitorWarning] = useState(true);
  const [overlay, setOverlay] = useState<'rename' | 'delete' | 'restore' | null>(null);
  const [name, setName] = useState('Monsoon Sessions');
  const [renameValue, setRenameValue] = useState(name);

  function closeOverlay() {
    setOverlay(null);
  }

  function saveName() {
    const next = renameValue.trim();
    if (!next) return;
    setName(next);
    closeOverlay();
    toast('Name saved');
  }

  return <AppScreen scroll>
    <View style={styles.content}>
      <AppHeader title="Component gallery" onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/home');
      }} />

      <GallerySection title="Buttons and cards">
        <PrimaryGlossyButton label="New Recording" icon="plus" onPress={() => toast('Recording action preview')} />
        <PrimaryGlossyButton label="Checking access…" loading onPress={() => undefined} />
        <PrimaryGlossyButton label="Export" disabled onPress={() => undefined} />
        <View style={styles.row}>
          <SecondaryButton style={styles.flex} label="Rename" onPress={() => { setRenameValue(name); setOverlay('rename'); }} />
          <SecondaryButton style={styles.flex} label="Delete" tone="danger" onPress={() => setOverlay('delete')} />
        </View>
        <SecondaryButton label="Retake" disabled onPress={() => undefined} />
        <MatteCard><Text style={styles.label}>{name}</Text></MatteCard>
        <MatteCard elevated><Text style={styles.label}>Live monitoring</Text></MatteCard>
        <MatteCard inset><Text style={styles.label}>48 kHz · Mono · Clean</Text></MatteCard>
      </GallerySection>

      <GallerySection title="Controls">
        <SegmentedControl label="Noise cleanup" options={noiseOptions} value={noise} onChange={setNoise} />
        <MatteCard style={styles.section}>
          <View style={styles.setting}><Text style={styles.flexLabel}>Live monitoring</Text>
            <ToggleSwitch label="Live monitoring" value={monitoring} onChange={setMonitoring} /></View>
          <View style={styles.setting}><Text style={styles.flexLabel}>Haptics</Text>
            <ToggleSwitch label="Haptics" value={false} disabled onChange={() => undefined} /></View>
          <View style={styles.setting}><Text style={styles.flexLabel}>Reduce motion</Text>
            <ToggleSwitch label="Reduce motion" value={preference} onChange={setPreference} /></View>
        </MatteCard>
        <EffectGroup title="Voice level" description="Set the volume of your vocal take" summary={`${level} dB`}
          open={openEffect === 'level'} onToggle={() => setOpenEffect(openEffect === 'level' ? null : 'level')}>
          <EffectSlider label="Voice level" hint="Raises or lowers your vocal volume." min={-12} max={12} step={0.5}
            value={level} format={(value) => `${value > 0 ? '+' : ''}${value} dB`} onChange={setLevel} />
        </EffectGroup>
        <EffectGroup title="Reverb" description="Add a sense of space" summary={`${reverb}%`}
          open={openEffect === 'reverb'} onToggle={() => setOpenEffect(openEffect === 'reverb' ? null : 'reverb')}>
          <EffectSlider label="Amount" hint="How much room sound is mixed in." min={0} max={100} step={1}
            value={reverb} format={(value) => `${value}%`} onChange={setReverb} />
        </EffectGroup>
        <View style={styles.setting}><Text style={styles.flexLabel}>Lock studio steps</Text>
          <ToggleSwitch label="Lock studio steps" value={locked} onChange={setLocked} /></View>
        <StepRail current={step} reached="karaoke" locked={locked} onStep={setStep} />
      </GallerySection>

      <GallerySection title="Overlays and feedback">
        <SecondaryButton label="Restore defaults" onPress={() => setOverlay('restore')} />
        <View style={styles.row}>
          <SecondaryButton style={styles.flex} label="Success toast" onPress={() => toast('Draft saved on this phone')} />
          <SecondaryButton style={styles.flex} label="Warning toast" onPress={() => toast("Couldn't save the export. Try again.", 'warn')} />
        </View>
        {monitorWarning && <Banner title="Earphones disconnected" message="Live monitoring is off. Recording can continue."
          icon="headphones" dismissible onDismiss={() => setMonitorWarning(false)} />}
        <Banner title="You're offline" message="Recording, editing and exporting work offline. Sign-in needs a connection."
          icon="wifiOff" tone="neutral" />
      </GallerySection>

      <GallerySection title="Waveform previews">
        <WaveformTimeline variant="playback" duration={8} samples={demoPeaks} playhead={playhead} onSeek={setPlayhead} />
        <WaveformTimeline variant="trimmed" duration={8} samples={demoPeaks} playhead={playhead} trim={{ start: 1, end: 6 }} />
        <WaveformTimeline variant="karaoke" duration={8} samples={demoPeaks} playhead={playhead} />
        <WaveformTimeline variant="mini" duration={8} samples={demoPeaks} />
      </GallerySection>

      <GallerySection title="Empty and loading states">
        <MatteCard inset>
          <EmptyState icon="wave" title="Your studio is quiet" body="Every take you record is saved here as a project."
            action={{ label: 'Start recording', onPress: () => toast('Recorder action preview') }} />
        </MatteCard>
        <LoadingSkeleton variant="projects" />
        <LoadingSkeleton variant="home" />
        <LoadingSkeleton variant="waveform" />
      </GallerySection>
    </View>

    <BottomSheet visible={overlay === 'rename'} title="Rename project" onClose={closeOverlay}>
      <Text style={styles.inputLabel}>Project name</Text>
      <TextInput accessibilityLabel="Project name" value={renameValue} onChangeText={setRenameValue}
        style={styles.input} returnKeyType="done" onSubmitEditing={saveName} />
      <PrimaryGlossyButton label="Save name" disabled={!renameValue.trim()} onPress={saveName} />
    </BottomSheet>
    <ConfirmationDialog visible={overlay === 'delete'} title={`Delete "${name}"?`}
      body="Removes the project and its original recording from this phone. This can't be undone."
      confirmLabel="Delete" destructive onCancel={closeOverlay}
      onConfirm={() => { closeOverlay(); toast('Delete confirmation preview'); }} />
    <ConfirmationDialog visible={overlay === 'restore'} title="Restore defaults?" body="Your trim stays where it is."
      confirmLabel="Restore" onCancel={closeOverlay} onConfirm={() => { setLevel(0); setReverb(12); closeOverlay(); toast('Defaults restored'); }} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenX, paddingVertical: spacing.screenTop, gap: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.section },
  label: { color: colors.porcelain, fontFamily: typography.family.medium, fontSize: typography.size.body },
  flexLabel: { flex: 1, color: colors.porcelain, fontFamily: typography.family.medium, fontSize: typography.size.body },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  setting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inputLabel: { color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.label },
  input: { minHeight: dims.input.height, backgroundColor: colors.well, borderColor: colors.ashSilver, borderWidth: 1,
    borderRadius: radius.input, paddingHorizontal: spacing.lg, color: colors.porcelain, fontFamily: typography.family.regular,
    fontSize: typography.size.cardTitle },
});
