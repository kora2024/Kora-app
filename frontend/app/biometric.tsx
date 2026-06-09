/**
 * KORA Biometric Screen — UPGRADE 17
 * 
 * Écran intermédiaire pour l'authentification biométrique
 * - Empreinte digitale ou reconnaissance faciale
 * - 3 tentatives max → blocage 30s
 * - Skip automatique si pas de biométrie disponible
 * 
 * // La sécurité est transparente
 * // Ton territoire t'attend
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../src/theme';
import { haptic } from '../src/utils/haptics';
import { FingerprintIcon, FaceIdIcon, LockIcon } from '../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30; // seconds

export default function BiometricScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const [authType, setAuthType] = useState<'fingerprint' | 'facial' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const lockShake = useRef(new Animated.Value(0)).current;
  
  // Check biometric hardware and authenticate
  useEffect(() => {
    checkBiometricAndAuthenticate();
    
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Lockout countdown
  useEffect(() => {
    if (isLocked && lockoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLockoutCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutCountdown === 0) {
      // Unlock and reset
      setIsLocked(false);
      setAttempts(0);
      setStatusText('');
      // Try again
      setTimeout(() => authenticate(), 500);
    }
  }, [isLocked, lockoutCountdown]);
  
  const checkBiometricAndAuthenticate = async () => {
    try {
      // Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      
      if (!hasHardware) {
        console.log('No biometric hardware, skipping to globe');
        navigateToGlobe();
        return;
      }
      
      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isEnrolled) {
        console.log('No biometrics enrolled, skipping to globe');
        navigateToGlobe();
        return;
      }
      
      // Determine auth type (Face ID vs Touch ID)
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setAuthType('facial');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setAuthType('fingerprint');
      }
      
      // Start authentication after delay
      setTimeout(() => authenticate(), 500);
      
    } catch (error) {
      console.error('Biometric check error:', error);
      navigateToGlobe();
    }
  };
  
  const authenticate = async () => {
    if (isLocked) return;
    
    try {
      setStatusText('');
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ton territoire t\'attend',
        fallbackLabel: 'Code de secours',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        haptic.success();
        setStatusText('Bienvenue');
        
        // Animate out and navigate
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          navigateToGlobe();
        });
        
      } else {
        // Failed attempt
        haptic.error();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Shake animation
        Animated.sequence([
          Animated.timing(lockShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(lockShake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(lockShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(lockShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        
        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock out
          setIsLocked(true);
          setLockoutCountdown(LOCKOUT_DURATION);
          setStatusText(`Trop de tentatives`);
        } else {
          setStatusText(`Tentative ${newAttempts}/${MAX_ATTEMPTS}`);
          // Allow retry after 1 second
          setTimeout(() => {
            if (!isLocked) authenticate();
          }, 1500);
        }
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      // On error, skip to globe
      navigateToGlobe();
    }
  };
  
  const navigateToGlobe = useCallback(() => {
    router.replace('/(tabs)/feed');
  }, [router]);
  
  // Render biometric icon based on type
  const renderBiometricIcon = () => {
    const iconSize = 48;
    const iconColor = isLocked ? COLORS.gray : COLORS.terra;
    
    if (isLocked) {
      return <LockIcon size={iconSize} color={iconColor} strokeWidth={1.5} />;
    }
    
    if (authType === 'facial') {
      return <FaceIdIcon size={iconSize} color={iconColor} strokeWidth={1.5} />;
    }
    
    return <FingerprintIcon size={iconSize} color={iconColor} strokeWidth={1.5} />;
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(166,93,71,0.1)', 'transparent', 'rgba(74,127,165,0.05)']}
        locations={[0.2, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logo}>KORA</Text>
        </Animated.View>
        
        {/* Biometric Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: iconOpacity,
              transform: [
                { scale: iconPulse },
                { translateX: lockShake },
              ],
            },
          ]}
        >
          {renderBiometricIcon()}
        </Animated.View>
        
        {/* Text */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.promptText}>
            {isLocked 
              ? `Réessayer dans ${lockoutCountdown}s`
              : 'Ton territoire t\'attend'
            }
          </Text>
          
          {statusText !== '' && (
            <Text style={[
              styles.statusText,
              isLocked && styles.statusTextError
            ]}>
              {statusText}
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 56,
    color: COLORS.cream,
    letterSpacing: 6,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textContainer: {
    alignItems: 'center',
  },
  promptText: {
    fontFamily: FONTS.playfairItalic,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
    opacity: 0.9,
  },
  statusText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  statusTextError: {
    color: '#ff6b6b',
  },
});
