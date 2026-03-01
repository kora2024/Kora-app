/**
 * KORA Live Stream Simulation — UPGRADE 22
 * 
 * La simulation doit être crédible
 * Les intervalles aléatoires évitent l'effet robotique
 * L'utilisateur doit avoir l'impression que le monde est vivant
 */

import { TERRITORIES, Territory } from '../store/useKoraStore';
import { Eclat } from './eclatStorage';
import { getAncrages, Ancrage } from './ancrage';
import { isEtoileNoire } from './etoileNoire';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface LiveEclatEvent {
  type: 'new_eclat';
  eclat: MockLiveEclat;
  territory: Territory;
  isFromAncrage: boolean;
}

export interface MockLiveEclat {
  id: string;
  territoryId: string;
  territoryName: string;
  lat: number;
  lng: number;
  color: string;
  createdAt: string;
  duration: number;
  transcription?: string;
}

type LiveEventCallback = (event: LiveEclatEvent) => void;

// ══════════════════════════════════════════════════════════════════════════════
// MOCK TRANSCRIPTIONS
// ══════════════════════════════════════════════════════════════════════════════

const MOCK_TRANSCRIPTIONS = [
  "La chaleur du soleil sur ma peau me rappelle d'où je viens...",
  "Chaque rythme porte l'écho de nos ancêtres.",
  "Le monde est grand mais nos racines nous connectent.",
  "J'entends les tambours de loin, ils battent dans mon cœur.",
  "La diaspora est une constellation, pas une dispersion.",
  "Nos voix traversent les océans comme nos ancêtres l'ont fait.",
  "Le créole danse sur ma langue comme une mélodie familière.",
  "Ce soir le ciel a la couleur de chez moi.",
  "Les épices de ma grand-mère parfument encore mes souvenirs.",
  "Nous sommes les étoiles d'un même firmament.",
];

// ══════════════════════════════════════════════════════════════════════════════
// LIVE STREAM SIMULATOR
// ══════════════════════════════════════════════════════════════════════════════

class LiveStreamSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<LiveEventCallback> = new Set();
  private isRunning = false;

  /**
   * Start the live stream simulation
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextEclat();
    console.log('🌐 Live stream simulation started');
  }

  /**
   * Stop the live stream simulation
   */
  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🌐 Live stream simulation stopped');
  }

  /**
   * Subscribe to live events
   */
  subscribe(callback: LiveEventCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Schedule the next random eclat
   */
  private scheduleNextEclat() {
    if (!this.isRunning) return;

    // Random delay between 15-45 seconds
    const delay = this.randomBetween(15000, 45000);
    
    this.intervalId = setTimeout(async () => {
      await this.emitRandomEclat();
      this.scheduleNextEclat(); // Schedule next
    }, delay);
  }

  /**
   * Emit a random eclat event
   */
  private async emitRandomEclat() {
    // Get a random territory (excluding user's own)
    const territories = TERRITORIES.filter(t => t.id !== 'martinique');
    const territory = territories[Math.floor(Math.random() * territories.length)];

    // Check if this territory is an Étoile Noire
    const isMuted = await isEtoileNoire(territory.id);
    if (isMuted) {
      console.log('🌑 Éclat from muted territory ignored:', territory.name);
      return; // Skip muted territories
    }

    // Check if user is anchored to this territory
    const ancrages = await getAncrages();
    const isFromAncrage = ancrages.some(a => a.territoireId === territory.id);

    // Create mock eclat
    const eclat: MockLiveEclat = {
      id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      territoryId: territory.id,
      territoryName: territory.name,
      lat: territory.lat + (Math.random() - 0.5) * 2, // Small random offset
      lng: territory.lng + (Math.random() - 0.5) * 2,
      color: territory.color,
      createdAt: new Date().toISOString(),
      duration: this.randomBetween(5000, 60000),
      transcription: MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)],
    };

    // Emit event
    const event: LiveEclatEvent = {
      type: 'new_eclat',
      eclat,
      territory,
      isFromAncrage,
    };

    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Error in live stream callback:', e);
      }
    });

    console.log('📡 Live éclat emitted from:', territory.name, isFromAncrage ? '(ancré)' : '');
  }

  /**
   * Random number between min and max
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Manually trigger an eclat for testing
   */
  async triggerManualEclat(territoryId?: string) {
    const territories = TERRITORIES.filter(t => t.id !== 'martinique');
    const territory = territoryId 
      ? territories.find(t => t.id === territoryId) || territories[0]
      : territories[Math.floor(Math.random() * territories.length)];

    const ancrages = await getAncrages();
    const isFromAncrage = ancrages.some(a => a.territoireId === territory.id);

    const eclat: MockLiveEclat = {
      id: `manual_${Date.now()}`,
      territoryId: territory.id,
      territoryName: territory.name,
      lat: territory.lat,
      lng: territory.lng,
      color: territory.color,
      createdAt: new Date().toISOString(),
      duration: 30000,
      transcription: MOCK_TRANSCRIPTIONS[0],
    };

    const event: LiveEclatEvent = {
      type: 'new_eclat',
      eclat,
      territory,
      isFromAncrage,
    };

    this.callbacks.forEach(callback => callback(event));
  }
}

// Singleton instance
export const liveStream = new LiveStreamSimulator();

// ══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback, useState } from 'react';

/**
 * Hook to subscribe to live eclat events
 */
export function useLiveStream(onEvent: LiveEventCallback) {
  useEffect(() => {
    const unsubscribe = liveStream.subscribe(onEvent);
    return unsubscribe;
  }, [onEvent]);
}

/**
 * Hook to manage live stream lifecycle
 */
export function useLiveStreamManager() {
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    liveStream.start();
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    liveStream.stop();
    setIsActive(false);
  }, []);

  useEffect(() => {
    // Auto-start when hook mounts
    start();
    return () => stop();
  }, []);

  return { isActive, start, stop };
}
