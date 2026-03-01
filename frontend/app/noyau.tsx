/**
 * KORA Noyau Screen — UPGRADE 5 (Épure et respiration)
 * 
 * Principes appliqués :
 * - La sphère occupe 50% de l'écran
 * - Rien d'autre visible au-dessus du fold
 * - Maximum 3 couleurs : dark, cream, terra
 * - Beaucoup d'espace entre les sections
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../src/theme';
import { haptic } from '../src/utils/haptics';
import { BackIcon } from '../src/components/icons/KoraIcons';
import EmissionMode from '../src/components/EmissionMode';
import { Eclat } from '../src/utils/eclatStorage';

const { width: SW, height: SH } = Dimensions.get('window');

// ──────────── DATA ────────────

const STATS = [
  { value: '2 847', label: 'CVLN' },
  { value: '+313', label: 'CE MOIS', accent: true },
  { value: '12', label: 'FREK' },
];

const ACTIVITY = [
  { desc: 'Fatou Diallo entre dans votre territoire', cvln: '+8' },
  { desc: 'Pulse Records résonne votre Éclat', cvln: '+15' },
  { desc: 'FREK certifié — Kévin × Lagos', cvln: 'FREK', isFrek: true },
];

// ──────────── CENTRAL SPHERE ────────────

interface CentralSphereProps {
  onTap: () => void;
  onLongPress: () => void;
}

function CentralSphere({ onTap, onLongPress }: CentralSphereProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.02, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    // Glow oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleTap = () => {
    haptic.light();
    Animated.sequence([
      Animated.spring(pulseScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(pulseScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
    onTap();
  };

  const handleLongPress = () => {
    // UPGRADE 12: Trigger Emission Mode
    haptic.heavy();
    onLongPress();
  };

  // 50% of screen height for the sphere area
  const sphereAreaHeight = SH * 0.5;
  const sphereSize = Math.min(SW * 0.55, 220);

  return (
    <View style={[styles.sphereArea, { height: sphereAreaHeight }]}>
      {/* Outer glow */}
      <Animated.View 
        style={[
          styles.glowOuter, 
          { 
            width: sphereSize * 1.5, 
            height: sphereSize * 1.5, 
            borderRadius: sphereSize * 0.75,
            opacity: glowOpacity 
          }
        ]} 
      />

      {/* Main sphere — Tap + Long Press */}
      <TouchableOpacity 
        onPress={handleTap} 
        onLongPress={handleLongPress}
        delayLongPress={800}
        activeOpacity={0.9} 
        testID="noyau-sphere-btn"
      >
        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <LinearGradient
            colors={['#e8a882', COLORS.terra, '#6b2d1a']}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.8, y: 0.9 }}
            style={[styles.sphere, { width: sphereSize, height: sphereSize, borderRadius: sphereSize / 2 }]}
          >
            {/* Light reflection */}
            <View style={[styles.sphereHighlight, { width: sphereSize * 0.35, height: sphereSize * 0.18 }]} />
            <Text style={styles.sphereValue} testID="noyau-cvln-value">2 847</Text>
            <Text style={styles.sphereLabel}>CVLN</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ──────────── MAIN ────────────

export default function NoyauScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // UPGRADE 12: Emission Mode state
  const [emissionModeActive, setEmissionModeActive] = useState(false);
  
  // Mock user location (Fort-de-France)
  const userLocation = { lat: 14.6, lng: -61.08 };

  // Entrance animation
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);
  
  // Tap on sphere → open Nébuleuse (messages)
  const handleSphereTap = () => {
    router.push('/(tabs)/nebuleuse');
  };
  
  // Long press on sphere → Emission Mode
  const handleSphereLongPress = () => {
    setEmissionModeActive(true);
  };
  
  // Handle Éclat creation
  const handleEclatCreated = (eclat: Eclat) => {
    console.log('Éclat created:', eclat.id);
    // Navigate to Globe to see the new Éclat
    router.push('/(tabs)/globe');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="noyau-screen">
      {/* Back button — minimal, top left */}
      <TouchableOpacity
        testID="noyau-back-btn"
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <BackIcon size={20} color={COLORS.cream} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════════════════════════════════════════════════════
            CENTRAL SPHERE — 50% of screen, nothing else above fold
            Tap = Nébuleuse, Long Press (800ms) = Emission Mode
        ═══════════════════════════════════════════════════════════════ */}
        <CentralSphere 
          onTap={handleSphereTap}
          onLongPress={handleSphereLongPress}
        />

        {/* ═══════════════════════════════════════════════════════════════
            CONTENT BELOW FOLD — Animated entrance
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>

          {/* ──── STATS ──── */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[styles.statValue, s.accent && styles.statValueAccent]}>
                  {s.value}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ──── SPACING ──── */}
          <View style={styles.sectionSpacing} />

          {/* ──── ACTIVITY ──── */}
          <Text style={styles.sectionTitle}>ACTIVITÉ</Text>
          
          {ACTIVITY.map((a, i) => (
            <View key={i} style={styles.activityCard} testID={`activity-${i}`}>
              <Text style={styles.activityDesc}>{a.desc}</Text>
              <Text style={[styles.activityCvln, a.isFrek && styles.activityFrek]}>
                {a.cvln}
              </Text>
            </View>
          ))}

        </Animated.View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
      
      {/* UPGRADE 12: Emission Mode Overlay */}
      <EmissionMode
        visible={emissionModeActive}
        onClose={() => setEmissionModeActive(false)}
        onEclatCreated={handleEclatCreated}
        userLocation={userLocation}
      />
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  
  // ═══════════ BACK BUTTON ═══════════
  backBtn: {
    position: 'absolute',
    top: 60,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  // ═══════════ SPHERE AREA — 50% of screen ═══════════
  sphereArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    backgroundColor: 'rgba(166,93,71,0.12)',
  },
  sphere: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sphereHighlight: {
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 25,
    left: 30,
    transform: [{ rotate: '-20deg' }],
  },
  sphereValue: {
    ...TYPOGRAPHY.cvlnLarge,
    color: '#FFFFFF',
  },
  sphereLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // ═══════════ STATS ═══════════
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.statValue,
  },
  statValueAccent: {
    color: COLORS.terra,
  },
  statLabel: {
    ...TYPOGRAPHY.statLabel,
    marginTop: 8,
  },
  
  // ═══════════ SPACING ═══════════
  sectionSpacing: {
    height: SPACING.xl,
  },
  
  // ═══════════ SECTION TITLE ═══════════
  sectionTitle: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.md,
  },
  
  // ═══════════ ACTIVITY ═══════════
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  activityDesc: {
    ...TYPOGRAPHY.body,
    flex: 1,
    marginRight: SPACING.sm,
  },
  activityCvln: {
    ...TYPOGRAPHY.cvlnSmall,
  },
  activityFrek: {
    ...TYPOGRAPHY.badge,
    backgroundColor: 'rgba(166,93,71,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
