/**
 * KORA Root Layout — UPGRADE 7 (Transitions Fluides)
 * 
 * Configuration des animations de navigation :
 * - default: fade simple (280ms)
 * - orbite: slide_from_bottom (expansion orbitale)
 * - noyau: slide_from_right (descente centrale)
 * - eveil: fade (onboarding)
 * - tabs: fade
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Jost_200ExtraLight,
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
} from '@expo-google-fonts/jost';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/theme';
import TransitionOverlay from '../src/components/TransitionOverlay';

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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold_Italic,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    JetBrainsMono_400Regular,
  });

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
        
        {/* Onboarding — fade lent */}
        <Stack.Screen 
          name="eveil" 
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
        
        {/* Tabs principaux — fade cinématique */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: TRANSITION_DURATION.cinematic,
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
