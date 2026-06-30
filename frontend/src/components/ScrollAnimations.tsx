/**
 * KORA Scroll Animations — Cinematic Scroll Effects
 * 
 * Components for immersive scroll experience:
 * - FadeInOnScroll: Elements fade in when scrolled into view
 * - ParallaxSection: Background parallax effect
 * - ScaleOnPress: Touch feedback with scale animation
 * - SlideInSection: Sections slide in from sides
 */

import React, { useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// FADE IN ON SCROLL
// ══════════════════════════════════════════════════════════════════════════════

interface FadeInOnScrollProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  style?: ViewStyle;
}

export function FadeInOnScroll({ 
  children, 
  delay = 0, 
  duration = 600,
  direction = 'up',
  distance = 30,
  style,
}: FadeInOnScrollProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(direction === 'up' ? distance : direction === 'down' ? -distance : 0)).current;
  const translateX = useRef(new Animated.Value(direction === 'left' ? distance : direction === 'right' ? -distance : 0)).current;
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]).start();
        setHasAnimated(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [hasAnimated, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCALE ON PRESS (Touch Feedback)
// ══════════════════════════════════════════════════════════════════════════════

interface ScaleOnPressProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  scale?: number;
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  style?: ViewStyle;
  disabled?: boolean;
}

export function ScaleOnPress({
  children,
  onPress,
  onLongPress,
  scale = 0.96,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  style,
  disabled = false,
}: ScaleOnPressProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (haptic) {
      try { Haptics.impactAsync(hapticStyle); } catch {}
    }
    onPress?.();
  }, [haptic, hapticStyle, onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PARALLAX BACKGROUND
// ══════════════════════════════════════════════════════════════════════════════

interface ParallaxBackgroundProps {
  scrollY: Animated.Value;
  children: ReactNode;
  parallaxFactor?: number;
  style?: ViewStyle;
}

export function ParallaxBackground({
  scrollY,
  children,
  parallaxFactor = 0.5,
  style,
}: ParallaxBackgroundProps) {
  const translateY = scrollY.interpolate({
    inputRange: [-SH, 0, SH],
    outputRange: [SH * parallaxFactor, 0, -SH * parallaxFactor],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGGER CHILDREN ANIMATION
// ══════════════════════════════════════════════════════════════════════════════

interface StaggerProps {
  children: ReactNode[];
  delay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: ViewStyle;
}

export function StaggerChildren({
  children,
  delay = 0,
  staggerDelay = 100,
  direction = 'up',
  style,
}: StaggerProps) {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeInOnScroll
          key={index}
          delay={delay + index * staggerDelay}
          direction={direction}
          duration={500}
        >
          {child}
        </FadeInOnScroll>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED SECTION HEADER
// ══════════════════════════════════════════════════════════════════════════════

interface AnimatedHeaderProps {
  children: ReactNode;
  scrollY: Animated.Value;
  triggerOffset?: number;
  style?: ViewStyle;
}

export function AnimatedSectionHeader({
  children,
  scrollY,
  triggerOffset = 100,
  style,
}: AnimatedHeaderProps) {
  const opacity = scrollY.interpolate({
    inputRange: [triggerOffset - 50, triggerOffset, triggerOffset + 50],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const translateX = scrollY.interpolate({
    inputRange: [triggerOffset - 50, triggerOffset + 50],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PULSE ANIMATION (For CTAs)
// ══════════════════════════════════════════════════════════════════════════════

interface PulseProps {
  children: ReactNode;
  duration?: number;
  scale?: number;
  active?: boolean;
  style?: ViewStyle;
}

export function Pulse({
  children,
  duration = 1500,
  scale = 1.03,
  active = true,
  style,
}: PulseProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: scale,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [active, duration, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOW EFFECT
// ══════════════════════════════════════════════════════════════════════════════

interface GlowProps {
  children: ReactNode;
  color?: string;
  intensity?: number;
  active?: boolean;
  style?: ViewStyle;
}

export function GlowEffect({
  children,
  color = '#C9A84C',
  intensity = 0.5,
  active = true,
  style,
}: GlowProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: intensity,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: intensity * 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [active, intensity]);

  return (
    <View style={style}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: color,
            opacity: glowAnim,
            borderRadius: 20,
          },
        ]}
      />
      {children}
    </View>
  );
}

export default {
  FadeInOnScroll,
  ScaleOnPress,
  ParallaxBackground,
  StaggerChildren,
  AnimatedSectionHeader,
  Pulse,
  GlowEffect,
};
