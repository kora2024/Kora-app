/**
 * KORA Anchoring System — UPGRADE 19
 * 
 * L'Ancrage est la rupture sociale de KORA
 * Pas un clic sur "Suivre"
 * Un geste physique qui crée un lien physique
 * C'est la différence entre signer et tamponner
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Territory } from '../store/useKoraStore';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface Ancrage {
  territoireId: string;
  nom: string;
  lat: number;
  lng: number;
  color: string;
  ancredAt: string; // ISO date
}

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEY
// ══════════════════════════════════════════════════════════════════════════════

const ANCRAGES_KEY = 'kora_ancrages';

// ══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all ancrages
 */
export async function getAncrages(): Promise<Ancrage[]> {
  try {
    const data = await AsyncStorage.getItem(ANCRAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting ancrages:', error);
    return [];
  }
}

/**
 * Add a new ancrage
 */
export async function addAncrage(territory: Territory): Promise<Ancrage> {
  const ancrages = await getAncrages();
  
  // Check if already anchored to this territory
  const existing = ancrages.find(a => a.territoireId === territory.id);
  if (existing) {
    return existing;
  }
  
  const newAncrage: Ancrage = {
    territoireId: territory.id,
    nom: territory.name,
    lat: territory.lat,
    lng: territory.lng,
    color: territory.color,
    ancredAt: new Date().toISOString(),
  };
  
  ancrages.push(newAncrage);
  await AsyncStorage.setItem(ANCRAGES_KEY, JSON.stringify(ancrages));
  
  console.log('🔗 Ancré à:', territory.name);
  return newAncrage;
}

/**
 * Remove an ancrage
 */
export async function removeAncrage(territoireId: string): Promise<boolean> {
  try {
    const ancrages = await getAncrages();
    const filtered = ancrages.filter(a => a.territoireId !== territoireId);
    await AsyncStorage.setItem(ANCRAGES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing ancrage:', error);
    return false;
  }
}

/**
 * Check if anchored to a territory
 */
export async function isAnchored(territoireId: string): Promise<boolean> {
  const ancrages = await getAncrages();
  return ancrages.some(a => a.territoireId === territoireId);
}

/**
 * Get random ancrage for simulated emission
 */
export async function getRandomAncrage(): Promise<Ancrage | null> {
  const ancrages = await getAncrages();
  if (ancrages.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * ancrages.length);
  return ancrages[randomIndex];
}

/**
 * Clear all ancrages (for reset)
 */
export async function clearAncrages(): Promise<void> {
  await AsyncStorage.removeItem(ANCRAGES_KEY);
}
