import { SpectrumDisplayConfig } from "./types";

export const DEFAULT_SPECTRUM_DISPLAY_CONFIG: SpectrumDisplayConfig = {
  barCount: 32,
  minHz: 0,
  maxHz: 20000,
  noiseFloorDbfs: -65,
  barSmoothingAlpha: 0.2,
};
