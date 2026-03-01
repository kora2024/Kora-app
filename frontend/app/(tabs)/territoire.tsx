import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore } from '../../src/store/useKoraStore';
import { haptic } from '../../src/utils/haptics';
import { getSovereignId, truncateSovereignId } from '../../src/utils/sovereignId';

const { width: SW } = Dimensions.get('window');
const HEADER_H = 380;

// Derive avatar emoji from first frequency
function getAvatarEmoji(freqs: string[]): string {
  if (freqs.includes('musique')) return '🎵';
  if (freqs.includes('art')) return '🎨';
  if (freqs.includes('pensee')) return '💭';
  if (freqs.includes('construction')) return '🏗️';
  return '✦';
}

// Derive role from frequencies
function getRole(freqs: string[]): string {
  const roles: string[] = [];
  if (freqs.includes('musique')) roles.push('GRIOT');
  if (freqs.includes('art')) roles.push('CRÉATEUR');
  if (freqs.includes('pensee')) roles.push('PENSEUR');
  if (freqs.includes('construction')) roles.push('BÂTISSEUR');
  return roles.length > 0 ? roles.slice(0, 2).join(' · ') : 'EXPLORATEUR';
}

// Derive gradient from frequency + memory
function getHeaderGradient(freqs: string[], mems: string[]): [string, string, string] {
  const freqColor = freqs.includes('musique') ? '#2a1520'
    : freqs.includes('art') ? '#1a2520'
    : freqs.includes('pensee') ? '#1a1a2e'
    : '#2a2015';
  const memColor = mems.includes('caraibes') ? '#0a2a3d'
    : mems.includes('afrique') ? '#1a2d0e'
    : mems.includes('europe') ? '#1a1a3d'
    : '#2d1a2a';
  return [freqColor, '#1a0a06', memColor];
}

const STATS = [
  { num: '847', label: 'HABITANTS' },
  { num: '23', label: 'ÉCLATS' },
  { num: '12', label: 'FREK' },
];

const ECLATS = [
  { emoji: '🎵', title: 'Rythmes de Dakar', resonance: 234, ancre: 12, bg: ['#2a1520', '#1a1520'] as [string, string] },
  { emoji: '🎨', title: "L'Art Originel", resonance: 189, ancre: 8, bg: ['#1a2520', '#1a1a25'] as [string, string] },
  { emoji: '💭', title: 'Pensées Nocturnes', resonance: 312, ancre: 15, bg: ['#1a1a2e', '#251a1a'] as [string, string] },
  { emoji: '🏗️', title: 'Construire Demain', resonance: 156, ancre: 6, bg: ['#1a2525', '#1a1a20'] as [string, string] },
  { emoji: '🌊', title: 'Vagues Ancestrales', resonance: 445, ancre: 20, bg: ['#0a1a2e', '#1a2520'] as [string, string] },
  { emoji: '🔥', title: 'Feu Sacré', resonance: 278, ancre: 11, bg: ['#2d1a0e', '#1a0a06'] as [string, string] },
];

const COLLABS = [
  { emoji: '🎶', name: 'Fréquences Croisées', partner: 'Kwame Asante', date: 'Jan 2026', verified: true },
  { emoji: '🌍', name: 'Mémoire Collective', partner: 'Fatou Keita', date: 'Déc 2025', verified: true },
  { emoji: '🎨', name: 'Couleurs du Monde', partner: 'Omar Sy', date: 'Nov 2025', verified: false },
];

// Pulsating sphere for Noyau CTA
function NoyauSphere() {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={noyauStyles.sphereWrap}>
      <Animated.View style={[noyauStyles.sphereGlow, { opacity: glow, transform: [{ scale: pulse }] }]} />
      <LinearGradient colors={[COLORS.terra, COLORS.gold]} style={noyauStyles.sphere} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
    </View>
  );
}

