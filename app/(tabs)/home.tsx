import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText, ScreenTitle } from '@/components/CreatorScreenElements';
import { GlossFill } from '@/components/GlossFill';
import { MatteCard } from '@/components/MatteCard';
import { PreviewWaveform } from '@/components/PreviewWaveform';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { ProjectBadge } from '@/components/ProjectCard';
import { StudioIcon, type StudioIconName } from '@/components/StudioIcon';
import { useStatusToast } from '@/components/StatusToast';
import { projectEntryRoute, useStartRecording } from '@/navigation/studioRoutes';
import { demoCreator, demoPhoneStorage, formatDuration, type Project, useCreatorStudio } from '@/store/creatorStudio';
import { colors, dims, gradients, icon, radius, spacing, typography } from '@/theme/theme';

function SummaryTile({ title, count, glyph, onPress }: { title: string; count: number; glyph: StudioIconName; onPress: () => void }) {
  return <ButtonSurface accessibilityLabel={`${count} ${title}`} onPress={onPress} style={styles.flex} faceStyle={styles.tile}>
    <StudioIcon name={glyph} color={colors.mutedSilver} size={icon.button} />
    <View><Text style={styles.count}>{count}</Text><Text style={creatorText.detail}>{title}</Text></View>
  </ButtonSurface>;
}

