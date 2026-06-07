import {
  type AudioEngineConfig,
  type AudioRuntimeMetrics,
  type MicrophoneEngine,
  createMicrophoneEngine,
  disconnectMicrophoneEngine,
  startMicrophoneEngine,
  stopMicrophoneEngine,
} from './engine';
import {
  captureSentryException,
  getSentryErrorAttributes,
  getSentryErrorMessage,
  logSentryError,
  traceSentrySpan,
} from '@/analytics/sentry';

export type { AudioEngineConfig };

export type MicrophoneState = {
  isRunning: boolean;
  isConnecting: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isDisconnecting: boolean;
  elapsedSeconds: number;
  measurementSessionId: number;
  error: string | null;
};

export type MicrophoneAudioFrame = {
  frequencyData: Float32Array;
  dbfs: number;
  frameDurationSeconds: number;
  sessionElapsedSeconds: number;
  sampleRate: number;
  fftSize: number;
  minDecibels: number;
  maxDecibels: number;
};

export type MicrophoneStateListener = (state: MicrophoneState) => void;
export type MicrophoneFrameListener = (frame: MicrophoneAudioFrame) => void;
export type MicrophoneStateDisposeListener = (state: MicrophoneState) => void;
export type MicrophoneFrameDisposeListener = (frame: MicrophoneAudioFrame | null) => void;

export function createIdleMicrophoneState(measurementSessionId = 0, elapsedSeconds = 0): MicrophoneState {
  return {
    isRunning: false,
    isConnecting: false,
    isStarting: false,
    isStopping: false,
    isDisconnecting: false,
    elapsedSeconds,
    measurementSessionId,
    error: null,
  };
}

export class MicrophoneController {
  private static instance: MicrophoneController | null = null;

  private freqData: Float32Array | null = null;
  private running = false;
  private elapsedAccumulator = 0;
  private measurementSessionId = 0;
  private engine: MicrophoneEngine | null = null;
  private stateListeners = new Set<MicrophoneStateListener>();
  private frameListeners = new Set<MicrophoneFrameListener>();
  private stateDisposeListeners = new Map<MicrophoneStateListener, MicrophoneStateDisposeListener>();
  private frameDisposeListeners = new Map<MicrophoneFrameListener, MicrophoneFrameDisposeListener>();
  private lastState = createIdleMicrophoneState();
  private lastFrame: MicrophoneAudioFrame | null = null;

  private constructor() {}

  static getInstance(): MicrophoneController {
    if (!MicrophoneController.instance) {
      MicrophoneController.instance = new MicrophoneController();
    }
    return MicrophoneController.instance;
  }

  subscribe(listener: MicrophoneStateListener, onDispose?: MicrophoneStateDisposeListener): () => void {
    this.stateListeners.add(listener);
    if (onDispose) {
      this.stateDisposeListeners.set(listener, onDispose);
    }

    return () => {
      this.stateListeners.delete(listener);
      this.stateDisposeListeners.delete(listener);
    };
  }

  onFrame(listener: MicrophoneFrameListener, onDispose?: MicrophoneFrameDisposeListener): () => void {
    this.frameListeners.add(listener);
    if (onDispose) {
      this.frameDisposeListeners.set(listener, onDispose);
    }

    return () => {
      this.frameListeners.delete(listener);
      this.frameDisposeListeners.delete(listener);
    };
  }

