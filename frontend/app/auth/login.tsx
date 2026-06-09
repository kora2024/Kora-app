/**
 * KORA Login — Connexion FREK-ID
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
// MAIN LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.detail || 'Email ou mot de passe incorrect' });
        return;
      }

      // Store token and user data
      await AsyncStorage.setItem('kora_auth_token', data.token);
      await AsyncStorage.setItem('kora_frek_id', data.frek_id);
      await AsyncStorage.setItem('kora_user', JSON.stringify(data.user));

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Check if onboarding completed
      const eveilCompleted = await AsyncStorage.getItem('kora_eveil_completed');
      
      // Navigate to Home (expérience unifiée) or Onboarding
      if (eveilCompleted === 'true') {
        router.replace('/home');
      } else {
        router.replace('/eveil');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateForm, router]);

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
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>KORA</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>Connecte-toi avec ton FREK-ID</Text>

            {/* General error */}
            {errors.general && (
              <View style={styles.generalError}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Form */}
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
              placeholder="Ton mot de passe"
              secureTextEntry
              error={errors.password}
            />

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.cream} />
              ) : (
                <Text style={styles.submitBtnText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Signup link */}
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.signupLinkText}>
                Pas encore de compte ? <Text style={styles.signupLinkAccent}>Créer un FREK-ID</Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 48,
    color: COLORS.terra,
    letterSpacing: 8,
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
    marginBottom: 32,
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
  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
  },
  // Submit
  submitBtn: {
    backgroundColor: COLORS.terra,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
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
  // Signup link
  signupLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  signupLinkText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
  signupLinkAccent: {
    color: COLORS.terra,
    fontFamily: FONTS.jostMedium,
  },
});
