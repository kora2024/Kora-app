/**
 * KORA Ad Gate Component — Premium Monetization
 * 
 * Shows interstitial or rewarded ads before playback for non-premium users.
 * Premium users (stripe_status = 'active') bypass ads entirely.
 * 
 * Note: On web preview/Expo Go, ads are simulated since AdMob requires native builds.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  checkAdGating,
  recordRewardedAdWatch,
  trackAdImpression,
  setLocalAdFreeSession,
  hasLocalAdFreeSession,
  getRemainingAdFreeMinutes,
  AD_UNIT_IDS,
} from '../services/adService';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════════════════

const CINEMA = {
  black: '#0A0A0A',
  darkGray: '#141414',
  gold: '#C9A84C',
  goldLight: '#D4B55A',
  terra: '#A65D47',
  cream: '#F5F0E6',
  white: '#FFFFFF',
};

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function PlayIcon({ size = 24, color = CINEMA.black }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function GiftIcon({ size = 24, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M20 12v10H4V12" />
      <Path d="M2 7h20v5H2V7z" />
      <Path d="M12 22V7" />
      <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </Svg>
  );
}

function CrownIcon({ size = 24, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M2 19h20l-3-10-4 3-3-7-3 7-4-3-3 10z" />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AD GATE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

interface AdGateProps {
  userId?: string;
  contentId?: string;
  contentTitle?: string;
  onProceed: () => void;
  onCancel?: () => void;
}

export default function AdGate({
  userId,
  contentId,
  contentTitle,
  onProceed,
  onCancel,
}: AdGateProps) {
  const [loading, setLoading] = useState(true);
  const [showingAd, setShowingAd] = useState(false);
  const [adType, setAdType] = useState<'interstitial' | 'rewarded' | null>(null);
  const [adProgress, setAdProgress] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [hasAdFree, setHasAdFree] = useState(false);
  const [adFreeMinutes, setAdFreeMinutes] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check ad gating on mount
  useEffect(() => {
    checkGating();
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [userId]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkGating = async () => {
    setLoading(true);
    
    // First check local ad-free session
    if (hasLocalAdFreeSession()) {
      const remaining = getRemainingAdFreeMinutes();
      setHasAdFree(true);
      setAdFreeMinutes(remaining);
      setLoading(false);
      return;
    }

    // Then check server
    const result = await checkAdGating(userId);
    setIsPremium(result.isPremium);
    setHasAdFree(result.hasAdFreeSession);
    
    if (result.isPremium || result.hasAdFreeSession) {
      // Premium or has ad-free session - proceed immediately
      setLoading(false);
      setTimeout(() => onProceed(), 500);
    } else {
      // Must show ad
      setLoading(false);
    }
  };

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try { Haptics.impactAsync(style); } catch {}
  }, []);

  const simulateAd = useCallback((type: 'interstitial' | 'rewarded') => {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    setAdType(type);
    setShowingAd(true);
    setAdProgress(0);

    // Track impression
    trackAdImpression({ userId, adType: type, contentId });

    // Simulate ad duration (5s for interstitial, 15s for rewarded)
    const duration = type === 'interstitial' ? 5000 : 15000;
    const interval = 100;
    let elapsed = 0;

    adTimerRef.current = setInterval(() => {
      elapsed += interval;
      const progress = Math.min(1, elapsed / duration);
      setAdProgress(progress);

      if (elapsed >= duration) {
        if (adTimerRef.current) clearInterval(adTimerRef.current);
        handleAdComplete(type);
      }
    }, interval);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [userId, contentId]);

  const handleAdComplete = async (type: 'interstitial' | 'rewarded') => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    
    if (type === 'rewarded' && userId) {
      // Grant ad-free session
      setLocalAdFreeSession(30); // 30 minutes
      await recordRewardedAdWatch(userId);
    }
    
    setShowingAd(false);
    setAdType(null);
    setTimeout(() => onProceed(), 300);
  };

  const handleWatchInterstitial = () => {
    simulateAd('interstitial');
  };

  const handleWatchRewarded = () => {
    simulateAd('rewarded');
  };

  const handleGoPremium = () => {
    haptic();
    // This would navigate to paywall
    if (onCancel) onCancel();
  };

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CINEMA.gold} />
          <Text style={styles.loadingText}>Préparation de votre contenu...</Text>
        </View>
      </Animated.View>
    );
  }

  // ─── Premium or Ad-Free User ──────────────────────────────────────────────────
  if (isPremium || hasAdFree) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.premiumContainer}>
          <CrownIcon size={48} color={CINEMA.gold} />
          <Text style={styles.premiumTitle}>
            {isPremium ? 'Accès Premium' : 'Session Sans Pub'}
          </Text>
          {hasAdFree && !isPremium && (
            <View style={styles.adFreeInfo}>
              <ClockIcon size={14} color={CINEMA.cream} />
              <Text style={styles.adFreeText}>{adFreeMinutes} min restantes</Text>
            </View>
          )}
          <Text style={styles.premiumSubtitle}>Lecture immédiate</Text>
        </View>
      </Animated.View>
    );
  }

  // ─── Showing Ad ───────────────────────────────────────────────────────────────
  if (showingAd) {
    return (
      <View style={styles.adContainer}>
        <LinearGradient
          colors={['rgba(10,10,10,0.98)', 'rgba(20,20,20,0.95)']}
          style={styles.adGradient}
        >
          {/* Ad Header */}
          <View style={styles.adHeader}>
            <Text style={styles.adLabel}>
              {adType === 'rewarded' ? 'PUBLICITÉ RÉCOMPENSÉE' : 'PUBLICITÉ'}
            </Text>
            <Text style={styles.adTimer}>
              {Math.ceil((adType === 'interstitial' ? 5 : 15) * (1 - adProgress))}s
            </Text>
          </View>

          {/* Simulated Ad Content */}
          <View style={styles.adContent}>
            <View style={styles.adPlaceholder}>
              <Text style={styles.adPlaceholderText}>KORA</Text>
              <Text style={styles.adPlaceholderSubtext}>
                {adType === 'rewarded' 
                  ? 'Regardez cette pub pour 30 min sans publicité' 
                  : 'La culture en mouvement'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.adProgressContainer}>
            <View style={[styles.adProgressBar, { width: `${adProgress * 100}%` }]} />
          </View>

          {/* Reward Info */}
          {adType === 'rewarded' && (
            <View style={styles.rewardInfo}>
              <GiftIcon size={18} color={CINEMA.gold} />
              <Text style={styles.rewardText}>30 minutes sans pub à la fin</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }

  // ─── Ad Choice Screen ─────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(10,10,10,0.98)', 'rgba(20,20,20,0.95)']}
        style={styles.choiceGradient}
      >
        {/* Content Info */}
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle} numberOfLines={2}>
            {contentTitle || 'Votre contenu'}
          </Text>
          <Text style={styles.contentSubtitle}>est prêt à être lu</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Watch Interstitial - Quick Option */}
          <TouchableOpacity
            style={styles.interstitialBtn}
            onPress={handleWatchInterstitial}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[CINEMA.gold, CINEMA.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.interstitialGradient}
            >
              <PlayIcon size={20} color={CINEMA.black} />
              <View style={styles.interstitialTextContainer}>
                <Text style={styles.interstitialText}>REGARDER APRÈS LA PUB</Text>
                <Text style={styles.interstitialSubtext}>5 secondes de publicité</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Rewarded Ad - Better Option */}
          <TouchableOpacity
            style={styles.rewardedBtn}
            onPress={handleWatchRewarded}
            activeOpacity={0.9}
          >
            <GiftIcon size={22} color={CINEMA.gold} />
            <View style={styles.rewardedTextContainer}>
              <Text style={styles.rewardedText}>REGARDER UNE PUB LONGUE</Text>
              <Text style={styles.rewardedSubtext}>30 min sans pub ensuite</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Go Premium */}
          <TouchableOpacity
            style={styles.premiumBtn}
            onPress={handleGoPremium}
            activeOpacity={0.9}
          >
            <CrownIcon size={18} color={CINEMA.gold} />
            <Text style={styles.premiumBtnText}>PASSER PREMIUM - 3,98€/MOIS</Text>
          </TouchableOpacity>
          <Text style={styles.premiumBtnSubtext}>Sans publicité, à vie</Text>
        </View>

        {/* Cancel */}
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CINEMA.black,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  // Premium/Ad-Free State
  premiumContainer: {
    alignItems: 'center',
    gap: 12,
  },
  premiumTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.gold,
    marginTop: 8,
  },
  premiumSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  adFreeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,168,76,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  adFreeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
  },

  // Ad Container
  adContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
  },
  adGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  adTimer: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.cream,
  },
  adContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adPlaceholder: {
    width: SW * 0.85,
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  adPlaceholderText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CINEMA.gold,
    letterSpacing: 4,
  },
  adPlaceholderSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  adProgressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  adProgressBar: {
    height: '100%',
    backgroundColor: CINEMA.gold,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  rewardText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.gold,
  },

  // Choice Screen
  choiceGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  contentTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: SW > 400 ? 28 : 24,
    color: CINEMA.cream,
    textAlign: 'center',
    marginBottom: 6,
  },
  contentSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  
  // Interstitial Button
  interstitialBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  interstitialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  interstitialTextContainer: {
    alignItems: 'flex-start',
  },
  interstitialText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  interstitialSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
  },

  // Rewarded Button
  rewardedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: CINEMA.gold,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  rewardedTextContainer: {
    alignItems: 'flex-start',
  },
  rewardedText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
    letterSpacing: 1,
  },
  rewardedSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: CINEMA.gold,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
  },

  // Premium Button
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: 'rgba(166,93,71,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
  },
  premiumBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.terra,
    letterSpacing: 1,
  },
  premiumBtnSubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 4,
  },

  // Cancel
  cancelBtn: {
    marginTop: 24,
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
});
