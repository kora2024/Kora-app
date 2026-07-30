/**
 * KORA Index — Entry Point (Racine `/`)
 * 
 * FLUX UTILISATEUR KORA (Section 1 — Fondation):
 * 
 * ÉTAPE 1 — Landing Page CVLN Motion (racine `/`)
 *   → Accessible à tous (public)
 *   → Bouton "Commencer" → Inscription
 *   → Bouton "Se connecter" → Connexion
 * 
 * ÉTAPE 2 — Inscription/Connexion
 *   → Email + Password (ou OAuth futur)
 * 
 * ÉTAPE 3 — Onboarding 60s (Sprint 1.5 — Phase B)
 *   → Territoires culturels
 *   → Langues préférées
 *   → Genres musicaux
 *   → Créateurs favoris
 *   → Génération FREK-ID
 * 
 * ÉTAPE 4 — Paywall (optionnel - si non premium)
 *   → Proposition abonnement PREMIUM
 * 
 * ÉTAPE 5 — Home (expérience principale)
 *   → Feed personnalisé basé sur l'onboarding
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/theme';

const AUTH_TOKEN_KEY = 'kora_auth_token';
const ONBOARDING_COMPLETED_KEY = 'kora_onboarding_completed';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      
      setIsAuthenticated(!!token);
      setHasCompletedOnboarding(onboardingCompleted === 'true');
    } catch (error) {
      console.log('Error checking auth status:', error);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  // FLUX DE NAVIGATION KORA (Section 1 — Fondation):
  // 
  // 1. Non authentifié → Landing Page CVLN Motion
  // 2. Authentifié + pas onboardé → Onboarding 60s
  // 3. Authentifié + onboardé → Home (feed personnalisé)
  
  if (!isAuthenticated) {
    // ÉTAPE 1: Landing Page CVLN Motion
    return <Redirect href="/landing" />;
  }
  
  if (!hasCompletedOnboarding) {
    // ÉTAPE 3: Onboarding 60s (territoires, langues, genres, créateurs, FREK-ID)
    return <Redirect href="/onboarding" />;
  }
  
  // ÉTAPE 5: Home avec feed personnalisé
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
