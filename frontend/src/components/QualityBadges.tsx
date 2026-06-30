/**
 * KORA Quality Badges — Professional Audio Certification Badges
 * 
 * Like Dolby Atmos, Spatial Audio, Hi-Res badges on Spotify/Apple Music
 * Very discreet but professional
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FONTS } from '../theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

// ══════════════════════════════════════════════════════════════════════════════
// FREKCORE BADGE — Certification de qualité culturelle
// ══════════════════════════════════════════════════════════════════════════════

export const FrekCoreBadge = memo(({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) => {
  const dimensions = {
    small: { width: 14, height: 14, fontSize: 6 },
    medium: { width: 18, height: 18, fontSize: 8 },
    large: { width: 24, height: 24, fontSize: 10 },
  };
  const d = dimensions[size];

  return (
    <View style={[styles.frekBadge, { width: d.width, height: d.height }]}>
      <Svg width={d.width} height={d.height} viewBox="0 0 24 24">
        <Defs>
          <LinearGradient id="frekGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={CINEMA.gold} />
            <Stop offset="1" stopColor={CINEMA.terra} />
          </LinearGradient>
        </Defs>
        <Circle cx="12" cy="12" r="11" fill="url(#frekGrad)" />
        <Path 
          d="M12 6l1.5 3.5 3.5 1.5-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" 
          fill={CINEMA.black} 
        />
      </Svg>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SPATIAL AUDIO BADGE — Like Dolby Atmos
// ══════════════════════════════════════════════════════════════════════════════

export const SpatialAudioBadge = memo(({ size = 'small' }: { size?: 'small' | 'medium' }) => {
  const isSmall = size === 'small';
  
  return (
    <View style={[styles.spatialBadge, isSmall ? styles.spatialBadgeSmall : styles.spatialBadgeMedium]}>
      <Svg width={isSmall ? 10 : 14} height={isSmall ? 10 : 14} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="3" fill={CINEMA.gold} />
        <Circle cx="12" cy="12" r="6" stroke={CINEMA.gold} strokeWidth="1.5" strokeDasharray="3 2" />
        <Circle cx="12" cy="12" r="10" stroke={CINEMA.gold} strokeWidth="1" strokeOpacity="0.5" />
      </Svg>
      {!isSmall && <Text style={styles.spatialText}>SPATIAL</Text>}
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// HI-RES AUDIO BADGE
// ══════════════════════════════════════════════════════════════════════════════

export const HiResBadge = memo(({ size = 'small' }: { size?: 'small' | 'medium' }) => {
  const isSmall = size === 'small';
  
  return (
    <View style={[styles.hiresBadge, isSmall ? styles.hiresBadgeSmall : styles.hiresBadgeMedium]}>
      <Text style={[styles.hiresText, isSmall && styles.hiresTextSmall]}>Hi-Res</Text>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// LOSSLESS BADGE
// ══════════════════════════════════════════════════════════════════════════════

export const LosslessBadge = memo(({ size = 'small' }: { size?: 'small' | 'medium' }) => {
  const isSmall = size === 'small';
  
  return (
    <View style={[styles.losslessBadge, isSmall ? styles.losslessBadgeSmall : styles.losslessBadgeMedium]}>
      <Text style={[styles.losslessText, isSmall && styles.losslessTextSmall]}>LOSSLESS</Text>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// COMBINED QUALITY BADGES ROW
// ══════════════════════════════════════════════════════════════════════════════

interface QualityBadgesProps {
  showFrekCore?: boolean;
  showSpatial?: boolean;
  showHiRes?: boolean;
  showLossless?: boolean;
  size?: 'small' | 'medium';
}

export const QualityBadges = memo(({
  showFrekCore = true,
  showSpatial = false,
  showHiRes = false,
  showLossless = false,
  size = 'small',
}: QualityBadgesProps) => {
  return (
    <View style={styles.badgesRow}>
      {showFrekCore && <FrekCoreBadge size={size} />}
      {showSpatial && <SpatialAudioBadge size={size} />}
      {showHiRes && <HiResBadge size={size} />}
      {showLossless && <LosslessBadge size={size} />}
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// VERIFIED ARTIST BADGE
// ══════════════════════════════════════════════════════════════════════════════

export const VerifiedBadge = memo(({ size = 12 }: { size?: number }) => {
  return (
    <View style={[styles.verifiedBadge, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill={CINEMA.gold} />
        <Path d="M9 12l2 2 4-4" stroke={CINEMA.black} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  frekBadge: {
    // Container for the FrekCore icon
  },
  spatialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 4,
    gap: 3,
  },
  spatialBadgeSmall: {
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  spatialBadgeMedium: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  spatialText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 7,
    color: CINEMA.gold,
    letterSpacing: 0.5,
  },
  hiresBadge: {
    backgroundColor: 'rgba(166,93,71,0.15)',
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(166,93,71,0.3)',
  },
  hiresBadgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hiresBadgeMedium: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hiresText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 8,
    color: CINEMA.terra,
    letterSpacing: 0.3,
  },
  hiresTextSmall: {
    fontSize: 6,
  },
  losslessBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  losslessBadgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  losslessBadgeMedium: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  losslessText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  losslessTextSmall: {
    fontSize: 5,
  },
  verifiedBadge: {
    // Container for verified checkmark
  },
});

export default {
  FrekCoreBadge,
  SpatialAudioBadge,
  HiResBadge,
  LosslessBadge,
  QualityBadges,
  VerifiedBadge,
};
