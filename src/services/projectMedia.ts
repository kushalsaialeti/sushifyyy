export const studioSteps = ['record', 'enhance', 'karaoke', 'video', 'export'] as const;
export type StudioStep = (typeof studioSteps)[number];
export type ExportKind = 'audio' | 'video';
export const exportLocations = ['Music › Sushifyyyy', 'Downloads', 'Movies › Sushifyyyy'] as const;
export type ExportSettings = {
  name: string;
  format: 'wav' | 'm4a';
  quality: 'std' | 'high' | 'studio';
  resolution: '720' | '1080';
  location: (typeof exportLocations)[number];
};
export type KaraokeAsset = { name: string; localUri: string };
export type CameraFacing = 'front' | 'back';
export type VideoTake = { duration: number; facing: CameraFacing };

export type KaraokeMix = {
  vocalMute: boolean; vocalSolo: boolean; karaokeMute: boolean; karaokeSolo: boolean;
  vocalGain: number; karaokeGain: number; offsetSeconds: number; introSeconds: number;
};
export type VideoSync = { offsetMs: number; trimSeconds: number };
export type ProjectMedia = {
  karaoke: KaraokeAsset | null;
  includeKaraoke: boolean;
  mix: KaraokeMix;
  video: VideoTake | null;
  sync: VideoSync;
  exportKind: ExportKind;
  exportSettings?: ExportSettings;
  reached: StudioStep;
};

export const defaultSync: VideoSync = { offsetMs: 0, trimSeconds: 0 };
export const defaultMix: KaraokeMix = {
  vocalMute: false, vocalSolo: false, karaokeMute: false, karaokeSolo: false,
  vocalGain: 0, karaokeGain: -4, offsetSeconds: 0, introSeconds: 0,
};
export const defaultMedia: ProjectMedia = {
  karaoke: null, includeKaraoke: false, mix: defaultMix, video: null, sync: defaultSync, exportKind: 'audio', reached: 'record',
};
export const autoSyncOffsetMs = 80;

export function furthestStep(a: StudioStep, b: StudioStep): StudioStep {
  return studioSteps.indexOf(a) >= studioSteps.indexOf(b) ? a : b;
}

export function audibleTracks(mix: KaraokeMix) {
  const vocals = !mix.vocalMute && (!mix.karaokeSolo || mix.vocalSolo);
  const karaoke = !mix.karaokeMute && (!mix.vocalSolo || mix.karaokeSolo);
  const label = vocals ? (karaoke ? 'Vocals + karaoke' : 'Vocals only') : (karaoke ? 'Karaoke only' : 'Everything muted');
  return { vocals, karaoke, label };
}

export function isInSync(offsetMs: number) {
  return Math.abs(offsetMs - autoSyncOffsetMs) <= 30;
}

export function stepBack(path: 'karaoke' | 'video' | 'camera' | 'sync' | 'export', media: ProjectMedia) {
  switch (path) {
    case 'karaoke': return 'enhance';
    case 'video': return media.karaoke ? 'karaoke' : 'enhance';
    case 'camera': return 'video';
    case 'sync': return 'video/camera';
    case 'export': return media.video ? 'video/sync' : 'video';
  }
}

const fileExtensions = /\.(mp3|m4a|wav)$/i;
const audioTypes: Record<string, string> = {
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/x-mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/m4a': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/wav': 'wav', 'audio/wave': 'wav', 'audio/x-wav': 'wav', 'audio/vnd.wave': 'wav',
};

export function karaokeExtension(name: string, mimeType?: string) {
  const extension = fileExtensions.exec(name)?.[1].toLowerCase();
  const mime = mimeType?.toLowerCase();
  if (!mime || mime === 'application/octet-stream' || mime === 'audio/*') return extension;
  if (!mime.startsWith('audio/')) return undefined;
  const fromMime = audioTypes[mime];
  if (!fromMime || (extension && extension !== fromMime)) return undefined;
  return extension ?? (/\.[^.]+$/.test(name) ? undefined : fromMime);
}
