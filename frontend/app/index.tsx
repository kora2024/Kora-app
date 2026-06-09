/**
 * KORA Index — Entry Point (Racine `/`)
 * 
 * FLUX UTILISATEUR KORA:
 * 
 * ÉTAPE 1 — Landing Page (racine `/`)
 *   → Accessible à tous (public)
 *   → Bouton "Commencer" → Inscription
 *   → Bouton "Se connecter" → Connexion
 * 
 * ÉTAPE 2 — Inscription/Connexion
 *   → FREK-ID généré silencieusement
 * 
 * ÉTAPE 3 — Onboarding (si premier login)
 *   → Territoires & genres
 * 
 * ÉTAPE 4 — Feed (expérience principale)
 *   → Globe comme navigation territoriale
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/theme';

const AUTH_TOKEN_KEY = 'kora_auth_token';
const EVEIL_COMPLETED_KEY = 'kora_eveil_completed';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedEveil, setHasCompletedEveil] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const eveilCompleted = await AsyncStorage.getItem(EVEIL_COMPLETED_KEY);
      
      setIsAuthenticated(!!token);
      setHasCompletedEveil(eveilCompleted === 'true');
    } catch (error) {
      console.log('Error checking auth status:', error);
      setIsAuthenticated(false);
      setHasCompletedEveil(false);
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

  // FLUX DE NAVIGATION KORA:
  // 
  // 1. Non authentifié → Landing Page (la racine affiche la landing)
  // 2. Authentifié + pas onboardé → Onboarding (Éveil)
  // 3. Authentifié + onboardé → Home (expérience unifiée)
  
  if (!isAuthenticated) {
    // ÉTAPE 1: Landing Page publique
    return <Redirect href="/landing" />;
  }
  
  if (!hasCompletedEveil) {
    // ÉTAPE 3: Onboarding pour calibrer l'expérience
    return <Redirect href="/eveil" />;
  }
  
  // ÉTAPE 4: Home unifiée (tout KORA en un seul écran)
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
