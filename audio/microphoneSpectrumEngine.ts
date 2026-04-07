import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  GainNode,
  AudioNode,
  AudioRecorder,
} from "react-native-audio-api";

type CreateMicrophoneSpectrumEngineOptions = {
  sampleRate: number;
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  autoResumeContext: boolean;
};

export type MicrophoneSpectrumEngine = {
  audioContext: AudioContext;
  recorder: AudioRecorder;
  analyser: AnalyserNode;
  adapter: AudioNode;
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
  const muteGain = audioContext.createGain();

  analyser.fftSize = options.fftSize;
  analyser.smoothingTimeConstant = options.smoothingTimeConstant;
  analyser.minDecibels = options.minDecibels;
  analyser.maxDecibels = options.maxDecibels;
  muteGain.gain.value = 0;

  recorder.connect(adapter);
  adapter.connect(analyser);
  analyser.connect(muteGain);
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
    await engine.audioContext.suspend();
  } catch {}

  try {
    await AudioManager.setAudioSessionActivity(false);
  } catch {}

  try {
    await engine.audioContext.close();
  } catch {}
}
