/**
 * KORA Territoire Screen — UPGRADE 5 (Épure et respiration)
 * 
 * Principes appliqués :
 * - Header : seulement avatar + nom + rôle
 * - Sections séparées par beaucoup d'espace (48px minimum)
 * - Maximum 3 couleurs : dark, cream, terra
 * - Line-height minimum : 1.6
 */

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
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../../src/theme';
import { useKoraStore } from '../../src/store/useKoraStore';
import { haptic } from '../../src/utils/haptics';
import { getSovereignId, truncateSovereignId } from '../../src/utils/sovereignId';
import { TerritoireIcon, CreateIcon, BackIcon } from '../../src/components/icons/KoraIcons';

const { width: SW } = Dimensions.get('window');

// Derive role from frequencies
function getRole(freqs: string[]): string {
  if (freqs.includes('musique')) return 'GRIOT';
  if (freqs.includes('art')) return 'CRÉATEUR';
  if (freqs.includes('pensee')) return 'PENSEUR';
  if (freqs.includes('construction')) return 'BÂTISSEUR';
  return 'EXPLORATEUR';
}

const ECLATS = [
  { title: 'Rythmes de Dakar', resonance: 234, bg: ['#2a1520', '#1a1520'] as [string, string] },
  { title: "L'Art Originel", resonance: 189, bg: ['#1a2520', '#1a1a25'] as [string, string] },
  { title: 'Pensées Nocturnes', resonance: 312, bg: ['#1a1a2e', '#251a1a'] as [string, string] },
  { title: 'Construire Demain', resonance: 156, bg: ['#1a2525', '#1a1a20'] as [string, string] },
];

const COLLABS = [
  { name: 'Fréquences Croisées', partner: 'Kwame Asante', verified: true },
  { name: 'Mémoire Collective', partner: 'Fatou Keita', verified: true },
];

// Pulsating sphere for Noyau CTA
function NoyauSphere() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[noyauStyles.sphere, { transform: [{ scale: pulse }] }]}>
      <LinearGradient 
        colors={[COLORS.terra, COLORS.gold]} 
        style={noyauStyles.sphereInner} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
      />
    </Animated.View>
  );
}

export default function TerritoireScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { frequencies } = useKoraStore();
  
  const [sovereignId, setSovereignId] = useState<string>('');
  
  useEffect(() => {
    getSovereignId().then((id) => setSovereignId(id));
  }, []);

  const role = getRole(frequencies);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="territoire-screen">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══════════════════════════════════════════════════════════════
            HEADER — Épuré : Avatar + Nom + Rôle uniquement
        ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.headerSection}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[COLORS.terra, COLORS.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <TerritoireIcon size={44} color={COLORS.cream} />
            </LinearGradient>
          </View>

          {/* Name */}
          <Text style={styles.name} testID="territoire-name">Amina Diallo</Text>
          
          {/* Role */}
          <Text style={styles.role} testID="territoire-role">{role}</Text>
        </View>

        {/* ═══════════════════════════════════════════════════════════════
            NOYAU CTA — Séparé par beaucoup d'espace
        ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionSpacing} />
        
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
            <Text style={styles.noyauLabel}>NOYAU</Text>
            <Text style={styles.noyauValue}>2,847 CVLN</Text>
          </View>
          <BackIcon size={20} color={COLORS.gray} />
        </TouchableOpacity>

        {/* ═══════════════════════════════════════════════════════════════
            ÉCLATS — Minimal grid
        ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionSpacing} />
        
        <Text style={styles.sectionTitle}>ÉCLATS</Text>
        
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
                <CreateIcon size={28} color="rgba(255,255,255,0.3)" />
              </LinearGradient>
              <View style={styles.eclatInfo}>
                <Text style={styles.eclatTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.eclatMeta}>{e.resonance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══════════════════════════════════════════════════════════════
            COLLABORATIONS FREK
        ═══════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionSpacing} />
        
        <Text style={styles.sectionTitle}>COLLABORATIONS</Text>
        
        {COLLABS.map((c, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.collabCard} 
            activeOpacity={0.8} 
            testID={`collab-card-${i}`}
            onPress={() => { if (c.verified) haptic.success(); }}
          >
            <View style={styles.collabInfo}>
              <Text style={styles.collabName}>{c.name}</Text>
              <Text style={styles.collabPartner}>avec {c.partner}</Text>
            </View>
            {c.verified && (
              <View style={styles.frekBadge}>
                <Text style={styles.frekBadgeText}>FREK</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* ═══════════════════════════════════════════════════════════════
            SOVEREIGN ID — Discret en bas
        ═══════════════════════════════════════════════════════════════ */}
        {sovereignId ? (
          <>
            <View style={styles.sectionSpacing} />
            <View style={styles.sovereignSection}>
              <Text style={styles.sovereignLabel}>ID SOUVERAIN</Text>
              <Text style={styles.sovereignValue}>{truncateSovereignId(sovereignId)}</Text>
            </View>
          </>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const noyauStyles = StyleSheet.create({
  sphere: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sphereInner: {
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
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  
  // ═══════════ HEADER — Épuré ═══════════
  headerSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  avatarWrap: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...TYPOGRAPHY.nameLarge,
    textAlign: 'center',
  },
  role: {
    ...TYPOGRAPHY.role,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // ═══════════ SPACING ═══════════
  sectionSpacing: {
    height: SPACING.xxl, // 80px minimum
  },
  
  // ═══════════ NOYAU CTA ═══════════
  noyauBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: 'rgba(166,93,71,0.06)',
  },
  noyauInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  noyauLabel: {
    ...TYPOGRAPHY.label,
  },
  noyauValue: {
    ...TYPOGRAPHY.cvln,
  },
  
  // ═══════════ SECTION TITLE ═══════════
  sectionTitle: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.md,
  },
  
  // ═══════════ ÉCLATS GRID ═══════════
  eclatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  eclatCard: {
    width: (SW - SPACING.md * 2 - SPACING.sm) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  eclatBg: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eclatInfo: {
    padding: SPACING.sm,
  },
  eclatTitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 14 * 1.6,
  },
  eclatMeta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  
  // ═══════════ COLLABORATIONS ═══════════
  collabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  collabInfo: {
    flex: 1,
  },
  collabName: {
    ...TYPOGRAPHY.body,
  },
  collabPartner: {
    ...TYPOGRAPHY.meta,
    marginTop: 4,
  },
  frekBadge: {
    backgroundColor: 'rgba(166,93,71,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  frekBadgeText: {
    ...TYPOGRAPHY.badge,
  },
  
  // ═══════════ SOVEREIGN ID ═══════════
  sovereignSection: {
    alignItems: 'center',
  },
  sovereignLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: 8,
  },
  sovereignValue: {
    ...TYPOGRAPHY.id,
    color: 'rgba(255,255,255,0.3)',
  },
});