  private emitState(state: MicrophoneState) {
    this.lastState = state;

    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private emitFrame(frame: MicrophoneAudioFrame) {
    this.lastFrame = frame;

    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  private emitDispose(state: MicrophoneState, frame: MicrophoneAudioFrame | null) {
    for (const listener of Array.from(this.stateDisposeListeners.values())) {
      listener(state);
    }

    for (const listener of Array.from(this.frameDisposeListeners.values())) {
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
      frameDurationSeconds: metrics.elapsedSeconds,
      sessionElapsedSeconds: this.elapsedAccumulator,
      sampleRate: this.engine.audioContext.sampleRate,
      fftSize: this.engine.analyser.fftSize,
      minDecibels: this.engine.analyser.minDecibels,
      maxDecibels: this.engine.analyser.maxDecibels,
    });

    this.emitState({
      isRunning: true,
      isConnecting: false,
      isStarting: false,
      isStopping: false,
      isDisconnecting: false,
      elapsedSeconds: this.elapsedAccumulator,
      measurementSessionId: this.measurementSessionId,
      error: null,
    });
  };

  stop() {
    this.running = false;
    stopMicrophoneEngine();

    this.emitState(createIdleMicrophoneState(this.measurementSessionId, this.elapsedAccumulator));
  }

  private async releaseEngine(): Promise<void> {
    this.running = false;
    this.emitState({
      ...createIdleMicrophoneState(this.measurementSessionId, this.elapsedAccumulator),
      isDisconnecting: true,
    });

    await disconnectMicrophoneEngine();
    this.engine = null;
    this.freqData = null;
    this.elapsedAccumulator = 0;

    this.emitState(createIdleMicrophoneState(this.measurementSessionId));
  }

  async disconnect(): Promise<void> {
    const stateSnapshot = this.lastState;
    const frameSnapshot = this.lastFrame;

    this.emitDispose(stateSnapshot, frameSnapshot);
    await this.releaseEngine();

    this.stateListeners.clear();
    this.frameListeners.clear();
    this.stateDisposeListeners.clear();
    this.frameDisposeListeners.clear();
    this.lastFrame = null;
  }

  async dispose(): Promise<void> {
    await this.disconnect();
  }

  private async prepareEngine(config: AudioEngineConfig, stateKey: 'isConnecting' | 'isStarting'): Promise<boolean> {
    if (this.engine) {
      return true;
    }

    this.emitState({
      ...createIdleMicrophoneState(this.measurementSessionId, this.elapsedAccumulator),
      [stateKey]: true,
    });

    try {
      this.engine = await traceSentrySpan(
        {
          name: 'Create microphone engine',
          op: 'audio.engine.create',
          attributes: {
            stateKey,
            sampleRate: config.sampleRate,
            fftSize: config.fftSize,
          },
        },
        () =>
          createMicrophoneEngine({
            sampleRate: config.sampleRate,
            fftSize: config.fftSize,
            smoothingTimeConstant: config.smoothingTimeConstant,
            minDecibels: config.minDecibels,
            maxDecibels: config.maxDecibels,
            autoResumeContext: config.autoResumeContext,
            onAudioMetrics: this.handleAudioMetrics,
          })
      );

      traceSentrySpan(
        {
          name: 'Allocate frequency buffer',
          op: 'audio.engine.allocate',
          attributes: {
            frequencyBinCount: this.engine.analyser.frequencyBinCount,
          },
        },
        () => {
          this.freqData = new Float32Array(this.engine?.analyser.frequencyBinCount ?? 0);
          this.elapsedAccumulator = 0;
        }
      );

      if (stateKey === 'isConnecting') {
        this.emitState(createIdleMicrophoneState(this.measurementSessionId));
      }
      return true;
    } catch (error) {
      const message = getSentryErrorMessage(error, 'Unknown microphone engine preparation error occurred');
      logSentryError('Microphone engine preparation failed', {
        ...getSentryErrorAttributes(error),
        stateKey,
      });
      captureSentryException(error, 'Microphone engine preparation failed', {
        stateKey,
        sampleRate: config.sampleRate,
        fftSize: config.fftSize,
      });
      this.emitState({
        ...createIdleMicrophoneState(this.measurementSessionId, this.elapsedAccumulator),
        error: message,
      });
      return false;
    }
  }

  async connect(config: AudioEngineConfig): Promise<boolean> {
    return this.prepareEngine(config, 'isConnecting');
  }

  async start(config: AudioEngineConfig): Promise<boolean> {
    if (this.running) {
      this.stop();
    }

    const connected = await this.prepareEngine(config, 'isStarting');
    if (!connected) {
      return false;
    }

    try {
      traceSentrySpan(
        {
          name: 'Start native microphone recorder',
          op: 'audio.engine.recorder.start',
          attributes: {
            sampleRate: config.sampleRate,
            fftSize: config.fftSize,
          },
        },
        () => startMicrophoneEngine()
      );
      this.elapsedAccumulator = 0;
      this.measurementSessionId++;
      this.running = true;

      this.emitState({
        ...createIdleMicrophoneState(this.measurementSessionId),
        isRunning: true,
      });
      return true;
    } catch (error) {
      const message = getSentryErrorMessage(error, 'Unknown microphone engine start error occurred');
      logSentryError('Microphone engine start failed', {
        ...getSentryErrorAttributes(error),
      });
      captureSentryException(error, 'Microphone engine start failed', {
        sampleRate: config.sampleRate,
        fftSize: config.fftSize,
      });
      const heldElapsedSeconds = this.elapsedAccumulator;
      this.running = false;
      try {
        await disconnectMicrophoneEngine();
      } catch (disconnectError) {
        logSentryError('Microphone cleanup after start failure failed', getSentryErrorAttributes(disconnectError));
        captureSentryException(disconnectError, 'Microphone cleanup after start failure failed');
      }
      this.engine = null;
      this.freqData = null;
      this.elapsedAccumulator = heldElapsedSeconds;
      this.emitState({
        ...createIdleMicrophoneState(this.measurementSessionId, heldElapsedSeconds),
        error: message,
      });
      return false;
    }
  }
}
