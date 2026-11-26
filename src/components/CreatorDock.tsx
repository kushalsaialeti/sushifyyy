import { useRouter, useSegments } from 'expo-router';

import { BottomNavigation, type CreatorTab } from '@/components/BottomNavigation';
import { useStartRecording } from '@/navigation/studioRoutes';
import { useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';

const tabRoutes = {
  home: '/(tabs)/home',
  projects: '/(tabs)/projects',
  exports: '/(tabs)/exports',
  profile: '/(tabs)/profile',
} as const;

export function CreatorDock() {
  const router = useRouter();
  const [section, screen, step] = useSegments();
  const startRecording = useStartRecording(false);
  const haptics = useCreatorStudio((state) => state.preferences.haptics);
  const signedIn = useCreatorStudio((state) => state.email !== null);
  const exportRunning = useCreatorStudio((state) => state.activeExport !== null);
  const { reduceMotion } = useMotionPreference();

  const inStudio = section === 'studio';
  const inTabs = section === '(tabs)';
  const inSettings = section === 'settings';
  if (!signedIn || (!inStudio && !inTabs && !inSettings)) return null;

  let active: CreatorTab = 'home';
  if (inSettings) active = 'profile';
  if (inTabs && (screen === 'projects' || screen === 'exports' || screen === 'profile')) active = screen;

  function openTab(tab: CreatorTab) {
    if (useCreatorStudio.getState().activeExport) return;
    if (inTabs) router.navigate(tabRoutes[tab]);
    else router.dismissTo(tabRoutes[tab]);
  }

  return (
    <BottomNavigation
      active={inStudio ? null : active}
      onTab={openTab}
      onCreate={() => { if (!useCreatorStudio.getState().activeExport) startRecording(inStudio); }}
      inStudio={inStudio}
      createDisabled={exportRunning || (inStudio && step === 'record')}
      tabsDisabled={exportRunning}
      haptics={haptics}
      reduceMotion={reduceMotion}
    />
  );
}
