import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../src/theme';
import BackButton from '../src/components/common/BackButton';

const { width: SW } = Dimensions.get('window');

const ORBIT_ITEMS = [
  { emoji: '🔥', text: 'La vibration est pure', author: 'Omar', angle: 0 },
  { emoji: '💎', text: "Ça résonne avec l'essence", author: 'Fatou', angle: 60 },
  { emoji: '🌊', text: 'Flow ancestral détecté', author: 'Kwame', angle: 120 },
  { emoji: '✨', text: 'Fréquence alignée', author: 'Yara', angle: 180 },
  { emoji: '🌱', text: "Le territoire s'éveille", author: 'Ibra', angle: 240 },
  { emoji: '🎵', text: 'Harmonie collective', author: 'Nia', angle: 300 },
];

// Voice wave bar
function WaveBar({ delay }: { delay: number }) {
  const height = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(height, { toValue: 16 + Math.random() * 12, duration: 300, useNativeDriver: false }),
        Animated.timing(height, { toValue: 4, duration: 400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.waveBar, { height }]} />;
}

export default function OrbiteScreen() {
  const insets = useSafeAreaInsets();
  const orbitAnims = useRef(
    ORBIT_ITEMS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    ORBIT_ITEMS.forEach((_, i) => {
      Animated.loop(
        Animated.timing(orbitAnims[i], {
          toValue: 1,
          duration: 20000 + i * 2000,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  const orbitRadius = (SW - 80) / 2 - 30;
  const centerX = (SW - 80) / 2;
  const centerY = 160;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="orbite-screen">
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{"L'ORBITE DE RÉSONANCE"}</Text>
      </View>

      {/* Central content */}
      <View style={styles.orbitArea}>
        {/* Center card */}
        <View style={[styles.centerCard, { left: centerX - 80, top: centerY - 40 }]}>
          <Text style={styles.centerEmoji}>🎵</Text>
          <Text style={styles.centerText}>
            La kora résonne dans chaque algorithme
          </Text>
          <Text style={styles.centerAuthor}>— Amina Diallo</Text>
        </View>

        {/* Orbit items */}
        {ORBIT_ITEMS.map((item, i) => {
          const baseAngle = (item.angle * Math.PI) / 180;
          const x = centerX + Math.cos(baseAngle) * orbitRadius - 32;
          const y = centerY + Math.sin(baseAngle) * orbitRadius - 32;

          return (
            <Animated.View
              key={i}
              style={[
                styles.orbitBubble,
                {
                  left: x,
                  top: y,
                  opacity: orbitAnims[i].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.7, 1, 0.7],
                  }),
                },
              ]}
            >
              <Text style={styles.orbitEmoji}>{item.emoji}</Text>
              <Text style={styles.orbitText} numberOfLines={2}>{item.text}</Text>
              <Text style={styles.orbitAuthor}>{item.author}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Griot response */}
      <View style={styles.griotCard}>
        <View style={styles.griotHeader}>
          <Text style={styles.griotLabel}>RÉPONSE DU GRIOT</Text>
          <View style={styles.waveContainer}>
            {Array.from({ length: 12 }).map((_, i) => (
              <WaveBar key={i} delay={i * 80} />
            ))}
          </View>
        </View>
        <Text style={styles.griotText}>
          {"La communauté résonne avec cette fréquence. L'orbite s'agrandit..."}
        </Text>
      </View>

      <Text style={styles.hint}>Tap une bulle pour répondre</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  headerTitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 3,
  },
  orbitArea: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 40,
  },
  centerCard: {
    position: 'absolute',
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    alignItems: 'center',
  },
  centerEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  centerText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    textAlign: 'center',
  },
  centerAuthor: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.terra,
    marginTop: 8,
    letterSpacing: 1,
  },
  orbitBubble: {
    position: 'absolute',
    width: 64,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    alignItems: 'center',
  },
  orbitEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  orbitText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 11,
  },
  orbitAuthor: {
    fontFamily: FONTS.jostLight,
    fontSize: 8,
    color: COLORS.terra,
    marginTop: 3,
  },
  griotCard: {
    marginHorizontal: SPACING.lg,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  griotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  griotLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 2,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  waveBar: {
    width: 2,
    backgroundColor: COLORS.terra,
    borderRadius: 1,
    opacity: 0.6,
  },
  griotText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  hint: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
});
