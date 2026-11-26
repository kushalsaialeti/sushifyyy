import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { BottomSheet } from '@/components/BottomSheet';
import { CreatorActionRow, creatorText, ScreenTitle } from '@/components/CreatorScreenElements';
import { ExportCard } from '@/components/ExportCard';
import { useStatusToast } from '@/components/StatusToast';
import { formatDuration, type StudioExport, useCreatorStudio } from '@/store/creatorStudio';
import { useMotionPreference } from '@/theme/MotionProvider';
import { colors, spacing, typography } from '@/theme/theme';

function beginPreview(item: StudioExport) {
  return { id: item.id, duration: item.dur, startedAt: Date.now() };
}

export default function ExportsRoute() {
  const exports = useCreatorStudio((state) => state.exports);
  const toast = useStatusToast();
  const { reduceMotion } = useMotionPreference();
  const [preview, setPreview] = useState<{ id: string; duration: number; startedAt: number } | null>(null);
  const [position, setPosition] = useState(0);
  const [info, setInfo] = useState<StudioExport | null>(null);

  useFocusEffect(useCallback(() => () => { setPreview(null); setPosition(0); setInfo(null); }, []));

  useEffect(() => {
    if (!preview) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - preview.startedAt) / 1000;
      if (elapsed >= preview.duration) {
        setPreview(null);
        setPosition(0);
      } else {
        setPosition(elapsed);
      }
    }, reduceMotion ? 1000 : 100);
    return () => clearInterval(timer);
  }, [preview, reduceMotion]);

  function play(item: StudioExport) {
    setPosition(0);
    setPreview(preview?.id === item.id ? null : beginPreview(item));
  }

  function share(item: StudioExport) {
    setInfo(null);
    if (item.result.kind === 'simulated') toast('This export was simulated. There’s no file to share.');
    else toast('Share sheet would open here with the saved file');
  }

  const simulated = info?.result.kind === 'simulated';
  const infoRows = info ? [
    ['Format', info.fmt], ['Length', formatDuration(info.dur)], [simulated ? 'Estimated size' : 'Size', info.size],
    ['Exported', info.date], [simulated ? 'Planned location' : 'Location', info.loc],
    ...(simulated ? [['Status', 'Simulated · no file created']] : []),
  ] : [];

  return <AppScreen scroll withDock>
    <View style={styles.page}>
      <ScreenTitle title="Exports" description={exports.some((item) => item.result.kind === 'saved') ? 'Finished files saved to your phone' : 'Simulated exports from this studio'} />
      {exports.map((item) => <ExportCard key={item.id} export={item} playing={preview?.id === item.id}
        position={preview?.id === item.id ? position : 0} onToggle={() => play(item)} onInfo={() => setInfo(item)} onShare={() => share(item)} />)}
      {exports.length === 0 && <Text style={styles.empty}>{"No exports yet. Finish a recording and export it — it'll show up here."}</Text>}
    </View>
    <BottomSheet visible={info !== null} title={info?.name ?? ''} onClose={() => setInfo(null)}>
      {infoRows.map(([label, value]) => <View key={label} style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text>
      </View>)}
      {info && <CreatorActionRow label="Save or share" detail={simulated ? 'No file was created' : "Opens your phone's share sheet"} glyph="share" onPress={() => share(info)} />}
    </BottomSheet>
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.screenTop, gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.graphiteElevated },
  infoLabel: { ...creatorText.detail, fontSize: typography.size.bodySmall },
  infoValue: { ...creatorText.body, fontSize: typography.size.bodySmall, flexShrink: 1, textAlign: 'right' },
  empty: { ...creatorText.detail, fontSize: typography.size.bodySmall, textAlign: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
});