export default function TerritoireScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { frequencies, memories } = useKoraStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  const avatarEmoji = getAvatarEmoji(frequencies);
  const role = getRole(frequencies);
  const headerGradient = getHeaderGradient(frequencies, memories);

  // Parallax: header moves at 0.5x
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_H],
    outputRange: [0, HEADER_H * 0.5],
    extrapolate: 'clamp',
  });

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(avatarGlow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="territoire-screen">
      {/* Parallax Header */}
      <Animated.View style={[styles.headerWrap, { transform: [{ translateY: headerTranslate }] }]}>
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        >
          {/* Texture overlays */}
          <View style={styles.texture1} />
          <View style={styles.texture2} />

          {/* Avatar */}
          <View style={styles.avatarArea}>
            <Animated.View style={[styles.avatarGlow, { opacity: avatarGlow }]} />
            <LinearGradient
              colors={[COLORS.terra, COLORS.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
            </LinearGradient>
          </View>

          {/* Name */}
          <Text style={styles.name} testID="territoire-name">Amina Diallo</Text>
          <Text style={styles.role} testID="territoire-role">{role}</Text>
          <Text style={styles.location}>{'📍 Fort-de-France, Martinique'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.stat, i < STATS.length - 1 && styles.statBorder]}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Fade bottom */}
          <LinearGradient
            colors={['transparent', COLORS.dark]}
            style={styles.headerFade}
          />
        </LinearGradient>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_H - 40 }]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Noyau CTA */}
        <TouchableOpacity
          style={styles.noyauBtn}
          testID="territoire-noyau-btn"
          onPress={() => {
            haptic.medium();
            router.push('/noyau');
          }}
          activeOpacity={0.8}
        >
          <NoyauSphere />
          <View style={styles.noyauInfo}>
            <Text style={styles.noyauLabel}>NOYAU CVLN</Text>
            <Text style={styles.noyauValue}>2,847 CVLN</Text>
          </View>
          <Text style={styles.noyauChevron}>{'›'}</Text>
        </TouchableOpacity>

        {/* Éclats section */}
        <Text style={styles.sectionTitle}>MES ÉCLATS</Text>
        <View style={styles.eclatGrid}>
          {ECLATS.map((e, i) => (
            <TouchableOpacity
              key={i}
              style={styles.eclatCard}
              activeOpacity={0.85}
              testID={`eclat-card-${i}`}
              onPress={() => router.push('/(tabs)/feed')}
            >
              <LinearGradient colors={e.bg} style={styles.eclatBg}>
                <Text style={styles.eclatEmoji}>{e.emoji}</Text>
              </LinearGradient>
              <View style={styles.eclatInfo}>
                <Text style={styles.eclatTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.eclatMeta}>
                  {'Résonne ' + e.resonance + ' · Ancre ' + e.ancre}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* FREK Collaborations */}
        <Text style={styles.sectionTitle}>COLLABORATIONS FREK</Text>
        {COLLABS.map((c, i) => (
          <TouchableOpacity key={i} style={styles.collabCard} activeOpacity={0.8} testID={`collab-card-${i}`}
            onPress={() => { if (c.verified) haptic.success(); }}
          >
            <Text style={styles.collabEmoji}>{c.emoji}</Text>
            <View style={styles.collabInfo}>
              <View style={styles.collabRow}>
                <Text style={styles.collabName}>{c.name}</Text>
                {c.verified && (
                  <View style={styles.frekBadge}>
                    <Text style={styles.frekBadgeText}>{'FREK ✓'}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.collabPartner}>avec {c.partner}</Text>
              <Text style={styles.collabDate}>{c.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const noyauStyles = StyleSheet.create({
  sphereWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.terra,
  },
  sphere: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  // Header
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    zIndex: 0,
  },
  headerBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  texture1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    opacity: 0.2,
    // Simulated radial gradient texture effect with border
    borderRadius: 200,
  },
  texture2: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(166,93,71,0.06)',
    top: -SW * 0.2,
    right: -SW * 0.2,
  },
  // Avatar
  avatarArea: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.terra,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  // Text
  name: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 6,
  },
  role: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  location: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  statNum: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 22,
    color: COLORS.cream,
  },
  statLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: COLORS.gray,
    letterSpacing: 1,
    marginTop: 2,
  },
  headerFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  // Noyau CTA
  noyauBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
    backgroundColor: 'rgba(166,93,71,0.08)',
    marginBottom: 28,
  },
  noyauInfo: {
    flex: 1,
    marginLeft: 14,
  },
  noyauLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 2,
  },
  noyauValue: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 22,
    color: COLORS.gold,
    marginTop: 2,
  },
  noyauChevron: {
    fontFamily: FONTS.jostLight,
    fontSize: 28,
    color: COLORS.gray,
  },
  // Section title
  sectionTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 3,
    marginBottom: 14,
  },
  // Éclats grid
  eclatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  eclatCard: {
    width: (SW - 48 - 10) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  eclatBg: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eclatEmoji: {
    fontSize: 40,
  },
  eclatInfo: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  eclatTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 12,
    color: COLORS.cream,
    marginBottom: 3,
  },
  eclatMeta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
  },
  // Collaborations
  collabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  collabEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  collabInfo: {
    flex: 1,
  },
  collabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collabName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
  },
  frekBadge: {
    backgroundColor: 'rgba(166,93,71,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.4)',
  },
  frekBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: COLORS.terra,
    letterSpacing: 0.5,
  },
  collabPartner: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  collabDate: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
});
