/**
 * KORA Landing Page — Premium Single Page
 * 
 * La première impression de KORA.
 * Un joyau sombre qui pulse au rythme caribéen.
 * 
 * - Background animé gradient caribéen
 * - Fade-in progressif du titre mot par mot
 * - Parallaxe au scroll
 * - Carousel automatique des œuvres
 * - Globe KORA en arrière-plan
 * - CTA avec pulse subtil
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, TYPOGRAPHY } from '../src/theme';
import { PlayIcon } from '../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// FEATURED WORKS DATA
// ══════════════════════════════════════════════════════════════════════════════

const FEATURED_WORKS = [
  {
    id: '1',
    title: 'Racines',
    artist: 'Collectif Caraïbe',
    type: 'Documentaire',
    image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=800',
  },
  {
    id: '2',
    title: 'Lagos Session',
    artist: 'Fela Jr.',
    type: 'Album',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  },
  {
    id: '3',
    title: 'La Traversée',
    artist: 'Marie-Claire',
    type: 'Film',
    image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800',
  },
  {
    id: '4',
    title: 'Zouk Forever',
    artist: "Kassav'",
    type: 'Concert',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
  },
];

// Title words for staggered fade-in
const TITLE_WORDS = ['La', 'culture', 'caribéenne', 'et', 'afro', 'au', 'cœur', 'du', 'monde.'];

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED GRADIENT BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedGradientBackground() {
  const color1 = useRef(new Animated.Value(0)).current;
  const color2 = useRef(new Animated.Value(0)).current;
  const color3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(color1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            Animated.timing(color2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            Animated.timing(color3, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(color1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            Animated.timing(color2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            Animated.timing(color3, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base dark gradient */}
      <LinearGradient
        colors={[COLORS.dark, '#0a0a12', '#0D0D0D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Animated terra glow - top */}
      <Animated.View
        style={[
          styles.gradientOrb,
          {
            top: -100,
            left: -100,
            opacity: color1.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.3] }),
            transform: [{
              scale: color1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] })
            }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(166, 93, 71, 0.4)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      {/* Animated blue glow - bottom right */}
      <Animated.View
        style={[
          styles.gradientOrb,
          {
            bottom: -150,
            right: -150,
            opacity: color2.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] }),
            transform: [{
              scale: color2.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] })
            }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(74, 127, 165, 0.3)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>
      {/* Animated gold accent - center */}
      <Animated.View
        style={[
          styles.gradientOrb,
          {
            top: SH * 0.4,
            right: -200,
            opacity: color3.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(201, 168, 76, 0.25)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WORD BY WORD FADE IN
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedTitle() {
  const wordAnimations = TITLE_WORDS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    // Staggered fade-in: 200ms micro + 100ms delay between words
    const animations = wordAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, animations).start();
  }, []);

  return (
    <View style={styles.titleContainer}>
      {TITLE_WORDS.map((word, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.titleWord,
            {
              opacity: wordAnimations[index],
              transform: [{
                translateY: wordAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {word}{' '}
        </Animated.Text>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTO CAROUSEL
// ══════════════════════════════════════════════════════════════════════════════

function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, change, fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % FEATURED_WORKS.length);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentWork = FEATURED_WORKS[currentIndex];

  return (
    <Animated.View
      style={[
        styles.carouselContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.carouselCard}>
        <Image source={{ uri: currentWork.image }} style={styles.carouselImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.carouselGradient}
        />
        <View style={styles.carouselContent}>
          <Text style={styles.carouselType}>{currentWork.type}</Text>
          <Text style={styles.carouselTitle}>{currentWork.title}</Text>
          <Text style={styles.carouselArtist}>{currentWork.artist}</Text>
        </View>
        <View style={styles.carouselPlayBtn}>
          <PlayIcon size={24} color={COLORS.dark} />
        </View>
      </View>
      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {FEATURED_WORKS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentIndex === i && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PULSING CTA BUTTON
// ══════════════════════════════════════════════════════════════════════════════

function PulsingCTA({ onPress, title, variant = 'primary' }: { onPress: () => void; title: string; variant?: 'primary' | 'secondary' }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (variant === 'primary') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [variant]);

  return (
    <Animated.View style={{ transform: [{ scale: variant === 'primary' ? pulseAnim : 1 }] }}>
      <TouchableOpacity
        style={[styles.ctaButton, variant === 'secondary' && styles.ctaButtonSecondary]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.ctaText, variant === 'secondary' && styles.ctaTextSecondary]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in header after 600ms
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCommencer = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/auth/signup');
  }, [router]);

  const handleConnexion = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    router.push('/auth/login');
  }, [router]);

  // Parallax effects
  const logoTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const carouselTranslateY = scrollY.interpolate({
    inputRange: [0, 400],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <AnimatedGradientBackground />

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: headerOpacity,
                transform: [{ translateY: logoTranslateY }],
              },
            ]}
          >
            <Text style={styles.logo}>KORA</Text>
            <Text style={styles.tagline}>Streaming Culturel Souverain</Text>
          </Animated.View>

          {/* Animated title */}
          <Animated.View style={{ transform: [{ translateY: titleTranslateY }] }}>
            <AnimatedTitle />
          </Animated.View>

          {/* Featured carousel */}
          <Animated.View style={{ transform: [{ translateY: carouselTranslateY }] }}>
            <FeaturedCarousel />
          </Animated.View>

          {/* Value props */}
          <View style={styles.valueProps}>
            <View style={styles.valueProp}>
              <Text style={styles.valuePropIcon}>◆</Text>
              <Text style={styles.valuePropText}>Musique & Films</Text>
            </View>
            <View style={styles.valueProp}>
              <Text style={styles.valuePropIcon}>◆</Text>
              <Text style={styles.valuePropText}>Lives & Exclusivités</Text>
            </View>
            <View style={styles.valueProp}>
              <Text style={styles.valuePropIcon}>◆</Text>
              <Text style={styles.valuePropText}>3,98€/mois</Text>
            </View>
          </View>

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            <PulsingCTA title="Commencer" onPress={handleCommencer} variant="primary" />
            <View style={styles.ctaSpacer} />
            <PulsingCTA title="Se connecter" onPress={handleConnexion} variant="secondary" />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.footerText}>Une plateforme caribéenne et afro-diasporique</Text>
            <Text style={styles.footerCopyright}>© 2024 KORA</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    minHeight: SH,
  },
  // Gradient orbs
  gradientOrb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 56,
    color: COLORS.terra,
    letterSpacing: 12,
  },
  tagline: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    letterSpacing: 3,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  // Title
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  titleWord: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 44,
  },
  // Carousel
  carouselContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  carouselCard: {
    width: SW - 80,
    height: (SW - 80) * 0.6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  carouselType: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.terra,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  carouselTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: 4,
  },
  carouselArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
  carouselPlayBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: COLORS.terra,
    width: 24,
  },
  // Value props
  valueProps: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 50,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valuePropIcon: {
    fontFamily: FONTS.jostMedium,
    fontSize: 8,
    color: COLORS.terra,
    marginRight: 8,
  },
  valuePropText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.cream,
  },
  // CTAs
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  ctaButton: {
    backgroundColor: COLORS.terra,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  ctaTextSecondary: {
    color: COLORS.gray,
  },
  ctaSpacer: {
    height: 16,
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  footerCopyright: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
});
