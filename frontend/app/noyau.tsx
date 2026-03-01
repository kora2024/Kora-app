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
import { COLORS, FONTS, SPACING } from '../src/theme';

const { width: SW } = Dimensions.get('window');

// ──────────── DATA ────────────

const RACINES = [
  { label: 'Rythmes de Dakar', pct: 85, cvln: '+124 CVLN', emoji: '🎵' },
  { label: "L'Art Originel", pct: 60, cvln: '+87 CVLN', emoji: '🎨' },
  { label: 'Pensées Nocturnes', pct: 70, cvln: '+102 CVLN', emoji: '💭' },
];

const TRONC_STATS = [
  { value: '2 847', label: 'CVLN total', accent: false },
  { value: '+313', label: 'Ce mois', accent: true },
  { value: '12', label: 'FREK certifiés', accent: false },
  { value: '3', label: 'Artefacts actifs', accent: false },
];

const FEUILLES = [
  {
    emoji: '🌍',
    desc: 'Fatou Diallo entre dans votre territoire',
    time: 'il y a 2h',
    cvln: '+8 CVLN',
    isFrek: false,
  },
  {
    emoji: '📡',
    desc: 'Pulse Records résonne votre Éclat',
    time: 'il y a 4h',
    cvln: '+15 CVLN',
    isFrek: false,
  },
  {
    emoji: '✓',
    desc: 'FREK certifié — Kévin × Lagos',
    time: 'Collaboration validée',
    cvln: 'FREK ✓',
    isFrek: true,
  },
];

// ──────────── ANIMATED BAR ────────────

function ProgressBar({ pct, delay }: { pct: number; delay: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(widthAnim, {
        toValue: pct,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFillWrap, {
        width: widthAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        }),
      }]}>
        <LinearGradient
          colors={[COLORS.terra, COLORS.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.barFill}
        />
      </Animated.View>
    </View>
  );
}

// ──────────── CENTRAL SPHERE ────────────

