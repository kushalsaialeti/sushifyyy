import { Stack } from 'expo-router';

import { colors } from '@/theme/theme';

export default function StudioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.obsidian } }}>
      <Stack.Screen name="enhance" options={{ gestureEnabled: false }} />
      <Stack.Screen name="karaoke" options={{ gestureEnabled: false }} />
      <Stack.Screen name="video/index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="video/camera" options={{ gestureEnabled: false }} />
      <Stack.Screen name="video/sync" options={{ gestureEnabled: false }} />
      <Stack.Screen name="export" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
