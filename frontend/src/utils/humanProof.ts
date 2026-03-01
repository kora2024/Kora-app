/**
 * KORA Human Proof — UPGRADE 25
 * 
 * On ne ban pas les bots. On les refroidit.
 * Leur existence ne nuit pas. Leur absence d'humanité les neutralise.
 * La culture est vivante. Les bots ne le sont pas.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gyroscope, Accelerometer } from 'expo-sensors';
import * as Device from 'expo-device';

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════════════════════

const LAST_HUMAN_PROOF_KEY = 'kora_last_human_proof';
const LAST_HAPTIC_KEY = 'kora_last_haptic';
const MOVEMENT_DETECTED_KEY = 'kora_movement_detected';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface HumanProofStatus {
  isHuman: boolean;
  hasValidHardware: boolean;
  hasRecentMovement: boolean;
  hasRecentHaptic: boolean;
  hasEclat: boolean;
  lastProofDate: string | null;
  warmAncrages: number;
  coldAncrages: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// MOVEMENT DETECTION
// ══════════════════════════════════════════════════════════════════════════════

let gyroscopeSubscription: ReturnType<typeof Gyroscope.addListener> | null = null;
let accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;

const MOVEMENT_THRESHOLD = 0.3; // Sensitivity threshold
const PROOF_VALIDITY_HOURS = 24;

/**
 * Start listening for human movement (gyroscope + accelerometer)
 */
export async function startMovementDetection(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Movement detection not available on web');
    return;
  }

  try {
    // Check if sensors are available
    const gyroAvailable = await Gyroscope.isAvailableAsync();
    const accelAvailable = await Accelerometer.isAvailableAsync();

    if (gyroAvailable) {
      Gyroscope.setUpdateInterval(1000); // Check every second
      gyroscopeSubscription = Gyroscope.addListener(async (data) => {
        const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        if (magnitude > MOVEMENT_THRESHOLD) {
          await recordMovement();
        }
      });
    }

    if (accelAvailable) {
      Accelerometer.setUpdateInterval(1000);
      accelerometerSubscription = Accelerometer.addListener(async (data) => {
        // Subtract gravity (approximately 1g on y-axis when stationary)
        const magnitude = Math.abs(
          Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2) - 1
        );
        if (magnitude > MOVEMENT_THRESHOLD) {
          await recordMovement();
        }
      });
    }

    console.log('🎯 Movement detection started');
  } catch (error) {
    console.error('Error starting movement detection:', error);
  }
}

/**
 * Stop movement detection
 */
export function stopMovementDetection(): void {
  if (gyroscopeSubscription) {
    gyroscopeSubscription.remove();
    gyroscopeSubscription = null;
  }
  if (accelerometerSubscription) {
    accelerometerSubscription.remove();
    accelerometerSubscription = null;
  }
  console.log('🎯 Movement detection stopped');
}

/**
 * Record that movement was detected
 */
async function recordMovement(): Promise<void> {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(MOVEMENT_DETECTED_KEY, now);
  await AsyncStorage.setItem(LAST_HUMAN_PROOF_KEY, now);
}

/**
 * Record haptic interaction (call this when haptic.* is triggered)
 */
export async function recordHapticInteraction(): Promise<void> {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_HAPTIC_KEY, now);
  await AsyncStorage.setItem(LAST_HUMAN_PROOF_KEY, now);
}

// ══════════════════════════════════════════════════════════════════════════════
// HARDWARE VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if device has valid hardware (not emulator)
 */
export async function hasValidHardware(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  try {
    // Check if running on a real device
    const isDevice = Device.isDevice;
    const deviceType = Device.deviceType;
    
    // Emulators often have specific characteristics
    const deviceName = Device.deviceName || '';
    const isEmulator = 
      deviceName.toLowerCase().includes('emulator') ||
      deviceName.toLowerCase().includes('simulator') ||
      deviceName.toLowerCase().includes('sdk');
    
    return isDevice && !isEmulator && deviceType !== Device.DeviceType.UNKNOWN;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PROOF STATUS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a timestamp is within the last 24 hours
 */
function isWithin24Hours(isoDate: string | null): boolean {
  if (!isoDate) return false;
  
  const date = new Date(isoDate);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  return diffHours <= PROOF_VALIDITY_HOURS;
}

/**
 * Get full human proof status
 */
export async function getHumanProofStatus(
  eclatCount: number = 0,
  totalAncrages: number = 0
): Promise<HumanProofStatus> {
  try {
    const [lastProof, lastMovement, lastHaptic, validHardware] = await Promise.all([
      AsyncStorage.getItem(LAST_HUMAN_PROOF_KEY),
      AsyncStorage.getItem(MOVEMENT_DETECTED_KEY),
      AsyncStorage.getItem(LAST_HAPTIC_KEY),
      hasValidHardware(),
    ]);

    const hasRecentMovement = isWithin24Hours(lastMovement);
    const hasRecentHaptic = isWithin24Hours(lastHaptic);
    const hasEclat = eclatCount > 0;

    // Un ancrage est "chaud" si l'utilisateur est un humain confirmé
    const isHuman = validHardware && (hasRecentMovement || hasRecentHaptic) && hasEclat;
    
    // Calcul des ancrages chauds/froids
    // Pour la démo, on simule que 95% des ancrages sont chauds si l'utilisateur est humain
    const warmRatio = isHuman ? 0.95 : 0;
    const warmAncrages = Math.floor(totalAncrages * warmRatio);
    const coldAncrages = totalAncrages - warmAncrages;

    return {
      isHuman,
      hasValidHardware: validHardware,
      hasRecentMovement,
      hasRecentHaptic,
      hasEclat,
      lastProofDate: lastProof,
      warmAncrages,
      coldAncrages,
    };
  } catch (error) {
    console.error('Error getting human proof status:', error);
    return {
      isHuman: false,
      hasValidHardware: false,
      hasRecentMovement: false,
      hasRecentHaptic: false,
      hasEclat: false,
      lastProofDate: null,
      warmAncrages: 0,
      coldAncrages: 0,
    };
  }
}

/**
 * Format human proof for display
 */
export function formatHumanProof(status: HumanProofStatus): string {
  if (status.isHuman) {
    return `${status.warmAncrages} humains confirmés`;
  }
  return 'Vérification en cours...';
}

// ══════════════════════════════════════════════════════════════════════════════
// CLEAR DATA
// ══════════════════════════════════════════════════════════════════════════════

export async function clearHumanProofData(): Promise<void> {
  await AsyncStorage.multiRemove([
    LAST_HUMAN_PROOF_KEY,
    LAST_HAPTIC_KEY,
    MOVEMENT_DETECTED_KEY,
  ]);
}
