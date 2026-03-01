import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';

const { width: SW } = Dimensions.get('window');

const TERRITORY_DOTS = [
  { x: 0.3, y: 0.35, color: COLORS.terra, name: 'Dakar', size: 10 },
  { x: 0.55, y: 0.25, color: COLORS.gold, name: 'Paris', size: 8 },
  { x: 0.7, y: 0.55, color: COLORS.blue, name: 'Lagos', size: 12 },
  { x: 0.2, y: 0.6, color: '#7FD89A', name: 'Kingston', size: 9 },
  { x: 0.65, y: 0.4, color: COLORS.terra, name: 'Abidjan', size: 7 },
  { x: 0.4, y: 0.7, color: COLORS.gold, name: 'Bahia', size: 8 },
];

function GlobeDot({ dot, delay }: { dot: typeof TERRITORY_DOTS[0]; delay: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const globeSize = SW * 0.78;

  return (
    <Animated.View
      style={[
        styles.dotContainer,
        {
          left: dot.x * globeSize - dot.size / 2,
          top: dot.y * globeSize - dot.size / 2,
          opacity,
        },
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: dot.size * 3,
          height: dot.size * 3,
          borderRadius: dot.size * 1.5,
          backgroundColor: dot.color,
          opacity: 0.15,
          transform: [{ scale: pulse }],
          left: -dot.size,
          top: -dot.size,
        }}
      />
      <View
        style={{
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          backgroundColor: dot.color,
          shadowColor: dot.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        }}
      />
    </Animated.View>
  );
}

export default function GlobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const globeSize = SW * 0.78;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="globe-screen">
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoText} testID="globe-logo">KORA</Text>
        <TouchableOpacity style={styles.settingsBtn} testID="globe-settings-btn" activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Globe */}
      <View style={styles.globeArea}>
        <LinearGradient
          colors={['#0a1a2c', '#1a3a5c', '#0D1520']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.8, y: 0.9 }}
          style={[styles.globe, { width: globeSize, height: globeSize, borderRadius: globeSize / 2 }]}
        >
          {/* Grid lines */}
          <View style={[styles.gridLineH, { top: '30%' }]} />
          <View style={[styles.gridLineH, { top: '50%' }]} />
          <View style={[styles.gridLineH, { top: '70%' }]} />
          <View style={[styles.gridLineV, { left: '35%' }]} />
          <View style={[styles.gridLineV, { left: '50%' }]} />
          <View style={[styles.gridLineV, { left: '65%' }]} />

          {/* Dots */}
          {TERRITORY_DOTS.map((dot, i) => (
            <GlobeDot key={i} dot={dot} delay={i * 200} />
          ))}
        </LinearGradient>
      </View>

      {/* Territory preview */}
      <TouchableOpacity
        style={styles.previewCard}
        testID="globe-territory-preview"
        onPress={() => router.push('/feed' as any)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.terra, COLORS.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewAvatar}
        >
          <Text style={styles.previewAvatarText}>A</Text>
        </LinearGradient>
        <View style={styles.previewInfo}>
          <Text style={styles.previewName}>Amina Diallo</Text>
          <Text style={styles.previewSub}>Griot · Dakar, Sénégal</Text>
        </View>
        <View style={styles.previewPulse} />
      </TouchableOpacity>

      {/* Pinch hint */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Pince pour zoomer · Tap un territoire</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: COLORS.cream,
  },
  globeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globe: {
    overflow: 'hidden',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  gridLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridLineV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dotContainer: {
    position: 'absolute',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  previewSub: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  previewPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.terra,
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  hintText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
});
