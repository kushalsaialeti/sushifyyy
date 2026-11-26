import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { AppScreen } from '@/components/AppScreen';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { SecondaryButton } from '@/components/SecondaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useStatusToast } from '@/components/StatusToast';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { exportOptions, noiseOptions, qualityOptions, useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, spacing, typography } from '@/theme/theme';

function SettingsCard({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <MatteCard style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    {children}
    <Text style={creatorText.caption}>{detail}</Text>
  </MatteCard>;
}

function SettingToggle({ label, detail, value, onChange, divider }: {
  label: string; detail: string; value: boolean; onChange: (enabled: boolean) => void; divider?: boolean;
}) {
  return <View style={[styles.toggle, divider && styles.divider]}>
    <View style={styles.copy}>
      <Text style={creatorText.body}>{label}</Text>
      <Text style={styles.toggleDescription}>{detail}</Text>
    </View>
    <ToggleSwitch label={label} value={value} onChange={onChange} />
  </View>;
}

export default function SettingsRoute() {
  const router = useRouter();
  const toast = useStatusToast();
  const preferences = useCreatorStudio((state) => state.preferences);
  const setPreferences = useCreatorStudio((state) => state.setPreferences);
  const cacheMB = useCreatorStudio((state) => state.cacheMB);
  const clearCache = useCreatorStudio((state) => state.clearCache);
  const { preference, setPreference } = useMotionPreference();
  const [confirmCache, setConfirmCache] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  }

  return <AppScreen scroll withDock compactDock header={<View style={styles.header}><AppHeader title="Studio settings" onBack={goBack} /></View>}>
    <View style={styles.page}>
      <SettingsCard title="Default recording quality" detail="48 kHz is studio standard. 44.1 kHz saves a little space.">
        <SegmentedControl label="Default recording quality" options={qualityOptions} value={preferences.quality} onChange={(value) => setPreferences({ quality: value })} />
      </SettingsCard>
      <SettingsCard title="Noise cleanup default" detail="Used for every new recording.">
        <SegmentedControl label="Noise cleanup default" options={noiseOptions} value={preferences.noise} onChange={(value) => setPreferences({ noise: value })} />
      </SettingsCard>
      <SettingsCard title="Export default" detail="You can still change it for each export.">
        <SegmentedControl label="Export default" options={exportOptions} value={preferences.format} onChange={(value) => setPreferences({ format: value })} />
      </SettingsCard>

      <MatteCard padding={0} style={styles.toggleCard}>
        <SettingToggle label="Headphone monitoring" detail="Turn on live monitoring automatically when earphones are connected."
          value={preferences.monitor} onChange={(value) => setPreferences({ monitor: value })} divider />
        <SettingToggle label="Reduce motion" detail="Minimise animations across the app." value={preference} onChange={setPreference} divider />
        <SettingToggle label="Haptic feedback" detail="Soft taps when you press record and key buttons."
          value={preferences.haptics} onChange={(value) => setPreferences({ haptics: value })} />
      </MatteCard>

      <MatteCard style={styles.card}>
        <Text style={styles.title}>Local data</Text>
        <Text style={styles.description}>Projects 1.1 GB · Exports 0.1 GB · Cache {cacheMB} MB</Text>
        <SecondaryButton label="Clear cache" disabled={cacheMB === 0} onPress={() => setConfirmCache(true)} />
      </MatteCard>
      <MatteCard inset style={styles.privacy}>
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.description}>Your recordings, karaoke files and videos are stored only on this phone. Sushifyyyy checks your Studio access when you sign in, but never uploads your audio or video.</Text>
      </MatteCard>
    </View>

    <ConfirmationDialog visible={confirmCache} title="Clear cache?"
      body={`Frees ${cacheMB} MB of temporary waveform previews. Your projects and exports are not touched.`}
      confirmLabel="Clear" onCancel={() => setConfirmCache(false)} onConfirm={() => { setConfirmCache(false); clearCache(); toast('Cache cleared'); }} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screenX, paddingTop: 14, paddingBottom: 6 },
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: 14 },
  card: { gap: 10 },
  title: { ...creatorText.body, fontFamily: typography.family.semibold },
  description: { ...creatorText.detail, lineHeight: typography.size.label * typography.lineHeight.body },
  toggleCard: { overflow: 'hidden' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  copy: { flex: 1, gap: spacing.xxs },
  toggleDescription: { ...creatorText.caption, lineHeight: typography.size.caption * 1.4 },
  divider: { borderBottomColor: colors.graphiteElevated, borderBottomWidth: 1 },
  privacy: { gap: spacing.sm },
});
