import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../src/theme';
import BackButton from '../src/components/common/BackButton';

const { width: SW } = Dimensions.get('window');

const RACINES = [
  { label: 'Écoute passive', value: 42, max: 100, display: '42' },
  { label: 'Curation', value: 28, max: 100, display: '28' },
  { label: 'Partage culturel', value: 65, max: 100, display: '65' },
];

const STATS_GRID = [
  { value: '847', label: 'Connexions' },
  { value: '156', label: 'Éclats' },
  { value: '2.4K', label: 'Résonance' },
  { value: '12', label: 'Territoires' },
];

const CONNEXIONS = [
  { initial: 'K', name: 'Kwame Asante', cvln: '+12', time: '2h' },
  { initial: 'F', name: 'Fatou Keita', cvln: '+8', time: '5h' },
  { initial: 'O', name: 'Omar Sy', cvln: '+23', time: '1j' },
];

function AnimatedBar({ value, max, delay }: { value: number; max: number; delay: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(width, {
        toValue: (value / max) * 100,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

export default function NoyauScreen() {
  const insets = useSafeAreaInsets();
  const spherePulse = useRef(new Animated.Value(1)).current;
  const sphereGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(spherePulse, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(spherePulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sphereGlow, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(sphereGlow, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="noyau-screen">
      <LinearGradient
        colors={['rgba(166,93,71,0.08)', 'transparent', 'rgba(201,168,76,0.06)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Le Noyau</Text>
        </View>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>30 jours</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Central sphere */}
        <View style={styles.sphereArea}>
          <Animated.View style={[styles.sphereGlow, { opacity: sphereGlow }]} />
          <Animated.View style={{ transform: [{ scale: spherePulse }] }}>
            <LinearGradient
              colors={['#3d2010', COLORS.terra, '#201510']}
              start={{ x: 0.3, y: 0.2 }}
              end={{ x: 0.8, y: 0.9 }}
              style={styles.sphere}
            >
              <Text style={styles.sphereValue}>1,247</Text>
              <Text style={styles.sphereLabel}>CVLN</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Arbre de Vie - Racines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌱</Text>
            <Text style={styles.sectionTitle}>RACINES · REVENUS PASSIFS</Text>
          </View>
          {RACINES.map((r, i) => (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barLabel}>{r.label}</Text>
              <AnimatedBar value={r.value} max={r.max} delay={i * 200} />
              <Text style={styles.barValue}>{r.display}</Text>
            </View>
          ))}
        </View>

        {/* Tronc - Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌳</Text>
            <Text style={styles.sectionTitle}>TRONC · ACTIVITÉ</Text>
          </View>
          <View style={styles.statsGrid}>
            {STATS_GRID.map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Feuilles - Connexions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🍃</Text>
            <Text style={styles.sectionTitle}>FEUILLES · NOUVELLES CONNEXIONS</Text>
          </View>
          {CONNEXIONS.map((c, i) => (
            <View key={i} style={styles.connexionRow}>
              <LinearGradient
                colors={[COLORS.terra, COLORS.dark2]}
                style={styles.connexionAvatar}
              >
                <Text style={styles.connexionInitial}>{c.initial}</Text>
              </LinearGradient>
              <View style={styles.connexionInfo}>
                <Text style={styles.connexionName}>{c.name}</Text>
                <Text style={styles.connexionTime}>il y a {c.time}</Text>
              </View>
              <Text style={styles.connexionCvln}>{c.cvln} CVLN</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  periodBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodText: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
  },
  // Sphere
  sphereArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 10,
  },
  sphereGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.terra,
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 10,
  },
  sphere: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.terra,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 8,
  },
  sphereValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: COLORS.cream,
  },
  sphereLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 3,
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 2.5,
  },
  // Bars
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    width: 110,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  barValue: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 13,
    color: COLORS.gold,
    width: 30,
    textAlign: 'right',
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: (SW - 48 - 10) / 2 - 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
  },
  statLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  // Connexions
  connexionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  connexionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connexionInitial: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  connexionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  connexionName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
  },
  connexionTime: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
  connexionCvln: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 13,
    color: COLORS.gold,
  },
});
