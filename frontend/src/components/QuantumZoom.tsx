/**
 * KORA Quantum Zoom — UPGRADE 11
 * 
 * Transition de plongée depuis le Globe vers le Feed
 * Version simplifiée (MVP acceptable) + Version complète
 * 
 * Séquence :
 * Phase 1: Préparation (territoire scale up)
 * Phase 2: Dissolution (globe scale down + fade)
 * Phase 3: Vide (particules voyagent)
 * Phase 4: Reformation (FeedScreen apparaît)
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface QuantumZoomProps {
  visible: boolean;
  onComplete: () => void;
  territoryColor?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// PARTICLE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

interface ParticleProps {
  delay: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  duration: number;
}

function Particle({ delay, startX, startY, endX, endY, size, color, duration }: ParticleProps) {
  const posX = useRef(new Animated.Value(startX)).current;
  const posY = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(posX, {
          toValue: endX,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(posY, {
          toValue: endY,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 0.3,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [
            { translateX: posX },
            { translateY: posY },
            { scale },
          ],
        },
      ]}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN QUANTUM ZOOM COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function QuantumZoom({ visible, onComplete, territoryColor = COLORS.terra }: QuantumZoomProps) {
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  
  // Main animations
  const globeScale = useRef(new Animated.Value(1)).current;
  const globeOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const centerGlow = useRef(new Animated.Value(0)).current;
  const feedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Generate explosion particles
    const newParticles: ParticleProps[] = [];
    const centerX = SW / 2;
    const centerY = SH / 2;
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 150 + Math.random() * 200;
      const size = 3 + Math.random() * 8;
      
      newParticles.push({
        delay: 150 + Math.random() * 100,
        startX: centerX - size / 2,
        startY: centerY - size / 2,
        endX: centerX + Math.cos(angle) * distance - size / 2,
        endY: centerY + Math.sin(angle) * distance - size / 2,
        size,
        color: Math.random() > 0.7 ? COLORS.gold : territoryColor,
        duration: 400 + Math.random() * 200,
      });
    }
    setParticles(newParticles);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: PRÉPARATION (0-200ms)
    // Globe scale up slightly, bg darkens
    // ═══════════════════════════════════════════════════════════════
    
    setPhase(1);
    Animated.parallel([
      Animated.timing(globeScale, {
        toValue: 1.05,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      
      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: DISSOLUTION (200-500ms)
      // Globe scales down and fades, particles explode outward
      // ═══════════════════════════════════════════════════════════════
      
      setPhase(2);
      Animated.parallel([
        Animated.timing(globeScale, {
          toValue: 0.3,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(globeOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(centerGlow, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        
        // ═══════════════════════════════════════════════════════════════
        // PHASE 3: VIDE (500-700ms)
        // Dark screen with traveling particles, golden anchor
        // ═══════════════════════════════════════════════════════════════
        
        setPhase(3);
        Animated.sequence([
          Animated.timing(centerGlow, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          
          // ═══════════════════════════════════════════════════════════════
          // PHASE 4: REFORMATION (700-900ms)
          // Feed screen fades in from particles
          // ═══════════════════════════════════════════════════════════════
          
          setPhase(4);
          Animated.parallel([
            Animated.timing(feedOpacity, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(centerGlow, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bgOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Transition complete
            setTimeout(onComplete, 50);
          });
        });
      });
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Dark background overlay */}
      <Animated.View
        style={[
          styles.bgOverlay,
          { opacity: bgOpacity },
        ]}
      />

      {/* Explosion particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Center golden anchor glow */}
      <Animated.View
        style={[
          styles.centerGlow,
          {
            opacity: centerGlow,
            transform: [{ scale: Animated.add(centerGlow, 0.5) }],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gold, 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMPLIFIED VERSION — Use this for immediate MVP
// ══════════════════════════════════════════════════════════════════════════════

interface SimpleQuantumZoomProps {
  visible: boolean;
  onComplete: () => void;
}

export function SimpleQuantumZoom({ visible, onComplete }: SimpleQuantumZoomProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Simple but elegant: scale down + fade + bg flash
    Animated.parallel([
      // Globe scales down
      Animated.timing(scale, {
        toValue: 0.3,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Globe fades out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      // Background flash
      Animated.sequence([
        Animated.timing(bgOpacity, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.simpleContainer} pointerEvents="none">
      <Animated.View style={[styles.simpleBg, { opacity: bgOpacity }]} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dark,
  },
  particle: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    top: SH / 2 - 50,
    left: SW / 2 - 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  // Simple version styles
  simpleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  simpleBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dark,
  },
});
