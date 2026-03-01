import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore, TERRITORIES, Territory } from '../../src/store/useKoraStore';
import { haptic } from '../../src/utils/haptics';
import KoraGlobe from '../../src/globe/KoraGlobe';

const { width: SW } = Dimensions.get('window');

// Loading component for Globe
function GlobeLoader() {
  return (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={['#0a1829', '#060d17']}
        style={styles.loadingGlobe}
      >
        <ActivityIndicator size="large" color={COLORS.blue} />
      </LinearGradient>
      <Text style={styles.loadingLabel}>Chargement du globe...</Text>
    </View>
  );
}

export default function GlobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTerritory, setActiveTerritory } = useKoraStore();
  const [globeReady, setGlobeReady] = useState(false);
  const [lastGPSClick, setLastGPSClick] = useState<{ lat: number; lng: number } | null>(null);

  // Animations
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const gpsToastOpacity = useRef(new Animated.Value(0)).current;

  // Mark globe as ready after mount
  useEffect(() => {
    const timer = setTimeout(() => setGlobeReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show hint after 2s, hide after 6s
    Animated.sequence([
      Animated.delay(2000),
      Animated.timing(hintOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(hintOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Card entrance
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 500, useNativeDriver: true }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Handle territory selection from globe
  const handleTerritorySelect = useCallback((territory: Territory) => {
    haptic.light();
    setActiveTerritory(territory);
  }, [setActiveTerritory]);

  // Handle double tap on territory
  const handleTerritoryDoubleTap = useCallback((territory: Territory) => {
    haptic.heavy();
    setActiveTerritory(territory);
    router.push('/(tabs)/feed');
  }, [setActiveTerritory, router]);

  // Handle GPS click (raycasting result)
  const handleGPSClick = useCallback((lat: number, lng: number) => {
    setLastGPSClick({ lat, lng });
    
    // Show GPS toast
    Animated.sequence([
      Animated.timing(gpsToastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(gpsToastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [gpsToastOpacity]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="globe-screen">
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoText} testID="globe-logo">KORA</Text>
        <TouchableOpacity style={styles.settingsBtn} testID="globe-settings-btn" activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Native Globe */}
      <View style={styles.globeContainer}>
        {Platform.OS === 'web' ? (
          // Web fallback - simple styled view with message
          <View style={styles.webFallback}>
            <LinearGradient
              colors={['#0a1829', '#060d17', '#000000']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.webGlobeCircle}>
              <Text style={styles.webGlobeEmoji}>🌍</Text>
            </View>
            <Text style={styles.webFallbackText}>Globe 3D interactif</Text>
            <Text style={styles.webFallbackSubtext}>Disponible sur l'app mobile</Text>
          </View>
        ) : (
          <KoraGlobe
            onTerritorySelect={handleTerritorySelect}
            onTerritoryDoubleTap={handleTerritoryDoubleTap}
            onGPSClick={handleGPSClick}
          />
        )}

        {/* Loading overlay */}
        {!globeReady && Platform.OS !== 'web' && <GlobeLoader />}
      </View>

      {/* GPS Coordinates Toast */}
      <Animated.View
        style={[
          styles.gpsToast,
          { opacity: gpsToastOpacity },
        ]}
        pointerEvents="none"
      >
        <View style={styles.gpsToastContent}>
          <Text style={styles.gpsToastIcon}>📍</Text>
          <View>
            <Text style={styles.gpsToastLabel}>Coordonnées GPS</Text>
            {lastGPSClick && (
              <Text style={styles.gpsToastCoords}>
                {lastGPSClick.lat.toFixed(3)}°, {lastGPSClick.lng.toFixed(3)}°
              </Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Territory preview card */}
      <Animated.View
        style={[
          styles.previewWrapper,
          { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
        ]}
      >
        <TouchableOpacity
          style={styles.previewCard}
          testID="globe-territory-preview"
          onPress={() => {
            haptic.medium();
            router.push('/(tabs)/territoire');
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.previewAvatar, { backgroundColor: activeTerritory.color }]}>
            <Text style={styles.previewAvatarText}>
              {activeTerritory.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName} testID="territory-name">{activeTerritory.name}</Text>
            <Text style={styles.previewSub} testID="territory-desc">
              {activeTerritory.population} habitants actifs ce soir
            </Text>
          </View>
          <Animated.View
            style={[
              styles.previewPulse,
              { backgroundColor: activeTerritory.color, transform: [{ scale: pulseAnim }] },
            ]}
          />
          <View style={[styles.previewPulseCore, { backgroundColor: activeTerritory.color }]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Hint */}
      <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
        <Text style={styles.hintText} testID="globe-hint">
          {'✋ Appui long + glisse pour plonger'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    zIndex: 10,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: COLORS.cream,
  },
  // Globe
  globeContainer: {
    flex: 1,
    marginTop: -10,
    backgroundColor: COLORS.dark,
  },
  // Web fallback
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webGlobeCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(26, 58, 92, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 127, 165, 0.3)',
  },
  webGlobeEmoji: {
    fontSize: 80,
  },
  webFallbackText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
    marginTop: 24,
  },
  webFallbackSubtext: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGlobe: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  loadingLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    letterSpacing: 1,
  },
  // GPS Toast
  gpsToast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  gpsToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsToastIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  gpsToastLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  gpsToastCoords: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  },
  // Preview card
  previewWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: 6,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(26,26,26,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  previewSub: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  previewPulse: {
    position: 'absolute',
    right: 18,
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.3,
  },
  previewPulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    right: 22,
  },
  // Hint
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  hintText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
});