export default function HomeRoute() {
  const router = useRouter();
  const toast = useStatusToast();
  const startRecording = useStartRecording();
  const projects = useCreatorStudio((state) => state.projects);
  const exportCount = useCreatorStudio((state) => state.exports.length);
  const headphones = useCreatorStudio((state) => state.headphones);
  const setHeadphones = useCreatorStudio((state) => state.setHeadphones);
  const setFilter = useCreatorStudio((state) => state.setFilter);
  const current = projects[0];
  const recent = projects.slice(1, 4);
  const openProject = (project: Project) => router.push(projectEntryRoute(project));
  const headphoneTitle = headphones ? 'Wired earphones connected' : 'No earphones connected';

  function toggleHeadphones() {
    setHeadphones(!headphones);
    toast(headphones ? 'Earphones disconnected (simulated)' : 'Wired earphones connected (simulated)', headphones ? 'warn' : 'success');
  }

  return <AppScreen scroll withDock>
    <View style={styles.page}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>Good morning,</Text>
          <ScreenTitle title={demoCreator.name} />
        </View>
        <ButtonSurface accessibilityLabel="Open profile" onPress={() => router.navigate('/(tabs)/profile')} faceStyle={styles.avatar}>
          <Text style={creatorText.cardTitle}>S</Text>
        </ButtonSurface>
      </View>
      <ButtonSurface accessibilityLabel={headphoneTitle} accessibilityState={{ selected: headphones }} onPress={toggleHeadphones} faceStyle={styles.readiness}>
        <View aria-hidden style={styles.headphonesIcon}><StudioIcon name="headphones" color={headphones ? colors.porcelain : colors.textTertiary} /></View>
        <View style={styles.flex}>
          <Text style={styles.readinessTitle}>{headphoneTitle}</Text>
          <Text style={creatorText.caption}>{headphones ? 'Live monitoring is ready · tap to simulate' : 'Connect wired earphones to hear yourself live'}</Text>
        </View>
        <View aria-hidden style={[styles.dot, !headphones && styles.disconnected]} />
      </ButtonSurface>
      <ButtonSurface accessibilityLabel="New Recording" onPress={() => startRecording()} faceStyle={styles.create}>
        <GlossFill />
        <View aria-hidden style={styles.createIcon}><StudioIcon name="plus" size={icon.nav} strokeWidth={2.2} color={gradients.porcelainGloss[0]} /></View>
        <View style={styles.flex}>
          <Text style={styles.createTitle}>New Recording</Text>
          <Text style={styles.createHint}>Start a fresh take</Text>
        </View>
        <StudioIcon name="chevron" size={icon.button} color={colors.textOnLight} />
      </ButtonSurface>

      {current && <View style={styles.section}>
        <Text accessibilityRole="header" style={creatorText.section}>Continue where you left off</Text>
        <MatteCard style={styles.continueCard}>
          <View style={styles.wave}><PreviewWaveform seed={current.seed} variant="continue" /></View>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={creatorText.cardTitle}>{current.name}</Text>
              <Text style={creatorText.caption}>{current.date} · {formatDuration(current.dur)} · {current.status}</Text>
            </View>
            <PrimaryGlossyButton label="Continue" compact onPress={() => openProject(current)} />
          </View>
        </MatteCard>
      </View>}

      <View style={styles.metrics}>
        <SummaryTile title="Drafts" count={projects.filter((project) => project.status === 'Draft').length} glyph="edit"
          onPress={() => { setFilter('draft'); router.navigate('/(tabs)/projects'); }} />
        <SummaryTile title="Exports" count={exportCount} glyph="download" onPress={() => router.navigate('/(tabs)/exports')} />
      </View>

      {recent.length > 0 && <View style={styles.recentList}>
        <View style={styles.row}>
          <Text accessibilityRole="header" style={[creatorText.section, styles.flex]}>Recent projects</Text>
          <ButtonSurface onPress={() => { setFilter('all'); router.navigate('/(tabs)/projects'); }} faceStyle={styles.seeAll}>
            <Text style={creatorText.detail}>See all</Text>
          </ButtonSurface>
        </View>
        {recent.map((project) => <ButtonSurface key={project.id} onPress={() => openProject(project)} faceStyle={styles.recent}>
          <View aria-hidden style={styles.recentIcon}><StudioIcon name={project.media === 'video' ? 'video' : 'mic'} color={colors.mutedSilver} /></View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.readinessTitle}>{project.name}</Text>
            <Text style={creatorText.caption}>{project.date} · {formatDuration(project.dur)}</Text>
          </View>
          <ProjectBadge status={project.status} />
        </ButtonSurface>)}
      </View>}

      <MatteCard inset padding={14} style={styles.storage}>
        <View style={styles.row}><Text style={creatorText.caption}>Phone storage</Text><Text style={creatorText.caption}>{demoPhoneStorage.label}</Text></View>
        <View aria-hidden style={styles.storageTrack}><View style={styles.storageFill} /></View>
      </MatteCard>
      {__DEV__ && <ButtonSurface onPress={() => router.push('/dev/components')} faceStyle={styles.devLink}>
        <Text style={creatorText.detail}>Component gallery</Text>
      </ButtonSurface>}
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screenX, gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1 },
  copy: { flex: 1, gap: spacing.xxs },
  greeting: { ...creatorText.detail, fontSize: typography.size.bodySmall, marginBottom: spacing.xxs },
  avatar: { width: dims.touchTarget, height: dims.touchTarget, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.ashSilver, backgroundColor: colors.graphiteElevated, alignItems: 'center', justifyContent: 'center' },
  readiness: { backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.button,
    minHeight: dims.touchTarget, paddingVertical: spacing.md, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headphonesIcon: { ...iconTile(), width: 36, height: 36 },
  readinessTitle: { ...creatorText.body, fontSize: typography.size.bodySmall },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.signalCrimson },
  disconnected: { backgroundColor: colors.textOnLightMuted },
  create: { minHeight: 76, borderRadius: radius.panel, backgroundColor: colors.porcelain, overflow: 'hidden',
    paddingVertical: spacing.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  createIcon: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.signalCrimson,
    alignItems: 'center', justifyContent: 'center' },
  createTitle: { ...creatorText.section, color: colors.textOnLight },
  createHint: { ...creatorText.detail, color: colors.textOnLightMuted, marginTop: spacing.xxs },
  section: { gap: 10 },
  continueCard: { gap: 14 },
  wave: { height: 64, paddingHorizontal: 10, borderRadius: radius.input, backgroundColor: colors.timelineWhite, justifyContent: 'center' },
  metrics: { flexDirection: 'row', gap: 10 },
  tile: { padding: 14, borderRadius: dims.dock.indicatorRadius, borderWidth: 1, borderColor: colors.hairline,
    backgroundColor: colors.graphite, gap: 10 },
  count: { ...creatorText.section, fontSize: 22, fontVariant: ['tabular-nums'] },
  recentList: { gap: spacing.sm },
  recent: { minHeight: dims.touchTarget, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.well,
    borderRadius: radius.button, paddingVertical: 10, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recentIcon: { ...iconTile(), width: 40, height: 40 },
  seeAll: { minWidth: dims.touchTarget, minHeight: dims.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
  storage: { gap: spacing.sm, borderRadius: radius.button },
  storageTrack: { height: 6, backgroundColor: colors.graphiteElevated, overflow: 'hidden', borderRadius: radius.pill },
  storageFill: { width: `${demoPhoneStorage.usedPercent}%`, height: '100%', backgroundColor: colors.mutedSilver },
  devLink: { minHeight: dims.touchTarget, alignItems: 'center', justifyContent: 'center' },
});

function iconTile() {
  return { backgroundColor: colors.graphiteElevated, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' } as const;
}
