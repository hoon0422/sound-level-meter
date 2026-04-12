import {
  type AudioEngineConfig,
  type AudioRuntimeMetrics,
  type MicrophoneEngine,
  createMicrophoneEngine,
  disconnectMicrophoneEngine,
  resumeMicrophoneEngine,
  stopMicrophoneEngine,
} from "./engine";
import { calibrateDbfsForDisplay } from "./spectrum";

export type { AudioEngineConfig };

export type MicrophoneState = {
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isDisconnecting: boolean;
  elapsedSeconds: number;
  dbfs: number;
  error: string | null;
};

export type MicrophoneAudioFrame = {
  frequencyData: Float32Array;
  dbfs: number;
  elapsedSeconds: number;
  sampleRate: number;
  fftSize: number;
  minDecibels: number;
  maxDecibels: number;
};

export type MicrophoneStateListener = (state: MicrophoneState) => void;
export type MicrophoneFrameListener = (frame: MicrophoneAudioFrame) => void;

export function createIdleMicrophoneState(): MicrophoneState {
  return {
    isRunning: false,
    isStarting: false,
    isStopping: false,
    isDisconnecting: false,
    elapsedSeconds: 0,
    dbfs: -100,
    error: null,
  };
}

export class MicrophoneController {
  private static instance: MicrophoneController | null = null;

  private freqData: Float32Array | null = null;
  private running = false;
  private elapsedAccumulator = 0;
  private engine: MicrophoneEngine | null = null;
  private stateListeners = new Set<MicrophoneStateListener>();
  private frameListeners = new Set<MicrophoneFrameListener>();

  private constructor() {}

  static getInstance(): MicrophoneController {
    if (!MicrophoneController.instance) {
      MicrophoneController.instance = new MicrophoneController();
    }
    return MicrophoneController.instance;
  }

  subscribe(listener: MicrophoneStateListener): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  onFrame(listener: MicrophoneFrameListener): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  private emitState(state: MicrophoneState) {
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private emitFrame(frame: MicrophoneAudioFrame) {
    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  private handleAudioMetrics = (metrics: AudioRuntimeMetrics) => {
    if (!this.running || !this.engine || !this.freqData) return;

    this.elapsedAccumulator += metrics.elapsedSeconds;
    this.engine.analyser.getFloatFrequencyData(this.freqData);

    this.emitFrame({
      frequencyData: this.freqData,
      dbfs: metrics.dbfs,
      elapsedSeconds: metrics.elapsedSeconds,
      sampleRate: this.engine.audioContext.sampleRate,
      fftSize: this.engine.analyser.fftSize,
      minDecibels: this.engine.analyser.minDecibels,
      maxDecibels: this.engine.analyser.maxDecibels,
    });

    this.emitState({
      isRunning: true,
      isStarting: false,
      isStopping: false,
      isDisconnecting: false,
      elapsedSeconds: this.elapsedAccumulator,
      dbfs: calibrateDbfsForDisplay(metrics.dbfs),
      error: null,
    });
  };

  stop() {
    this.running = false;
    stopMicrophoneEngine();
    this.elapsedAccumulator = 0;

    this.emitState(createIdleMicrophoneState());
  }

  async disconnect(): Promise<void> {
    this.running = false;
    this.emitState({
      ...createIdleMicrophoneState(),
      isDisconnecting: true,
    });

    await disconnectMicrophoneEngine();
    this.engine = null;
    this.freqData = null;
    this.elapsedAccumulator = 0;

    this.emitState(createIdleMicrophoneState());
  }

  async start(config: AudioEngineConfig): Promise<boolean> {
    if (this.running) {
      this.stop();
    }

    if (this.engine) {
      try {
        resumeMicrophoneEngine();
        this.elapsedAccumulator = 0;
        this.running = true;

        this.emitState({
          ...createIdleMicrophoneState(),
          isRunning: true,
        });
        return true;
      } catch {
        await this.disconnect();
      }
    }

    this.emitState({
      ...createIdleMicrophoneState(),
      isStarting: true,
    });

    try {
      this.engine = await createMicrophoneEngine({
        sampleRate: config.sampleRate,
        fftSize: config.fftSize,
        smoothingTimeConstant: config.smoothingTimeConstant,
        minDecibels: config.minDecibels,
        maxDecibels: config.maxDecibels,
        autoResumeContext: config.autoResumeContext,
        onAudioMetrics: this.handleAudioMetrics,
      });

      this.freqData = new Float32Array(this.engine.analyser.frequencyBinCount);
      this.elapsedAccumulator = 0;
      this.running = true;

      this.emitState({
        ...createIdleMicrophoneState(),
        isRunning: true,
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.emitState({
        ...createIdleMicrophoneState(),
        error: message,
      });
      return false;
    }
  }
}
