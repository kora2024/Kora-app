/**
 * KORA Onboarding 60s — Éveil Complet
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sprint 1.5 — Phase B
 * 
 * Flow en 5 étapes (60 secondes):
 * 1. Territoires culturels (multi-select)
 * 2. Langues préférées
 * 3. Genres musicaux
 * 4. Créateurs favoris (suggestion basée sur territoires)
 * 5. Génération FREK-ID + Premier feed personnalisé
 * 
 * @author CVLN Group
 * @version 2.0.0 — Horizon 2055
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '../src/theme';
import { useRBAC } from '../src/context/RBACContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// DATA CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TERRITORIES = [
  { id: 'MQ', name: 'Martinique', flag: '🇲🇶', region: 'caraibes' },
  { id: 'GP', name: 'Guadeloupe', flag: '🇬🇵', region: 'caraibes' },
  { id: 'HT', name: 'Haïti', flag: '🇭🇹', region: 'caraibes' },
  { id: 'JM', name: 'Jamaïque', flag: '🇯🇲', region: 'caraibes' },
  { id: 'TT', name: 'Trinidad', flag: '🇹🇹', region: 'caraibes' },
  { id: 'SN', name: 'Sénégal', flag: '🇸🇳', region: 'afrique' },
  { id: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'afrique' },
  { id: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', region: 'afrique' },
  { id: 'CD', name: 'Congo', flag: '🇨🇩', region: 'afrique' },
  { id: 'GH', name: 'Ghana', flag: '🇬🇭', region: 'afrique' },
  { id: 'FR', name: 'France', flag: '🇫🇷', region: 'europe' },
  { id: 'GB', name: 'UK', flag: '🇬🇧', region: 'europe' },
  { id: 'US', name: 'USA', flag: '🇺🇸', region: 'ameriques' },
  { id: 'BR', name: 'Brésil', flag: '🇧🇷', region: 'ameriques' },
];

const LANGUAGES = [
  { id: 'fr', name: 'Français', native: 'Français' },
  { id: 'en', name: 'English', native: 'English' },
  { id: 'es', name: 'Español', native: 'Español' },
  { id: 'pt', name: 'Português', native: 'Português' },
  { id: 'cr', name: 'Créole', native: 'Kréyòl' },
  { id: 'wo', name: 'Wolof', native: 'Wolof' },
  { id: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili' },
];

const GENRES = [
  { id: 'zouk', name: 'Zouk', color: '#C9A84C' },
  { id: 'afrobeats', name: 'Afrobeats', color: '#A65D47' },
  { id: 'reggae', name: 'Reggae', color: '#4A7FA5' },
  { id: 'kompa', name: 'Kompa', color: '#6B4EE6' },
  { id: 'dancehall', name: 'Dancehall', color: '#E6704E' },
  { id: 'hiphop', name: 'Hip-Hop', color: '#4EE68C' },
  { id: 'rnb', name: 'R&B', color: '#E64E9A' },
  { id: 'soca', name: 'Soca', color: '#E6C94E' },
  { id: 'mbalax', name: 'Mbalax', color: '#4EE6D4' },
  { id: 'rumba', name: 'Rumba', color: '#9A4EE6' },
  { id: 'highlife', name: 'Highlife', color: '#E69A4E' },
  { id: 'kizomba', name: 'Kizomba', color: '#4E9AE6' },
];

// Featured creators based on catalog
const FEATURED_CREATORS = [
  { id: 'kassav', name: "Kassav'", genre: 'Zouk', territory: 'GP' },
  { id: 'burnaboy', name: 'Burna Boy', genre: 'Afrobeats', territory: 'NG' },
  { id: 'bts', name: 'BTS', genre: 'K-Pop', territory: 'KR' },
  { id: 'djsayd', name: 'DJ Sayd', genre: 'Afro-House', territory: 'FR' },
  { id: 'youssoumndour', name: 'Youssou N\'Dour', genre: 'Mbalax', territory: 'SN' },
  { id: 'bobmarley', name: 'Bob Marley', genre: 'Reggae', territory: 'JM' },
  { id: 'taboutheo', name: 'Tabou Combo', genre: 'Kompa', territory: 'HT' },
  { id: 'felaKuti', name: 'Fela Kuti', genre: 'Afrobeat', territory: 'NG' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const CheckIcon = ({ size = 16, color = '#FAF9F6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const KoraOrbIcon = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Circle cx="32" cy="32" r="28" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity={0.3} />
    <Circle cx="32" cy="32" r="18" stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity={0.5} />
    <Circle cx="32" cy="32" r="6" fill="#C9A84C" />
  </Svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface StepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

// Step 1: Territories
const TerritoriesStep = ({ selected, onToggle }: StepProps) => (
  <View style={styles.stepContent}>
    <Text style={styles.stepTitle}>D'où vient ta culture ?</Text>
    <Text style={styles.stepSubtitle}>Sélectionne tes territoires d'origine ou d'affinité</Text>
    <View style={styles.optionsGrid}>
      {TERRITORIES.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.optionChip, isSelected && styles.optionChipSelected]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionFlag}>{item.flag}</Text>
            <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
              {item.name}
            </Text>
            {isSelected && (
              <View style={styles.checkBadge}>
                <CheckIcon size={10} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Step 2: Languages
const LanguagesStep = ({ selected, onToggle }: StepProps) => (
  <View style={styles.stepContent}>
    <Text style={styles.stepTitle}>Quelles langues parles-tu ?</Text>
    <Text style={styles.stepSubtitle}>On adaptera tes recommandations</Text>
    <View style={styles.optionsGrid}>
      {LANGUAGES.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.languageChip, isSelected && styles.languageChipSelected]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
              {item.name}
            </Text>
            <Text style={styles.languageNative}>{item.native}</Text>
            {isSelected && (
              <View style={styles.checkBadge}>
                <CheckIcon size={10} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Step 3: Genres
const GenresStep = ({ selected, onToggle }: StepProps) => (
  <View style={styles.stepContent}>
    <Text style={styles.stepTitle}>Tes genres préférés ?</Text>
    <Text style={styles.stepSubtitle}>Sélectionne au moins 3 genres</Text>
    <View style={styles.genresGrid}>
      {GENRES.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.genreChip,
              isSelected && [styles.genreChipSelected, { borderColor: item.color }],
            ]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.genreDot, { backgroundColor: item.color }]} />
            <Text style={[styles.genreName, isSelected && styles.genreNameSelected]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Step 4: Creators
const CreatorsStep = ({ selected, onToggle }: StepProps) => (
  <View style={styles.stepContent}>
    <Text style={styles.stepTitle}>Qui veux-tu suivre ?</Text>
    <Text style={styles.stepSubtitle}>Des artistes que tu aimes ou à découvrir</Text>
    <View style={styles.creatorsGrid}>
      {FEATURED_CREATORS.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.creatorCard, isSelected && styles.creatorCardSelected]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>{item.name.charAt(0)}</Text>
            </View>
            <Text style={styles.creatorName}>{item.name}</Text>
            <Text style={styles.creatorGenre}>{item.genre}</Text>
            {isSelected && (
              <View style={styles.creatorCheck}>
                <CheckIcon size={14} color="#C9A84C" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// Step 5: FREK-ID Generation
const FrekIdStep = ({ frekId, loading }: { frekId: string | null; loading: boolean }) => (
  <View style={styles.finalStepContent}>
    <KoraOrbIcon size={80} />
    
    {loading ? (
      <>
        <Text style={styles.finalTitle}>Création de ton identité...</Text>
        <ActivityIndicator color="#C9A84C" size="large" style={{ marginTop: 24 }} />
      </>
    ) : (
      <>
        <Text style={styles.finalTitle}>Bienvenue dans KORA</Text>
        <View style={styles.frekIdContainer}>
          <Text style={styles.frekIdLabel}>TON FREK-ID</Text>
          <Text style={styles.frekIdValue}>{frekId}</Text>
        </View>
        <Text style={styles.finalSubtitle}>
          Ton identité culturelle unique.{'\n'}
          Ton feed personnalisé t'attend.
        </Text>
      </>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════════

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <View style={styles.progressContainer}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.progressDot,
          i <= current && styles.progressDotActive,
        ]}
      />
    ))}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useRBAC();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [frekId, setFrekId] = useState<string | null>(null);
  
  // Selections
  const [territories, setTerritories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['fr']); // Default French
  const [genres, setGenres] = useState<string[]>([]);
  const [creators, setCreators] = useState<string[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const hapticFeedback = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const toggleSelection = useCallback((
    id: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    hapticFeedback();
    if (current.includes(id)) {
      setter(current.filter(x => x !== id));
    } else {
      setter([...current, id]);
    }
  }, [hapticFeedback]);

  const animateTransition = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    
    if (step < 4) {
      animateTransition(step + 1);
    }
    
    // Step 4 -> Generate FREK-ID and complete
    if (step === 3) {
      setLoading(true);
      
      try {
        // Generate FREK-ID
        const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
        const response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `user_${Date.now()}@kora.temp`, // Temp email for anonymous onboarding
            password: Math.random().toString(36).slice(-10),
            territories,
            languages,
            genres,
            favorite_creators: creators,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFrekId(data.frek_id || `FRK-${Math.random().toString(36).slice(-8).toUpperCase()}`);
          
          // Save to RBAC context
          if (data.user) {
            setUser({
              ...data.user,
              role: 'listener',
              is_creator: false,
              is_developer: false,
              is_premium: false,
              onboarding_completed: true,
              territories,
              genres,
            });
          }
        } else {
          // Fallback: Generate local FREK-ID
          setFrekId(`FRK-${Math.random().toString(36).slice(-8).toUpperCase()}`);
        }
        
        // Save preferences locally
        await AsyncStorage.setItem('kora_onboarding_completed', 'true');
        await AsyncStorage.setItem('kora_territories', JSON.stringify(territories));
        await AsyncStorage.setItem('kora_languages', JSON.stringify(languages));
        await AsyncStorage.setItem('kora_genres', JSON.stringify(genres));
        await AsyncStorage.setItem('kora_favorite_creators', JSON.stringify(creators));
        
      } catch (error) {
        console.error('Onboarding error:', error);
        // Fallback FREK-ID
        setFrekId(`FRK-${Math.random().toString(36).slice(-8).toUpperCase()}`);
      } finally {
        setLoading(false);
      }
      
      animateTransition(4);
    }
  }, [step, animateTransition, territories, languages, genres, creators, setUser]);

  const handleEnterKora = useCallback(async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    router.replace('/home');
  }, [router]);

  const handleSkip = useCallback(() => {
    router.replace('/home');
  }, [router]);

  // Can continue to next step?
  const canContinue = () => {
    switch (step) {
      case 0: return territories.length > 0;
      case 1: return languages.length > 0;
      case 2: return genres.length >= 3;
      case 3: return true; // Creators are optional
      case 4: return !loading && !!frekId;
      default: return false;
    }
  };

  const STEPS = ['Territoires', 'Langues', 'Genres', 'Créateurs', 'FREK-ID'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A24', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>KORA</Text>
        <ProgressBar current={step} total={5} />
        {step < 4 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {step === 0 && (
            <TerritoriesStep
              selected={territories}
              onToggle={(id) => toggleSelection(id, territories, setTerritories)}
            />
          )}
          {step === 1 && (
            <LanguagesStep
              selected={languages}
              onToggle={(id) => toggleSelection(id, languages, setLanguages)}
            />
          )}
          {step === 2 && (
            <GenresStep
              selected={genres}
              onToggle={(id) => toggleSelection(id, genres, setGenres)}
            />
          )}
          {step === 3 && (
            <CreatorsStep
              selected={creators}
              onToggle={(id) => toggleSelection(id, creators, setCreators)}
            />
          )}
          {step === 4 && (
            <FrekIdStep frekId={frekId} loading={loading} />
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        {step < 4 ? (
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
            onPress={handleNext}
            disabled={!canContinue()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={canContinue() ? ['#C9A84C', '#D4B55A'] : ['#333', '#222']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={[styles.continueBtnText, !canContinue() && styles.continueBtnTextDisabled]}>
                {step === 3 ? 'CRÉER MON FREK-ID' : 'CONTINUER'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleEnterKora}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#C9A84C', '#D4B55A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>ENTRER DANS KORA</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {step < 4 && (
          <Text style={styles.stepIndicator}>
            {step + 1}/5 • {STEPS[step]}
          </Text>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: '#C9A84C',
    letterSpacing: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    backgroundColor: '#C9A84C',
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stepContent: {
    marginTop: 20,
  },
  stepTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: '#FAF9F6',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  optionChipSelected: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderColor: '#C9A84C',
  },
  optionFlag: {
    fontSize: 18,
  },
  optionChipText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  optionChipTextSelected: {
    color: '#FAF9F6',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '48%',
    alignItems: 'center',
    marginBottom: 4,
  },
  languageChipSelected: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderColor: '#C9A84C',
  },
  languageName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  languageNameSelected: {
    color: '#FAF9F6',
  },
  languageNative: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  genreChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  genreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genreName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  genreNameSelected: {
    color: '#FAF9F6',
  },
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  creatorCard: {
    width: '47%',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  creatorCardSelected: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: '#C9A84C',
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(166,93,71,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  creatorAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: '#C9A84C',
  },
  creatorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: '#FAF9F6',
    textAlign: 'center',
  },
  creatorGenre: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  creatorCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalStepContent: {
    alignItems: 'center',
    paddingTop: 60,
  },
  finalTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: '#FAF9F6',
    marginTop: 32,
    textAlign: 'center',
  },
  frekIdContainer: {
    marginTop: 32,
    padding: 24,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
  },
  frekIdLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: '#C9A84C',
    letterSpacing: 2,
    marginBottom: 8,
  },
  frekIdValue: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 20,
    color: '#FAF9F6',
    letterSpacing: 2,
  },
  finalSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#0A0A0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  continueBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: '#0A0A0F',
    letterSpacing: 2,
  },
  continueBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  stepIndicator: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
});
