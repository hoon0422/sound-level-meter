import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum/constants';
import { makeMutable } from 'react-native-reanimated';

const IDLE_SPECTRUM_DBFS = -200;

function createIdleSpectrumBars() {
  return Array(SPECTRUM_BANDS.length).fill(IDLE_SPECTRUM_DBFS) as number[];
}

function toDisplayDb(rawDbfs: number) {
  return Number.isFinite(rawDbfs) ? rawDbfs + CALIBRATION_PEAK_DBFS : 0;
}

export const audioVisualValues = {
  displayDb: makeMutable(0),
  elapsedSeconds: makeMutable(0),
  hasSignal: makeMutable(false),
  isRunning: makeMutable(false),
  spectrumBars: makeMutable<number[]>(createIdleSpectrumBars()),
  spectrumPeaks: makeMutable<number[]>(createIdleSpectrumBars()),
  spectrumHasSignal: makeMutable(false),
};

export function resetAudioVisualValues() {
  audioVisualValues.displayDb.value = 0;
  audioVisualValues.elapsedSeconds.value = 0;
  audioVisualValues.hasSignal.value = false;
  audioVisualValues.isRunning.value = false;
  audioVisualValues.spectrumBars.value = createIdleSpectrumBars();
  audioVisualValues.spectrumPeaks.value = createIdleSpectrumBars();
  audioVisualValues.spectrumHasSignal.value = false;
}

export function startAudioVisualValues() {
  audioVisualValues.displayDb.value = 0;
  audioVisualValues.elapsedSeconds.value = 0;
  audioVisualValues.hasSignal.value = false;
  audioVisualValues.isRunning.value = true;
  audioVisualValues.spectrumBars.value = createIdleSpectrumBars();
  audioVisualValues.spectrumPeaks.value = createIdleSpectrumBars();
  audioVisualValues.spectrumHasSignal.value = false;
}

export function stopAudioVisualValues(elapsedSeconds: number) {
  audioVisualValues.elapsedSeconds.value = elapsedSeconds;
  audioVisualValues.isRunning.value = false;
  audioVisualValues.spectrumHasSignal.value = false;
}

export function updateAudioVisualFrame(rawDbfs: number, elapsedSeconds: number) {
  const displayDb = toDisplayDb(rawDbfs);
  audioVisualValues.displayDb.value = Math.max(0, displayDb);
  audioVisualValues.elapsedSeconds.value = elapsedSeconds;
  audioVisualValues.hasSignal.value = elapsedSeconds > 0 && displayDb > 0;
  audioVisualValues.isRunning.value = true;
}

export function holdAudioVisualFrame(elapsedSeconds: number) {
  audioVisualValues.elapsedSeconds.value = elapsedSeconds;
  audioVisualValues.isRunning.value = true;
}

export function markAudioVisualNoSignal(elapsedSeconds: number) {
  audioVisualValues.displayDb.value = 0;
  audioVisualValues.elapsedSeconds.value = elapsedSeconds;
  audioVisualValues.hasSignal.value = false;
  audioVisualValues.isRunning.value = true;
  audioVisualValues.spectrumHasSignal.value = false;
}

export function updateAudioVisualSpectrum(bars: number[], peaks: number[], hasSignal: boolean) {
  audioVisualValues.spectrumBars.value = bars.slice();
  audioVisualValues.spectrumPeaks.value = peaks.slice();
  audioVisualValues.spectrumHasSignal.value = hasSignal;
}
