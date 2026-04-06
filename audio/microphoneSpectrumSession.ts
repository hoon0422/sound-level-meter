import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  AudioNode,
  AudioRecorder,
} from "react-native-audio-api";

type CreateMicrophoneSpectrumSessionOptions = {
  sampleRate: number;
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  autoResumeContext: boolean;
};

export type MicrophoneSpectrumSession = {
  audioContext: AudioContext;
  recorder: AudioRecorder;
  analyser: AnalyserNode;
  adapter: AudioNode;
  freqData: Uint8Array;
  timeData: Float32Array;
};

export async function createMicrophoneSpectrumSession(
  options: CreateMicrophoneSpectrumSessionOptions,
): Promise<MicrophoneSpectrumSession> {
  const audioContext = new AudioContext({ sampleRate: options.sampleRate });
  const recorder = new AudioRecorder();
  const analyser = audioContext.createAnalyser();
  const adapter = audioContext.createRecorderAdapter();

  analyser.fftSize = options.fftSize;
  analyser.smoothingTimeConstant = options.smoothingTimeConstant;
  analyser.minDecibels = options.minDecibels;
  analyser.maxDecibels = options.maxDecibels;

  recorder.connect(adapter);
  adapter.connect(analyser);
  analyser.connect(audioContext.destination);

  if (options.autoResumeContext && audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const startResult = recorder.start();
  if (startResult.status === "error") {
    throw new Error(startResult.message);
  }

  return {
    audioContext,
    recorder,
    analyser,
    adapter,
    freqData: new Uint8Array(analyser.frequencyBinCount),
    timeData: new Float32Array(analyser.fftSize),
  };
}

export async function stopMicrophoneSpectrumSession(
  session: MicrophoneSpectrumSession | null,
) {
  if (!session) {
    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {}
    return;
  }

  try {
    session.recorder.stop();
  } catch {}

  try {
    session.recorder.disconnect();
  } catch {}

  try {
    session.adapter.disconnect();
  } catch {}

  try {
    session.analyser.disconnect();
  } catch {}

  try {
    await session.audioContext.suspend();
  } catch {}

  try {
    await AudioManager.setAudioSessionActivity(false);
  } catch {}

  try {
    await session.audioContext.close();
  } catch {}
}
