/**
 * KORA Device Transition — UPGRADE 24
 * 
 * 48h = assez long pour réagir
 * Assez court pour ne pas bloquer un vrai changement légitime
 * C'est la protection la plus humaine possible
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const TRANSITION_KEY = 'kora_device_transition';
const TRANSITION_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface DeviceTransition {
  startedAt: string; // ISO date
  expiresAt: string; // ISO date
  status: 'pending' | 'completed' | 'cancelled';
}

// ══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Start a device transition (48h delay begins)
 */
export async function startDeviceTransition(): Promise<DeviceTransition> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRANSITION_DURATION_MS);
  
  const transition: DeviceTransition = {
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'pending',
  };
  
  await AsyncStorage.setItem(TRANSITION_KEY, JSON.stringify(transition));
  console.log('⏳ Device transition started, expires:', expiresAt.toISOString());
  
  return transition;
}

/**
 * Get current transition status
 */
export async function getDeviceTransition(): Promise<DeviceTransition | null> {
  try {
    const data = await AsyncStorage.getItem(TRANSITION_KEY);
    if (!data) return null;
    
    const transition: DeviceTransition = JSON.parse(data);
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(transition.expiresAt);
    
    if (transition.status === 'pending' && now >= expiresAt) {
      // Transition completed
      transition.status = 'completed';
      await AsyncStorage.setItem(TRANSITION_KEY, JSON.stringify(transition));
    }
    
    return transition;
  } catch (error) {
    console.error('Error getting transition:', error);
    return null;
  }
}

/**
 * Cancel an active transition
 */
export async function cancelDeviceTransition(): Promise<boolean> {
  try {
    const transition = await getDeviceTransition();
    if (!transition || transition.status !== 'pending') {
      return false;
    }
    
    transition.status = 'cancelled';
    await AsyncStorage.setItem(TRANSITION_KEY, JSON.stringify(transition));
    console.log('❌ Device transition cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling transition:', error);
    return false;
  }
}

/**
 * Clear transition data (for reset)
 */
export async function clearDeviceTransition(): Promise<void> {
  await AsyncStorage.removeItem(TRANSITION_KEY);
}

/**
 * Check if transition is currently active
 */
export async function isTransitionActive(): Promise<boolean> {
  const transition = await getDeviceTransition();
  return transition?.status === 'pending';
}

/**
 * Get remaining time in transition (ms)
 */
export async function getTransitionTimeRemaining(): Promise<number> {
  const transition = await getDeviceTransition();
  if (!transition || transition.status !== 'pending') {
    return 0;
  }
  
  const now = new Date();
  const expiresAt = new Date(transition.expiresAt);
  const remaining = expiresAt.getTime() - now.getTime();
  
  return Math.max(0, remaining);
}

/**
 * Format remaining time as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0h 0min';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}min`;
}
