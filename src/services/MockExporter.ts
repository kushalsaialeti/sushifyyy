import type { Exporter, ExportPhase, ExportRequest, ExportSettlement, ExportSnapshot } from './Exporter';
import { motion } from '../theme/theme';

const encodingThreshold = 40;
const savingThreshold = 82;
const failureThreshold = 68;
const progressStep = 1.5;

function phaseFor(progress: number): ExportPhase {
  return progress >= savingThreshold ? 'saving' : progress >= encodingThreshold ? 'encoding' : 'rendering';
}

export class MockExporter implements Exporter {
  private snapshot: ExportSnapshot = { state: 'form' };
  private listeners = new Set<() => void>();
  private clock: ReturnType<typeof setInterval> | null = null;
  private onSettle: ((settlement: ExportSettlement) => void) | null = null;

  constructor(private readonly tickMs = motion.waveformTickMs) {}

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  start(request: ExportRequest, onSettle: (settlement: ExportSettlement) => void) {
    if (this.snapshot.state === 'running') return false;
    this.onSettle = onSettle;
    this.clock = setInterval(() => this.tick(), this.tickMs);
    this.setSnapshot({ state: 'running', request, progress: 0, phase: 'rendering' });
    return true;
  }

  cancel() {
    const current = this.snapshot;
    if (current.state !== 'running' || current.phase === 'saving') return false;
    this.settle({ state: 'cancelled', request: current.request });
    return true;
  }

  reset() {
    if (this.snapshot.state !== 'running') this.setSnapshot({ state: 'form' });
  }

  dispose() {
    if (this.clock !== null) clearInterval(this.clock);
    this.clock = null;
    this.onSettle = null;
    this.snapshot = { state: 'form' };
  }

  private tick() {
    const current = this.snapshot;
    if (current.state !== 'running') return;
    const progress = current.progress + progressStep;
    if (current.request.simulateFailure && progress >= failureThreshold) {
      this.settle({ state: 'failed', request: current.request, progress: failureThreshold });
    } else if (progress >= 100) {
      this.settle({ state: 'complete', request: current.request, result: { kind: 'simulated' } });
    } else {
      this.setSnapshot({ ...current, progress, phase: phaseFor(progress) });
    }
  }

  private settle(settlement: ExportSettlement) {
    if (this.clock !== null) clearInterval(this.clock);
    this.clock = null;
    const report = this.onSettle;
    this.onSettle = null;
    this.setSnapshot(settlement.state === 'cancelled' ? { state: 'form' } : settlement);
    report?.(settlement);
  }

  private setSnapshot(snapshot: ExportSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export function createExporter(): Exporter {
  // Select the Expo Media Library-backed adapter here when local rendering is connected.
  return new MockExporter();
}
