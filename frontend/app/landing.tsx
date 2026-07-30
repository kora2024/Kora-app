/**
 * KORA Landing — CVLN Motion Immersive Experience
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Phase A — Sprint 1.5 Experience Foundation
 * 
 * Sections :
 * 1. HERO — Plein écran cinématique "LA CULTURE EN MOUVEMENT"
 * 2. STORY — Scroll horizontal storytelling (Pourquoi KORA existe)
 * 3. TERRITORIES — Présentation des territoires culturels
 * 4. FEED PREVIEW — Aperçu de la recommandation culturelle
 * 5. CTA — Appel à l'action "Commencer"
 * 
 * Ce composant est la première implémentation du CVLN Motion System,
 * servant de template pour tout l'écosystème CVLN.
 * 
 * @author CVLN Group
 * @version 2.0.0 — Horizon 2055
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import {
  AnimatedTypography,
  HorizontalStoryScroll,
  ParticleSystem,
  GradientPulse,
  ScrollReveal,
  TerritoryCard,
  MOTION,
} from '../src/design-system/CVLNMotion';

const { width: SW, height: SH } = Dimensions.get('window');

// Platform-aware native driver flag
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — CVLN Motion Standard
// ═══════════════════════════════════════════════════════════════════════════════

const CVLN = {
  // Core palette
  void: '#0A0A0F',
  surface: '#1A1A24',
  gold: '#C9A84C',
  goldLight: '#D4B55A',
  terra: '#A65D47',
  purple: '#6B4EE6',
  cream: '#FAF9F6',
  
  // Semantic
  textPrimary: '#FAF9F6',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// STORY SLIDES DATA
// ═══════════════════════════════════════════════════════════════════════════════

const STORY_SLIDES = [
  {
    id: 'story-1',
    title: 'POURQUOI KORA ?',
    subtitle: 'UNE VISION',
    description: 'Parce que la culture afro-diasporique mérite sa propre maison. Pas un tiroir, pas une catégorie. Une maison.',
    gradient: ['#0A0A0F', '#1A1A24'],
  },
  {
    id: 'story-2',
    title: 'AU-DELÀ DU SON',
    subtitle: 'BEYOND SOUND',
    description: 'KORA n\'est pas un énième service de streaming. C\'est un écosystème culturel vivant où chaque écoute nourrit les créateurs.',
    gradient: ['#0A0A0F', '#2A1A34'],
  },
  {
    id: 'story-3',
    title: 'FREK-ID',
    subtitle: 'IDENTITÉ SOUVERAINE',
    description: 'Votre empreinte culturelle unique. Vos territoires, vos genres, vos créateurs favoris — tout en un seul ID.',
    gradient: ['#0A0A0F', '#1A2A24'],
  },
  {
    id: 'story-4',
    title: 'LA VALEUR CULTURELLE',
    subtitle: 'CVE ENGINE',
    description: 'Chaque stream génère de la valeur. Cette valeur retourne aux créateurs, pas aux algorithmes sans âme.',
    gradient: ['#0A0A0F', '#3A2A1A'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TERRITORIES DATA
// ═══════════════════════════════════════════════════════════════════════════════

const TERRITORIES = [
  { code: 'MQ', name: 'Martinique', genres: ['Zouk', 'Dancehall', 'Biguine'] },
  { code: 'SN', name: 'Sénégal', genres: ['Mbalax', 'Afro-Manding', 'Hip-Hop'] },
  { code: 'HT', name: 'Haïti', genres: ['Kompa', 'Rasin', 'Twoubadou'] },
  { code: 'NG', name: 'Nigeria', genres: ['Afrobeats', 'Highlife', 'Jùjú'] },
  { code: 'JM', name: 'Jamaïque', genres: ['Reggae', 'Dancehall', 'Dub'] },
  { code: 'CD', name: 'Congo', genres: ['Rumba', 'Ndombolo', 'Soukouss'] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS — CVLN Standard
// ═══════════════════════════════════════════════════════════════════════════════

const KoraLogoIcon = memo(({ size = 48, color = CVLN.gold }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="20" stroke={color} strokeWidth="1.5" opacity={0.3} />
    <Circle cx="24" cy="24" r="12" stroke={color} strokeWidth="1.5" opacity={0.5} />
    <Circle cx="24" cy="24" r="4" fill={color} />
    {/* Orbits */}
    <Circle cx="24" cy="8" r="2" fill={color} opacity={0.6} />
    <Circle cx="24" cy="40" r="2" fill={color} opacity={0.6} />
    <Circle cx="8" cy="24" r="2" fill={color} opacity={0.6} />
    <Circle cx="40" cy="24" r="2" fill={color} opacity={0.6} />
  </Svg>
));

