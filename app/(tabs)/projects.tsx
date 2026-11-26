import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CreatorActionRow, creatorText, ScreenTitle } from '@/components/CreatorScreenElements';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryGlossyButton } from '@/components/PrimaryGlossyButton';
import { ProjectCard } from '@/components/ProjectCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useStatusToast } from '@/components/StatusToast';
import { StudioIcon } from '@/components/StudioIcon';
import { projectEntryRoute, studioRoute, useStartRecording } from '@/navigation/studioRoutes';
import { discardUnreferencedKaraokeCopy } from '@/services/karaokeFiles';
import { filterProjects, projectFilters, type Project, useCreatorStudio } from '@/store/creatorStudio';
import { colors, spacing, typography } from '@/theme/theme';

export default function ProjectsRoute() {
  const router = useRouter();
  const toast = useStatusToast();
  const startRecording = useStartRecording();
  const projects = useCreatorStudio((state) => state.projects);
  const filter = useCreatorStudio((state) => state.filter);
  const setFilter = useCreatorStudio((state) => state.setFilter);
  const rename = useCreatorStudio((state) => state.renameProject);
  const duplicate = useCreatorStudio((state) => state.duplicateProject);
  const remove = useCreatorStudio((state) => state.deleteProject);
  const [query, setQuery] = useState('');
  const [overlay, setOverlay] = useState<{ kind: 'menu' | 'rename' | 'delete'; id: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const visibleProjects = filterProjects(projects, filter, query);
  const selected = projects.find((project) => project.id === overlay?.id);

  function close() {
    setOverlay(null);
  }

  function open(project: Project, toExport = false) {
    Keyboard.dismiss();
    close();
    router.push(toExport ? studioRoute(project.id, 'export') : projectEntryRoute(project));
  }

  function saveName() {
    if (!selected || !rename(selected.id, renameValue)) return;
    Keyboard.dismiss();
    close();
    toast('Renamed');
  }

  return <AppScreen scroll withDock keyboardAvoiding>
    <View style={styles.page}>
      <ScreenTitle title="Projects" description={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} · saved on this phone`} />
      <View style={styles.search}>
        <StudioIcon name="search" color={colors.textTertiary} />
        <TextInput accessibilityLabel="Search projects" value={query} onChangeText={setQuery} placeholder="Search projects"
          placeholderTextColor={colors.textTertiary} autoCorrect={false} returnKeyType="search" style={styles.searchInput} />
      </View>
      <SegmentedControl label="Filter" options={projectFilters} value={filter} onChange={setFilter} />

      {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} onOpen={() => open(project)}
        onMenu={() => { Keyboard.dismiss(); setOverlay({ kind: 'menu', id: project.id }); }} />)}
      {visibleProjects.length === 0 && <EmptyState icon="wave"
        title={projects.length === 0 ? 'Your studio is quiet' : 'Nothing matches'}
        body={projects.length === 0 ? 'Every take you record is saved here as a project you can come back to.' : 'Try another name or filter.'}
        action={{ label: 'Start recording', onPress: () => { Keyboard.dismiss(); startRecording(); } }} />}
    </View>

    {selected && <>
      <BottomSheet visible={overlay?.kind === 'menu' || overlay?.kind === 'rename'} title={overlay?.kind === 'rename' ? 'Rename project' : selected.name} onClose={close}>
        {overlay?.kind === 'rename' ? <>
          <Text style={creatorText.detail}>Project name</Text>
          <TextInput accessibilityLabel="Project name" value={renameValue} onChangeText={setRenameValue}
            style={styles.renameInput} returnKeyType="done" onSubmitEditing={saveName} />
          <PrimaryGlossyButton label="Save name" disabled={!renameValue.trim()} onPress={saveName} />
        </> : <>
          <CreatorActionRow label="Open" detail="Continue editing" glyph="open" onPress={() => open(selected)} />
          <CreatorActionRow label="Rename" glyph="edit" onPress={() => { setRenameValue(selected.name); setOverlay({ kind: 'rename', id: selected.id }); }} />
          <CreatorActionRow label="Duplicate" detail="Make a copy to try new ideas" glyph="copy" onPress={() => {
            if (duplicate(selected.id)) toast('Project duplicated');
            close();
          }} />
          <CreatorActionRow label="Export" glyph="download" detail={selected.status === 'Completed' ? 'Save a new file' : 'Finish editing first, or export as is'}
            onPress={() => open(selected, true)} />
          <CreatorActionRow label="Delete" glyph="trash" danger onPress={() => setOverlay({ kind: 'delete', id: selected.id })} />
        </>}
      </BottomSheet>
      <ConfirmationDialog visible={overlay?.kind === 'delete'} title={`Delete "${selected.name}"?`}
        body="This removes the project and its original recording from this phone. Exported files are kept. This can't be undone."
        confirmLabel="Delete" destructive onCancel={close} onConfirm={() => {
          const uri = useCreatorStudio.getState().projectMedia[selected.id]?.karaoke?.localUri;
          if (remove(selected.id)) {
            if (uri) discardUnreferencedKaraokeCopy(uri);
            toast('Project deleted');
          }
          close();
        }} />
    </>}
  </AppScreen>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.screenX, paddingTop: spacing.screenTop, gap: 14 },
  search: { ...creatorText.input, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, minHeight: 46, color: colors.porcelain, fontFamily: typography.family.regular, fontSize: typography.size.body },
  renameInput: { ...creatorText.input, backgroundColor: colors.well, borderColor: colors.ashSilver },
});
