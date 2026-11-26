import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRouter } from 'expo-router';

import { type Project, useCreatorStudio } from '@/store/creatorStudio';

import type { StudioStep } from '@/services/projectMedia';

export function studioRoute(projectId: string, step: StudioStep | 'video/camera' | 'video/sync') {
  return { pathname: `/studio/[projectId]/${step}` as const, params: { projectId } };
}

export function projectEntryRoute(project: Pick<Project, 'id' | 'dur'>) {
  return studioRoute(project.id, project.dur > 0 ? 'enhance' : 'record');
}

export function useStartRecording(withHaptics = true) {
  const router = useRouter();
  const createDraft = useCreatorStudio((state) => state.createDraft);
  const haptics = useCreatorStudio((state) => state.preferences.haptics);
  return (replace = false) => {
    if (withHaptics && haptics) void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    const route = studioRoute(createDraft().id, 'record');
    if (replace) router.replace(route);
    else router.push(route);
  };
}