const PlayIcon = memo(({ size = 24, color = CVLN.cream }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5v14l11-7z" />
  </Svg>
));

const ChevronDownIcon = memo(({ size = 24, color = CVLN.cream }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
));

const GlobeIcon = memo(({ size = 24, color = CVLN.gold }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — HERO (Full Screen Cinematic)
// ═══════════════════════════════════════════════════════════════════════════════

const HeroSection = memo(({ onStart, onScroll, scrollY, screenWidth, screenHeight }: { 
  onStart: () => void; 
  onScroll: () => void;
  scrollY: Animated.Value;
  screenWidth: number;
  screenHeight: number;
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;  // Start visible
  const slideAnim = useRef(new Animated.Value(0)).current;  // Start at final position
  const logoScale = useRef(new Animated.Value(1)).current;  // Start at final scale
  const ctaOpacity = useRef(new Animated.Value(1)).current;  // Start visible

  useEffect(() => {
    // On web, animations with useNativeDriver: false in complex sequences
    // can be problematic, so we simplify by starting with visible content
    // and only running subtle enhancement animations
    if (Platform.OS !== 'web') {
      // Reset for native platforms
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      logoScale.setValue(0.8);
      ctaOpacity.setValue(0);
      
      // Sequence d'entrée cinématique
      Animated.sequence([
        // 1. Logo apparaît
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            ...MOTION.spring.bouncy,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        // 2. Titre et sous-titre
        Animated.stagger(150, [
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: MOTION.duration.expressive,
              easing: MOTION.easing.easeOut,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: MOTION.duration.expressive,
              easing: MOTION.easing.zouk,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
          // 3. CTA apparaît
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: MOTION.duration.standard,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]).start();
    }
  }, []);

  // Parallax effect on scroll - only on native platforms
  // On web, these interpolations can cause issues with initial render
  const heroOpacity = Platform.OS === 'web' 
    ? 1 
    : scrollY.interpolate({
        inputRange: [0, screenHeight * 0.5],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });

  const heroScale = Platform.OS === 'web'
    ? 1
    : scrollY.interpolate({
        inputRange: [-100, 0, screenHeight * 0.5],
        outputRange: [1.1, 1, 0.95],
        extrapolate: 'clamp',
      });

  return (
    <Animated.View 
      style={[
        styles.heroContainer,
        { height: screenHeight, width: screenWidth },
        {
          opacity: heroOpacity,
          transform: typeof heroScale === 'number' ? [] : [{ scale: heroScale }],
        }
      ]}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={[CVLN.void, '#0D0D12', CVLN.void]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Particles */}
      <ParticleSystem 
        count={15} 
        colors={[CVLN.gold, CVLN.terra, CVLN.purple]} 
        speed="slow"
      />

      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Content */}
      <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
        {/* Logo */}
        <Animated.View style={[styles.heroLogo, { transform: [{ scale: logoScale }] }]}>
          <KoraLogoIcon size={64} />
          <Text style={styles.heroLogoText}>KORA</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[
          styles.heroTagline,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          <Text style={styles.heroTaglineSmall}>BEYOND SOUND. BEYOND TIME.</Text>
        </Animated.View>

        {/* Main Headline */}
        <Animated.View style={[
          styles.heroHeadlineContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          <Text style={styles.heroHeadline}>LA CULTURE</Text>
          <Text style={styles.heroHeadlineAccent}>EN MOUVEMENT</Text>
        </Animated.View>

        {/* Subheadline */}
        <Animated.View style={[styles.heroSubheadlineContainer, { opacity: fadeAnim }]}>
          <Text style={styles.heroSubheadline}>
            Streaming afro-diasporique.{'\n'}
            Musique • Films • Podcasts • Live
          </Text>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View style={[styles.heroCTAContainer, { opacity: ctaOpacity }]}>
          <GradientPulse style={styles.heroPrimaryCTAWrapper}>
            <TouchableOpacity 
              style={styles.heroPrimaryCTA} 
              onPress={onStart}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[CVLN.gold, CVLN.goldLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroPrimaryCTAGradient}
              >
                <PlayIcon size={18} color={CVLN.void} />
                <Text style={styles.heroPrimaryCTAText}>COMMENCER</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GradientPulse>

          <TouchableOpacity style={styles.heroSecondaryCTA} activeOpacity={0.8}>
            <Text style={styles.heroSecondaryCTAText}>EN SAVOIR PLUS</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Pricing Tag */}
        <Animated.View style={[styles.pricingTag, { opacity: ctaOpacity }]}>
          <Text style={styles.pricingTagText}>
            GRATUIT AVEC PUBS • PREMIUM À 3,98€/MOIS
          </Text>
        </Animated.View>
      </View>

      {/* Scroll Indicator */}
      <TouchableOpacity style={styles.scrollIndicator} onPress={onScroll} activeOpacity={0.7}>
        <Animated.View style={[
          styles.scrollIndicatorInner,
          {
            opacity: ctaOpacity,
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 20],
                extrapolate: 'clamp',
              })
            }],
          }
        ]}>
          <Text style={styles.scrollIndicatorText}>DÉCOUVRIR</Text>
          <ChevronDownIcon size={20} color={CVLN.textMuted} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — STORY (Horizontal Scroll Storytelling)
// ═══════════════════════════════════════════════════════════════════════════════

const StorySection = memo(({ scrollY }: { scrollY: Animated.Value }) => {
  return (
    <ScrollReveal scrollY={scrollY} triggerOffset={SH * 0.7} animation="fadeUp">
      <View style={styles.storySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>NOTRE HISTOIRE</Text>
          <Text style={styles.sectionTitle}>Pourquoi KORA existe</Text>
        </View>

        <HorizontalStoryScroll
          slides={STORY_SLIDES}
          height={SH * 0.45}
        />
      </View>
    </ScrollReveal>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — TERRITORIES (Globe & Cultural Regions)
// ═══════════════════════════════════════════════════════════════════════════════

const TerritoriesSection = memo(({ scrollY }: { scrollY: Animated.Value }) => {
  return (
    <ScrollReveal scrollY={scrollY} triggerOffset={SH * 1.4} animation="fadeUp">
      <View style={styles.territoriesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <GlobeIcon size={20} />
            <Text style={[styles.sectionLabel, { marginLeft: 8 }]}>TERRITOIRES</Text>
          </View>
          <Text style={styles.sectionTitle}>500+ cultures.{'\n'}Un seul écosystème.</Text>
          <Text style={styles.sectionDescription}>
            Du Zouk martiniquais au Mbalax sénégalais, de la Rumba congolaise au Reggae jamaïcain — 
            KORA célèbre toute la richesse de l'afro-diaspora.
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.territoriesScroll}
        >
          {TERRITORIES.map((territory, index) => (
            <TerritoryCard
              key={territory.code}
              code={territory.code}
              name={territory.name}
              genres={territory.genres}
              index={index}
            />
          ))}
        </ScrollView>
      </View>
    </ScrollReveal>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — FEED PREVIEW (Cultural Recommendation)
// ═══════════════════════════════════════════════════════════════════════════════

const FeedPreviewSection = memo(({ scrollY }: { scrollY: Animated.Value }) => {
  const previewItems = [
    { title: 'C\'est Nous L\'Avenir', artist: 'DJ Sayd', genre: 'Afro-House', plays: '2.4M' },
    { title: 'Soulèvman', artist: 'Kassav\'', genre: 'Zouk', plays: '8.1M' },
    { title: 'Ye', artist: 'Burna Boy', genre: 'Afrobeats', plays: '12M' },
  ];

  return (
    <ScrollReveal scrollY={scrollY} triggerOffset={SH * 2.0} animation="scaleIn">
      <View style={styles.feedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>VOTRE FEED</Text>
          <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
          <Text style={styles.sectionDescription}>
            Basé sur vos territoires et préférences culturelles
          </Text>
        </View>

        <View style={styles.feedPreview}>
          {previewItems.map((item, index) => (
            <View key={index} style={styles.feedItem}>
              <View style={styles.feedItemArt}>
                <LinearGradient
                  colors={[CVLN.purple, CVLN.terra]}
                  style={StyleSheet.absoluteFill}
                />
                <PlayIcon size={24} color={CVLN.cream} />
              </View>
              <View style={styles.feedItemInfo}>
                <Text style={styles.feedItemTitle}>{item.title}</Text>
                <Text style={styles.feedItemArtist}>{item.artist}</Text>
                <View style={styles.feedItemMeta}>
                  <Text style={styles.feedItemGenre}>{item.genre}</Text>
                  <Text style={styles.feedItemPlays}>{item.plays} écoutes</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollReveal>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — FINAL CTA
// ═══════════════════════════════════════════════════════════════════════════════

const FinalCTASection = memo(({ onStart, scrollY }: { onStart: () => void; scrollY: Animated.Value }) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollReveal scrollY={scrollY} triggerOffset={SH * 2.5} animation="fadeUp">
      <View style={[styles.finalCTASection, { paddingBottom: insets.bottom + 40 }]}>
        <LinearGradient
          colors={['transparent', CVLN.void]}
          style={styles.finalCTAGradient}
        />

        <View style={styles.finalCTAContent}>
          <Text style={styles.finalCTATitle}>PRÊT À PLONGER ?</Text>
          <Text style={styles.finalCTASubtitle}>
            Rejoignez la première plateforme culturelle{'\n'}conçue par et pour l'afro-diaspora.
          </Text>

          <TouchableOpacity 
            style={styles.finalCTAButton} 
            onPress={onStart}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[CVLN.gold, CVLN.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finalCTAButtonGradient}
            >
              <Text style={styles.finalCTAButtonText}>CRÉER MON FREK-ID</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <KoraLogoIcon size={32} />
            <Text style={styles.footerLogoText}>KORA</Text>
          </View>
          <Text style={styles.footerTagline}>BEYOND SOUND. BEYOND TIME.</Text>
          <Text style={styles.footerCopyright}>© 2024 CVLN Group. Tous droits réservés.</Text>
        </View>
      </View>
    </ScrollReveal>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Use dynamic window dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const hapticFeedback = useCallback((style = Haptics.ImpactFeedbackStyle.Medium) => {
    try { Haptics.impactAsync(style); } catch {}
  }, []);

  const handleStart = useCallback(() => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/auth/register');
  }, [router, hapticFeedback]);

  const handleScrollDown = useCallback(() => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    scrollRef.current?.scrollTo({ y: screenHeight, animated: true });
  }, [hapticFeedback, screenHeight]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: Platform.OS !== 'web' }
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[CVLN.void, '#0D0D12', CVLN.void]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ minHeight: screenHeight * 4 }}
      >
        {/* Section 1: Hero */}
        <HeroSection 
          onStart={handleStart} 
          onScroll={handleScrollDown}
          scrollY={scrollY}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />

        {/* Section 2: Story */}
        <StorySection scrollY={scrollY} />

        {/* Section 3: Territories */}
        <TerritoriesSection scrollY={scrollY} />

        {/* Section 4: Feed Preview */}
        <FeedPreviewSection scrollY={scrollY} />

        {/* Section 5: Final CTA */}
        <FinalCTASection onStart={handleStart} scrollY={scrollY} />
      </Animated.ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CVLN.void,
  },
  scrollView: {
    flex: 1,
  },

  // ─── Hero Section ──────────────────────────────────────────────────────────────
  heroContainer: {
    height: SH,
    width: SW,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: SH * 0.2,
    left: SW * 0.1,
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: CVLN.gold,
    opacity: 0.03,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroLogo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroLogoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CVLN.gold,
    letterSpacing: 8,
    marginTop: 12,
  },
  heroTagline: {
    marginBottom: 40,
  },
  heroTaglineSmall: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: CVLN.textMuted,
    letterSpacing: 4,
  },
  heroHeadlineContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroHeadline: {
    fontFamily: FONTS.playfairBold,
    fontSize: SW > 600 ? 64 : 36,
    color: CVLN.cream,
    lineHeight: SW > 600 ? 72 : 44,
    textAlign: 'center',
  },
  heroHeadlineAccent: {
    fontFamily: FONTS.playfairBold,
    fontSize: SW > 600 ? 64 : 36,
    color: CVLN.gold,
    lineHeight: SW > 600 ? 72 : 44,
    textAlign: 'center',
  },
  heroSubheadlineContainer: {
    marginBottom: 48,
  },
  heroSubheadline: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: CVLN.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  heroCTAContainer: {
    flexDirection: SW > 500 ? 'row' : 'column',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  heroPrimaryCTAWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroPrimaryCTA: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroPrimaryCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  heroPrimaryCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CVLN.void,
    letterSpacing: 2,
  },
  heroSecondaryCTA: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  heroSecondaryCTAText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: CVLN.textSecondary,
    letterSpacing: 1,
  },
  pricingTag: {
    marginBottom: 40,
  },
  pricingTagText: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: CVLN.textMuted,
    letterSpacing: 1.5,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollIndicatorInner: {
    alignItems: 'center',
  },
  scrollIndicatorText: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: CVLN.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },

  // ─── Section Common ────────────────────────────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CVLN.gold,
    letterSpacing: 3,
  },
  sectionTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: CVLN.cream,
    lineHeight: 40,
    marginBottom: 12,
  },
  sectionDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: CVLN.textSecondary,
    lineHeight: 24,
    maxWidth: 400,
  },

  // ─── Story Section ─────────────────────────────────────────────────────────────
  storySection: {
    paddingTop: 80,
    paddingBottom: 60,
  },

  // ─── Territories Section ───────────────────────────────────────────────────────
  territoriesSection: {
    paddingTop: 60,
    paddingBottom: 60,
  },
  territoriesScroll: {
    paddingLeft: 24,
    paddingRight: 24,
  },

  // ─── Feed Section ──────────────────────────────────────────────────────────────
  feedSection: {
    paddingTop: 60,
    paddingBottom: 60,
  },
  feedPreview: {
    paddingHorizontal: 24,
    gap: 16,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  feedItemArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  feedItemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  feedItemTitle: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 16,
    color: CVLN.cream,
    marginBottom: 4,
  },
  feedItemArtist: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: CVLN.textSecondary,
    marginBottom: 8,
  },
  feedItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedItemGenre: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CVLN.gold,
    letterSpacing: 1,
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  feedItemPlays: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: CVLN.textMuted,
  },

  // ─── Final CTA Section ─────────────────────────────────────────────────────────
  finalCTASection: {
    paddingTop: 80,
    alignItems: 'center',
    position: 'relative',
  },
  finalCTAGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  finalCTAContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 80,
  },
  finalCTATitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CVLN.cream,
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCTASubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: CVLN.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  finalCTAButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  finalCTAButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  finalCTAButtonText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CVLN.void,
    letterSpacing: 2,
  },
  loginLink: {
    padding: 12,
  },
  loginLinkText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: CVLN.textSecondary,
    textDecorationLine: 'underline',
  },

  // ─── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLogoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: CVLN.gold,
    letterSpacing: 4,
    marginLeft: 8,
  },
  footerTagline: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: CVLN.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  footerCopyright: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
});
