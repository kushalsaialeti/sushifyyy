import { useRouter } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { StepRail, type StudioStep } from '@/components/StepRail';
import { useReachedStudioStep } from '@/hooks/useStudioMedia';
import { studioRoute } from '@/navigation/studioRoutes';
import { useCreatorStudio } from '@/store/creatorStudio';
import { colors, spacing } from '@/theme/theme';

export function MediaStepRail({ id, current, minimum, locked }: { id: string; current: StudioStep; minimum?: StudioStep; locked?: boolean }) {
  const router = useRouter();
  const video = useCreatorStudio((state) => state.projectMedia[id]?.video);
  const reached = useReachedStudioStep(id, current, minimum);

  return <StepRail current={current} reached={reached} locked={locked}
    onStep={(step) => router.dismissTo(studioRoute(id, step === 'video' && video ? 'video/sync' : step))} />;
}

export function StudioMediaHeader({ id, title, subtitle, step, backLabel, onBack, right, locked }: {
  id: string; title: string; subtitle?: string; step?: StudioStep; backLabel?: string; onBack: () => void; right?: ReactNode; locked?: boolean;
}) {
  return <View style={styles.header}>
    <AppHeader title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} right={right} fitActions={!!right} backDisabled={locked} />
    {step && <MediaStepRail id={id} current={step} locked={locked} />}
  </View>;
}

export function StudioMediaFooter({ children }: PropsWithChildren) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screenX, paddingTop: 14, paddingBottom: 6, gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'stretch', gap: 10, paddingHorizontal: spacing.screenX, paddingTop: spacing.md,
    paddingBottom: 14, backgroundColor: colors.footer, borderTopWidth: 1, borderTopColor: colors.hairline },
});