function CentralSphere() {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const innerPulse = useRef(new Animated.Value(0.8)).current;
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.03, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    // Glow oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.7, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    // Inner ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(innerPulse, { toValue: 1.3, duration: 2000, useNativeDriver: true }),
        Animated.timing(innerPulse, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleTap = () => {
    // Bounce
    Animated.sequence([
      Animated.spring(pulseScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(pulseScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();

    // Tooltip
    setShowTooltip(true);
    Animated.sequence([
      Animated.timing(tooltipOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowTooltip(false));
  };

  return (
    <View style={styles.sphereArea}>
      {/* Outer glow layers */}
      <Animated.View style={[styles.glowOuter, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowMid, { opacity: glowOpacity }]} />

      {/* Inner pulse ring */}
      <Animated.View
        style={[
          styles.innerRing,
          { transform: [{ scale: innerPulse }], opacity: glowOpacity },
        ]}
      />

      {/* Main sphere */}
      <TouchableOpacity onPress={handleTap} activeOpacity={0.9} testID="noyau-sphere-btn">
        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <LinearGradient
            colors={['#e8a882', COLORS.terra, '#6b2d1a']}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.8, y: 0.9 }}
            style={styles.sphere}
          >
            {/* Light reflection */}
            <View style={styles.sphereHighlight} />
            <Text style={styles.sphereValue} testID="noyau-cvln-value">2 847</Text>
            <Text style={styles.sphereLabel}>CVLN</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Tooltip */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
          <Text style={styles.tooltipText}>Toucher pour déployer les statistiques</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ──────────── MAIN ────────────

export default function NoyauScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Entrance animation
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="noyau-screen">
      {/* Background ambiance */}
      <View style={styles.bgTerra} />
      <View style={styles.bgGold} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="noyau-back-btn"
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Le Noyau</Text>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>Mars 2026</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Central sphere */}
        <CentralSphere />

        {/* Arbre de Vie */}
        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>

          {/* ──── RACINES ──── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🌿</Text>
              <View>
                <Text style={styles.sectionTitle}>RACINES</Text>
                <Text style={styles.sectionSubtitle}>Résonance passive</Text>
              </View>
            </View>

            {RACINES.map((r, i) => (
              <View key={i} style={styles.racineRow} testID={`racine-${i}`}>
                <View style={styles.racineTop}>
                  <Text style={styles.racineEmoji}>{r.emoji}</Text>
                  <Text style={styles.racineLabel}>{r.label}</Text>
                  <Text style={styles.racineCvln}>{r.cvln}</Text>
                </View>
                <ProgressBar pct={r.pct} delay={i * 200 + 400} />
              </View>
            ))}
          </View>

          {/* ──── TRONC ──── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🪵</Text>
              <View>
                <Text style={styles.sectionTitle}>TRONC</Text>
                <Text style={styles.sectionSubtitle}>{'Solde & transactions'}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {TRONC_STATS.map((s, i) => (
                <View key={i} style={styles.statCard} testID={`tronc-stat-${i}`}>
                  <Text style={[styles.statValue, s.accent && styles.statValueAccent]}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ──── FEUILLES ──── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🍃</Text>
              <View>
                <Text style={styles.sectionTitle}>FEUILLES</Text>
                <Text style={styles.sectionSubtitle}>Nouvelles connexions</Text>
              </View>
            </View>

            {FEUILLES.map((f, i) => (
              <View key={i} style={styles.feuilleCard} testID={`feuille-${i}`}>
                <View style={[styles.feuilleEmoji, f.isFrek && styles.feuilleEmojiFrek]}>
                  <Text style={styles.feuilleEmojiText}>{f.emoji}</Text>
                </View>
                <View style={styles.feuilleInfo}>
                  <Text style={styles.feuilleDesc}>{f.desc}</Text>
                  <Text style={styles.feuilleTime}>{f.time}</Text>
                </View>
                <Text style={[styles.feuilleCvln, f.isFrek && styles.feuilleFrek]}>
                  {f.cvln}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  // Background ambiance
  bgTerra: {
    position: 'absolute',
    width: SW * 0.9,
    height: SW * 0.9,
    borderRadius: SW * 0.45,
    backgroundColor: 'rgba(166,93,71,0.12)',
    left: SW * 0.05,
    top: 80,
  },
  bgGold: {
    position: 'absolute',
    width: SW * 0.5,
    height: SW * 0.5,
    borderRadius: SW * 0.25,
    backgroundColor: 'rgba(201,168,76,0.06)',
    right: -SW * 0.1,
    top: -SW * 0.05,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    marginTop: -1,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginLeft: 14,
  },
  periodBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  // Sphere area
  sphereArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    marginBottom: 12,
  },
  glowOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(166,93,71,0.15)',
  },
  glowMid: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(166,93,71,0.2)',
  },
  innerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
  },
  sphere: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sphereHighlight: {
    position: 'absolute',
    width: 60,
    height: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 20,
    left: 25,
    transform: [{ rotate: '-20deg' }],
  },
  sphereValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  sphereLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 3,
    marginTop: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tooltipText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 3,
  },
  sectionSubtitle: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
  // Racines
  racineRow: {
    marginBottom: 16,
  },
  racineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  racineEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  racineLabel: {
    flex: 1,
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  racineCvln: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 14,
    color: COLORS.gold,
  },
  barTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFillWrap: {
    height: '100%',
  },
  barFill: {
    flex: 1,
    borderRadius: 2,
  },
  // Tronc
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
  },
  statValue: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 4,
  },
  statValueAccent: {
    color: COLORS.terra,
  },
  statLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  // Feuilles
  feuilleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  feuilleEmoji: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feuilleEmojiFrek: {
    backgroundColor: 'rgba(166,93,71,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
  },
  feuilleEmojiText: {
    fontSize: 16,
  },
  feuilleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  feuilleDesc: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 17,
  },
  feuilleTime: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 3,
  },
  feuilleCvln: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 13,
    color: COLORS.gold,
    marginLeft: 8,
  },
  feuilleFrek: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
});
