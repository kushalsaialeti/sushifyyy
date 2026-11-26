import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { GlossFill } from '@/components/GlossFill';
import { StudioMediaHeader } from '@/components/StudioMediaShell';
import { StudioIcon } from '@/components/StudioIcon';
import { useStudioBack, useStudioMedia } from '@/hooks/useStudioMedia';
import { studioRoute } from '@/navigation/studioRoutes';
import { stepBack } from '@/services/projectMedia';
import { colors, dims, gradients, radius, spacing, typography } from '@/theme/theme';

function VideoChoice({ title, description, video, onPress }: { title: string; description: string; video?: boolean; onPress: () => void }) {
  return <ButtonSurface accessibilityLabel={title} onPress={onPress} faceStyle={[styles.choice, video && styles.primaryChoice]}>
    <View aria-hidden style={[styles.tile, video && styles.videoTile]}>
      {!video && <GlossFill />}
      <StudioIcon name={video ? 'video' : 'music'} color={video ? gradients.porcelainGloss[0] : colors.textOnLight} size={24} />
    </View>
    <View style={styles.copy}><Text style={creatorText.section}>{title}</Text><Text style={styles.description}>{description}</Text></View>
  </ButtonSurface>;
}

export default function VideoRoute() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, media, update } = useStudioMedia(projectId);
  const back = useCallback(() => router.dismissTo(studioRoute(projectId, stepBack('video', media))), [media, projectId, router]);
  useStudioBack(back);
  if (!project) return <Redirect href="/(tabs)/projects" />;
  if (project.dur <= 0) return <Redirect href={studioRoute(projectId, 'record')} />;

  return <AppScreen scroll withDock compactDock header={<StudioMediaHeader id={projectId} title="Performance video" step="video" onBack={back} />}>
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>Want to film your performance?</Text>
      <Text style={styles.intro}>Your audio is ready. You can add a video now, or export the song on its own. You can always come back.</Text>
      <VideoChoice video title="Add Performance Video" description="Film yourself while your mix plays in your earphones. We'll sync it for you."
        onPress={() => router.push(studioRoute(projectId, media.video ? 'video/sync' : 'video/camera'))} />
      <VideoChoice title="Continue Without Video" description="Go straight to export and save your audio."
        onPress={() => { update((current) => ({ ...current, exportKind: 'audio' })); router.push(studioRoute(projectId, 'export')); }} />
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingVertical: spacing.xl, gap: 14 },
  title: { ...creatorText.title, fontSize: 26 },
  intro: { ...creatorText.detail, fontSize: typography.size.body, lineHeight: typography.size.body * typography.lineHeight.body },
  choice: { padding: spacing.xl, gap: 14, borderRadius: spacing.xxl, borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.graphite },
  primaryChoice: { marginTop: 10 },
  tile: { width: dims.input.height, height: dims.input.height, borderRadius: radius.button, overflow: 'hidden',
    backgroundColor: colors.porcelain, alignItems: 'center', justifyContent: 'center' },
  videoTile: { backgroundColor: colors.signalCrimson },
  copy: { gap: spacing.xs },
  description: { ...creatorText.detail, lineHeight: typography.size.label * 1.45 },
});
