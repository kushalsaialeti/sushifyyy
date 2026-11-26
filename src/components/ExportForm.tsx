import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ButtonSurface } from '@/components/ButtonSurface';
import { creatorText } from '@/components/CreatorScreenElements';
import { MatteCard } from '@/components/MatteCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StudioIcon } from '@/components/StudioIcon';
import type { ExportDescription } from '@/services/Exporter';
import { exportLocations, type ExportKind, type ExportSettings } from '@/services/projectMedia';
import { formatDuration } from '@/store/creatorStudio';
import { colors, dims, icon, radius, spacing, typography } from '@/theme/theme';

const audioFormats = [{ value: 'wav', label: 'WAV' }, { value: 'm4a', label: 'AAC / M4A' }] as const;
const resolutions = [{ value: '720', label: '720p' }, { value: '1080', label: '1080p' }] as const;
const qualities = [{ value: 'std', label: 'Standard' }, { value: 'high', label: 'High' }, { value: 'studio', label: 'Studio' }] as const;

function Field({ label, children }: PropsWithChildren<{ label: string }>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

export function ExportForm({ settings, kind, hasVideo, duration, description, simulateFailure, onSettings, onKind, onSimulateFailure }: {
  settings: ExportSettings; kind: ExportKind; hasVideo: boolean; duration: number; description: ExportDescription; simulateFailure: boolean;
  onSettings: (patch: Partial<ExportSettings>) => void; onKind: (kind: ExportKind) => void; onSimulateFailure: () => void;
}) {
  const kinds = [{ value: 'audio', label: 'Audio only' }, { value: 'video', label: 'Video', disabled: !hasVideo }] as const;
  const estimate = [['Format', description.format], ['Length', formatDuration(duration)], ['Est. size', description.estimatedSize]];

  return <View style={styles.page}>
    <Field label="File name">
      <TextInput accessibilityLabel="File name" value={settings.name} onChangeText={(name) => onSettings({ name })}
        autoCorrect={false} returnKeyType="done" style={creatorText.input} />
    </Field>
    <Field label="What to export">
      <SegmentedControl label="What to export" options={kinds} value={kind} onChange={onKind} />
      {!hasVideo && <Text style={styles.hint}>{"Video export appears once you've recorded a performance video."}</Text>}
    </Field>
    {kind === 'video' ? <Field label="MP4 resolution">
      <SegmentedControl label="Resolution" options={resolutions} value={settings.resolution} onChange={(resolution) => onSettings({ resolution })} />
    </Field> : <Field label="Format">
      <SegmentedControl label="Audio format" options={audioFormats} value={settings.format} onChange={(format) => onSettings({ format })} />
      <Text style={styles.hint}>{settings.format === 'wav' ? 'Lossless — best for further mixing. Bigger files.' : 'Smaller files that sound great for sharing.'}</Text>
    </Field>}
    <Field label="Quality">
      <SegmentedControl label="Quality" options={qualities} value={settings.quality} onChange={(quality) => onSettings({ quality })} />
    </Field>

    <ButtonSurface accessibilityLabel={`Save to ${settings.location}. Change location`} onPress={() => {
      const index = exportLocations.indexOf(settings.location);
      onSettings({ location: exportLocations[(index + 1) % exportLocations.length] });
    }} faceStyle={styles.location}>
      <StudioIcon name="folder" size={icon.button} color={colors.mutedSilver} />
      <View style={styles.locationCopy}>
        <Text style={creatorText.caption}>Save to</Text>
        <Text style={styles.locationName}>{settings.location}</Text>
      </View>
      <Text style={creatorText.detail}>Change</Text>
    </ButtonSurface>
    <MatteCard inset style={styles.estimate}>
      {estimate.map(([label, value]) => <View key={label} style={styles.metric}>
        <Text style={styles.hint}>{label}</Text><Text style={styles.metricValue}>{value}</Text>
      </View>)}
    </MatteCard>
    <Text style={styles.note}>Your editable project stays in Projects, so you can come back and change it later.</Text>
    {__DEV__ && <ButtonSurface accessibilityRole="checkbox" accessibilityLabel="Prototype: simulate a failed export"
      accessibilityState={{ checked: simulateFailure }} onPress={onSimulateFailure} faceStyle={styles.failureToggle}>
      <View aria-hidden style={[styles.checkbox, simulateFailure && styles.checkboxChecked]}>
        {simulateFailure && <StudioIcon name="check" size={12} strokeWidth={2.6} />}
      </View>
      <Text style={styles.hint}>Prototype: simulate a failed export</Text>
    </ButtonSurface>}
  </View>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: 14 },
  field: { gap: spacing.sm },
  label: { ...creatorText.detail, fontFamily: typography.family.medium },
  hint: { ...creatorText.caption, color: colors.textTertiary },
  location: { minHeight: dims.touchTarget, paddingVertical: spacing.md, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, borderRadius: radius.button, backgroundColor: colors.graphite, borderColor: colors.hairlineStrong, borderWidth: 1 },
  locationCopy: { flex: 1, gap: spacing.xxs },
  locationName: { ...creatorText.body, fontSize: typography.size.bodySmall },
  estimate: { flexDirection: 'row', gap: spacing.sm, borderRadius: radius.button, borderColor: colors.hairline },
  metric: { flex: 1, gap: spacing.xs },
  metricValue: { ...creatorText.body, fontFamily: typography.family.semibold, fontSize: typography.size.bodySmall, fontVariant: ['tabular-nums'] },
  note: { ...creatorText.caption, lineHeight: typography.size.caption * typography.lineHeight.body },
  failureToggle: { minHeight: dims.touchTarget, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: icon.inline, height: icon.inline, borderRadius: spacing.xs, borderColor: colors.ashSilver, borderWidth: 1,
    backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.signalCrimson, borderColor: colors.signalCrimson },
});
