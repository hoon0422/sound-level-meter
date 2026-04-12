<<<<<<< HEAD
import { SpectrumBand, SpectrumDisplayConfig } from "./types";

const SQRT2 = Math.SQRT2;

export const SPECTRUM_BANDS: SpectrumBand[] = [
  { center: 32, label: "32", lowEdge: 32 / SQRT2, highEdge: 32 * SQRT2 },
  { center: 63, label: "63", lowEdge: 63 / SQRT2, highEdge: 63 * SQRT2 },
  { center: 125, label: "125", lowEdge: 125 / SQRT2, highEdge: 125 * SQRT2 },
  { center: 250, label: "250", lowEdge: 250 / SQRT2, highEdge: 250 * SQRT2 },
  { center: 500, label: "500", lowEdge: 500 / SQRT2, highEdge: 500 * SQRT2 },
  {
    center: 1000,
    label: "1K",
    lowEdge: 1000 / SQRT2,
    highEdge: 1000 * SQRT2,
  },
  {
    center: 2000,
    label: "2K",
    lowEdge: 2000 / SQRT2,
    highEdge: 2000 * SQRT2,
  },
  {
    center: 4000,
    label: "4K",
    lowEdge: 4000 / SQRT2,
    highEdge: 4000 * SQRT2,
  },
  {
    center: 8000,
    label: "8K",
    lowEdge: 8000 / SQRT2,
    highEdge: 8000 * SQRT2,
  },
  {
    center: 15000,
    label: "15K",
    lowEdge: 15000 / SQRT2,
    highEdge: 15000 * SQRT2,
  },
  {
    center: 20000,
    label: "20K",
    lowEdge: 20000 / SQRT2,
    highEdge: Math.min(20000 * SQRT2, 22050),
  },
];

export const DEFAULT_SPECTRUM_DISPLAY_CONFIG: SpectrumDisplayConfig = {
  barCount: SPECTRUM_BANDS.length,
  minHz: 0,
  maxHz: 22000,
=======
import { SpectrumDisplayConfig } from "./types";

export const DEFAULT_SPECTRUM_DISPLAY_CONFIG: SpectrumDisplayConfig = {
  barCount: 32,
  minHz: 0,
  maxHz: 20000,
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  noiseFloorDbfs: -65,
  barSmoothingAlpha: 0.2,
};
