import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { BackHandler } from 'react-native';

import { demoPeak } from '@/services/demoWaveform';
import { defaultMedia, furthestStep, type ProjectMedia, type StudioStep } from '@/services/projectMedia';
import { defaultVocalEffects, enhancedPeaks, trimFor } from '@/services/vocalEditor';
import { type Project, useCreatorStudio } from '@/store/creatorStudio';

export function useStudioBack(back: () => void) {
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => listener.remove();
  }, [back]));
}

export function useStudioMedia(id: string) {
  const project = useCreatorStudio((state) => state.projects.find((item) => item.id === id));
  const media = useCreatorStudio((state) => state.projectMedia[id] ?? defaultMedia);
  const updateMedia = useCreatorStudio((state) => state.updateProjectMedia);
  const update = useCallback((fn: (current: ProjectMedia) => ProjectMedia) => updateMedia(id, fn), [id, updateMedia]);
  return { project, media, update };
}

export function useReachedStudioStep(id: string, current: StudioStep, minimum: StudioStep = current) {
  const reached = useCreatorStudio((state) => state.projectMedia[id]?.reached ?? 'record');
  const update = useCreatorStudio((state) => state.updateProjectMedia);
  useFocusEffect(useCallback(() => {
    update(id, (media) => {
      const next = furthestStep(media.reached, minimum);
      return next === media.reached ? media : { ...media, reached: next };
    });
  }, [id, minimum, update]));
  return furthestStep(reached, minimum);
}

export function useProjectVocalTrack({ id, dur, seed }: Project) {
  const take = useCreatorStudio((state) => state.takes[id]);
  const history = useCreatorStudio((state) => state.editorHistories[id]);
  const effects = history?.snapshots[history.index] ?? defaultVocalEffects;
  return useMemo(() => {
    const source = take?.peaks.length ? take.peaks : Array.from({ length: Math.ceil(dur * 4) }, (_, i) => demoPeak(i, seed));
    const { start, end } = trimFor(effects, dur);
    const duration = end - start;
    if (dur <= 0) return { duration: 0, peaks: [] };
    const peaks = enhancedPeaks(source, dur, effects).slice(Math.floor(start / dur * source.length), Math.ceil(end / dur * source.length));
    return { duration, peaks };
  }, [dur, effects, seed, take]);
}
