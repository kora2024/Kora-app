/**
 * KORA — Devenir Créateur
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page affichée quand un LISTENER tente d'accéder à une fonctionnalité créateur.
 * Master Prompt Section 20 — KORA for Creators
 * 
 * Processus de vérification créateur :
 * 1. Demande d'informations (nom d'artiste, bio, liens sociaux)
 * 2. Vérification identité (optionnel: FREK-ID existant)
 * 3. Validation par équipe KORA
 * 4. Activation du rôle CREATOR
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import * as Haptics from 'expo-haptics';

// Icons
const MicIcon = ({ size = 24, color = COLORS.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v4M8 23h8" />
  </Svg>
);

const CheckIcon = ({ size = 20, color = COLORS.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const ArrowLeftIcon = ({ size = 24, color = '#FAF9F6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

export default function BecomeCreatorScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [genre, setGenre] = useState('');
  const [territory, setTerritory] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    spotify: '',
    youtube: '',
  });

  const hapticFeedback = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    hapticFeedback();

    try {
      // In production, this would call the API to submit creator application
      // For now, simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        '🎉 Demande Envoyée !',
        'Votre demande de compte créateur a été soumise. Notre équipe va la vérifier sous 24-48h.',
        [
          {
            text: 'Retour à l\'accueil',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Publiez vos œuvres directement sur KORA',
    'Accédez à vos statistiques d\'écoute en temps réel',
    'Recevez vos royalties via le Wallet KORA',
    'Rejoignez une communauté de créateurs afro-diasporiques',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeftIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DEVENIR CRÉATEUR</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <MicIcon size={48} />
            </View>
            <Text style={styles.heroTitle}>KORA for Creators</Text>
            <Text style={styles.heroSubtitle}>
              Rejoignez la première plateforme de streaming{'\n'}
              conçue par et pour les créateurs afro-diasporiques.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Avantages Créateur</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <CheckIcon />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informations</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom d'artiste *</Text>
              <TextInput
                style={styles.input}
                value={artistName}
                onChangeText={setArtistName}
                placeholder="Votre nom de scène"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez-nous de vous et de votre musique..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Genre principal</Text>
              <TextInput
                style={styles.input}
                value={genre}
                onChangeText={setGenre}
                placeholder="Ex: Afrobeats, Zouk, Kompa..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Territoire d'origine</Text>
              <TextInput
                style={styles.input}
                value={territory}
                onChangeText={setTerritory}
                placeholder="Ex: Martinique, Sénégal, Haïti..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Liens (optionnel)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instagram</Text>
              <TextInput
                style={styles.input}
                value={socialLinks.instagram}
                onChangeText={(val) => setSocialLinks({...socialLinks, instagram: val})}
                placeholder="@votrecompte"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Spotify</Text>
              <TextInput
                style={styles.input}
                value={socialLinks.spotify}
                onChangeText={(val) => setSocialLinks({...socialLinks, spotify: val})}
                placeholder="Lien Spotify Artist"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity 
            style={[styles.submitButton, (!artistName && styles.submitButtonDisabled)]}
            onPress={handleSubmit}
            disabled={!artistName || loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={artistName ? [COLORS.gold, '#D4B55A'] : ['#444', '#333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.submitText}>SOUMETTRE MA DEMANDE</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            En soumettant cette demande, vous acceptez les conditions d'utilisation
            de KORA for Creators et la politique de distribution de royalties.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: '#FAF9F6',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONTS.jostRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: '#FAF9F6',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.dark,
    letterSpacing: 2,
  },
  disclaimer: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
