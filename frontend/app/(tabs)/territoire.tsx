import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';

const STATS = [
  { num: '2.4K', label: 'RÉSONANCE' },
  { num: '847', label: 'CONNEXIONS' },
  { num: '156', label: 'ÉCLATS' },
];

const ECLATS = [
  { emoji: '🎵', title: 'Rythmes de Dakar', meta: '234 résonances', bg: ['#2a1520', '#1a1520'] as const },
  { emoji: '🎨', title: "L'Art Originel", meta: '189 résonances', bg: ['#1a2520', '#1a1a25'] as const },
  { emoji: '💭', title: 'Pensées Nocturnes', meta: '312 résonances', bg: ['#1a1a2e', '#251a1a'] as const },
  { emoji: '🏗️', title: 'Construire Demain', meta: '156 résonances', bg: ['#1a2525', '#1a1a20'] as const },
];

export default function TerritoireScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="territoire-screen">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header bg */}
        <LinearGradient
          colors={['#1a0a06', '#2d1a0e', '#0a1a2d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        >
          {/* Avatar */}
          <LinearGradient
            colors={[COLORS.terra, COLORS.gold]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>A</Text>
          </LinearGradient>

          <Text style={styles.name}>Amina Diallo</Text>
          <Text style={styles.role}>GRIOT · CRÉATRICE</Text>
          <Text style={styles.location}>📍 Dakar, Sénégal</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.stat, i < STATS.length - 1 && styles.statBorder]}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Noyau button */}
        <TouchableOpacity
          style={styles.noyauBtn}
          testID="territoire-noyau-btn"
          onPress={() => router.push('/noyau')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.terra, COLORS.gold]}
            style={styles.noyauSphere}
          />
          <View style={styles.noyauInfo}>
            <Text style={styles.noyauLabel}>TON NOYAU ÉCONOMIQUE</Text>
            <Text style={styles.noyauValue}>1,247 CVLN</Text>
          </View>
          <Text style={styles.noyauArrow}>›</Text>
        </TouchableOpacity>

        {/* Éclats */}
        <Text style={styles.sectionTitle}>MES ÉCLATS</Text>
        <View style={styles.eclatGrid}>
          {ECLATS.map((e, i) => (
            <TouchableOpacity key={i} style={styles.eclatCard} activeOpacity={0.8} testID={`eclat-card-${i}`}>
              <LinearGradient colors={[...e.bg]} style={styles.eclatBg}>
                <Text style={styles.eclatEmoji}>{e.emoji}</Text>
              </LinearGradient>
              <View style={styles.eclatInfo}>
                <Text style={styles.eclatTitle}>{e.title}</Text>
                <Text style={styles.eclatMeta}>{e.meta}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Collab */}
        <Text style={styles.sectionTitle}>COLLABORATIONS</Text>
        <View style={styles.collabCard}>
          <LinearGradient colors={[COLORS.blue, COLORS.dark2]} style={styles.collabAvatar}>
            <Text style={styles.collabInitial}>K</Text>
          </LinearGradient>
          <View style={styles.collabInfo}>
            <Text style={styles.collabName}>Kwame Asante</Text>
            <Text style={styles.collabDesc}>Projet "Fréquences Croisées"</Text>
          </View>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  headerBg: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: COLORS.cream,
  },
  name: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 6,
  },
  role: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 3,
    marginBottom: 4,
  },
  location: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
  // Noyau
  noyauBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(166,93,71,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.2)',
  },
  noyauSphere: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  noyauArrow: {
    fontSize: 24,
    color: COLORS.gray,
  },
  // Section
  sectionTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 3,
    marginHorizontal: SPACING.lg,
    marginTop: 28,
    marginBottom: 14,
  },
  // Eclats
  eclatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: SPACING.lg,
  },
  eclatCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  eclatBg: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eclatEmoji: {
    fontSize: 36,
  },
  eclatInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  eclatTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 12,
    color: COLORS.cream,
  },
  eclatMeta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Collab
  collabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  collabAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabInitial: {
    fontFamily: FONTS.playfairBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  collabInfo: {
    marginLeft: 12,
  },
  collabName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
  },
  collabDesc: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});
