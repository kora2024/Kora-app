/**
 * KORA Transitions — UPGRADE 7 (Transitions Fluides)
 * 
 * Chaque transition raconte quelque chose :
 * - Globe → Feed = plongée (zoom in)
 * - Feed → Orbite = expansion (l'orbite s'ouvre autour)
 * - Territoire → Noyau = descente vers le centre
 * - Retour = inverse exact de l'entrée
 * 
 * Les transitions sont ce que l'utilisateur ressent
 * même sans pouvoir les décrire
 */

import { Animated, Easing } from 'react-native';
import {
  StackCardStyleInterpolator,
  StackCardInterpolationProps,
  TransitionSpec,
} from '@react-navigation/stack';

// ══════════════════════════════════════════════════════════════════════════════
// TIMING SPECS — Durées et courbes d'animation
// ══════════════════════════════════════════════════════════════════════════════

export const TransitionSpecs = {
  // Plongée (Globe → Feed) — lente et cinématique
  plunge: {
    animation: 'timing' as const,
    config: {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    },
  },
  
  // Expansion orbitale (Feed → Orbite)
  expand: {
    animation: 'timing' as const,
    config: {
      duration: 350,
      easing: Easing.out(Easing.quad),
    },
  },
  
  // Descente centrale (Territoire → Noyau)
  descend: {
    animation: 'timing' as const,
    config: {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    },
  },
  
  // Fade simple (défaut)
  fade: {
    animation: 'timing' as const,
    config: {
      duration: 280,
      easing: Easing.inOut(Easing.ease),
    },
  },
  
  // Flash overlay
  flash: {
    animation: 'timing' as const,
    config: {
      duration: 150,
      easing: Easing.linear,
    },
  },
} satisfies Record<string, TransitionSpec>;

// ══════════════════════════════════════════════════════════════════════════════
// CARD STYLE INTERPOLATORS — Animations visuelles
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Plongée — Globe → Feed
 * L'écran zoom légèrement en arrière puis revient (sensation de plongée)
 */
export const plungeTransition: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0
  );

  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 0.9, 1],
        outputRange: [0, 0.3, 0.8, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 0.15, 0.05, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Expansion orbitale — Feed → Orbite
 * L'écran glisse vers le haut et apparaît (ouverture de l'orbite)
 */
export const expandTransition: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.05, 0.95, 1],
        outputRange: [0, 0.2, 0.1, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Descente centrale — Territoire → Noyau
 * L'écran scale légèrement vers le bas (descente vers le noyau)
 */
export const descendTransition: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.6, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1.08, 1],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 0.25, 0.1, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Fade simple — Transition par défaut
 * Fondu enchaîné élégant
 */
export const fadeTransition: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 0.15, 0.05, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * Slide horizontal — Pour les modales et écrans secondaires
 */
export const slideTransition: StackCardStyleInterpolator = ({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0.5, 0.8, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.width * 0.3, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 0.2, 0.1, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN OPTIONS — Configuration prête à l'emploi
// ══════════════════════════════════════════════════════════════════════════════

export const ScreenTransitions = {
  // Plongée (Globe vers autres écrans principaux)
  plunge: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: TransitionSpecs.plunge,
      close: TransitionSpecs.plunge,
    },
    cardStyleInterpolator: plungeTransition,
    cardOverlayEnabled: true,
  },
  
  // Expansion (vers Orbite, commentaires)
  expand: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: TransitionSpecs.expand,
      close: TransitionSpecs.expand,
    },
    cardStyleInterpolator: expandTransition,
    cardOverlayEnabled: true,
  },
  
  // Descente (vers Noyau)
  descend: {
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: TransitionSpecs.descend,
      close: TransitionSpecs.descend,
    },
    cardStyleInterpolator: descendTransition,
    cardOverlayEnabled: true,
  },
  
  // Fade (défaut)
  fade: {
    gestureEnabled: true,
    transitionSpec: {
      open: TransitionSpecs.fade,
      close: TransitionSpecs.fade,
    },
    cardStyleInterpolator: fadeTransition,
    cardOverlayEnabled: true,
  },
  
  // Slide (modales, écrans secondaires)
  slide: {
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: TransitionSpecs.expand,
      close: TransitionSpecs.expand,
    },
    cardStyleInterpolator: slideTransition,
    cardOverlayEnabled: true,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPO ROUTER ANIMATIONS — Pour expo-router
// ══════════════════════════════════════════════════════════════════════════════

export type KoraAnimation = 
  | 'fade'
  | 'slide_from_right'
  | 'slide_from_bottom'
  | 'ios_from_right'
  | 'none';

/**
 * Animations pour Expo Router Stack.Screen
 */
export const ExpoAnimations = {
  // Transitions principales
  default: 'fade' as KoraAnimation,
  orbite: 'slide_from_bottom' as KoraAnimation,
  noyau: 'slide_from_right' as KoraAnimation,
  eveil: 'fade' as KoraAnimation,
  tabs: 'fade' as KoraAnimation,
};
