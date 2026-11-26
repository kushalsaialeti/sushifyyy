import type { ExportKind, ExportSettings } from './projectMedia';

export type ExportDescription = {
  extension: 'wav' | 'm4a' | 'mp4';
  format: 'WAV' | 'M4A' | 'MP4';
  formatDetails: string;
  estimatedSize: string;
};

export type ExportRequest = {
  id: string;
  projectId: string;
  kind: ExportKind;
  settings: ExportSettings;
  duration: number;
  description: ExportDescription;
  simulateFailure: boolean;
};

// The native adapter returns a saved result only after expo-media-library confirms the local asset.
export type ExportResult = { kind: 'simulated' } | { kind: 'saved'; uri: string };
export type ExportPhase = 'rendering' | 'encoding' | 'saving';
export type ExportSettlement =
  | { state: 'complete'; request: ExportRequest; result: ExportResult }
  | { state: 'failed'; request: ExportRequest; progress: number }
  | { state: 'cancelled'; request: ExportRequest };
export type ExportSnapshot =
  | { state: 'form' }
  | { state: 'running'; request: ExportRequest; progress: number; phase: ExportPhase }
  | Exclude<ExportSettlement, { state: 'cancelled' }>;

export interface Exporter {
  getSnapshot(): ExportSnapshot;
  subscribe(listener: () => void): () => void;
  start(request: ExportRequest, onSettle: (settlement: ExportSettlement) => void): boolean;
  cancel(): boolean;
  reset(): void;
  dispose(): void;
}

const wavRates = { std: 176400, high: 288000, studio: 576000 };
const wavDetails = { std: '44.1 kHz / 16-bit', high: '48 kHz / 24-bit', studio: '96 kHz / 24-bit' };
const aacRates = { std: 128, high: 256, studio: 320 };
const videoRates = { '720': 5e6, '1080': 9.5e6 };
const videoQualityScale = { std: 0.7, high: 1, studio: 1.4 };

// The prototype estimates against the original take length, while the export duration reflects the trim.
export function describeExport(kind: ExportKind, settings: ExportSettings, originalDuration: number): ExportDescription {
  const { format, quality, resolution } = settings;
  const description = kind === 'video'
    ? { extension: 'mp4', format: 'MP4', detail: `${resolution}p`, rate: videoRates[resolution] * videoQualityScale[quality] / 8 } as const
    : format === 'wav'
      ? { extension: 'wav', format: 'WAV', detail: wavDetails[quality], rate: wavRates[quality] } as const
      : { extension: 'm4a', format: 'M4A', detail: `${aacRates[quality]} kbps`, rate: aacRates[quality] * 1000 / 8 } as const;
  const size = description.rate * Math.max(0, originalDuration) / 1048576;
  return { extension: description.extension, format: description.format, formatDetails: `${description.format} · ${description.detail}`,
    estimatedSize: `${size.toFixed(size >= 100 ? 0 : 1)} MB` };
}

export function exportBaseName(name: string, fallback: string) {
  const clean = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_').trim().replace(/\.(wav|m4a|mp4)$/i, '').replace(/[. ]+$/, '');
  return clean(name) || clean(fallback) || 'Recording';
}
