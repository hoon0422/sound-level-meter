<<<<<<< HEAD
export type SpectrumBand = {
  center: number;
  label: string;
  lowEdge: number;
  highEdge: number;
};

=======
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
export type SpectrumDisplayConfig = {
  barCount: number;
  minHz: number;
  maxHz: number;
  noiseFloorDbfs: number;
  barSmoothingAlpha: number;
};
