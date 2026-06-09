/**
 * KORA Inscription — FREK-ID Souverain
 * 
 * FREK-ID en premier — connexion souveraine caribéenne
 * Google + Apple en second — discrets, pour l'accessibilité
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../src/theme';
import { BackIcon } from '../../src/components/icons/KoraIcons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL ICONS
// ══════════════════════════════════════════════════════════════════════════════

import Svg, { Path, Circle, Rect } from 'react-native-svg';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function AppleIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INPUT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function KoraInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  error?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SIGNUP SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Nom requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, confirmPassword, displayName]);

  const handleSignup = useCallback(async () => {
    if (!validateForm()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          display_name: displayName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.detail || 'Erreur lors de l\'inscription' });
        return;
      }

      // Store token and FREK-ID
      await AsyncStorage.setItem('kora_auth_token', data.token);
      await AsyncStorage.setItem('kora_frek_id', data.frek_id);
      await AsyncStorage.setItem('kora_user', JSON.stringify(data.user));

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Navigate to onboarding
      router.replace('/eveil');
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, displayName, validateForm, router]);

  const handleSocialLogin = useCallback((provider: 'google' | 'apple') => {
    // TODO: Implement social login
    console.log(`Social login with ${provider}`);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.dark, '#0a0a12', COLORS.dark]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <BackIcon size={24} color={COLORS.cream} />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title */}
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoins la communauté KORA</Text>

            {/* FREK-ID Badge */}
            <View style={styles.frekBadge}>
              <Text style={styles.frekBadgeText}>FREK-ID</Text>
              <Text style={styles.frekBadgeDesc}>Identité souveraine caribéenne</Text>
            </View>

            {/* General error */}
            {errors.general && (
              <View style={styles.generalError}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Form */}
            <KoraInput
              label="Nom d'affichage"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ton nom sur KORA"
              autoCapitalize="sentences"
              error={errors.displayName}
            />

            <KoraInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <KoraInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 8 caractères"
              secureTextEntry
              error={errors.password}
            />

            <KoraInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme ton mot de passe"
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.cream} />
              ) : (
                <Text style={styles.submitBtnText}>Créer mon FREK-ID</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social logins - discreet */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialLogin('google')}
                activeOpacity={0.7}
              >
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialLogin('apple')}
                activeOpacity={0.7}
              >
                <AppleIcon size={18} color={COLORS.cream} />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Login link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginLinkText}>
                Déjà un compte ? <Text style={styles.loginLinkAccent}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: COLORS.cream,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 24,
  },
  // FREK Badge
  frekBadge: {
    backgroundColor: 'rgba(166, 93, 71, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.terra,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  frekBadgeText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.terra,
    letterSpacing: 4,
  },
  frekBadgeDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  // Errors
  generalError: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  generalErrorText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
  },
  // Input
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
  },
  inputFocused: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166, 93, 71, 0.05)',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: '#dc3545',
    marginTop: 6,
  },
  // Submit
  submitBtn: {
    backgroundColor: COLORS.terra,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    marginHorizontal: 16,
  },
  // Social
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  socialBtnText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.gray,
  },
  // Login link
  loginLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
  loginLinkAccent: {
    color: COLORS.terra,
    fontFamily: FONTS.jostMedium,
  },
});
