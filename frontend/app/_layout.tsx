/**
 * KORA Root Layout — Netflix Premium Typography
 * 
 * Configuration des animations de navigation :
 * - default: fade simple (280ms)
 * - orbite: slide_from_bottom (expansion orbitale)
 * - noyau: slide_from_right (descente centrale)
 * - eveil: fade (onboarding)
 * - tabs: fade
 * 
 * Fonts loaded via expo-font for better native compatibility
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/theme';
import TransitionOverlay from '../src/components/TransitionOverlay';
import { ToastContainer } from '../src/components/Toast';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// ══════════════════════════════════════════════════════════════════════════════
// TRANSITION CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const TRANSITION_DURATION = {
  fast: 200,
  normal: 280,
  slow: 400,
  cinematic: 500,
};

// Font configuration - using Google Fonts packages that are already installed
// These will fallback to system fonts if loading fails
const GOOGLE_FONTS = {
  'PlayfairDisplay_400Regular': require('@expo-google-fonts/playfair-display').PlayfairDisplay_400Regular,
  'PlayfairDisplay_700Bold': require('@expo-google-fonts/playfair-display').PlayfairDisplay_700Bold,
  'PlayfairDisplay_400Regular_Italic': require('@expo-google-fonts/playfair-display').PlayfairDisplay_400Regular_Italic,
  'PlayfairDisplay_700Bold_Italic': require('@expo-google-fonts/playfair-display').PlayfairDisplay_700Bold_Italic,
  'Jost_200ExtraLight': require('@expo-google-fonts/jost').Jost_200ExtraLight,
  'Jost_300Light': require('@expo-google-fonts/jost').Jost_300Light,
  'Jost_400Regular': require('@expo-google-fonts/jost').Jost_400Regular,
  'Jost_500Medium': require('@expo-google-fonts/jost').Jost_500Medium,
  'JetBrainsMono_400Regular': require('@expo-google-fonts/jetbrains-mono').JetBrainsMono_400Regular,
};

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  // Load fonts using expo-font for better native compatibility
  const loadFonts = useCallback(async () => {
    try {
      await Font.loadAsync(GOOGLE_FONTS);
      setFontsLoaded(true);
    } catch (error) {
      console.warn('Font loading failed, using system fonts:', error);
      setFontError(error as Error);
      // Continue with system fonts fallback
      setFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.terra} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      
      {/* Overlay de transition (flash subtil) */}
      <TransitionOverlay />
      
      {/* Toast notifications — UPGRADE 19 */}
      <ToastContainer />
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.dark },
          // Animation par défaut : fade élégant
          animation: 'fade',
          animationDuration: TRANSITION_DURATION.normal,
        }}
      >
        {/* Écran d'accueil */}
        <Stack.Screen 
          name="index"
          options={{
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.fast,
          }}
        />
        
        {/* Landing Page — PHASE A */}
        <Stack.Screen 
          name="landing" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.cinematic,
          }} 
        />
        
        {/* Auth screens — PHASE A */}
        <Stack.Screen 
          name="auth" 
          options={{ 
            gestureEnabled: false,
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.normal,
          }} 
        />
        
        {/* Onboarding — fade lent */}
        <Stack.Screen 
          name="eveil" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.slow,
          }} 
        />
        
        {/* Pacte Souverain — Rituel d'Éveil */}
        <Stack.Screen 
          name="pacte" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.slow,
          }} 
        />
        
        {/* Biometric — UPGRADE 17 */}
        <Stack.Screen 
          name="biometric" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.fast,
          }} 
        />
        
        {/* HOME — Expérience unifiée KORA (sans tabs) */}
        <Stack.Screen 
          name="home" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.cinematic,
          }} 
        />
        
        {/* Player — Lecteur média immersif */}
        <Stack.Screen 
          name="player" 
          options={{ 
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.cinematic,
            presentation: 'fullScreenModal',
          }} 
        />
        
        {/* Creator screens group — Profile & Studio */}
        <Stack.Screen 
          name="creator" 
          options={{ 
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.normal,
          }} 
        />
        
        {/* Paywall — Abonnement premium */}
        <Stack.Screen 
          name="paywall" 
          options={{ 
            animation: 'slide_from_bottom',
            animationDuration: TRANSITION_DURATION.slow,
            presentation: 'modal',
          }} 
        />
        
        {/* Orbite (commentaires) — expansion depuis le bas */}
        <Stack.Screen 
          name="orbite" 
          options={{ 
            animation: 'slide_from_bottom',
            animationDuration: TRANSITION_DURATION.normal,
            presentation: 'card',
          }} 
        />
        
        {/* Noyau — slide depuis la droite (descente) */}
        <Stack.Screen 
          name="noyau" 
          options={{ 
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.slow,
          }} 
        />
        
        {/* Settings — UPGRADE 18 */}
        <Stack.Screen 
          name="settings" 
          options={{ 
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.normal,
          }} 
        />
        
        {/* P2-P3: Playlists */}
        <Stack.Screen 
          name="playlists" 
          options={{ 
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.normal,
          }} 
        />
        
        {/* P2-P3: Podcasts */}
        <Stack.Screen 
          name="podcasts" 
          options={{ 
            animation: 'slide_from_right',
            animationDuration: TRANSITION_DURATION.normal,
          }} 
        />
        
        {/* P2-P3: Live Events */}
        <Stack.Screen 
          name="live" 
          options={{ 
            animation: 'slide_from_bottom',
            animationDuration: TRANSITION_DURATION.slow,
            presentation: 'card',
          }} 
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
