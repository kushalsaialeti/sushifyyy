export type RecorderStatus = 'idle' | 'preparing' | 'recording' | 'paused' | 'processing' | 'finished' | 'denied';
export type NoiseProfile = 'natural' | 'clean' | 'strong';

export type AudioFrame = {
  seconds: number;
  level: number;
  peaks: readonly number[];
};

export type AudioTake = { duration: number; peaks: readonly number[]; noise: NoiseProfile };
export type RecorderSnapshot = { status: RecorderStatus; monitoring: boolean; noise: NoiseProfile; interrupted: boolean };

export interface AudioEngine {
  prepare(): void;
  start(): void;
  pause(): void;
  stop(): boolean;
  setMonitoring(enabled: boolean): void;
  setNoiseProfile(profile: NoiseProfile): void;
  getSnapshot(): RecorderSnapshot;
  getFrame(): AudioFrame;
  getTake(): AudioTake;
  subscribe(listener: () => void): () => void;
  onFrame(listener: (frame: AudioFrame) => void): () => void;
  dispose(): void;
}
