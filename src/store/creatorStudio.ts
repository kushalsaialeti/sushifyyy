import { create } from 'zustand';

import type { AudioTake } from '@/services/AudioEngine';
import type { ExportRequest, ExportResult } from '@/services/Exporter';
import { defaultMedia, type ProjectMedia } from '@/services/projectMedia';
import { commitEditorHistory, createEditorHistory, defaultVocalEffects, type EditorHistory, type VocalEffects } from '@/services/vocalEditor';

export type Project = {
  id: string;
  name: string;
  date: string;
  dur: number;
  status: 'Draft' | 'Completed';
  media: 'audio' | 'video';
  seed: number;
};

export type StudioExport = {
  id: string;
  name: string;
  fmt: string;
  fmtShort: 'MP4' | 'WAV' | 'M4A';
  dur: number;
  date: string;
  size: string;
  loc: string;
  result: ExportResult;
};

export const demoCreator = { name: 'Sushi', email: 'sushi@example.com' };
export const demoPhoneStorage = { label: '18.4 GB free of 64 GB', usedPercent: 71 };

const initialProjects: Project[] = [
  { id: 'p1', name: 'Monsoon Sessions', date: 'Today, 6:42 AM', dur: 184, status: 'Draft', media: 'audio', seed: 2 },
  { id: 'p2', name: 'Late Night Acoustic', date: 'Yesterday', dur: 212, status: 'Completed', media: 'video', seed: 4 },
  { id: 'p3', name: 'Fest Rehearsal — Take 3', date: 'Nov 22', dur: 158, status: 'Draft', media: 'audio', seed: 6 },
  { id: 'p4', name: 'Lullaby Cover', date: 'Nov 18', dur: 241, status: 'Completed', media: 'audio', seed: 8 },
];

const initialExports: StudioExport[] = [
  { id: 'e1', name: 'Late Night Acoustic', fmt: 'MP4 · 1080p', fmtShort: 'MP4', dur: 212, date: 'Nov 25', size: '254 MB', loc: 'Movies › Sushifyyyy', result: { kind: 'simulated' } },
  { id: 'e2', name: 'Lullaby Cover', fmt: 'WAV · 48 kHz / 24-bit', fmtShort: 'WAV', dur: 241, date: 'Nov 19', size: '66.6 MB', loc: 'Music › Sushifyyyy', result: { kind: 'simulated' } },
  { id: 'e3', name: 'Lullaby Cover', fmt: 'M4A · 256 kbps', fmtShort: 'M4A', dur: 241, date: 'Nov 19', size: '7.7 MB', loc: 'Music › Sushifyyyy', result: { kind: 'simulated' } },
];

export const qualityOptions = [{ value: '48', label: '48 kHz' }, { value: '44', label: '44.1 kHz' }] as const;
export const noiseOptions = [
  { value: 'natural', label: 'Natural' }, { value: 'clean', label: 'Clean' }, { value: 'strong', label: 'Strong Clean' },
] as const;
export const exportOptions = [{ value: 'wav', label: 'WAV' }, { value: 'm4a', label: 'M4A' }] as const;
export const projectFilters = [
  { value: 'all', label: 'All' }, { value: 'draft', label: 'Drafts' }, { value: 'done', label: 'Completed' },
] as const;
export type ProjectFilter = (typeof projectFilters)[number]['value'];

type StudioPreferences = {
  quality: (typeof qualityOptions)[number]['value'];
  noise: (typeof noiseOptions)[number]['value'];
  format: (typeof exportOptions)[number]['value'];
  monitor: boolean;
  haptics: boolean;
};

type CreatorStudio = {
  email: string | null;
  projects: Project[];
  exports: StudioExport[];
  activeExport: { id: string; projectId: string } | null;
  takes: Record<string, AudioTake>;
  editorHistories: Record<string, EditorHistory>;
  projectMedia: Record<string, ProjectMedia>;
  filter: ProjectFilter;
  headphones: boolean;
  preferences: StudioPreferences;
  cacheMB: number;
  signIn: (email: string) => void;
  signOut: () => void;
  setFilter: (filter: ProjectFilter) => void;
  setHeadphones: (headphones: boolean) => void;
  setPreferences: (patch: Partial<StudioPreferences>) => void;
  clearCache: () => void;
  createDraft: () => Project;
  saveTake: (id: string, take: AudioTake) => boolean;
  editVocals: (id: string, patch: Partial<VocalEffects>) => void;
  moveVocalHistory: (id: string, direction: -1 | 1) => void;
  restoreVocalEffects: (id: string) => void;
  updateProjectMedia: (id: string, update: (current: ProjectMedia) => ProjectMedia) => boolean;
  beginExport: (projectId: string) => string | null;
  releaseExport: (id: string) => void;
  completeExport: (request: ExportRequest, result: ExportResult) => void;
  renameProject: (id: string, name: string) => boolean;
  duplicateProject: (id: string) => boolean;
  deleteProject: (id: string) => boolean;
};

