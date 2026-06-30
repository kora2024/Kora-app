/**
 * KORA Paywall — Premium 3,98€/mois
 * 
 * Expérience premium Apple-style
 * Stripe integration ready
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import { BackIcon } from '../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Price formatted
const PRICE = 3.98;
const PRICE_LABEL = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
}).format(PRICE);

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="10" fill={COLORS.terra} />
      <Path d="M6 10L9 13L14 7" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function CrownIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M8 36H40V40H8V36ZM8 16L16 24L24 12L32 24L40 16V36H8V16Z"
        fill={COLORS.terra}
      />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURES LIST
// ══════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  'Streaming illimité audio & vidéo',
  'Qualité audio FLAC / Hi-Res',
  'Téléchargement hors-ligne',
  'Contenu exclusif créateurs',
  'Lives et avant-premières',
  'Zéro publicité',
  'Support prioritaire',
  'Certification FREK-ID',
];

function FeatureItem({ text, delay }: { text: string; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.featureItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <CheckIcon size={18} />
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAYWALL SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSubscribe = useCallback(async (planType: 'premium' | 'family' = 'premium') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    setIsLoading(true);
    setError(null);

    try {
      // Get token from storage
      const token = await AsyncStorage.getItem('kora_token');
      if (!token) {
        setError('Veuillez vous connecter');
        router.push('/auth/login');
        setIsLoading(false);
        return;
      }

      // Create checkout session with auth token and plan type
      const response = await fetch(`${API_URL}/api/subscriptions/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_type: planType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la création de la session');
      }

      const { checkoutUrl } = await response.json();

      // Open Stripe Checkout
      if (Platform.OS === 'web') {
        (window as any).location.href = checkoutUrl;
      } else {
        await WebBrowser.openBrowserAsync(checkoutUrl);
        // Check subscription status after returning
        const statusResponse = await fetch(`${API_URL}/api/subscriptions/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const status = await statusResponse.json();
        if (status.active) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          router.replace('/home');
        }
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRestore = useCallback(async () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    // TODO: Implement restore purchases
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.dark, '#0a0a12', '#0d0d0d']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Glow effect */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={['transparent', 'rgba(166,93,71,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <BackIcon size={24} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.restoreText}>Restaurer</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Crown icon */}
          <View style={styles.iconContainer}>
            <CrownIcon size={64} />
          </View>

          {/* Title */}
          <Text style={styles.title}>KORA Premium</Text>
          <Text style={styles.subtitle}>L'expérience culturelle ultime</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{PRICE_LABEL}</Text>
            <Text style={styles.priceFrequency}>/mois</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feature, i) => (
              <FeatureItem key={i} text={feature} delay={300 + i * 80} />
            ))}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Subscribe button */}
          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.terra, '#8B4D3B']}
              style={styles.subscribeBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.cream} />
              ) : (
                <Text style={styles.subscribeBtnText}>S'abonner maintenant</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            Renouvellement automatique. Annulation possible à tout moment.
            En continuant, vous acceptez nos{' '}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  restoreText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(166,93,71,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 24,
    marginBottom: 32,
  },
  price: {
    fontFamily: FONTS.playfairBold,
    fontSize: 48,
    color: COLORS.terra,
  },
  priceFrequency: {
    fontFamily: FONTS.jostLight,
    fontSize: 18,
    color: COLORS.gray,
    marginLeft: 4,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  featureText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: COLORS.cream,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  errorText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
  },
  subscribeBtn: {
    alignSelf: 'stretch',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
  },
  subscribeBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 17,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  terms: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.terra,
    textDecorationLine: 'underline',
  },
});
