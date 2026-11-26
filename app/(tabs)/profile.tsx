import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ButtonSurface } from '@/components/ButtonSurface';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CreatorActionRow, creatorText, ScreenTitle } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { demoCreator, demoPhoneStorage, useCreatorStudio } from '@/store/creatorStudio';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

const qualityOptions = [{ value: '48', label: 'Studio · 48 kHz' }, { value: '44', label: 'Standard · 44.1 kHz' }] as const;

export default function ProfileRoute() {
  const router = useRouter();
  const email = useCreatorStudio((state) => state.email);
  const quality = useCreatorStudio((state) => state.preferences.quality);
  const setPreferences = useCreatorStudio((state) => state.setPreferences);
  const signOut = useCreatorStudio((state) => state.signOut);
  const [dialog, setDialog] = useState<'signout' | 'about' | null>(null);
  const openSettings = () => router.push('/settings');
  const closeDialog = () => setDialog(null);

  function confirmSignOut() {
    closeDialog();
    router.replace('/(auth)/login');
    signOut();
  }

  return <AppScreen scroll withDock>
    <View style={styles.page}>
      <ScreenTitle title="Profile" />
      <MatteCard padding={spacing.xl} style={styles.identity}>
        <View style={styles.avatar} aria-hidden><Text style={styles.initial}>S</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{demoCreator.name}</Text>
          <Text numberOfLines={1} style={creatorText.detail}>{email ?? demoCreator.email}</Text>
          <View style={styles.approval}>
            <View style={styles.dot} aria-hidden />
            <Text style={styles.approvalText}>Studio access · Approved</Text>
          </View>
        </View>
      </MatteCard>

      <MatteCard style={styles.panel}>
        <Text style={styles.panelTitle}>Recording quality</Text>
        <SegmentedControl label="Recording quality" options={qualityOptions} value={quality} onChange={(value) => setPreferences({ quality: value })} />
        <Text style={creatorText.caption}>Higher quality sounds best but uses more space.</Text>
      </MatteCard>

      <MatteCard style={styles.panel}>
        <View style={styles.storageHeading}>
          <Text style={styles.panelTitle}>Local storage</Text><Text style={creatorText.detail}>1.2 GB used by Sushifyyyy</Text>
        </View>
        <View aria-hidden style={styles.storageTrack}><View style={styles.appStorage} /><View style={styles.otherStorage} /></View>
        <Text style={creatorText.caption}>{demoPhoneStorage.label} on this phone. Recordings never leave your device.</Text>
      </MatteCard>

      <MatteCard padding={0} style={styles.rows}>
        <CreatorActionRow label="Studio settings" glyph="gear" chevron divider onPress={openSettings} />
        <CreatorActionRow label="Personal preferences" glyph="user" chevron divider onPress={openSettings} />
        <CreatorActionRow label="Privacy" glyph="shield" chevron divider onPress={openSettings} />
        <CreatorActionRow label="About Sushifyyyy" glyph="info" chevron onPress={() => setDialog('about')} />
      </MatteCard>
      <ButtonSurface accessibilityLabel="Sign out" onPress={() => setDialog('signout')} faceStyle={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </ButtonSurface>
      <Text style={styles.footer}>Sushifyyyy Studio · Version 1.0 prototype</Text>
    </View>

    <ConfirmationDialog visible={dialog === 'about'} title="About Sushifyyyy"
      body="A private recording studio made for a few talented singers. Your Voice. Your Vibe. Your Stage. Version 1.0 prototype."
      confirmLabel="Close" cancelLabel="Back" onConfirm={closeDialog} onCancel={closeDialog} />
    <ConfirmationDialog visible={dialog === 'signout'} title="Sign out?"
      body="Your projects stay on this phone. You'll need your approved account to get back into the Studio."
      confirmLabel="Sign out" destructive onConfirm={confirmSignOut} onCancel={closeDialog} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.screenTop, gap: spacing.lg },
  identity: { borderRadius: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 68, height: 68, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.ashSilver,
    backgroundColor: colors.graphiteElevated, alignItems: 'center', justifyContent: 'center' },
  initial: { ...creatorText.title, fontSize: 26 },
  identityCopy: { flex: 1, gap: spacing.xxs },
  name: { ...creatorText.section, fontSize: 20 },
  approval: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: colors.graphiteElevated, borderRadius: radius.pill,
    marginTop: 6, paddingHorizontal: 10, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.signalCrimson },
  approvalText: { ...creatorText.caption, flexShrink: 1, fontFamily: typography.family.medium, color: colors.porcelain },
  panel: { gap: 10 },
  panelTitle: { ...creatorText.body, fontFamily: typography.family.semibold },
  storageHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.xs },
  storageTrack: { flexDirection: 'row', height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.graphiteElevated, overflow: 'hidden' },
  appStorage: { width: '6%', backgroundColor: colors.signalCrimson },
  otherStorage: { width: '65%', backgroundColor: colors.ashSilver },
  rows: { overflow: 'hidden' },
  signOut: { minHeight: dims.input.height, alignItems: 'center', justifyContent: 'center', padding: spacing.sm,
    borderRadius: radius.button, borderColor: colors.ashSilver, borderWidth: 1 },
  signOutText: { ...creatorText.body, color: colors.electricCoral },
  footer: { ...creatorText.caption, color: colors.textTertiary, textAlign: 'center' },
});
