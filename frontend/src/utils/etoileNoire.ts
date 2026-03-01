/**
 * KORA Étoile Noire (Black Star) — UPGRADE 21
 * 
 * Personne n'est banni de KORA
 * Certains deviennent inaudibles pour certains
 * La communauté s'autorégule par le silence
 * Pas par la force
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════════════════════

const ETOILES_NOIRES_KEY = 'kora_etoiles_noires';
const HARMONIE_LEVEL_KEY = 'kora_harmonie_level';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface EtoileNoire {
  territoireId: string;
  nom: string;
  eloigneAt: string; // ISO date
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉTOILES NOIRES (MUTED TERRITORIES)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all muted territories (Étoiles Noires)
 */
export async function getEtoilesNoires(): Promise<EtoileNoire[]> {
  try {
    const data = await AsyncStorage.getItem(ETOILES_NOIRES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting étoiles noires:', error);
    return [];
  }
}

/**
 * Add a territory to Étoiles Noires (mute it)
 */
export async function eloignerTerritoire(
  territoireId: string, 
  nom: string
): Promise<EtoileNoire> {
  const etoiles = await getEtoilesNoires();
  
  // Check if already muted
  const existing = etoiles.find(e => e.territoireId === territoireId);
  if (existing) {
    return existing;
  }
  
  const newEtoile: EtoileNoire = {
    territoireId,
    nom,
    eloigneAt: new Date().toISOString(),
  };
  
  etoiles.push(newEtoile);
  await AsyncStorage.setItem(ETOILES_NOIRES_KEY, JSON.stringify(etoiles));
  
  console.log('🌑 Territoire éloigné:', nom);
  return newEtoile;
}

/**
 * Remove a territory from Étoiles Noires (unmute / "rallumer")
 */
export async function rallumerTerritoire(territoireId: string): Promise<boolean> {
  try {
    const etoiles = await getEtoilesNoires();
    const filtered = etoiles.filter(e => e.territoireId !== territoireId);
    await AsyncStorage.setItem(ETOILES_NOIRES_KEY, JSON.stringify(filtered));
    console.log('✨ Territoire rallumé:', territoireId);
    return true;
  } catch (error) {
    console.error('Error rallumer territoire:', error);
    return false;
  }
}

/**
 * Check if a territory is an Étoile Noire
 */
export async function isEtoileNoire(territoireId: string): Promise<boolean> {
  const etoiles = await getEtoilesNoires();
  return etoiles.some(e => e.territoireId === territoireId);
}

/**
 * Clear all Étoiles Noires (for reset)
 */
export async function clearEtoilesNoires(): Promise<void> {
  await AsyncStorage.removeItem(ETOILES_NOIRES_KEY);
}

// ══════════════════════════════════════════════════════════════════════════════
// CURSEUR D'HARMONIE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get harmony level (0 = Spectre Large, 1 = Spectre Harmonique)
 */
export async function getHarmonieLevel(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(HARMONIE_LEVEL_KEY);
    return value !== null ? parseFloat(value) : 0.5; // Default: middle
  } catch {
    return 0.5;
  }
}

/**
 * Set harmony level
 */
export async function setHarmonieLevel(level: number): Promise<void> {
  const clamped = Math.max(0, Math.min(1, level));
  await AsyncStorage.setItem(HARMONIE_LEVEL_KEY, clamped.toString());
}
