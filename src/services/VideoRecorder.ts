import type { CameraFacing, VideoTake } from './projectMedia';

export interface VideoRecorder {
  start(facing: CameraFacing): void;
  elapsed(): number;
  stop(facing: CameraFacing): VideoTake | null;
  discard(): void;
}

export class MockVideoRecorder implements VideoRecorder {
  private startedAt: number | null = null;

  constructor(private readonly now = () => performance.now()) {}

  start() {
    if (this.startedAt === null) this.startedAt = this.now();
  }

  elapsed() {
    return this.startedAt === null ? 0 : Math.max(0, (this.now() - this.startedAt) / 1000);
  }

  stop(facing: CameraFacing) {
    if (this.startedAt === null) return null;
    const duration = Math.max(0.1, Math.round(this.elapsed() * 1000) / 1000);
    this.discard();
    return { duration, facing };
  }

  discard() { this.startedAt = null; }
}
