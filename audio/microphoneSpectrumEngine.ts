import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  GainNode,
  AudioNode,
  AudioRecorder,
  WorkletNode,
} from "react-native-audio-api";
import { scheduleOnRN } from "react-native-worklets";

type CreateMicrophoneSpectrumEngineOptions = {
  sampleRate: number;
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  autoResumeContext: boolean;
  onAudioMetrics: (metrics: AudioRuntimeMetrics) => void;
};

export type AudioRuntimeMetrics = {
  dbfs: number;
  elapsedSeconds: number;
};

export type MicrophoneSpectrumEngine = {
  audioContext: AudioContext;
  recorder: AudioRecorder;
  analyser: AnalyserNode;
  adapter: AudioNode;
  workletNode: WorkletNode;
  muteGain: GainNode;
};

let microphoneSpectrumEngine: MicrophoneSpectrumEngine | null = null;

export function getMicrophoneSpectrumEngine() {
  return microphoneSpectrumEngine;
}

export async function createMicrophoneSpectrumEngine(
  options: CreateMicrophoneSpectrumEngineOptions,
): Promise<MicrophoneSpectrumEngine> {
  if (microphoneSpectrumEngine) {
    return microphoneSpectrumEngine;
  }

  const audioContext = new AudioContext({ sampleRate: options.sampleRate });
  const recorder = new AudioRecorder();
  const analyser = audioContext.createAnalyser();
  const adapter = audioContext.createRecorderAdapter();
  const workletNode = audioContext.createWorkletNode(
    (audioData, inputChannelCount) => {
      "worklet";

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
    "AudioRuntime",
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

  if (options.autoResumeContext && audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const startResult = recorder.start();
  if (startResult.status === "error") {
    throw new Error(startResult.message);
  }

  microphoneSpectrumEngine = {
    audioContext,
    recorder,
    analyser,
    adapter,
    workletNode,
    muteGain,
  };

  return microphoneSpectrumEngine;
}

export async function stopMicrophoneSpectrumEngine() {
  const engine = microphoneSpectrumEngine;
  microphoneSpectrumEngine = null;

  if (!engine) {
    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {}
    return;
  }

  try {
    engine.recorder.stop();
  } catch {}

  try {
    engine.recorder.disconnect();
  } catch {}

  try {
    engine.adapter.disconnect();
  } catch {}

  try {
    engine.analyser.disconnect();
  } catch {}

  try {
    engine.workletNode.disconnect();
  } catch {}

  try {
    engine.muteGain.disconnect();
  } catch {}

  try {
    await engine.audioContext.suspend();
  } catch {}

  try {
    await AudioManager.setAudioSessionActivity(false);
  } catch {}

  try {
    await engine.audioContext.close();
  } catch {}
}
