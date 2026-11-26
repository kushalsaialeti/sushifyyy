import 'tsx/cjs';

import type { ExpoConfig } from 'expo/config';

import { colors } from './src/theme/theme';

export default {
  name: 'Sushifyyyy',
  slug: 'sushifyyyy',
  scheme: 'sushifyyyy',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['android', 'ios'],
  userInterfaceStyle: 'dark',
  backgroundColor: colors.obsidian,
  plugins: ['expo-router', ['expo-splash-screen', { backgroundColor: colors.obsidian }]],
  experiments: { typedRoutes: true },
  android: { package: 'com.sushifyyyy.studio' },
  ios: { bundleIdentifier: 'com.sushifyyyy.studio' },
} satisfies ExpoConfig;
