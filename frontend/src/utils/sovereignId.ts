import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const SOVEREIGN_ID_KEY = 'KORA_SOVEREIGN_ID';

/**
 * AXE 3 — SOUVERAINETÉ HARDWARE ID
 * Generates a unique sovereign ID based on device hardware fingerprint.
 * Uses SHA-256 hash of deviceName + modelId.
 * Stores securely and persists across sessions.
 */
export async function getSovereignId(): Promise<string> {
  // Check if already stored
  try {
    const stored = await SecureStore.getItemAsync(SOVEREIGN_ID_KEY);
    if (stored) return stored;
  } catch (e) {
    console.log('SecureStore read error:', e);
  }

  // Generate new sovereign ID
  const deviceName = Device.deviceName || 'unknown';
  const modelId = Device.modelId || Device.modelName || 'generic';
  const osVersion = Device.osVersion || '0';
  const brand = Device.brand || 'unknown';
  
  // Create hardware fingerprint string
  const fingerprint = `${deviceName}:${modelId}:${brand}:${osVersion}:${Platform.OS}`;
  
  // Generate SHA-256 hash
  let sovereignId: string;
  try {
    sovereignId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprint
    );
  } catch (e) {
    // Fallback for web or unsupported platforms
    sovereignId = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Store securely
  try {
    await SecureStore.setItemAsync(SOVEREIGN_ID_KEY, sovereignId);
  } catch (e) {
    console.log('SecureStore write error:', e);
  }

  return sovereignId;
}

/**
 * Returns truncated sovereign ID for display (e.g., "3f7a...c12b")
 */
export function truncateSovereignId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

/**
 * Clear stored sovereign ID (for testing/reset)
 */
export async function clearSovereignId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SOVEREIGN_ID_KEY);
  } catch (e) {
    console.log('SecureStore delete error:', e);
  }
}
