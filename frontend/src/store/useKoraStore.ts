import { create } from 'zustand';

export interface Territory {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
  size: number;
  population: string;
  description: string;
}

export const TERRITORIES: Territory[] = [
  { id: 'ftf', name: 'Fort-de-France', color: '#A65D47', lat: 14.6, lng: -61.0, size: 14, population: '2,847', description: 'Martinique · Territoire source' },
  { id: 'par', name: 'Paris', color: '#4A7FA5', lat: 48.85, lng: 2.35, size: 10, population: '12,340', description: 'France · Diaspora active' },
  { id: 'lag', name: 'Lagos', color: '#C9A84C', lat: 6.45, lng: 3.4, size: 12, population: '8,920', description: 'Nigeria · Hub culturel' },
  { id: 'lon', name: 'Londres', color: '#7A9A7A', lat: 51.5, lng: -0.12, size: 9, population: '5,670', description: 'UK · Créateurs' },
  { id: 'bog', name: 'Bogotá', color: '#9A7AC9', lat: 4.7, lng: -74.0, size: 9, population: '3,210', description: 'Colombie · Rythmes' },
  { id: 'dak', name: 'Dakar', color: '#C9984C', lat: 14.7, lng: -17.4, size: 9, population: '6,780', description: 'Sénégal · Griots' },
  { id: 'nyc', name: 'New York', color: '#5A8FA5', lat: 40.7, lng: -74.0, size: 10, population: '9,450', description: 'USA · Diaspora mondiale' },
  { id: 'abi', name: 'Abidjan', color: '#A5A55A', lat: 5.35, lng: -4.0, size: 8, population: '4,320', description: "Côte d'Ivoire · Tradition" },
];

interface KoraState {
  // Eveil (Onboarding) state
  frequencies: string[];
  memories: string[];
  onboardingComplete: boolean;

  // Globe state
  activeTerritory: Territory;

  // Actions
  toggleFrequency: (freq: string) => void;
  toggleMemory: (mem: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setActiveTerritory: (territory: Territory) => void;
}

export const useKoraStore = create<KoraState>((set) => ({
  frequencies: [],
  memories: [],
  onboardingComplete: false,
  activeTerritory: TERRITORIES[0], // Fort-de-France default

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
  setActiveTerritory: (territory: Territory) => set({ activeTerritory: territory }),
}));
