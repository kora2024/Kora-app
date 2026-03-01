/**
 * KORA Voice Wave — UPGRADE 13
 * 
 * Visualisation de l'onde sonore en temps réel
 * pendant l'enregistrement.
 * 
 * L'onde sonore est la signature visuelle de chaque Griot
 * Chaque voix a une forme unique
 * C'est ce qui différencie KORA de tout message vocal existant
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width: SW } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = 80;
const WAVE_WIDTH = SW * 0.8;
const WAVE_HEIGHT = 100;

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface VoiceWaveProps {
  metering: number; // Current metering level in dB (-160 to 0)
  isRecording: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE BAR COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

interface BarProps {
  height: number;
  index: number;
  isMirror?: boolean;
}

const Bar = memo(function Bar({ height, index, isMirror = false }: BarProps) {
  const animHeight = useRef(new Animated.Value(BAR_MIN_HEIGHT)).current;
  
  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: height,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [height]);

  // Calculate gradient intensity based on height
  const intensity = (height - BAR_MIN_HEIGHT) / (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: animHeight,
          opacity: isMirror ? 0.3 : (0.5 + intensity * 0.5),
          transform: isMirror ? [{ scaleY: -1 }] : [],
        },
      ]}
    >
      <LinearGradient
        colors={isMirror 
          ? [COLORS.gold, COLORS.terra]
          : [COLORS.terra, COLORS.gold]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN VOICE WAVE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function VoiceWave({ metering, isRecording }: VoiceWaveProps) {
  // Store history of metering levels
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(BAR_COUNT).fill(BAR_MIN_HEIGHT)
  );
  
  // Track previous metering to smooth out jumps
  const prevMeteringRef = useRef(metering);
  
  // Update bars when new metering comes in
  useEffect(() => {
    if (!isRecording) {
      // Reset to flat line when not recording
      setBarHeights(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
      return;
    }
    
    // Convert dB metering to height
    // Metering is typically -160 (silence) to 0 (max)
    // We'll use -60 to 0 as our working range
    const normalizedLevel = Math.max(0, Math.min(1, (metering + 60) / 60));
    const newHeight = BAR_MIN_HEIGHT + normalizedLevel * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT);
    
    // Add some natural variation
    const variation = (Math.random() - 0.5) * 10 * normalizedLevel;
    const finalHeight = Math.max(BAR_MIN_HEIGHT, Math.min(BAR_MAX_HEIGHT, newHeight + variation));
    
    // Shift bars left and add new bar on the right
    setBarHeights(prev => {
      const newBars = [...prev.slice(1), finalHeight];
      return newBars;
    });
    
    prevMeteringRef.current = metering;
  }, [metering, isRecording]);
  
  // Idle animation when recording but silent
  useEffect(() => {
    if (!isRecording) return;
    
    const idleInterval = setInterval(() => {
      // Add subtle movement even when silent
      setBarHeights(prev => {
        // Only animate if relatively quiet
        const avgHeight = prev.reduce((a, b) => a + b, 0) / prev.length;
        if (avgHeight > BAR_MIN_HEIGHT + 5) return prev;
        
        // Subtle wave
        const time = Date.now() / 1000;
        return prev.map((h, i) => {
          const wave = Math.sin(time * 2 + i * 0.3) * 2;
          return Math.max(BAR_MIN_HEIGHT, BAR_MIN_HEIGHT + wave);
        });
      });
    }, 100);
    
    return () => clearInterval(idleInterval);
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {/* Main wave (top half) */}
      <View style={styles.waveContainer}>
        <View style={styles.barsContainer}>
          {barHeights.map((height, index) => (
            <Bar key={`bar-${index}`} height={height} index={index} />
          ))}
        </View>
      </View>
      
      {/* Mirror reflection (bottom half) */}
      <View style={styles.mirrorContainer}>
        <View style={styles.barsContainer}>
          {barHeights.map((height, index) => (
            <Bar 
              key={`mirror-${index}`} 
              height={height * 0.6} 
              index={index} 
              isMirror 
            />
          ))}
        </View>
      </View>
      
      {/* Center line */}
      <View style={styles.centerLine} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMPLE PLACEHOLDER FOR WEB (no audio metering on web)
// ══════════════════════════════════════════════════════════════════════════════

export function VoiceWavePlaceholder({ isRecording }: { isRecording: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
  
  useEffect(() => {
    if (!isRecording) {
      setBars(Array(BAR_COUNT).fill(BAR_MIN_HEIGHT));
      return;
    }
    
    // Simulated wave animation
    const interval = setInterval(() => {
      setBars(prev => {
        const time = Date.now() / 1000;
        return prev.map((_, i) => {
          // Create a flowing wave pattern
          const wave1 = Math.sin(time * 3 + i * 0.2) * 0.5 + 0.5;
          const wave2 = Math.sin(time * 5 + i * 0.4) * 0.3 + 0.3;
          const combined = wave1 * wave2;
          return BAR_MIN_HEIGHT + combined * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * 0.7;
        });
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <View style={styles.waveContainer}>
        <View style={styles.barsContainer}>
          {bars.map((height, index) => (
            <Bar key={`bar-${index}`} height={height} index={index} />
          ))}
        </View>
      </View>
      <View style={styles.mirrorContainer}>
        <View style={styles.barsContainer}>
          {bars.map((height, index) => (
            <Bar 
              key={`mirror-${index}`} 
              height={height * 0.6} 
              index={index} 
              isMirror 
            />
          ))}
        </View>
      </View>
      <View style={styles.centerLine} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT * 2, // Main + mirror
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    height: WAVE_HEIGHT,
    justifyContent: 'flex-end',
  },
  mirrorContainer: {
    height: WAVE_HEIGHT * 0.6,
    justifyContent: 'flex-start',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    top: WAVE_HEIGHT,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
