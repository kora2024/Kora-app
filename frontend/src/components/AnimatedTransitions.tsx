/**
 * KORA Animated Transitions — UPGRADE 7
 * 
 * Composants d'animation pour les transitions inter-écrans
 * et les interactions importantes.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY } from '../theme';
import { haptic } from '../utils/haptics';

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED PRESSABLE — Bouton avec animation de presse
// ══════════════════════════════════════════════════════════════════════════════

interface AnimatedPressableProps {
  onPress: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
  pressScale?: number;
  duration?: number;
  testID?: string;
}

export function AnimatedPressable({
  onPress,
  style,
  children,
  pressScale = 0.96,
  duration = 100,
  testID,
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: pressScale,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
      testID={testID}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FADE IN VIEW — Vue avec animation d'entrée
// ══════════════════════════════════════════════════════════════════════════════

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  style,
  direction = 'up',
  distance = 20,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(
    direction === 'none' ? 0 : distance
  )).current;

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    if (direction !== 'none') {
      animations.push(
        Animated.timing(translate, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, []);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return [{ translateY: translate }];
      case 'down':
        return [{ translateY: Animated.multiply(translate, -1) }];
      case 'left':
        return [{ translateX: translate }];
      case 'right':
        return [{ translateX: Animated.multiply(translate, -1) }];
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
}

// ══════════════════════════════════════════════════════════════════════════════
// SCALE IN VIEW — Vue avec animation de scale
// ══════════════════════════════════════════════════════════════════════════════

interface ScaleInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  initialScale?: number;
}

export function ScaleInView({
  children,
  delay = 0,
  duration = 400,
  style,
  initialScale = 0.9,
}: ScaleInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOYAU TRANSITION BUTTON — Bouton spécial pour aller au Noyau
// ══════════════════════════════════════════════════════════════════════════════

interface NoyauTransitionButtonProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function NoyauTransitionButton({
  children,
  style,
  testID,
}: NoyauTransitionButtonProps) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    haptic.medium();
    
    // Animation de presse avec glow
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Navigation après l'animation
      router.push('/noyau');
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} testID={testID}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {/* Glow effect */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: COLORS.gold,
              borderRadius: 16,
              opacity: Animated.multiply(glowOpacity, 0.3),
            },
          ]}
        />
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGGERED LIST — Liste avec apparition échelonnée
// ══════════════════════════════════════════════════════════════════════════════

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  style?: ViewStyle;
}

export function StaggeredItem({
  children,
  index,
  staggerDelay = 50,
  style,
}: StaggeredItemProps) {
  return (
    <FadeInView
      delay={index * staggerDelay}
      duration={300}
      direction="up"
      distance={15}
      style={style}
    >
      {children}
    </FadeInView>
  );
}
