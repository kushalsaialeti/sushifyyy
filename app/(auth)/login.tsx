import { Redirect } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { Banner } from '@/components/Banner';
import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { PreviewWaveform } from '@/components/PreviewWaveform';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StudioIcon } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { demoCreator, useCreatorStudio } from '@/store/creatorStudio';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

const outcomes = [
  { value: 'approved', label: 'Approved' }, { value: 'invalid', label: 'Wrong password' },
  { value: 'pending', label: 'No access' }, { value: 'offline', label: 'Offline' },
] as const;
type Outcome = (typeof outcomes)[number]['value'];
type LoginState = 'idle' | 'loading' | Exclude<Outcome, 'approved'>;

export default function LoginRoute() {
  const signIn = useCreatorStudio((state) => state.signIn);
  const signedIn = useCreatorStudio((state) => state.email !== null);
  const toast = useStatusToast();
  const passwordField = useRef<ComponentRef<typeof TextInput>>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [email, setEmail] = useState<string>(demoCreator.email);
  const [password, setPassword] = useState('');
  const [outcome, setOutcome] = useState<Outcome>('approved');
  const [state, setState] = useState<LoginState>('idle');
  const loading = state === 'loading';

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  if (signedIn) return <Redirect href="/(tabs)/home" />;

  function submit() {
    if (!__DEV__ || timer.current !== null) return;
    Keyboard.dismiss();
    setState('loading');
    timer.current = setTimeout(() => {
      timer.current = null;
      setPassword('');
      if (outcome === 'approved') {
        toast('Welcome back, Sushi');
        signIn(email);
      } else {
        setState(outcome);
      }
    }, 1100);
  }

  function pickOutcome(next: Outcome) {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setOutcome(next);
    setState('idle');
  }

  const fieldStyle = [creatorText.input, state === 'invalid' && styles.invalidInput];
  return <AppScreen scroll keyboardAvoiding scrollContentStyle={styles.scroll}>
    <View style={styles.page}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}><StudioIcon name="wave" size={icon.hero} color={colors.signalCrimson} /></View>
        <View style={styles.field}>
          <Text accessibilityRole="header" style={styles.wordmark}>Sushifyyyy</Text>
          <Text style={styles.tagline}>Your Voice. Your Vibe. Your Stage.</Text>
        </View>
      </View>
      <MatteCard padding={14} style={styles.wave}><PreviewWaveform seed={11} variant="welcome" /></MatteCard>

      {state === 'pending' ? <MatteCard padding={22} style={styles.pending}>
        <View style={styles.lockTile}><StudioIcon name="lock" size={icon.nav} /></View>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.pendingTitle}>Studio access is pending</Text>
        <Text style={styles.pendingCopy}>{`You're signed in as ${email.trim() || demoCreator.email}, but this account hasn't been approved for the Studio yet. The Super Admin grants access to each creator. You'll be able to record as soon as you're approved.`}</Text>
        <PrimaryGlossyButton label="Use another account" onPress={() => { setEmail(''); pickOutcome('approved'); }} />
      </MatteCard> : <View style={styles.form}>
        {state === 'offline' && <Banner icon="wifiOff" message="Can't reach Sushifyyyy right now. Check your connection and try again." />}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput accessibilityLabel="Email" style={fieldStyle} value={email} onChangeText={setEmail} keyboardType="email-address"
            spellCheck={false} autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!loading}
            returnKeyType="next" onSubmitEditing={() => passwordField.current?.focus()} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput ref={passwordField} accessibilityLabel="Password" style={fieldStyle} value={password} onChangeText={setPassword}
            placeholder="Your password" placeholderTextColor={colors.textTertiary} secureTextEntry autoComplete="off"
            autoCapitalize="none" editable={!loading} returnKeyType="go" onSubmitEditing={submit} />
        </View>
        {state === 'invalid' && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{"That email and password don't match. Try again."}</Text>}
        <PrimaryGlossyButton label={loading ? 'Checking access…' : 'Sign in'} loading={loading} disabled={!__DEV__} onPress={submit} />
        <View style={styles.or} aria-hidden><View style={styles.divider} /><Text style={styles.quiet}>or</Text><View style={styles.divider} /></View>
        <ButtonSurface accessibilityLabel="Continue with Google" disabled={loading || !__DEV__} onPress={submit} faceStyle={styles.google}>
          <View style={styles.googleBadge} aria-hidden><Text style={styles.googleLetter}>G</Text></View>
          <Text style={creatorText.body}>Continue with Google</Text>
        </ButtonSurface>
        <MatteCard inset padding={14} style={styles.privacy}>
          <StudioIcon name="lock" size={16} color={colors.mutedSilver} />
          <Text style={styles.privacyCopy}>Sushifyyyy is a private studio. Only creators approved by the Super Admin can sign in and record.</Text>
        </MatteCard>
      </View>}

      {__DEV__ && <View style={styles.demo}>
        <Text style={styles.quiet}>Prototype · sign-in outcome</Text>
        <SegmentedControl label="Prototype sign-in outcome" options={outcomes} value={outcome} onChange={pickOutcome} />
      </View>}
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  page: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: dims.transportSecondary, paddingBottom: spacing.xxxl, gap: 22 },
  brand: { gap: 14, alignItems: 'flex-start' },
  brandIcon: { width: dims.input.height, height: dims.input.height, borderRadius: radius.button, backgroundColor: colors.graphite,
    borderColor: colors.hairlineStrong, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { color: colors.porcelain, fontFamily: typography.family.semibold, fontSize: typography.size.display,
    letterSpacing: typography.letterSpacing.display * typography.size.display },
  tagline: { color: colors.mutedSilver, fontFamily: typography.family.regular, fontSize: typography.size.body },
  wave: { height: 76, justifyContent: 'center' },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { ...creatorText.detail, fontFamily: typography.family.medium },
  invalidInput: { borderColor: colors.signalCrimson },
  error: { ...creatorText.detail, color: colors.electricCoral },
  or: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.hairlineStrong },
  quiet: { ...creatorText.caption, color: colors.textTertiary },
  google: { minHeight: dims.input.height, borderRadius: radius.button, borderWidth: 1, borderColor: colors.ashSilver,
    backgroundColor: colors.graphite, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.sm },
  googleBadge: { width: icon.nav, height: icon.nav, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.porcelain, alignItems: 'center', justifyContent: 'center' },
  googleLetter: { ...creatorText.caption, color: colors.porcelain, fontFamily: typography.family.bold },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: radius.input },
  privacyCopy: { ...creatorText.caption, flex: 1, lineHeight: typography.size.caption * typography.lineHeight.body },
  pending: { gap: spacing.md, borderRadius: spacing.xxl, borderColor: colors.hairlineStrong },
  lockTile: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.input, backgroundColor: colors.graphiteElevated, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { ...creatorText.section, fontSize: 20 },
  pendingCopy: { ...creatorText.detail, fontSize: typography.size.bodySmall, lineHeight: typography.size.bodySmall * typography.lineHeight.body },
  demo: { marginTop: 'auto', paddingTop: 6, gap: 6 },
});
