import { create } from 'zustand';

interface KoraState {
  // Eveil (Onboarding) state
  frequencies: string[];
  memories: string[];
  onboardingComplete: boolean;
  
  // Actions
  toggleFrequency: (freq: string) => void;
  toggleMemory: (mem: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useKoraStore = create<KoraState>((set) => ({
  frequencies: [],
  memories: [],
  onboardingComplete: false,

  toggleFrequency: (freq: string) =>
    set((state) => ({
      frequencies: state.frequencies.includes(freq)
        ? state.frequencies.filter((f) => f !== freq)
        : [...state.frequencies, freq],
    })),

  toggleMemory: (mem: string) =>
    set((state) => ({
      memories: state.memories.includes(mem)
        ? state.memories.filter((m) => m !== mem)
        : [...state.memories, mem],
    })),

  completeOnboarding: () => set({ onboardingComplete: true }),
  resetOnboarding: () => set({ frequencies: [], memories: [], onboardingComplete: false }),
}));
