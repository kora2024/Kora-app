/**
 * CVLN Motion System — La Signature Visuelle de l'Écosystème
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Ce système est conçu pour être réutilisé par :
 * - KORA (Streaming culturel)
 * - Laurentia (...)
 * - LabelOS (...)
 * - FREKCORE (...)
 * - CVLN Academy (...)
 * 
 * Principes :
 * 1. Performance first (useNativeDriver: true)
 * 2. Animations culturellement signifiantes (easings from genres)
 * 3. Composants modulaires et réutilisables
 * 4. Compatibilité cross-platform (iOS, Android, Web)
 * 
 * @author CVLN Group
 * @version 1.0.0 — Horizon 2055
 */

import React, { useRef, useEffect, useState, useCallback, memo, ReactNode } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';

// Platform-aware native driver flag
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
import { LinearGradient } from 'expo-linear-gradient';
import { KORA_TOKENS, getCulturalMotion } from './tokens';
import { COLORS, FONTS } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MotionConfig {
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION CONSTANTS — CVLN Standard Timings
// ═══════════════════════════════════════════════════════════════════════════════

export const MOTION = {
  // Durées
  duration: {
    micro: 100,
    fast: 150,
    standard: 250,
    slow: 400,
    expressive: 500,
    dramatic: 800,
    cinematic: 1200,
  },
  
  // Easings CVLN (from W3C tokens)
  easing: {
    // Standards
    linear: Easing.linear,
    easeIn: Easing.in(Easing.cubic),
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    
    // Cultural Easings
    zouk: Easing.bezier(0.4, 0.0, 0.2, 1),          // Smooth, flowing
    afrobeats: Easing.bezier(0.34, 1.56, 0.64, 1),  // Bouncy, energetic
    reggae: Easing.bezier(0.25, 0.1, 0.25, 1),      // Laid-back
    soca: Easing.bezier(0.68, -0.55, 0.265, 1.55),  // High-energy carnival
    kompa: Easing.bezier(0.33, 0, 0.67, 1),         // Sensual, steady
  },
  
  // Springs
  spring: {
    gentle: { stiffness: 30, damping: 15, mass: 1.2 },
    standard: { stiffness: 100, damping: 15, mass: 1 },
    bouncy: { stiffness: 180, damping: 12, mass: 0.8 },
    snappy: { stiffness: 250, damping: 20, mass: 0.7 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED TYPOGRAPHY — Texte animé signature CVLN
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedTypographyProps {
  children: string;
  style?: TextStyle;
  animation?: 'fadeUp' | 'fadeIn' | 'typewriter' | 'glitch' | 'wave';
  delay?: number;
  duration?: number;
  staggerDelay?: number;
}

export const AnimatedTypography = memo(({
  children,
  style,
  animation = 'fadeUp',
  delay = 0,
  duration = 500,
  staggerDelay = 30,
}: AnimatedTypographyProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(animation === 'fadeUp' ? 30 : 0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: MOTION.easing.easeOut,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: MOTION.easing.zouk,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  if (animation === 'wave') {
    // Animate each character with stagger
    const characters = children.split('');
    return (
      <View style={styles.waveContainer}>
        {characters.map((char, index) => (
          <WaveCharacter key={index} char={char} index={index} style={style} delay={delay} />
        ))}
      </View>
    );
  }

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
});

// Wave animation for individual characters
const WaveCharacter = memo(({ char, index, style, delay = 0 }: { char: string; index: number; style?: TextStyle; delay?: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -8,
            duration: 300,
            delay: delay + index * 50,
            easing: MOTION.easing.easeOut,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            easing: MOTION.easing.easeIn,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      ).start();
    };
    
    const timeout = setTimeout(startAnimation, index * 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.Text style={[style, { transform: [{ translateY }] }]}>
      {char === ' ' ? '\u00A0' : char}
    </Animated.Text>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// HORIZONTAL SCROLL STORYTELLING — Scroll cinématique horizontal
// ═══════════════════════════════════════════════════════════════════════════════

interface StorySlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  gradient?: string[];
  accentColor?: string;
}

interface HorizontalStoryScrollProps {
  slides: StorySlide[];
  height?: number;
  onSlideChange?: (index: number) => void;
  renderSlide?: (slide: StorySlide, index: number, isActive: boolean) => ReactNode;
}

export const HorizontalStoryScroll = memo(({
  slides,
  height = SCREEN_HEIGHT * 0.6,
  onSlideChange,
  renderSlide,
}: HorizontalStoryScrollProps) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: USE_NATIVE_DRIVER }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
    onSlideChange?.(index);
  };

  return (
    <View style={[styles.horizontalScrollContainer, { height }]}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {slides.map((slide, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });

          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [50, 0, -50],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={slide.id}
              style={[
                styles.storySlide,
                { width: SCREEN_WIDTH, height },
                {
                  opacity,
                  transform: [{ scale }, { translateX }],
                },
              ]}
            >
              {renderSlide ? (
                renderSlide(slide, index, index === activeIndex)
              ) : (
                <DefaultStorySlide slide={slide} />
              )}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
});

const DefaultStorySlide = memo(({ slide }: { slide: StorySlide }) => (
  <LinearGradient
    colors={slide.gradient || ['#0A0A0F', '#1A1A24']}
    style={styles.defaultSlide}
  >
    <AnimatedTypography
      style={styles.slideTitle}
      animation="fadeUp"
      delay={200}
    >
      {slide.title}
    </AnimatedTypography>
    {slide.subtitle && (
      <AnimatedTypography
        style={styles.slideSubtitle}
        animation="fadeUp"
        delay={400}
      >
        {slide.subtitle}
      </AnimatedTypography>
    )}
    {slide.description && (
      <AnimatedTypography
        style={styles.slideDescription}
        animation="fadeUp"
        delay={600}
      >
        {slide.description}
      </AnimatedTypography>
    )}
  </LinearGradient>
));

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT PARTICLE SYSTEM — Particules ambiantes CVLN
// ═══════════════════════════════════════════════════════════════════════════════

interface ParticleSystemProps {
  count?: number;
  colors?: string[];
  speed?: 'slow' | 'medium' | 'fast';
  direction?: 'up' | 'down' | 'random';
}

export const ParticleSystem = memo(({
  count = 12,
  colors = ['#C9A84C', '#A65D47', '#6B4EE6'],
  speed = 'medium',
  direction = 'up',
}: ParticleSystemProps) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(direction === 'up' ? SCREEN_HEIGHT + 50 : -50),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      size: 2 + Math.random() * 4,
      color: colors[i % colors.length],
    }))
  ).current;

  const speedMultiplier = speed === 'slow' ? 1.5 : speed === 'fast' ? 0.6 : 1;

  useEffect(() => {
    particles.forEach((particle, i) => {
      const animateParticle = () => {
        const duration = (6000 + Math.random() * 4000) * speedMultiplier;
        const targetY = direction === 'up' ? -50 : SCREEN_HEIGHT + 50;

        // Reset position
        particle.y.setValue(direction === 'up' ? SCREEN_HEIGHT + 50 : -50);
        particle.x.setValue(Math.random() * SCREEN_WIDTH);
        particle.opacity.setValue(0);

        Animated.parallel([
          // Move
          Animated.timing(particle.y, {
            toValue: targetY,
            duration,
            easing: Easing.linear,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          // Fade in then out
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: duration * 0.2,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: duration * 0.5,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.3,
              useNativeDriver: USE_NATIVE_DRIVER,
            }),
          ]),
        ]).start(() => {
          animateParticle(); // Loop
        });
      };

      // Stagger start
      setTimeout(animateParticle, i * 400);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT PULSE — Effet de pulsation pour les CTAs
// ═══════════════════════════════════════════════════════════════════════════════

interface GradientPulseProps {
  children: ReactNode;
  colors?: string[];
  style?: ViewStyle;
  pulseIntensity?: number;
}

export const GradientPulse = memo(({
  children,
  colors = ['#C9A84C', '#D4B55A'],
  style,
  pulseIntensity = 0.15,
}: GradientPulseProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          easing: MOTION.easing.easeInOut,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: MOTION.easing.easeInOut,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();

    // Glow opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: pulseIntensity,
          duration: 1200,
          easing: MOTION.easing.easeInOut,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(glowAnim, {
          toValue: pulseIntensity * 0.5,
          duration: 1200,
          easing: MOTION.easing.easeInOut,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>
      {/* Glow layer */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.glowLayer,
          { opacity: glowAnim, backgroundColor: colors[0] },
        ]}
      />
      {children}
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL-REVEAL SECTION — Section qui se révèle au scroll
// ═══════════════════════════════════════════════════════════════════════════════

interface ScrollRevealProps {
  children: ReactNode;
  scrollY: Animated.Value;
  triggerOffset: number;
  style?: ViewStyle;
  animation?: 'fadeUp' | 'scaleIn' | 'slideLeft' | 'slideRight';
}

export const ScrollReveal = memo(({
  children,
  scrollY,
  triggerOffset,
  style,
  animation = 'fadeUp',
}: ScrollRevealProps) => {
  const opacity = scrollY.interpolate({
    inputRange: [triggerOffset - 200, triggerOffset, triggerOffset + 100],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const getTransform = () => {
    switch (animation) {
      case 'fadeUp':
        return [{
          translateY: scrollY.interpolate({
            inputRange: [triggerOffset - 200, triggerOffset],
            outputRange: [50, 0],
            extrapolate: 'clamp',
          }),
        }];
      case 'scaleIn':
        return [{
          scale: scrollY.interpolate({
            inputRange: [triggerOffset - 200, triggerOffset],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
          }),
        }];
      case 'slideLeft':
        return [{
          translateX: scrollY.interpolate({
            inputRange: [triggerOffset - 200, triggerOffset],
            outputRange: [100, 0],
            extrapolate: 'clamp',
          }),
        }];
      case 'slideRight':
        return [{
          translateX: scrollY.interpolate({
            inputRange: [triggerOffset - 200, triggerOffset],
            outputRange: [-100, 0],
            extrapolate: 'clamp',
          }),
        }];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: getTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TERRITORY CARD — Carte de territoire avec animation culturelle
// ═══════════════════════════════════════════════════════════════════════════════

interface TerritoryCardProps {
  code: string;
  name: string;
  genres: string[];
  image?: string;
  onPress?: () => void;
  index?: number;
}

export const TerritoryCard = memo(({
  code,
  name,
  genres,
  image,
  onPress,
  index = 0,
}: TerritoryCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        easing: MOTION.easing.easeOut,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...MOTION.spring.bouncy,
        delay: index * 100,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, []);

  // Get cultural motion for this territory
  const culturalMotion = getCulturalMotion(code);

  return (
    <Animated.View
      style={[
        styles.territoryCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(26,26,36,0.9)', 'rgba(10,10,15,0.95)']}
        style={styles.territoryCardGradient}
      >
        <Text style={styles.territoryCode}>{code}</Text>
        <Text style={styles.territoryName}>{name}</Text>
        <View style={styles.territoryGenres}>
          {genres.slice(0, 3).map((genre, i) => (
            <View key={i} style={styles.genreTag}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MORPHING GRADIENT BACKGROUND — Fond dégradé animé
// ═══════════════════════════════════════════════════════════════════════════════

interface MorphingGradientProps {
  colors?: string[][];
  duration?: number;
}

export const MorphingGradient = memo(({
  colors = [
    ['#0A0A0F', '#1A1A24', '#0A0A0F'],
    ['#0A0A0F', '#2A1A34', '#0A0A0F'],
    ['#0A0A0F', '#1A2434', '#0A0A0F'],
  ],
  duration = 8000,
}: MorphingGradientProps) => {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, duration);

    return () => clearInterval(interval);
  }, [colors.length, duration]);

  return (
    <LinearGradient
      colors={colors[colorIndex]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  waveContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  horizontalScrollContainer: {
    width: '100%',
  },
  storySlide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  defaultSlide: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  slideTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: '#FAF9F6',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: '#C9A84C',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  slideDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  paginationDot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9A84C',
  },
  particle: {
    position: 'absolute',
  },
  glowLayer: {
    borderRadius: 8,
    transform: [{ scale: 1.1 }],
  },
  territoryCard: {
    width: 140,
    height: 180,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  territoryCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  territoryCode: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  territoryName: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: '#FAF9F6',
    marginBottom: 12,
  },
  territoryGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  genreText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 9,
    color: '#C9A84C',
    letterSpacing: 0.5,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  MOTION,
  AnimatedTypography,
  HorizontalStoryScroll,
  ParticleSystem,
  GradientPulse,
  ScrollReveal,
  TerritoryCard,
  MorphingGradient,
};
