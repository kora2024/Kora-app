/**
 * KORA — Demande d'Accès API (Développeur)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page affichée quand un LISTENER tente d'accéder à /developers.
 * Master Prompt Section 21 — KORA for Developers
 * 
 * Tiers d'accès API :
 * - FREE: 1000 appels/jour, rate limit 10/s
 * - DEVELOPER: 50K appels/jour, webhooks
 * - PROFESSIONAL: 500K appels/jour, support prioritaire
 * - ENTERPRISE: Illimité, SLA garanti
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
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';
import * as Haptics from 'expo-haptics';

// Icons
const CodeIcon = ({ size = 24, color = COLORS.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </Svg>
);

const ArrowLeftIcon = ({ size = 24, color = '#FAF9F6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const CheckIcon = ({ size = 16, color = COLORS.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

interface PlanCardProps {
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
  onSelect: () => void;
}

const PlanCard = ({ name, price, features, recommended, onSelect }: PlanCardProps) => (
  <TouchableOpacity 
    style={[styles.planCard, recommended && styles.planCardRecommended]}
    onPress={onSelect}
    activeOpacity={0.8}
  >
    {recommended && (
      <View style={styles.recommendedBadge}>
        <Text style={styles.recommendedText}>RECOMMANDÉ</Text>
      </View>
    )}
    <Text style={styles.planName}>{name}</Text>
    <Text style={styles.planPrice}>{price}</Text>
    <View style={styles.planFeatures}>
      {features.map((feature, index) => (
        <View key={index} style={styles.planFeatureItem}>
          <CheckIcon size={12} />
          <Text style={styles.planFeatureText}>{feature}</Text>
        </View>
      ))}
    </View>
    <View style={styles.planSelectButton}>
      <Text style={styles.planSelectText}>SÉLECTIONNER</Text>
    </View>
  </TouchableOpacity>
);

export default function RequestApiAccessScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Form data
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [website, setWebsite] = useState('');

  const hapticFeedback = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlan || !projectName) {
      Alert.alert('Information requise', 'Veuillez sélectionner un plan et renseigner le nom de votre projet.');
      return;
    }

    setLoading(true);
    hapticFeedback();

    try {
      // In production, this would call the API to submit developer application
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        '🚀 Demande Envoyée !',
        `Votre demande d'accès API (${selectedPlan}) a été soumise. Vous recevrez vos clés API par email sous 24h.`,
        [
          {
            text: 'OK',
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

  const plans = [
    {
      name: 'FREE',
      price: '0€',
      features: ['1 000 appels/jour', 'Rate limit 10/s', 'Documentation complète'],
    },
    {
      name: 'DEVELOPER',
      price: '29€/mois',
      features: ['50 000 appels/jour', 'Rate limit 100/s', 'Webhooks', 'Support email'],
      recommended: true,
    },
    {
      name: 'PROFESSIONAL',
      price: '99€/mois',
      features: ['500 000 appels/jour', 'Rate limit 500/s', 'Webhooks avancés', 'Support prioritaire'],
    },
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
          <Text style={styles.headerTitle}>KORA FOR DEVELOPERS</Text>
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
              <CodeIcon size={48} />
            </View>
            <Text style={styles.heroTitle}>API KORA</Text>
            <Text style={styles.heroSubtitle}>
              Construisez des applications innovantes{'\n'}
              sur l'infrastructure culturelle KORA.
            </Text>
          </View>

          {/* Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>CHOISISSEZ VOTRE PLAN</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansScroll}
            >
              {plans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  name={plan.name}
                  price={plan.price}
                  features={plan.features}
                  recommended={plan.recommended}
                  onSelect={() => setSelectedPlan(plan.name)}
                />
              ))}
            </ScrollView>
            {selectedPlan && (
              <View style={styles.selectedPlanBadge}>
                <Text style={styles.selectedPlanText}>Plan sélectionné : {selectedPlan}</Text>
              </View>
            )}
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>VOTRE PROJET</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du projet *</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Ex: MyMusic App"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={projectDescription}
                onChangeText={setProjectDescription}
                placeholder="Décrivez votre projet et comment vous utiliserez l'API KORA..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Site web (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://votresite.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="url"
              />
            </View>
          </View>

          {/* API Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>CAPABILITIES API</Text>
            <View style={styles.featuresList}>
              {[
                'Catalogue KORA (recherche, métadonnées)',
                'FrekCore Ingestion (publication)',
                'CVE Metrics (analytics culturelles)',
                'Webhooks (events temps réel)',
                'Embeds (lecteur intégrable)',
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureCode}>→</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity 
            style={[styles.submitButton, (!selectedPlan || !projectName) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedPlan || !projectName || loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedPlan && projectName ? [COLORS.gold, '#D4B55A'] : ['#444', '#333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.submitText}>DEMANDER L'ACCÈS API</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            En demandant l'accès, vous acceptez les conditions d'utilisation
            de l'API KORA et la politique de quotas.
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
  plansSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 16,
  },
  plansScroll: {
    paddingRight: 24,
    gap: 12,
  },
  planCard: {
    width: 160,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  planCardRecommended: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 8,
    color: COLORS.dark,
    letterSpacing: 1,
  },
  planName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: '#FAF9F6',
    marginBottom: 8,
    marginTop: 4,
  },
  planPrice: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.gold,
    marginBottom: 12,
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planFeatureText: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  planSelectButton: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
  },
  planSelectText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  selectedPlanBadge: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPlanText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.gold,
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
  featuresSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCode: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 14,
    color: COLORS.gold,
  },
  featureText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
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
