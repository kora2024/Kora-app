/**
 * KORA Network Indicator — UPGRADE 23
 * 
 * Indicateur discret du mode réseau/P2P
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS } from '../theme';
import { useNetworkStatus } from '../utils/network';

// ══════════════════════════════════════════════════════════════════════════════
// P2P ICON (Bluetooth/Wave pattern)
// ══════════════════════════════════════════════════════════════════════════════

function P2PIcon({ size = 14, color = COLORS.terra }: { size?: number; color?: string }) {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Simple wave pattern */}
      <View style={[styles.waveDot, { backgroundColor: color }]} />
      <View style={[styles.waveArc1, { borderColor: color }]} />
      <View style={[styles.waveArc2, { borderColor: color }]} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NETWORK INDICATOR COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function NetworkIndicator() {
  const { isConnected, isP2PMode, nearbyDevices } = useNetworkStatus();

  // Don't show anything if connected normally
  if (isConnected && !isP2PMode) {
    return null;
  }

  return (
    <Animated.View style={styles.container}>
      <P2PIcon size={12} color={isP2PMode ? COLORS.terra : COLORS.gray} />
      <View style={styles.textContainer}>
        <Text style={styles.statusText}>
          {isP2PMode ? 'Mode hors-ligne actif' : 'Connexion perdue'}
        </Text>
        {isP2PMode && nearbyDevices > 0 && (
          <Text style={styles.devicesText}>
            {nearbyDevices} appareil{nearbyDevices > 1 ? 's' : ''} KORA proche{nearbyDevices > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export default memo(NetworkIndicator);

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'center',
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  waveDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    position: 'absolute',
  },
  waveArc1: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    position: 'absolute',
    opacity: 0.7,
  },
  waveArc2: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    position: 'absolute',
    opacity: 0.4,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  statusText: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.gray,
    letterSpacing: 0.3,
  },
  devicesText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 9,
    color: COLORS.terra,
    marginTop: 1,
  },
});
