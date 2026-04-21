export type SpectrumBand = {
  center: number;
  label: string;
  lowEdge: number;
  highEdge: number;
};

export type SpectrumDisplayConfig = {
  barCount: number;
  minHz: number;
  maxHz: number;
  noiseFloorDbfs: number;
  barSmoothingAlpha: number;
};
