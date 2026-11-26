import type { NoiseProfile } from './AudioEngine';

export type VocalEffects = {
  gain: number; reverb: number; room: number; warmth: number; presence: number; air: number;
  comp: number; fadeIn: number; fadeOut: number; trimStart: number; trimEnd: number | null; noise: NoiseProfile;
};
export type Trim = { start: number; end: number };
export type EditorHistory = { snapshots: readonly VocalEffects[]; index: number };
export const defaultVocalEffects: VocalEffects = {
  gain: 0, reverb: 20, room: 40, warmth: 0, presence: 2, air: 1, comp: 30,
  fadeIn: 0.5, fadeOut: 1.5, trimStart: 0, trimEnd: null, noise: 'clean',
};
export const minimumTrimLength = 1;

export function createEditorHistory(noise: NoiseProfile = defaultVocalEffects.noise): EditorHistory {
  return { snapshots: [{ ...defaultVocalEffects, noise }], index: 0 };
}

export function trimFor(effects: VocalEffects, duration: number): Trim {
  const shortest = Math.min(minimumTrimLength, duration);
  const start = Math.max(0, Math.min(effects.trimStart, duration - shortest));
  const end = Math.min(duration, Math.max(effects.trimEnd ?? duration, start + shortest));
  return { start, end };
}

export function trimEdit(edge: keyof Trim, value: number, trim: Trim, duration: number): Partial<VocalEffects> {
  const shortest = Math.min(minimumTrimLength, duration);
  if (edge === 'start') return { trimStart: Math.max(0, Math.min(value, trim.end - shortest)) };
  const end = Math.min(duration, Math.max(value, trim.start + shortest));
  return { trimEnd: end === duration ? null : end };
}

export function commitEditorHistory(history: EditorHistory, patch: Partial<VocalEffects>): EditorHistory {
  const previous = history.snapshots[history.index];
  const next = { ...previous, ...patch };
  if ((Object.keys(patch) as (keyof VocalEffects)[]).every((key) => next[key] === previous[key])) return history;
  const index = history.index + 1;
  return { snapshots: [...history.snapshots.slice(0, index), next], index };
}

export function loopPreviewPosition(position: number, elapsed: number, { start, end }: Trim): number {
  const span = end - start;
  if (span <= 0) return start;
  const offset = position >= start && position < end ? position - start : 0;
  return start + ((offset + elapsed) % span);
}

export function enhancedPeaks(source: readonly number[], duration: number, effects: VocalEffects): readonly number[] {
  const trim = trimFor(effects, duration);
  const gain = Math.pow(10, effects.gain / 40);
  const smoothing = 1 - effects.comp / 220;
  return source.map((peak, index) => {
    const seconds = (index + 0.5) / source.length * duration;
    const head = effects.fadeIn > 0 ? (seconds - trim.start) / effects.fadeIn : 1;
    const tail = effects.fadeOut > 0 ? (trim.end - seconds) / effects.fadeOut : 1;
    const envelope = Math.max(0.05, Math.min(1, head, tail));
    return Math.max(0.05, Math.min(1, Math.pow(peak, smoothing) * gain * envelope));
  });
}
