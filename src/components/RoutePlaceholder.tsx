import { Link, type Href, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { colors, dims, radius, spacing, typography } from '@/theme/theme';

export function RoutePlaceholder({ title, previewLink }: {
  title: string;
  previewLink?: { href: Href; label: string };
}) {
  const [section] = useSegments();

  return (
    <AppScreen scroll withDock={section !== '(auth)'} compactDock={section === 'studio'}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {__DEV__ && previewLink && (
          <Link href={previewLink.href} asChild>
            <Pressable accessibilityRole="link" style={styles.previewLink}>
              <Text style={styles.previewLabel}>{previewLink.label}</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screenX, paddingVertical: spacing.screenTop, gap: spacing.lg },
  title: {
    color: colors.porcelain,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.screenTitle,
    letterSpacing: typography.letterSpacing.title * typography.size.screenTitle,
  },
  previewLink: {
    alignSelf: 'flex-start', justifyContent: 'center', minHeight: dims.touchTarget,
    paddingHorizontal: spacing.md, backgroundColor: colors.graphite, borderRadius: radius.control,
  },
  previewLabel: { color: colors.porcelain, fontFamily: typography.family.medium, fontSize: typography.size.body },
});
