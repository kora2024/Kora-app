/**
 * KORA Home — Expérience Ultra Premium Diasporique
 * 
 * NIVEAU: Apple Music × Netflix × Afrofuturisme
 * 
 * Animations:
 * - Entrées staggerées avec spring physics
 * - Parallaxe multi-couches au scroll
 * - Micro-interactions haptiques
 * - Globe animé avec particules
 * - Cards avec scale + glow au press
 * - Hero cinématique avec ken burns effect
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  FlatList,
  Animated,
  ImageBackground,
  StatusBar,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import { PlayIcon, SearchIcon, PlusIcon } from '../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION CONSTANTS — PREMIUM TIMING
// ══════════════════════════════════════════════════════════════════════════════

const TIMING = {
  micro: 120,
  fast: 200,
  normal: 320,
  slow: 480,
  cinematic: 600,
};

const SPRING = {
  gentle: { tension: 100, friction: 12 },
  snappy: { tension: 180, friction: 14 },
  bouncy: { tension: 200, friction: 8 },
};

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED CARD WRAPPER — Premium Press Effect
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedCard({ children, onPress, style, delay = 0 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: TIMING.slow,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        ...SPRING.gentle,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      ...SPRING.snappy,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      ...SPRING.bouncy,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          style,
          {
            opacity,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED GLOBE — Diaspora Pulse
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedGlobe({ selectedTerritory, onSelectTerritory }: { 
  selectedTerritory: string | null; 
  onSelectTerritory: (t: string) => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Rotation lente et continue
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse du globe
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow effect
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

    // Particules flottantes
    particleAnims.forEach((particle, i) => {
      const delay = i * 400;
      const duration = 4000 + Math.random() * 2000;
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: -80 - Math.random() * 40,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: (Math.random() - 0.5) * 100,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.y, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, []);

  const territories = [
    { id: 'caraibe', name: 'Caraïbe', x: 30, y: 45, color: COLORS.terra, size: 12 },
    { id: 'afrique', name: 'Afrique', x: 70, y: 50, color: '#C9A84C', size: 14 },
    { id: 'europe', name: 'Europe', x: 60, y: 30, color: '#4A7FA5', size: 10 },
    { id: 'ameriques', name: 'Amériques', x: 25, y: 55, color: '#7B4B94', size: 11 },
  ];

  const handleTerritoryPress = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onSelectTerritory(id);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.globeContainer}>
      {/* Glow background */}
      <Animated.View style={[styles.globeGlow, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={['transparent', 'rgba(166,93,71,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Floating particles */}
      {particleAnims.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: 75 + (i % 4) * 20,
              bottom: 60,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          <View style={[styles.particleDot, { backgroundColor: i % 2 === 0 ? COLORS.terra : '#C9A84C' }]} />
        </Animated.View>
      ))}

      {/* Globe */}
      <Animated.View style={[styles.globeWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Svg width={160} height={160} viewBox="0 0 160 160">
            <Defs>
              <RadialGradient id="globeGrad2" cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#2d2d3a" />
                <Stop offset="50%" stopColor="#1a1a22" />
                <Stop offset="100%" stopColor="#0d0d0d" />
              </RadialGradient>
              <RadialGradient id="atmosphereGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="70%" stopColor="transparent" />
                <Stop offset="100%" stopColor="rgba(166,93,71,0.2)" />
              </RadialGradient>
            </Defs>
            
            {/* Atmosphere */}
            <Circle cx="80" cy="80" r="78" fill="url(#atmosphereGrad)" />
            
            {/* Globe base */}
            <Circle cx="80" cy="80" r="70" fill="url(#globeGrad2)" />
            
            {/* Grid lines with glow */}
            <Ellipse cx="80" cy="80" rx="70" ry="25" stroke="rgba(166,93,71,0.15)" strokeWidth="0.5" fill="none" />
            <Ellipse cx="80" cy="80" rx="70" ry="50" stroke="rgba(166,93,71,0.1)" strokeWidth="0.5" fill="none" />
            <Path d="M80 10 Q120 80 80 150" stroke="rgba(166,93,71,0.1)" strokeWidth="0.5" fill="none" />
            <Path d="M80 10 Q40 80 80 150" stroke="rgba(166,93,71,0.1)" strokeWidth="0.5" fill="none" />
            
            {/* Connection lines between territories */}
            <Path 
              d="M48 72 Q80 50 112 80" 
              stroke="rgba(166,93,71,0.2)" 
              strokeWidth="1" 
              strokeDasharray="4,4"
              fill="none" 
            />
            <Path 
              d="M40 88 Q60 100 48 72" 
              stroke="rgba(201,168,76,0.2)" 
              strokeWidth="1" 
              strokeDasharray="4,4"
              fill="none" 
            />
          </Svg>
        </Animated.View>

        {/* Territory points - positioned absolutely */}
        {territories.map((t) => {
          const isSelected = selectedTerritory === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.territoryPoint,
                {
                  left: t.x * 1.6 - 15,
                  top: t.y * 1.6 - 15,
                },
              ]}
              onPress={() => handleTerritoryPress(t.id)}
              activeOpacity={0.7}
            >
              {/* Pulse ring when selected */}
              {isSelected && (
                <Animated.View
                  style={[
                    styles.territoryPulse,
                    {
                      borderColor: t.color,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.territoryDot,
                  {
                    backgroundColor: t.color,
                    width: isSelected ? t.size + 4 : t.size,
                    height: isSelected ? t.size + 4 : t.size,
                    borderRadius: (isSelected ? t.size + 4 : t.size) / 2,
                    shadowColor: t.color,
                    shadowOpacity: isSelected ? 0.8 : 0.4,
                    shadowRadius: isSelected ? 12 : 6,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Territory selector chips */}
      <View style={styles.territoryChips}>
        {territories.map((t, index) => {
          const isSelected = selectedTerritory === t.id;
          const chipAnim = useRef(new Animated.Value(0)).current;
          
          useEffect(() => {
            Animated.spring(chipAnim, {
              toValue: 1,
              ...SPRING.gentle,
              delay: index * 80,
              useNativeDriver: true,
            }).start();
          }, []);

          return (
            <Animated.View
              key={t.id}
              style={{
                opacity: chipAnim,
                transform: [{
                  translateY: chipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.territoryChip,
                  isSelected && { 
                    backgroundColor: t.color, 
                    borderColor: t.color,
                    shadowColor: t.color,
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  },
                ]}
                onPress={() => handleTerritoryPress(t.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.chipDot, { backgroundColor: t.color }]} />
                <Text style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive
                ]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO WITH KEN BURNS EFFECT
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedHero({ content, onPlay, insets }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const panAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ken Burns effect - slow zoom and pan
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(panAnim, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(panAnim, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Content fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: TIMING.cinematic,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        ...SPRING.gentle,
        useNativeDriver: true,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        ...SPRING.snappy,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const translateX = panAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateY = panAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.heroSection}>
      <Animated.View
        style={[
          styles.heroImageContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateX },
              { translateY },
            ],
          },
        ]}
      >
        <ImageBackground source={{ uri: content.image }} style={styles.heroImage}>
          <LinearGradient
            colors={[
              'rgba(13,13,13,0.1)',
              'rgba(13,13,13,0.3)',
              'rgba(13,13,13,0.7)',
              COLORS.dark,
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      <Animated.View style={[styles.heroContent, { paddingTop: insets.top + 80, opacity: fadeAnim }]}>
        <Animated.Text
          style={[
            styles.heroSubtitle,
            {
              transform: [{
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {content.subtitle}
        </Animated.Text>
        
        <Animated.Text
          style={[
            styles.heroTitle,
            {
              opacity: titleAnim,
              transform: [{
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          {content.title}
        </Animated.Text>
        
        <Animated.Text
          style={[
            styles.heroDescription,
            {
              opacity: titleAnim,
              transform: [{
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          {content.description}
        </Animated.Text>

        <Animated.View
          style={[
            styles.heroMeta,
            {
              opacity: titleAnim,
            },
          ]}
        >
          <Text style={styles.heroMatch}>{content.match}% Match</Text>
          <View style={styles.heroRating}>
            <Text style={styles.heroRatingText}>HD</Text>
          </View>
          <View style={styles.heroRating}>
            <Text style={styles.heroRatingText}>5.1</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.heroButtons,
            {
              opacity: buttonAnim,
              transform: [{
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.playBtn}
            onPress={onPlay}
            activeOpacity={0.9}
          >
            <PlayIcon size={22} color={COLORS.dark} />
            <Text style={styles.playBtnText}>Lecture</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listBtn} activeOpacity={0.8}>
            <PlusIcon size={20} color={COLORS.cream} />
            <Text style={styles.listBtnText}>Ma liste</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER WITH STAGGER ANIMATION
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedSection({ title, subtitle, action, onAction, children, delay = 0 }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: TIMING.slow,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...SPRING.gentle,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        {action && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PREMIUM CARD COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function ContinueCard({ item, onPress, index }: any) {
  return (
    <AnimatedCard onPress={onPress} style={styles.continueCard} delay={index * 60}>
      <View style={styles.continueImageWrapper}>
        <Image source={{ uri: item.image }} style={styles.continueImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.continuePlayOverlay}>
          <View style={styles.playCircle}>
            <PlayIcon size={18} color={COLORS.dark} />
          </View>
        </View>
        <View style={styles.continueTypeBadge}>
          <Text style={styles.continueTypeText}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.continueProgressBar}>
        <Animated.View style={[styles.continueProgressFill, { width: `${item.progress * 100}%` }]} />
      </View>
      <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.continueRemaining}>{item.remaining}</Text>
    </AnimatedCard>
  );
}

function LiveCard({ item, onPress, index }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <AnimatedCard onPress={onPress} style={styles.liveCard} delay={index * 80}>
      <Image source={{ uri: item.image }} style={styles.liveImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.liveGradient} />
      <View style={styles.liveBadge}>
        <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
        <Text style={styles.liveViewers}>{item.viewers}</Text>
      </View>
      <View style={styles.liveInfo}>
        <Text style={styles.liveTitle}>{item.title}</Text>
        <Text style={styles.liveCreator}>{item.creator} • {item.territory}</Text>
      </View>
    </AnimatedCard>
  );
}

function ContentCard({ item, onPress, index }: any) {
  return (
    <AnimatedCard onPress={onPress} style={styles.contentCard} delay={index * 50}>
      <View style={styles.contentImageWrapper}>
        <Image source={{ uri: item.image }} style={styles.contentImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.contentArtist} numberOfLines={1}>{item.artist}</Text>
        <Text style={styles.contentType}>{item.type}</Text>
      </View>
    </AnimatedCard>
  );
}

function CreatorCard({ item, onPress, index }: any) {
  return (
    <AnimatedCard onPress={onPress} style={styles.creatorCard} delay={index * 70}>
      <Image source={{ uri: item.image }} style={styles.creatorImage} />
      <View style={styles.creatorInfo}>
        <View style={styles.creatorNameRow}>
          <Text style={styles.creatorName}>{item.name}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.creatorRole}>{item.role}</Text>
        <Text style={styles.creatorFollowers}>{item.followers}</Text>
      </View>
      <TouchableOpacity style={styles.followBtn} activeOpacity={0.7}>
        <PlusIcon size={16} color={COLORS.cream} />
      </TouchableOpacity>
    </AnimatedCard>
  );
}

function NebuleuseCard({ item, onPress, index }: any) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <AnimatedCard onPress={onPress} style={styles.nebuleuseCard} delay={index * 100}>
      <Image source={{ uri: item.image }} style={styles.nebuleuseImage} />
      <LinearGradient colors={['transparent', item.color]} style={styles.nebuleuseGradient} />
      <Animated.View
        style={[
          styles.nebuleuseGlow,
          {
            backgroundColor: item.color,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
          },
        ]}
      />
      <View style={styles.nebuleuseInfo}>
        <Text style={styles.nebuleuseTitle}>{item.title}</Text>
        <Text style={styles.nebuleuseDesc}>{item.description}</Text>
      </View>
      <View style={[styles.nebuleusePlayBtn, { backgroundColor: item.color }]}>
        <PlayIcon size={20} color={COLORS.cream} />
      </View>
    </AnimatedCard>
  );
}

function CinemaCard({ item, onPress, index }: any) {
  return (
    <AnimatedCard onPress={onPress} style={styles.cinemaCard} delay={index * 90}>
      <Image source={{ uri: item.image }} style={styles.cinemaImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cinemaGradient} />
      <View style={styles.cinemaPlayOverlay}>
        <View style={styles.cinemaPlayCircle}>
          <PlayIcon size={24} color={COLORS.dark} />
        </View>
      </View>
      <View style={styles.cinemaInfo}>
        <Text style={styles.cinemaTitle}>{item.title}</Text>
        <Text style={styles.cinemaDuration}>{item.duration}</Text>
      </View>
    </AnimatedCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

const HERO_CONTENT = {
  id: 'hero_1',
  title: 'RACINES',
  subtitle: 'SÉRIE DOCUMENTAIRE',
  description: 'Voyage au cœur des diasporas africaines. Une exploration intime de l\'identité et de la mémoire.',
  image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=1200',
  match: 97,
};

const CONTINUE_WATCHING = [
  { id: 'cw1', title: 'Lagos Session', type: 'Album', progress: 0.65, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', remaining: '12 titres' },
  { id: 'cw2', title: 'La Traversée', type: 'Film', progress: 0.45, image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400', remaining: '32 min' },
  { id: 'cw3', title: 'Zouk Classics', type: 'Playlist', progress: 0.30, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', remaining: '24 titres' },
];

const LIVE_NOW = [
  { id: 'l1', title: 'Studio Live', creator: 'Fela Jr.', viewers: '2.4K', territory: 'Lagos', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400' },
  { id: 'l2', title: 'Culture Talk', creator: 'Marie-Claire', viewers: '890', territory: 'Paris', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400' },
];

const TRENDING = {
  caraibe: [
    { id: 'tc1', title: 'Zouk Forever', artist: "Kassav'", type: 'Album', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
    { id: 'tc2', title: 'Créole Dreams', artist: 'Jocelyne Labylle', type: 'Single', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'tc3', title: 'Antilles 2024', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
    { id: 'tc4', title: 'Island Vibes', artist: 'DJ Kora', type: 'Mix', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
  ],
  afrique: [
    { id: 'ta1', title: 'Afrobeats Rising', artist: 'Burna Boy', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'ta2', title: 'Lagos Nights', artist: 'Wizkid', type: 'Single', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
    { id: 'ta3', title: 'Dakar Sound', artist: "Youssou N'Dour", type: 'Album', image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400' },
    { id: 'ta4', title: 'Naija Hits', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  ],
  europe: [
    { id: 'te1', title: 'Diaspora Paris', artist: 'Aya Nakamura', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'te2', title: 'London Afro', artist: 'J Hus', type: 'Single', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
  ],
  ameriques: [
    { id: 'tam1', title: 'Brooklyn Vibes', artist: 'Wyclef Jean', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'tam2', title: 'Miami Bass', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  ],
};

const CREATORS = [
  { id: 'cr1', name: "Kassav'", role: 'Groupe', followers: '2.1M', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', verified: true },
  { id: 'cr2', name: 'Fela Jr.', role: 'Producteur', followers: '890K', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', verified: true },
  { id: 'cr3', name: 'Marie-Claire', role: 'Réalisatrice', followers: '340K', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', verified: false },
];

const NEBULEUSE = [
  { id: 'n1', title: 'Pour toi', description: 'Basé sur tes écoutes', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', color: COLORS.terra },
  { id: 'n2', title: 'Découvertes', description: 'Nouveaux artistes', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', color: '#4A7FA5' },
  { id: 'n3', title: 'Mix du jour', description: 'Sélection quotidienne', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', color: '#C9A84C' },
];

const CINEMA = [
  { id: 'cin1', title: 'Retour aux Sources', duration: '1h 45min', image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=400' },
  { id: 'cin2', title: "L'Or Noir", duration: '52 min', image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400' },
  { id: 'cin3', title: 'Génération Afro', duration: '1h 20min', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function KoraHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedTerritory, setSelectedTerritory] = useState<string>('caraibe');
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handlePlay = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  }, []);

  const handleSearch = useCallback(() => {
    setSearchVisible(!searchVisible);
    try { Haptics.selectionAsync(); } catch {}
  }, [searchVisible]);

  const handleProfile = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    router.push('/settings');
  }, [router]);

  const handleCreate = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/(tabs)/create');
  }, [router]);

  const currentTrending = TRENDING[selectedTerritory as keyof typeof TRENDING] || TRENDING.caraibe;
  const territoryNames: Record<string, string> = {
    caraibe: 'Caraïbe',
    afrique: 'Afrique',
    europe: 'Europe',
    ameriques: 'Amériques',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header Background */}
      <Animated.View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13,13,13,0.7)' }]} />
        </Animated.View>
      </Animated.View>
      
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logoText}>KORA</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleCreate} activeOpacity={0.7}>
            <PlusIcon size={22} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleSearch} activeOpacity={0.7}>
            <SearchIcon size={22} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={handleProfile} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.terra, '#8B4D3B']}
              style={styles.profileGradient}
            >
              <Text style={styles.profileInitial}>K</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={[styles.searchContainer, { top: insets.top + 56 }]}>
          <BlurView intensity={90} style={styles.searchBlur} tint="dark">
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={COLORS.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Artistes, albums, films..."
                placeholderTextColor={COLORS.gray}
                autoFocus
              />
            </View>
          </BlurView>
        </View>
      )}

      {/* Main Scroll */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.terra}
            colors={[COLORS.terra]}
          />
        }
      >
        {/* Hero */}
        <AnimatedHero content={HERO_CONTENT} onPlay={handlePlay} insets={insets} />

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          
          {/* Globe Section */}
          <AnimatedSection title="Explorer par territoire" delay={100}>
            <AnimatedGlobe 
              selectedTerritory={selectedTerritory} 
              onSelectTerritory={setSelectedTerritory} 
            />
          </AnimatedSection>

          {/* Continue */}
          <AnimatedSection title="Reprendre" action="Tout voir" delay={200}>
            <FlatList
              horizontal
              data={CONTINUE_WATCHING}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <ContinueCard item={item} onPress={handlePlay} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Live */}
          <AnimatedSection title="En direct" subtitle={`${LIVE_NOW.length} lives`} action="Tout voir" delay={300}>
            <FlatList
              horizontal
              data={LIVE_NOW}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <LiveCard item={item} onPress={handlePlay} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Trending by Territory */}
          <AnimatedSection 
            title={`Tendances ${territoryNames[selectedTerritory]}`}
            action="Tout voir" 
            delay={400}
          >
            <FlatList
              horizontal
              data={currentTrending}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <ContentCard item={item} onPress={handlePlay} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Nébuleuse */}
          <AnimatedSection title="Nébuleuse" subtitle="Tes recommandations IA" delay={500}>
            <FlatList
              horizontal
              data={NEBULEUSE}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <NebuleuseCard item={item} onPress={handlePlay} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Cinéma */}
          <AnimatedSection title="Cinéma" subtitle="Films & Documentaires" action="Tout voir" delay={600}>
            <FlatList
              horizontal
              data={CINEMA}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <CinemaCard item={item} onPress={handlePlay} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Creators */}
          <AnimatedSection title="Créateurs" subtitle="À suivre" action="Tout voir" delay={700}>
            <FlatList
              horizontal
              data={CREATORS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <CreatorCard item={item} onPress={() => {}} index={index} />
              )}
            />
          </AnimatedSection>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 60 }} />
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
  
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 90,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.terra,
    letterSpacing: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    marginLeft: 4,
  },
  profileGradient: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  
  // Search
  searchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
  },
  
  // Hero
  heroSection: {
    height: SH * 0.58,
    position: 'relative',
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroSubtitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.terra,
    letterSpacing: 3,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 48,
    color: COLORS.cream,
    letterSpacing: 3,
    marginBottom: 10,
  },
  heroDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 14,
    maxWidth: '90%',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  heroMatch: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: '#46D369',
  },
  heroRating: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  heroRatingText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
    gap: 10,
  },
  playBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.dark,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    gap: 10,
  },
  listBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  
  // Sections
  sectionsContainer: {
    backgroundColor: COLORS.dark,
    paddingTop: 28,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 22,
    color: COLORS.cream,
  },
  sectionSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 3,
  },
  sectionAction: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.terra,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  
  // Globe
  globeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  globeGlow: {
    position: 'absolute',
    width: 300,
    height: 200,
    borderRadius: 150,
  },
  globeWrapper: {
    width: 160,
    height: 160,
    position: 'relative',
    marginBottom: 24,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
  },
  particleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  territoryPoint: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  territoryPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    opacity: 0.5,
  },
  territoryDot: {
    shadowOffset: { width: 0, height: 0 },
  },
  territoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  territoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  chipTextActive: {
    color: COLORS.cream,
  },
  
  // Continue Card
  continueCard: {
    width: 155,
  },
  continueImageWrapper: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  continueImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  continuePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  continueTypeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
  },
  continueProgressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 2,
  },
  continueTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 10,
  },
  continueRemaining: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  
  // Live Card
  liveCard: {
    width: 210,
    height: 135,
    borderRadius: 10,
    overflow: 'hidden',
  },
  liveImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229,9,20,0.95)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  livePulse: {
    position: 'absolute',
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1,
  },
  liveViewers: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  liveInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  liveTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  liveCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  
  // Content Card
  contentCard: {
    width: 140,
  },
  contentImageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  contentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentInfo: {
    marginTop: 12,
  },
  contentTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  contentArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  contentType: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Creator Card
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 230,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  creatorImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.dark2,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: COLORS.cream,
  },
  creatorRole: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  creatorFollowers: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.terra,
    marginTop: 3,
  },
  followBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Nébuleuse Card
  nebuleuseCard: {
    width: 165,
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nebuleuseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nebuleuseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  nebuleuseGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  nebuleuseInfo: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    right: 14,
  },
  nebuleuseTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 17,
    color: COLORS.cream,
  },
  nebuleuseDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  nebuleusePlayBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Cinema Card
  cinemaCard: {
    width: 250,
    height: 145,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cinemaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cinemaGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cinemaPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaPlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
  },
  cinemaTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  cinemaDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
});
