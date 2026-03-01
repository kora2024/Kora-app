import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { COLORS, FONTS, SPACING } from '../src/theme';
import { useKoraStore } from '../src/store/useKoraStore';
import { haptic } from '../src/utils/haptics';

// UPGRADE 16 — Storage keys
const EVEIL_COMPLETED_KEY = 'kora_eveil_completed';
const EVEIL_DATE_KEY = 'kora_eveil_date';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FREQUENCIES = [
  { id: 'musique', icon: '🎵', label: 'Musique' },
  { id: 'art', icon: '🎨', label: 'Art' },
  { id: 'pensee', icon: '💭', label: 'Pensée' },
  { id: 'construction', icon: '🏗️', label: 'Construction' },
];

const MEMORIES = [
  { id: 'caraibes', icon: '🌊', label: 'Caraïbes' },
  { id: 'afrique', icon: '🌍', label: 'Afrique' },
  { id: 'europe', icon: '🗼', label: 'Europe' },
  { id: 'ameriques', icon: '🌎', label: 'Amériques' },
];

// Particle component
function Particle({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(SCREEN_H + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_H + 20);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -30,
            duration: 8000 + Math.random() * 6000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.4 + Math.random() * 0.5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              delay: 4000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const size = 2 + Math.random() * 3;
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

// Globe mini for step 3
function MiniGlobe() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.miniGlobeContainer}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.miniGlobeGlow,
          { opacity: glowAnim, transform: [{ scale: pulseAnim }] },
        ]}
      />
      {/* Globe */}
      <LinearGradient
        colors={['#1a3a5c', '#0a1a2c', '#0D1520']}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 0.8, y: 0.9 }}
        style={styles.miniGlobe}
      >
        {/* Grid lines */}
        <View style={styles.globeGridH1} />
        <View style={styles.globeGridH2} />
        <View style={styles.globeGridV} />
        {/* Pulse dot */}
        <Animated.View
          style={[styles.globePulseDot, { transform: [{ scale: pulseAnim }] }]}
        />
      </LinearGradient>
      {/* Golden lines */}
      <Animated.View
        style={[
          styles.goldenLine1,
          {
            transform: [
              {
                translateX: lineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-80, 80],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.goldenLine2,
          {
            transform: [
              {
                translateX: lineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, -80],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

// Progress indicator
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressContainer} testID="eveil-progress">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i <= current ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function EveilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const { frequencies, memories, toggleFrequency, toggleMemory, completeOnboarding } = useKoraStore();

  // UPGRADE 16 — Developer menu (5 taps on logo)
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fade animations per step
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Logo entrance
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStepTransition = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleContinueStep1 = () => {
    animateStepTransition(1);
  };

  const handleContinueStep2 = () => {
    animateStepTransition(2);
  };

  const handleEnterKora = () => {
    haptic.heavy();
    completeOnboarding();
    router.replace('/(tabs)/globe');
  };

  // Particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    delay: i * 400,
    startX: Math.random() * SCREEN_W,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="eveil-screen">
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(166,93,71,0.15)', 'transparent', 'rgba(74,127,165,0.08)']}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.8, y: 0.9 }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} startX={p.startX} />
      ))}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ translateY: logoSlide }] }]}>
          <Text style={styles.logo} testID="kora-logo">KORA</Text>
        </Animated.View>
        <Animated.View style={{ opacity: subOpacity }}>
          <Text style={styles.subtitle} testID="kora-subtitle">TON MONDE T'ATTEND</Text>
        </Animated.View>

        {/* Step content */}
        <Animated.View
          style={[
            styles.stepContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {step === 0 && (
            <View testID="eveil-step-1">
              <Text style={styles.question}>Quelle est ta fréquence ?</Text>
              <View style={styles.optionsGrid}>
                {FREQUENCIES.map((item) => {
                  const selected = frequencies.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      testID={`freq-option-${item.id}`}
                      style={[styles.optionCard, selected && styles.optionCardSelected]}
                      onPress={() => {
                      haptic.selection();
                      toggleFrequency(item.id);
                    }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {frequencies.length > 0 && (
                <TouchableOpacity
                  testID="eveil-continue-1"
                  style={styles.continueBtn}
                  onPress={handleContinueStep1}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueBtnText}>{'Continuer →'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 1 && (
            <View testID="eveil-step-2">
              <Text style={styles.question}>{"D'où vient ta mémoire ?"}</Text>
              <View style={styles.optionsGrid}>
                {MEMORIES.map((item) => {
                  const selected = memories.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      testID={`mem-option-${item.id}`}
                      style={[styles.optionCard, selected && styles.optionCardSelected]}
                      onPress={() => {
                      haptic.selection();
                      toggleMemory(item.id);
                    }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {memories.length > 0 && (
                <TouchableOpacity
                  testID="eveil-continue-2"
                  style={styles.continueBtn}
                  onPress={handleContinueStep2}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueBtnText}>{'Continuer →'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.materializationContainer} testID="eveil-step-3">
              <Text style={styles.materializationTitle}>Ton territoire se génère...</Text>
              <MiniGlobe />
              <TouchableOpacity
                testID="eveil-enter-btn"
                style={styles.enterBtn}
                onPress={handleEnterKora}
                activeOpacity={0.8}
              >
                <Text style={styles.enterBtnText}>{'Entrer dans KORA ✦'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Progress dots */}
        <ProgressDots current={step} total={3} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  // Particles
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.gold,
    zIndex: 0,
  },
  // Logo
  logoContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 64,
    color: COLORS.cream,
    letterSpacing: 6,
  },
  subtitle: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 13,
    color: COLORS.terra,
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 48,
  },
  // Step container
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  question: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 32,
  },
  // Options grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  optionCard: {
    width: (SCREEN_W - 72) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.2)',
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  // Continue button
  continueBtn: {
    marginTop: 32,
    backgroundColor: COLORS.terra,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  continueBtnText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 1.5,
  },
  // Materialization step
  materializationContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  materializationTitle: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 30,
  },
  // Mini globe
  miniGlobeContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  miniGlobeGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.terra,
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  miniGlobe: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  globeGridH1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: '40%',
  },
  globeGridH2: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: '60%',
  },
  globeGridV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    left: '50%',
  },
  globePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.terra,
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  goldenLine1: {
    position: 'absolute',
    width: 60,
    height: 1,
    top: '45%',
    backgroundColor: COLORS.gold,
    opacity: 0.6,
    borderRadius: 1,
  },
  goldenLine2: {
    position: 'absolute',
    width: 40,
    height: 1,
    top: '55%',
    backgroundColor: COLORS.gold,
    opacity: 0.4,
    borderRadius: 1,
  },
  // Enter button
  enterBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 50,
  },
  enterBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.dark,
    letterSpacing: 1.5,
  },
  // Progress dots
  progressContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
    paddingBottom: 20,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: COLORS.terra,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
