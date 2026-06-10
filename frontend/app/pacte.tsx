/**
 * KORA Pacte Souverain — Rituel d'Éveil
 * 
 * "Souveraineté & Respect. Le Don avant le Gain. L'Ancrage Réel."
 * 
 * Écran d'onboarding obligatoire avant d'accéder à /home
 * L'utilisateur doit accepter les 3 règles du Pacte Kora.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import { haptic } from '../src/utils/haptics';

const { width: SW, height: SH } = Dimensions.get('window');
const PACTE_ACCEPTED_KEY = 'kora_pacte_accepted';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// LES 3 RÈGLES DU PACTE SOUVERAIN
// ══════════════════════════════════════════════════════════════════════════════

const RULES = [
  {
    id: 'souverainete',
    title: "Souveraineté & Respect",
    text: "Kora transcende les frontières. Les débats politiques partisans et religieux n'ont pas leur place ici. Nous protégeons notre unité.",
    icon: 'lock',
    color: COLORS.terra,
  },
  {
    id: 'don',
    title: "Le Don avant le Gain",
    text: "Ici, on partage la culture, l'entraide et les opportunités. Le spam et le démarchage sauvage détruisent la confiance ; ils sont proscrits.",
    icon: 'globe',
    color: COLORS.gold,
  },
  {
    id: 'ancrage',
    title: "L'Ancrage Réel",
    text: "Le virtuel tisse le lien, le réel le scelle. Votre FREK-ID vous engage à la bienveillance lors de nos rassemblements physiques.",
    icon: 'music',
    color: COLORS.terra,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function LockIcon({ size = 48, color = COLORS.terra }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={16} r={1.5} fill={color} />
    </Svg>
  );
}

function GlobeIcon({ size = 48, color = COLORS.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.5} />
      <Path d="M2 12h20" stroke={color} strokeWidth={1.5} />
      <Path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function MusicIcon({ size = 48, color = COLORS.terra }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V5l12-2v13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={1.5} />
      <Circle cx={18} cy={16} r={3} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function getIcon(iconName: string, color: string) {
  switch (iconName) {
    case 'lock': return <LockIcon color={color} />;
    case 'globe': return <GlobeIcon color={color} />;
    case 'music': return <MusicIcon color={color} />;
    default: return <LockIcon color={color} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function ProgressBars({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.progressBar,
            { backgroundColor: idx <= current ? COLORS.terra : 'rgba(255,255,255,0.15)' },
          ]}
        />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PACTE SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function PacteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation for icon
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const animateToNextStep = useCallback((nextStep: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    haptic.light();

    // Fade out
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 0.5, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(30);
      iconScale.setValue(0);
      iconRotate.setValue(0);

      // Fade in
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => setIsAnimating(false));
    });
  }, [fadeAnim, slideAnim, iconScale, iconRotate, isAnimating]);

  const handleNext = async () => {
    if (currentStep < RULES.length - 1) {
      animateToNextStep(currentStep + 1);
    } else {
      // Final step — activate FREK-ID
      haptic.success();
      
      try {
        // Save pacte acceptance locally
        await AsyncStorage.setItem(PACTE_ACCEPTED_KEY, 'true');
        await AsyncStorage.setItem('kora_pacte_date', new Date().toISOString());

        // Update backend if logged in
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          try {
            await fetch(`${API_BASE}/api/auth/accept-pacte`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          } catch (e) {
            console.log('Backend pacte update failed, continuing anyway');
          }
        }
      } catch (error) {
        console.log('Storage not available');
      }

      // Navigate to home
      router.replace('/home');
    }
  };

  const currentRule = RULES[currentStep];
  const isLastStep = currentStep === RULES.length - 1;

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={['rgba(166,93,71,0.12)', 'transparent', 'rgba(74,127,165,0.06)']}
        locations={[0.2, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress Bars */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ProgressBars current={currentStep} total={RULES.length} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: iconScale },
                { rotate: iconRotation },
              ],
            },
          ]}
        >
          <View style={[styles.iconGlow, { shadowColor: currentRule.color }]} />
          {getIcon(currentRule.icon, currentRule.color)}
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.title, { color: currentRule.color }]}>
            {currentRule.title}
          </Text>
          <Text style={styles.body}>{currentRule.text}</Text>
        </Animated.View>
      </View>

      {/* CTA Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity
          style={[styles.button, isLastStep && styles.buttonFinal]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={isAnimating}
        >
          {isLastStep ? (
            <LinearGradient
              colors={[COLORS.gold, '#D4B55A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonTextFinal}>J'ACTIVE MON FREK-ID</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.buttonText}>CONTINUER</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.stepIndicator}>
          {currentStep + 1} / {RULES.length}
        </Text>
      </View>
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
  header: {
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: FONTS.jostLight,
    fontSize: 17,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  buttonFinal: {
    borderWidth: 0,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: 2,
    paddingVertical: 16,
    textAlign: 'center',
  },
  buttonTextFinal: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.dark,
    letterSpacing: 2,
  },
  stepIndicator: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 16,
    letterSpacing: 2,
  },
});
