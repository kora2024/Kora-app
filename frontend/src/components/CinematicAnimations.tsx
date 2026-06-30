/**
 * KORA Cinematic Animations — Senior-Level Scroll & Transition System
 * 
 * High-performance animations using React Native Animated API
 * Features:
 * - Parallax hero with depth layers
 * - Scroll-triggered section reveals
 * - Staggered content animations
 * - Micro-interactions with haptic feedback
 * - Ambient particle effects
 * - Smooth page transitions
 */

import React, { useRef, useEffect, useState, useCallback, ReactNode, memo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Pressable,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface AnimatedSectionProps {
  children: ReactNode;
  scrollY: Animated.Value;
  index: number;
  threshold?: number;
  style?: ViewStyle;
}

interface ParallaxLayerProps {
  children: ReactNode;
  scrollY: Animated.Value;
  speed: number; // 0 = static, 1 = full scroll, 0.5 = half speed (parallax)
  style?: ViewStyle;
}

interface ScalePressableProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scale?: number;
  haptic?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// PARALLAX HERO SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

export const ParallaxHero = memo(({ 
  children, 
  scrollY,
  height = SH * 0.7,
  style,
}: { 
  children: ReactNode; 
  scrollY: Animated.Value;
  height?: number;
  style?: ViewStyle;
}) => {
  // Parallax transform for the hero content
  const translateY = scrollY.interpolate({
    inputRange: [-height, 0, height],
    outputRange: [-height * 0.4, 0, height * 0.5],
    extrapolate: 'clamp',
  });

  // Scale effect when pulling down
  const scale = scrollY.interpolate({
    inputRange: [-height, 0, height],
    outputRange: [1.3, 1, 0.9],
    extrapolate: 'clamp',
  });

  // Opacity fade as you scroll
  const opacity = scrollY.interpolate({
    inputRange: [0, height * 0.5, height],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.parallaxHero,
        { height },
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// PARALLAX LAYER (For depth effects)
// ══════════════════════════════════════════════════════════════════════════════

export const ParallaxLayer = memo(({ 
  children, 
  scrollY, 
  speed, 
  style 
}: ParallaxLayerProps) => {
  const translateY = scrollY.interpolate({
    inputRange: [-SH, 0, SH],
    outputRange: [SH * speed, 0, -SH * speed],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ translateY }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SCROLL-TRIGGERED SECTION REVEAL
// ══════════════════════════════════════════════════════════════════════════════

export const RevealSection = memo(({ 
  children, 
  scrollY, 
  index,
  threshold = 150,
  style,
}: AnimatedSectionProps) => {
  const sectionOffset = index * threshold;
  
  // Opacity based on scroll position
  const opacity = scrollY.interpolate({
    inputRange: [
      sectionOffset - threshold,
      sectionOffset,
      sectionOffset + threshold * 2,
    ],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  // Slide up effect
  const translateY = scrollY.interpolate({
    inputRange: [
      sectionOffset - threshold,
      sectionOffset,
      sectionOffset + threshold,
    ],
    outputRange: [40, 0, 0],
    extrapolate: 'clamp',
  });

  // Scale effect
  const scale = scrollY.interpolate({
    inputRange: [
      sectionOffset - threshold,
      sectionOffset,
    ],
    outputRange: [0.95, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// STAGGERED CHILDREN REVEAL
// ══════════════════════════════════════════════════════════════════════════════

export const StaggerReveal = memo(({ 
  children,
  delay = 0,
  staggerDelay = 80,
  direction = 'up',
}: {
  children: ReactNode[];
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const animations = useRef(
    React.Children.map(children, () => ({
      opacity: new Animated.Value(0),
      translate: new Animated.Value(direction === 'up' || direction === 'left' ? 30 : -30),
    }))
  ).current;

  useEffect(() => {
    const anims = animations?.map((anim, i) => {
      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: delay + i * staggerDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.translate, {
          toValue: 0,
          duration: 600,
          delay: delay + i * staggerDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]);
    });

    if (anims) {
      Animated.stagger(staggerDelay, anims).start();
    }
  }, []);

  const isHorizontal = direction === 'left' || direction === 'right';

  return (
    <>
      {React.Children.map(children, (child, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: animations?.[i]?.opacity || 1,
            transform: [
              isHorizontal 
                ? { translateX: animations?.[i]?.translate || 0 }
                : { translateY: animations?.[i]?.translate || 0 }
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SCALE PRESSABLE (Micro-interaction)
// ══════════════════════════════════════════════════════════════════════════════

export const ScalePressable = memo(({
  children,
  onPress,
  onLongPress,
  scale = 0.96,
  haptic = true,
  style,
  disabled = false,
}: ScalePressableProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scale,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = useCallback(() => {
    if (haptic) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onPress?.();
  }, [haptic, onPress]);

  const handleLongPress = useCallback(() => {
    if (haptic) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }
    onLongPress?.();
  }, [haptic, onLongPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
    >
      <Animated.View 
        style={[
          style, 
          { 
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// AMBIENT GLOW EFFECT
// ══════════════════════════════════════════════════════════════════════════════

export const AmbientGlow = memo(({ 
  color = '#C9A84C',
  size = 200,
  intensity = 0.15,
  position = { top: 0, left: 0 },
  animated = true,
}: {
  color?: string;
  size?: number;
  intensity?: number;
  position?: { top: number; left: number };
  animated?: boolean;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(intensity)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: intensity * 1.5,
              duration: 2500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: intensity * 0.7,
              duration: 2500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [animated, intensity]);

  return (
    <Animated.View
      style={[
        styles.ambientGlow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: position.top,
          left: position.left,
          opacity: opacityAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      pointerEvents="none"
    />
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// FLOATING PARTICLES (Ambient effect)
// ══════════════════════════════════════════════════════════════════════════════

export const FloatingParticles = memo(({ 
  count = 8,
  color = '#C9A84C',
}: {
  count?: number;
  color?: string;
}) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      x: new Animated.Value(Math.random() * SW),
      y: new Animated.Value(Math.random() * SH),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      size: Math.random() * 4 + 2,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle, i) => {
      const animateParticle = () => {
        const duration = 8000 + Math.random() * 6000;
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.4,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          particle.y.setValue(SH + 50);
          particle.x.setValue(Math.random() * SW);
          particle.opacity.setValue(0.1);
          animateParticle();
        });
      };
      
      setTimeout(animateParticle, i * 500);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: color,
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

// ══════════════════════════════════════════════════════════════════════════════
// SHIMMER EFFECT (Loading placeholder)
// ══════════════════════════════════════════════════════════════════════════════

export const ShimmerEffect = memo(({ 
  width = 200, 
  height = 20,
  borderRadius = 4,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View 
      style={[
        styles.shimmerContainer,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerGradient,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// PULSE BUTTON (CTA animation)
// ══════════════════════════════════════════════════════════════════════════════

export const PulseButton = memo(({
  children,
  onPress,
  pulseColor = 'rgba(201,168,76,0.3)',
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  pulseColor?: string;
  style?: ViewStyle;
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={[styles.pulseButtonContainer, style]}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: pulseColor,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        {/* Button content */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// SCROLL PROGRESS INDICATOR
// ══════════════════════════════════════════════════════════════════════════════

export const ScrollProgress = memo(({ 
  scrollY, 
  contentHeight,
  color = '#C9A84C',
}: {
  scrollY: Animated.Value;
  contentHeight: number;
  color?: string;
}) => {
  const progress = scrollY.interpolate({
    inputRange: [0, contentHeight - SH],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.scrollProgressContainer}>
      <Animated.View 
        style={[
          styles.scrollProgressBar,
          { width: progress, backgroundColor: color },
        ]} 
      />
    </View>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  parallaxHero: {
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
  shimmerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
  },
  pulseButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  scrollProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollProgressBar: {
    height: '100%',
  },
});

export default {
  ParallaxHero,
  ParallaxLayer,
  RevealSection,
  StaggerReveal,
  ScalePressable,
  AmbientGlow,
  FloatingParticles,
  ShimmerEffect,
  PulseButton,
  ScrollProgress,
};