export const useCreatorStudio = create<CreatorStudio>((set, get) => {
  let idSequence = 0;
  let draftSequence = 0;
  const nextId = () => `project-${Date.now()}-${++idSequence}`;

  return {
    email: null,
    projects: initialProjects,
    exports: initialExports,
    activeExport: null,
    takes: {},
    editorHistories: { p1: commitEditorHistory(createEditorHistory(), { gain: 2, reverb: 35, trimStart: 4, trimEnd: 176 }) },
    projectMedia: {},
    filter: 'all',
    headphones: true,
    preferences: { quality: '48', noise: 'clean', format: 'wav', monitor: true, haptics: true },
    cacheMB: 38,
    signIn: (email) => set({ email: email.trim() || demoCreator.email }),
    signOut: () => set({ email: null }),
    setFilter: (filter) => set({ filter }),
    setHeadphones: (headphones) => set({ headphones }),
    setPreferences: (patch) => set((state) => ({ preferences: { ...state.preferences, ...patch } })),
    clearCache: () => set({ cacheMB: 0 }),
    createDraft() {
      const draft: Project = {
        id: nextId(), name: `Untitled Recording ${++draftSequence}`, date: 'Just now', dur: 0, status: 'Draft', media: 'audio', seed: 3,
      };
      set((state) => ({ projects: [draft, ...state.projects] }));
      return draft;
    },
    saveTake(id, take) {
      if (!get().projects.some((project) => project.id === id)) return false;
      set((state) => ({
        projects: state.projects.map((project) => project.id === id ? { ...project, dur: take.duration, date: 'Just now' } : project),
        takes: { ...state.takes, [id]: take },
      }));
      return true;
    },
    editVocals(id, patch) {
      const state = get();
      if (!state.projects.some((project) => project.id === id)) return;
      const history = state.editorHistories[id] ?? createEditorHistory(state.takes[id]?.noise);
      const next = commitEditorHistory(history, patch);
      if (next !== history) set({ editorHistories: { ...state.editorHistories, [id]: next } });
    },
    moveVocalHistory(id, direction) {
      const state = get();
      const history = state.editorHistories[id];
      if (!history) return;
      const index = history.index + direction;
      if (index < 0 || index >= history.snapshots.length) return;
      set({ editorHistories: { ...state.editorHistories, [id]: { ...history, index } } });
    },
    restoreVocalEffects(id) {
      const state = get();
      const history = state.editorHistories[id];
      const current = history?.snapshots[history.index] ?? createEditorHistory(state.takes[id]?.noise).snapshots[0];
      state.editVocals(id, { ...defaultVocalEffects, trimStart: current.trimStart, trimEnd: current.trimEnd });
    },
    updateProjectMedia(id, update) {
      const state = get();
      if (!state.projects.some((project) => project.id === id)) return false;
      const current = state.projectMedia[id] ?? defaultMedia;
      const next = update(current);
      if (next !== current) set({ projectMedia: { ...state.projectMedia, [id]: next } });
      return true;
    },
    beginExport(projectId) {
      const state = get();
      if (state.activeExport || !state.projects.some((project) => project.id === projectId && project.dur > 0)) return null;
      const id = `export-${nextId()}`;
      set({ activeExport: { id, projectId } });
      return id;
    },
    releaseExport(id) {
      if (get().activeExport?.id === id) set({ activeExport: null });
    },
    completeExport(request, result) {
      const state = get();
      if (state.activeExport?.id !== request.id || state.activeExport.projectId !== request.projectId) return;
      const item: StudioExport = {
        id: request.id, name: request.settings.name, fmt: request.description.formatDetails, fmtShort: request.description.format,
        dur: request.duration, date: 'Today', size: request.description.estimatedSize, loc: request.settings.location, result,
      };
      const media = state.projectMedia[request.projectId] ?? defaultMedia;
      set({
        activeExport: null,
        exports: [item, ...state.exports],
        projects: state.projects.map((project) => project.id === request.projectId ? {
          ...project, status: 'Completed', media: request.kind === 'video' ? 'video' : project.media, date: 'Today',
        } : project),
        projectMedia: { ...state.projectMedia, [request.projectId]: { ...media, reached: 'export' } },
      });
    },
    renameProject(id, name) {
      const trimmed = name.trim();
      if (!trimmed || !get().projects.some((project) => project.id === id)) return false;
      set((state) => ({ projects: state.projects.map((project) => project.id === id ? { ...project, name: trimmed } : project) }));
      return true;
    },
    duplicateProject(id) {
      const original = get().projects.find((project) => project.id === id);
      if (!original) return false;
      const copy: Project = { ...original, id: nextId(), name: `${original.name} (copy)`, status: 'Draft', date: 'Just now' };
      set((state) => ({ projects: [copy, ...state.projects],
        takes: state.takes[id] ? { ...state.takes, [copy.id]: state.takes[id] } : state.takes,
        editorHistories: state.editorHistories[id] ? { ...state.editorHistories, [copy.id]: state.editorHistories[id] } : state.editorHistories,
        projectMedia: state.projectMedia[id] ? { ...state.projectMedia, [copy.id]: state.projectMedia[id] } : state.projectMedia }));
      return true;
    },
    deleteProject(id) {
      if (get().activeExport?.projectId === id) return false;
      const current = get().projects;
      const remaining = current.filter((project) => project.id !== id);
      if (remaining.length === current.length) return false;
      const takes = { ...get().takes };
      const editorHistories = { ...get().editorHistories };
      const projectMedia = { ...get().projectMedia };
      delete takes[id];
      delete editorHistories[id];
      delete projectMedia[id];
      set({ projects: remaining, takes, editorHistories, projectMedia });
      return true;
    },
  };
});

export function filterProjects(projects: Project[], filter: ProjectFilter, search: string) {
  const query = search.trim().toLowerCase();
  const status = filter === 'all' ? null : filter === 'draft' ? 'Draft' : 'Completed';
  return projects.filter((project) => (!status || project.status === status) && project.name.toLowerCase().includes(query));
}

export function formatDuration(seconds: number) {
  const duration = Math.max(0, Math.floor(seconds));
  return `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
}
