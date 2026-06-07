import {
  captureSentryException,
  getSentryErrorAttributes,
  logSentryError,
  logSentryWarning,
  traceSentrySpan,
} from '@/analytics/sentry';
import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  AudioNode,
  AudioRecorder,
  GainNode,
  WorkletNode,
} from 'react-native-audio-api';
import { scheduleOnRN } from 'react-native-worklets';
import { initRecording } from './permission';
import { AudioEngineConfig } from './types';

type CreateMicrophoneEngineOptions = AudioEngineConfig & {
  onAudioMetrics: (metrics: AudioRuntimeMetrics) => void;
};

export type AudioRuntimeMetrics = {
  dbfs: number;
  elapsedSeconds: number;
};

export type MicrophoneEngine = {
  audioContext: AudioContext;
  recorder: AudioRecorder;
  analyser: AnalyserNode;
  adapter: AudioNode;
  workletNode: WorkletNode;
  muteGain: GainNode;
};

let microphoneEngine: MicrophoneEngine | null = null;

function logCleanupWarning(message: string, error: unknown) {
  logSentryWarning(message, getSentryErrorAttributes(error));
}

export async function createMicrophoneEngine(options: CreateMicrophoneEngineOptions): Promise<MicrophoneEngine> {
  if (microphoneEngine) {
    return microphoneEngine;
  }

  const recordingInitialized = await traceSentrySpan(
    {
      name: 'Initialize recording permissions',
      op: 'audio.permission.init',
    },
    () => initRecording()
  );
  if (!recordingInitialized) {
    throw new Error('Failed to initialize recording');
  }

  const audioContext = traceSentrySpan(
    {
      name: 'Create audio context',
      op: 'audio.context.create',
      attributes: {
        sampleRate: options.sampleRate,
      },
    },
    () => new AudioContext({ sampleRate: options.sampleRate })
  );
  const recorder = traceSentrySpan(
    {
      name: 'Create audio recorder',
      op: 'audio.recorder.create',
    },
    () => new AudioRecorder()
  );
  const analyser = audioContext.createAnalyser();
  const adapter = audioContext.createRecorderAdapter();
  const workletNode = traceSentrySpan(
    {
      name: 'Create audio worklet node',
      op: 'audio.worklet.create',
      attributes: {
        fftSize: options.fftSize,
      },
    },
    () =>
      audioContext.createWorkletNode(
        (audioData, inputChannelCount) => {
          'worklet';

          const channelCount = Math.max(inputChannelCount, 1);
          const frameCount = audioData[0]?.length ?? 0;
          if (frameCount === 0) {
            return;
          }

          let sum = 0;
          for (let channel = 0; channel < channelCount; channel++) {
            const samples = audioData[channel];
            if (!samples) {
              continue;
            }

            for (let i = 0; i < samples.length; i++) {
              const sample = samples[i];
              sum += sample * sample;
            }
          }

          const rms = Math.sqrt(sum / (frameCount * channelCount));
          const dbfs = rms <= 1e-8 ? -100 : Math.max(20 * Math.log10(rms), -100);
          const elapsedSeconds = frameCount / options.sampleRate;

          scheduleOnRN(options.onAudioMetrics, {
            dbfs,
            elapsedSeconds,
          });
        },
        options.fftSize,
        1,
        'AudioRuntime'
      )
  );
  const muteGain = audioContext.createGain();

  analyser.fftSize = options.fftSize;
  analyser.smoothingTimeConstant = options.smoothingTimeConstant;
  analyser.minDecibels = options.minDecibels;
  analyser.maxDecibels = options.maxDecibels;
  muteGain.gain.value = 0;

  recorder.connect(adapter);
  adapter.connect(analyser);
  analyser.connect(workletNode);
  workletNode.connect(muteGain);
  muteGain.connect(audioContext.destination);

  if (options.autoResumeContext && audioContext.state === 'suspended') {
    await traceSentrySpan(
      {
        name: 'Resume audio context',
        op: 'audio.context.resume',
      },
      () => audioContext.resume()
    );
  }

  // const startResult = recorder.start();
  // if (startResult.status === 'error') {
  //   throw new Error(startResult.message);
  // }

  microphoneEngine = {
    audioContext,
    recorder,
    analyser,
    adapter,
    workletNode,
    muteGain,
  };

  return microphoneEngine;
}

export function startMicrophoneEngine() {
  if (!microphoneEngine) return;

  const startResult = microphoneEngine.recorder.start();
  if (startResult.status === 'error') {
    throw new Error(startResult.message);
  }
}

export function stopMicrophoneEngine() {
  if (!microphoneEngine) return;

  try {
    microphoneEngine.recorder.stop();
  } catch (error) {
    logCleanupWarning('Microphone recorder stop failed', error);
  }
}

export async function disconnectMicrophoneEngine() {
  const engine = microphoneEngine;
  microphoneEngine = null;

  if (!engine) {
    return;
  }

  try {
    engine.recorder.stop();
  } catch (error) {
    logCleanupWarning('Microphone recorder stop during disconnect failed', error);
  }

  try {
    engine.recorder.disconnect();
  } catch (error) {
    logCleanupWarning('Microphone recorder disconnect failed', error);
  }

  try {
    engine.adapter.disconnect();
  } catch (error) {
    logCleanupWarning('Microphone adapter disconnect failed', error);
  }

  try {
    engine.analyser.disconnect();
  } catch (error) {
    logCleanupWarning('Microphone analyser disconnect failed', error);
  }

  try {
    engine.workletNode.disconnect();
  } catch (error) {
    logCleanupWarning('Microphone worklet node disconnect failed', error);
  }

  try {
    engine.muteGain.disconnect();
  } catch (error) {
    logCleanupWarning('Microphone mute gain disconnect failed', error);
  }

  await Promise.all([
    engine.audioContext.close().catch(error => {
      logSentryError('Audio context close failed', getSentryErrorAttributes(error));
      captureSentryException(error, 'Audio context close failed');
    }),
    AudioManager.setAudioSessionActivity(false).catch(error => {
      logSentryError('Audio session deactivation failed', getSentryErrorAttributes(error));
      captureSentryException(error, 'Audio session deactivation failed');
    }),
  ]);
}
