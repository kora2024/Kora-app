/**
 * KORA Index — Entry Point
 * 
 * Nouveau flux d'entrée KORA:
 * 1. Landing Page → Inscription/Connexion
 * 2. Post-auth → Onboarding (Éveil) si premier login
 * 3. Post-onboarding → Globe/App principale
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

  // Flux de navigation:
  // 1. Pas authentifié → Landing Page
  // 2. Authentifié mais pas onboardé → Éveil
  // 3. Authentifié et onboardé → Biométrie → App
  
  if (!isAuthenticated) {
    return <Redirect href="/landing" />;
  }
  
  if (!hasCompletedEveil) {
    return <Redirect href="/eveil" />;
  }
  
  return <Redirect href="/biometric" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
