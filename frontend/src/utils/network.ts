/**
 * KORA Network & P2P Mode — UPGRADE 23
 * 
 * Un réseau qui existe même sans internet
 * C'est ça la souveraineté réelle
 * Culture Connect 2026 peut être la première démonstration mondiale
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface NetworkStatus {
  isConnected: boolean;
  isP2PMode: boolean;
  connectionType: string | null;
  nearbyDevices: number; // Mock for now
}

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEY
// ══════════════════════════════════════════════════════════════════════════════

const P2P_ECLATS_KEY = 'kora_p2p_eclats';

// ══════════════════════════════════════════════════════════════════════════════
// NETWORK HOOK
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Hook to monitor network status and P2P mode
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isP2PMode: false,
    connectionType: null,
    nearbyDevices: 0,
  });

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Handle app state changes (foreground/background)
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? false;
    
    // P2P mode activates when no internet but device is connected (WiFi/Bluetooth)
    const isP2PMode = !isInternetReachable && (
      state.type === 'wifi' || 
      state.type === 'bluetooth' ||
      !isConnected
    );

    // Mock nearby devices count (real implementation would use Nearby Connections)
    const nearbyDevices = isP2PMode ? Math.floor(Math.random() * 5) : 0;

    setStatus({
      isConnected,
      isP2PMode,
      connectionType: state.type,
      nearbyDevices,
    });

    console.log('📶 Network status:', {
      connected: isConnected,
      p2p: isP2PMode,
      type: state.type,
    });
  }, []);

  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // Refresh network status when app comes to foreground
      NetInfo.fetch().then(handleNetworkChange);
    }
  }, [handleNetworkChange]);

  return status;
}

// ══════════════════════════════════════════════════════════════════════════════
// P2P ECLAT STORAGE (for offline mode)
// ══════════════════════════════════════════════════════════════════════════════

export interface P2PEclat {
  id: string;
  fromDeviceId: string;
  territoryName: string;
  lat: number;
  lng: number;
  receivedAt: string;
  transcription?: string;
}

/**
 * Store an éclat received via P2P
 */
export async function storeP2PEclat(eclat: P2PEclat): Promise<void> {
  try {
    const existing = await getP2PEclats();
    existing.push(eclat);
    
    // Keep only last 50 P2P eclats
    const trimmed = existing.slice(-50);
    await AsyncStorage.setItem(P2P_ECLATS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error storing P2P eclat:', error);
  }
}

/**
 * Get stored P2P éclats
 */
export async function getP2PEclats(): Promise<P2PEclat[]> {
  try {
    const data = await AsyncStorage.getItem(P2P_ECLATS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear P2P éclats (after syncing with server)
 */
export async function clearP2PEclats(): Promise<void> {
  await AsyncStorage.removeItem(P2P_ECLATS_KEY);
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK P2P DISCOVERY
// For the real implementation, use react-native-nearby-connections
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Simulate P2P device discovery
 * In real implementation, this would use Nearby Connections API
 */
export function simulateP2PDiscovery(
  onDeviceFound: (deviceId: string) => void
): () => void {
  // Simulate finding devices every 10-30 seconds when in P2P mode
  const interval = setInterval(() => {
    const mockDeviceId = `kora_${Math.random().toString(36).substring(2, 8)}`;
    onDeviceFound(mockDeviceId);
  }, Math.random() * 20000 + 10000);

  return () => clearInterval(interval);
}

/**
 * Simulate broadcasting your éclat to nearby devices
 * In real implementation, this would use Nearby Connections API
 */
export function simulateBroadcastEclat(eclat: {
  id: string;
  transcription?: string;
}): void {
  console.log('📡 Broadcasting éclat to nearby devices (mock):', eclat.id);
  // In real implementation, this would send via Nearby Connections
}

// ══════════════════════════════════════════════════════════════════════════════
// CULTURE CONNECT 2026 MODE
// Special mode for large gatherings with limited connectivity
// ══════════════════════════════════════════════════════════════════════════════

export async function enableCultureConnectMode(): Promise<void> {
  // Enable aggressive P2P discovery
  // Increase broadcast frequency
  // Enable mesh networking capabilities
  console.log('🎉 Culture Connect 2026 mode enabled');
}

export async function disableCultureConnectMode(): Promise<void> {
  console.log('🎉 Culture Connect 2026 mode disabled');
}
