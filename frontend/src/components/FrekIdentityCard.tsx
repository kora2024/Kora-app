/**
 * KORA FREK Identity Card — Carte d'Identité Souveraine
 * 
 * Affiche le FREK-ID avec le rang culturel et le score de sagesse
 * Design premium : Playfair Display, accents Gold, fond Dark
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../theme';
import { RoleCulturel } from '../utils/contentCharte';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface FrekIdentityCardProps {
  frekId: string;
  roleCulturel: RoleCulturel;
  sagesseScore: number;
  territory?: string;
  strikeCount?: number;
  compact?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// ROLE DISPLAY CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const ROLE_CONFIG: Record<RoleCulturel, { label: string; color: string; icon: string }> = {
  nouveau: { label: 'NOUVEAU', color: 'rgba(255,255,255,0.5)', icon: '○' },
  membre: { label: 'MEMBRE', color: COLORS.cream, icon: '◐' },
  confirme: { label: 'CONFIRMÉ', color: COLORS.terra, icon: '●' },
  veilleur: { label: 'VEILLEUR', color: COLORS.gold, icon: '◉' },
  ancien: { label: 'ANCIEN', color: COLORS.gold, icon: '✦' },
};

// ══════════════════════════════════════════════════════════════════════════════
// TERRITORY LABELS
// ══════════════════════════════════════════════════════════════════════════════

const TERRITORY_LABELS: Record<string, string> = {
  caribbean: 'Caraïbes',
  africa: 'Afrique',
  diaspora: 'Diaspora',
  latin: 'Amérique Latine',
  world: 'Monde',
  caraibes: 'Caraïbes',
  afrique: 'Afrique',
  europe: 'Europe',
  ameriques: 'Amériques',
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function FrekIdentityCard({
  frekId,
  roleCulturel,
  sagesseScore,
  territory,
  strikeCount = 0,
  compact = false,
}: FrekIdentityCardProps) {
  const roleConfig = ROLE_CONFIG[roleCulturel] || ROLE_CONFIG.nouveau;
  const territoryLabel = territory ? TERRITORY_LABELS[territory] || territory : null;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactLeft}>
          <Text style={styles.compactIcon}>{roleConfig.icon}</Text>
          <Text style={styles.compactFrekId}>{frekId}</Text>
        </View>
        <View style={[styles.compactBadge, { borderColor: roleConfig.color }]}>
          <Text style={[styles.compactBadgeText, { color: roleConfig.color }]}>
            {roleConfig.label}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.frekText}>{frekId}</Text>
        <View style={[styles.badge, { borderColor: roleConfig.color }]}>
          <Text style={styles.badgeIcon}>{roleConfig.icon}</Text>
          <Text style={[styles.badgeText, { color: roleConfig.color }]}>
            {roleConfig.label}
          </Text>
        </View>
      </View>

      {/* Territory */}
      {territoryLabel && (
        <Text style={styles.territoryText}>Territoire : {territoryLabel}</Text>
      )}

      {/* Stats Footer */}
      <View style={styles.footerRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Poids de Sagesse</Text>
          <Text style={styles.scoreText}>{sagesseScore} Pts</Text>
        </View>
        
        {strikeCount > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avertissements</Text>
            <Text style={styles.strikeText}>{strikeCount} / 3</Text>
          </View>
        )}
      </View>

      {/* Decorative line */}
      <LinearGradient
        colors={['transparent', roleConfig.color, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.decorativeLine}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI BADGE COMPONENT (for lists)
// ══════════════════════════════════════════════════════════════════════════════

export function RoleBadge({ roleCulturel }: { roleCulturel: RoleCulturel }) {
  const roleConfig = ROLE_CONFIG[roleCulturel] || ROLE_CONFIG.nouveau;
  
  return (
    <View style={[styles.miniBadge, { backgroundColor: `${roleConfig.color}20` }]}>
      <Text style={[styles.miniBadgeText, { color: roleConfig.color }]}>
        {roleConfig.icon} {roleConfig.label}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.dark2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frekText: {
    fontFamily: FONTS.jetbrainsMono || FONTS.jostMedium,
    color: COLORS.cream,
    fontSize: 14,
    letterSpacing: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 10,
    color: COLORS.cream,
  },
  badgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  territoryText: {
    fontFamily: FONTS.playfairRegular,
    color: COLORS.terra,
    fontSize: 18,
    marginTop: 16,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontFamily: FONTS.jostLight,
    color: COLORS.cream,
    opacity: 0.5,
    fontSize: 11,
    marginBottom: 4,
  },
  scoreText: {
    fontFamily: FONTS.jostMedium,
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 15,
  },
  strikeText: {
    fontFamily: FONTS.jostMedium,
    color: '#E50914',
    fontWeight: '600',
    fontSize: 15,
  },
  decorativeLine: {
    height: 1,
    marginTop: 16,
    opacity: 0.3,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactIcon: {
    fontSize: 14,
    color: COLORS.gold,
  },
  compactFrekId: {
    fontFamily: FONTS.jostMedium,
    color: COLORS.cream,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  compactBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  compactBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    letterSpacing: 1,
  },

  // Mini badge
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
