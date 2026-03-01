import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const ECLATS_STORAGE_KEY = 'KORA_ECLATS';
const ECLATS_DIRECTORY = `${FileSystem.documentDirectory}eclats/`;

export interface Eclat {
  id: string;
  audioPath: string;
  territoire: string;
  lat: number;
  lng: number;
  createdAt: string;
  duration: number; // in milliseconds
  transcription?: string; // UPGRADE 14 — Transcription organique (MOCK)
}

/**
 * Ensure the eclats directory exists
 */
async function ensureDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(ECLATS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ECLATS_DIRECTORY, { intermediates: true });
  }
}

/**
 * Save a recorded audio file to the eclats directory
 * Returns the new file path
 */
export async function saveEclatAudio(tempUri: string): Promise<string> {
  await ensureDirectory();
  
  const timestamp = Date.now();
  const filename = `${timestamp}.m4a`;
  const newPath = `${ECLATS_DIRECTORY}${filename}`;
  
  await FileSystem.copyAsync({
    from: tempUri,
    to: newPath,
  });
  
  return newPath;
}

/**
 * Create and store a new Eclat
 */
export async function createEclat(
  audioPath: string,
  duration: number,
  territoire: string = 'Fort-de-France',
  lat: number = 14.6,
  lng: number = -61.0
): Promise<Eclat> {
  const eclat: Eclat = {
    id: Date.now().toString(),
    audioPath,
    territoire,
    lat,
    lng,
    createdAt: new Date().toISOString(),
    duration,
  };
  
  // Get existing eclats
  const existing = await getEclats();
  existing.push(eclat);
  
  // Save to AsyncStorage
  await AsyncStorage.setItem(ECLATS_STORAGE_KEY, JSON.stringify(existing));
  
  return eclat;
}

/**
 * Get all stored Eclats
 */
export async function getEclats(): Promise<Eclat[]> {
  try {
    const data = await AsyncStorage.getItem(ECLATS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('Error loading eclats:', e);
  }
  return [];
}

/**
 * Delete an Eclat and its audio file
 */
export async function deleteEclat(id: string): Promise<void> {
  const eclats = await getEclats();
  const eclat = eclats.find(e => e.id === id);
  
  if (eclat) {
    // Delete audio file
    try {
      await FileSystem.deleteAsync(eclat.audioPath, { idempotent: true });
    } catch (e) {
      console.log('Error deleting audio file:', e);
    }
    
    // Remove from storage
    const filtered = eclats.filter(e => e.id !== id);
    await AsyncStorage.setItem(ECLATS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Clear all Eclats (for testing)
 */
export async function clearAllEclats(): Promise<void> {
  const eclats = await getEclats();
  
  // Delete all audio files
  for (const eclat of eclats) {
    try {
      await FileSystem.deleteAsync(eclat.audioPath, { idempotent: true });
    } catch (e) {}
  }
  
  // Clear storage
  await AsyncStorage.removeItem(ECLATS_STORAGE_KEY);
}
