import {
  AudioRuntimeMetrics,
  MicrophoneSpectrumEngine,
  createMicrophoneSpectrumEngine,
  disconnectMicrophoneSpectrumEngine,
  resumeMicrophoneSpectrumEngine,
  stopMicrophoneSpectrumEngine,
} from "@/audio/microphoneSpectrumEngine";
import {
  analyzeFrequencyFrame,
  calibrateDbfsForDisplay,
} from "@/audio/spectrumAnalysis";

export type MicrophoneSpectrumSnapshot = {
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isDisconnecting: boolean;
  elapsedSeconds: number;
  dbfs: number;
  peakHz: number | null;
  peakLevel: number | null;
  bars: number[];
  error: string | null;
};

export type MicrophoneSpectrumConfig = {
  fftSize: number;
  barCount: number;
  minHz: number;
  maxHz: number;
  minDecibels: number;
  maxDecibels: number;
  smoothingTimeConstant: number;
  noiseFloorDbfs: number;
  barSmoothingAlpha: number;
  sampleRate: number;
  autoResumeContext: boolean;
};

export type MicrophoneSpectrumListener = (
  snapshot: MicrophoneSpectrumSnapshot,
) => void;

export const DEFAULT_CONFIG: MicrophoneSpectrumConfig = {
  fftSize: 1024,
  barCount: 32,
  minHz: 0,
  maxHz: 20000,
  noiseFloorDbfs: -65,
  barSmoothingAlpha: 0.2,
  sampleRate: 44100,
  smoothingTimeConstant: 0.3,
  minDecibels: -90,
  maxDecibels: -10,
  autoResumeContext: true,
};

export function createIdleSnapshot(
  barCount: number,
): MicrophoneSpectrumSnapshot {
  return {
    isRunning: false,
    isStarting: false,
    isStopping: false,
    isDisconnecting: false,
    elapsedSeconds: 0,
    dbfs: -100,
    peakHz: null,
    peakLevel: null,
    bars: Array(barCount).fill(0) as number[],
    error: null,
  };
}

export class MicrophoneSpectrumController {
  private static instance: MicrophoneSpectrumController | null = null;

  private freqData: Float32Array | null = null;
  private smoothedBars: number[] = [];
  private running = false;
  private elapsedAccumulator = 0;
  private engine: MicrophoneSpectrumEngine | null = null;
  private config: MicrophoneSpectrumConfig = DEFAULT_CONFIG;
  private listeners = new Set<MicrophoneSpectrumListener>();

  private constructor() {}

  static getInstance(): MicrophoneSpectrumController {
    if (!MicrophoneSpectrumController.instance) {
      MicrophoneSpectrumController.instance =
        new MicrophoneSpectrumController();
    }
    return MicrophoneSpectrumController.instance;
  }

  subscribe(listener: MicrophoneSpectrumListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(snapshot: MicrophoneSpectrumSnapshot) {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private handleAudioMetrics = (metrics: AudioRuntimeMetrics) => {
    if (!this.running || !this.engine || !this.freqData) return;

    this.elapsedAccumulator += metrics.elapsedSeconds;
    this.engine.analyser.getFloatFrequencyData(this.freqData);

    const analysis = analyzeFrequencyFrame(this.freqData, this.smoothedBars, {
      sampleRate: this.engine.audioContext.sampleRate,
      fftSize: this.engine.analyser.fftSize,
      barCount: this.config.barCount,
      minHz: this.config.minHz,
      maxHz: this.config.maxHz,
      minDecibels: this.config.minDecibels,
      maxDecibels: this.config.maxDecibels,
      barSmoothingAlpha: this.config.barSmoothingAlpha,
    });
    this.smoothedBars = analysis.bars;
    const hasMeaningfulSignal = metrics.dbfs > this.config.noiseFloorDbfs;

    this.emit({
      isRunning: true,
      isStarting: false,
      isStopping: false,
      isDisconnecting: false,
      elapsedSeconds: this.elapsedAccumulator,
      dbfs: calibrateDbfsForDisplay(metrics.dbfs),
      peakHz: hasMeaningfulSignal ? analysis.peakHz : null,
      peakLevel: hasMeaningfulSignal ? analysis.peakLevel : null,
      bars: analysis.bars,
      error: null,
    });
  };

  stop() {
    this.running = false;
    stopMicrophoneSpectrumEngine();
    this.smoothedBars = [];
    this.elapsedAccumulator = 0;

    this.emit(createIdleSnapshot(this.config.barCount));
  }

  async disconnect(): Promise<void> {
    this.running = false;
    this.emit({
      ...createIdleSnapshot(this.config.barCount),
      isDisconnecting: true,
    });

    await disconnectMicrophoneSpectrumEngine();
    this.engine = null;
    this.freqData = null;
    this.smoothedBars = [];
    this.elapsedAccumulator = 0;

    this.emit(createIdleSnapshot(this.config.barCount));
  }

  async start(config: MicrophoneSpectrumConfig): Promise<boolean> {
    this.config = config;

    if (this.running) {
      this.stop();
    }

    if (this.engine) {
      try {
        resumeMicrophoneSpectrumEngine();
        this.smoothedBars = [];
        this.elapsedAccumulator = 0;
        this.running = true;

        this.emit({ ...createIdleSnapshot(config.barCount), isRunning: true });
        return true;
      } catch {
        await this.disconnect();
      }
    }

    this.emit({ ...createIdleSnapshot(config.barCount), isStarting: true });

    try {
      this.engine = await createMicrophoneSpectrumEngine({
        sampleRate: config.sampleRate,
        fftSize: config.fftSize,
        smoothingTimeConstant: config.smoothingTimeConstant,
        minDecibels: config.minDecibels,
        maxDecibels: config.maxDecibels,
        autoResumeContext: config.autoResumeContext,
        onAudioMetrics: this.handleAudioMetrics,
      });

      this.freqData = new Float32Array(this.engine.analyser.frequencyBinCount);
      this.smoothedBars = [];
      this.elapsedAccumulator = 0;
      this.running = true;

      this.emit({ ...createIdleSnapshot(config.barCount), isRunning: true });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown microphone error";
      await this.disconnect();
      this.emit({
        ...createIdleSnapshot(config.barCount),
        error: message,
      });
      return false;
    }
  }
}
