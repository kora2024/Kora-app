/**
 * KORA Root Layout — Netflix Premium Typography + Global DSP Mini-Player
 * 
 * Configuration des animations de navigation :
 * - default: fade simple (280ms)
 * - orbite: slide_from_bottom (expansion orbitale)
 * - noyau: slide_from_right (descente centrale)
 * - eveil: fade (onboarding)
 * - tabs: fade
 * 
 * UPDATED: Fonts loaded via expo-font (no @expo-google-fonts)
 * ADDED: Global MiniPlayer persists across all screens
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/theme';
import TransitionOverlay from '../src/components/TransitionOverlay';
import { ToastContainer } from '../src/components/Toast';
import MiniPlayer from '../src/components/MiniPlayer';

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

// ══════════════════════════════════════════════════════════════════════════════
// FONT CONFIGURATION — System fonts fallback (no @expo-google-fonts)
// Using Platform-specific system fonts as fallback for premium look
// ══════════════════════════════════════════════════════════════════════════════

const FONT_FALLBACK = {
  // Playfair Display → Georgia (serif) fallback
  'PlayfairDisplay_400Regular': Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  'PlayfairDisplay_700Bold': Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'serif' }),
  'PlayfairDisplay_400Regular_Italic': Platform.select({ ios: 'Georgia-Italic', android: 'serif', default: 'serif' }),
  'PlayfairDisplay_700Bold_Italic': Platform.select({ ios: 'Georgia-BoldItalic', android: 'serif', default: 'serif' }),
  // Jost → System (San Francisco/Roboto) fallback
  'Jost_200ExtraLight': Platform.select({ ios: 'System', android: 'sans-serif-light', default: 'sans-serif' }),
  'Jost_300Light': Platform.select({ ios: 'System', android: 'sans-serif-light', default: 'sans-serif' }),
  'Jost_400Regular': Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  'Jost_500Medium': Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  // JetBrains Mono → Courier fallback
  'JetBrainsMono_400Regular': Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
};

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  // Load fonts using system fallbacks (no @expo-google-fonts dependency)
  const loadFonts = useCallback(async () => {
    try {
      // Use system fonts directly - no external font loading needed
      // This ensures compatibility across all platforms without @expo-google-fonts
      console.log('Using system font fallbacks for KORA');
      setFontsLoaded(true);
    } catch (error) {
      console.warn('Font setup failed:', error);
      setFontError(error as Error);
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
    <View style={styles.rootContainer}>
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
      
      {/* Global DSP Mini-Player — persists across all screens */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
