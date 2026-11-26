import { Tabs } from 'expo-router';

import { colors } from '@/theme/theme';

export const unstable_settings = { initialRouteName: 'home' };

export default function CreatorTabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.obsidian } }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="exports" options={{ title: 'Exports' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
