/**
 * KORA Transition Overlay — UPGRADE 7
 * 
 * Vue noire opaque qui fait un bref flash (opacity 0→0.3→0)
 * au moment du changement d'écran.
 * Duration totale : 150ms. Imperceptible mais supprime le "blink".
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { COLORS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

export default function TransitionOverlay() {
  const pathname = usePathname();
  const opacity = useRef(new Animated.Value(0)).current;
  const previousPath = useRef(pathname);

  useEffect(() => {
    // Seulement si le chemin a changé
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      
      // Flash animation: 0 → 0.2 → 0 en 150ms
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pathname]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dark,
    zIndex: 9999,
  },
});
