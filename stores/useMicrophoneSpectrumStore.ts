import {
  MicrophoneSpectrumConfig,
  MicrophoneSpectrumController,
  MicrophoneSpectrumSnapshot,
  createIdleSnapshot,
} from "@/audio/MicrophoneSpectrumController";
import { DEFAULT_CONFIG } from "@/audio/constants";
import { createStore, useStore } from "zustand";

export type { MicrophoneSpectrumConfig, MicrophoneSpectrumSnapshot };

type MicrophoneSpectrumState = MicrophoneSpectrumSnapshot & {
  // config: MicrophoneSpectrumConfig;
  // configure: (options: Partial<MicrophoneSpectrumConfig>) => void;
  start: (config: MicrophoneSpectrumConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};

export const microphoneSpectrumStore = createStore<MicrophoneSpectrumState>()((
  set,
  get,
) => {
  const controller = MicrophoneSpectrumController.getInstance();

  controller.subscribe(snapshot => set(snapshot));

  return {
    ...createIdleSnapshot(DEFAULT_CONFIG.barCount),
    // config: DEFAULT_CONFIG,
    // configure: options =>
    //   set(state => ({ config: { ...state.config, ...options } })),
    start: (config: MicrophoneSpectrumConfig) => controller.start(config),
    stop: () => controller.stop(),
    disconnect: () => controller.disconnect(),
  };
});

export function useMicrophoneSpectrumStore(): MicrophoneSpectrumState;
export function useMicrophoneSpectrumStore<T>(
  selector: (state: MicrophoneSpectrumState) => T,
): T;
export function useMicrophoneSpectrumStore<T>(
  selector?: (state: MicrophoneSpectrumState) => T,
) {
  return useStore(
    microphoneSpectrumStore,
    selector as (state: MicrophoneSpectrumState) => T,
  );
}
