import type { AudioEngine, AudioFrame, AudioTake, NoiseProfile, RecorderSnapshot } from './AudioEngine';
import { motion } from '../theme/theme';

const frameMs = 25;
const sampleInterval = motion.waveformTickMs;
const rollingPeaks = 64;
const prepareMs = 900;
const processingMs = 1300;

export const recordingWindowSeconds = rollingPeaks * sampleInterval / 1000;
export const minimumTakeSeconds = 0.5;

type Options = { noise: NoiseProfile; monitoring: boolean; take?: AudioTake; now?: () => number };

export class MockAudioEngine implements AudioEngine {
  private snapshot: RecorderSnapshot;
  private frame: AudioFrame;
  private readonly now: () => number;
  private durationMs: number;
  private runningSince: number | null = null;
  private peaks: number[];
  private pendingPeak = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private transition: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private frameListeners = new Set<(frame: AudioFrame) => void>();

  constructor({ noise, monitoring, take, now = () => performance.now() }: Options) {
    this.now = now;
    this.durationMs = (take?.duration ?? 0) * 1000;
    this.peaks = [...(take?.peaks ?? [])];
    this.snapshot = { status: take ? 'finished' : 'idle', monitoring, noise: take?.noise ?? noise, interrupted: false };
    this.frame = { seconds: this.durationMs / 1000, level: 0, peaks: this.peaks.slice(-rollingPeaks) };
  }

  getSnapshot = () => this.snapshot;
  getFrame = () => this.frame;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  onFrame(listener: (frame: AudioFrame) => void) {
    this.frameListeners.add(listener);
    return () => { this.frameListeners.delete(listener); };
  }

  prepare() {
    if (this.snapshot.status !== 'idle') return;
    this.update({ status: 'preparing' });
    this.transition = setTimeout(() => { this.transition = null; this.start(); }, prepareMs);
  }

  start() {
    if (this.snapshot.status !== 'preparing' && this.snapshot.status !== 'paused') return;
    this.clearTransition();
    this.runningSince = this.now();
    this.update({ status: 'recording', interrupted: false });
    this.ticker = setInterval(() => this.tick(), frameMs);
  }

  pause() {
    if (this.snapshot.status !== 'recording') return;
    this.freeze();
    this.update({ status: 'paused' });
  }

  stop() {
    if (this.snapshot.status !== 'recording' && this.snapshot.status !== 'paused') return false;
    if (this.elapsedMs() < minimumTakeSeconds * 1000) return false;
    if (this.runningSince !== null) this.freeze();
    this.update({ status: 'processing', interrupted: false });
    this.transition = setTimeout(() => {
      this.transition = null;
      this.update({ status: 'finished' });
    }, processingMs);
    return true;
  }

  getTake(): AudioTake {
    return { duration: Math.round(this.elapsedMs()) / 1000, peaks: [...this.peaks], noise: this.snapshot.noise };
  }

  setMonitoring(monitoring: boolean) { this.update({ monitoring }); }
  setNoiseProfile(noise: NoiseProfile) { this.update({ noise }); }

  interrupt() {
    if (this.snapshot.status === 'recording') this.pause();
    if (this.snapshot.status === 'paused') this.update({ interrupted: true });
    if (this.snapshot.status === 'preparing') this.reset();
  }

  denyPermission() {
    if (this.runningSince !== null) this.freeze();
    else this.dispose();
    this.update({ status: 'denied', interrupted: false });
  }

  reset() {
    this.dispose();
    this.durationMs = 0;
    this.pendingPeak = 0;
    this.peaks = [];
    this.emit({ seconds: 0, level: 0, peaks: [] });
    this.update({ status: 'idle', interrupted: false });
  }

  dispose() {
    this.clearTransition();
    if (this.ticker !== null) clearInterval(this.ticker);
    this.ticker = null;
    this.runningSince = null;
  }

  private elapsedMs() {
    return this.durationMs + (this.runningSince === null ? 0 : Math.max(0, this.now() - this.runningSince));
  }

  private freeze() {
    this.tick();
    this.durationMs = this.elapsedMs();
    this.dispose();
    this.emit({ ...this.frame, seconds: this.durationMs / 1000, level: 0 });
  }

  private tick() {
    const elapsed = this.elapsedMs();
    const seconds = elapsed / 1000;
    const flutter = Math.abs(Math.sin(seconds * 8.7) * 0.6 + Math.sin(seconds * 4.1 + 2.1) * 0.4);
    const level = Math.min(0.98, 0.16 + flutter * 0.65 + Math.abs(Math.sin(seconds * 41)) * 0.16);
    this.pendingPeak = Math.max(this.pendingPeak, level);
    const target = Math.floor(elapsed / sampleInterval);
    let recent = this.frame.peaks;
    if (target > this.peaks.length) {
      for (let index = this.peaks.length; index < target; index += 1) this.peaks.push(this.pendingPeak);
      this.pendingPeak = 0;
      recent = this.peaks.slice(-rollingPeaks);
    }
    this.emit({ seconds, level, peaks: recent });
  }

  private clearTransition() {
    if (this.transition !== null) clearTimeout(this.transition);
    this.transition = null;
  }

  private emit(frame: AudioFrame) {
    this.frame = frame;
    this.frameListeners.forEach((listener) => listener(frame));
  }

  private update(patch: Partial<RecorderSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}
