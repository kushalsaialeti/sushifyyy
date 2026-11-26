import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CreatorDock } from '@/components/CreatorDock';
import { StatusToastProvider } from '@/components/StatusToast';
import { useCreatorStudio } from '@/store/creatorStudio';
import { MotionProvider } from '@/theme/MotionProvider';
import { colors, typography } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // The native splash may already be hidden during development refreshes.
});

export default function RootLayout() {
  const signedIn = useCreatorStudio((state) => state.email !== null);
  const [fontsLoaded, fontError] = useFonts({
    [typography.family.regular]: Inter_400Regular,
    [typography.family.medium]: Inter_500Medium,
    [typography.family.semibold]: Inter_600SemiBold,
    [typography.family.bold]: Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hide();
    if (fontError) console.warn('Could not load Inter fonts.', fontError);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <MotionProvider>
        <StatusToastProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: styles.root }}>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="studio/[projectId]" />
            </Stack.Protected>
            <Stack.Protected guard={__DEV__}>
              <Stack.Screen name="dev/components" />
            </Stack.Protected>
          </Stack>
          <CreatorDock />
        </StatusToastProvider>
      </MotionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.obsidian },
});
