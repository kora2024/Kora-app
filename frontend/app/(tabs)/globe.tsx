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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore, TERRITORIES, Territory } from '../../src/store/useKoraStore';
import { haptic } from '../../src/utils/haptics';
import KoraGlobe, { GlobeRef } from '../../src/globe/KoraGlobe';
import VoiceRecordModal from '../../src/components/VoiceRecordModal';
import EclatPlayerModal from '../../src/components/EclatPlayerModal';
import { Eclat, getEclats, deleteEclat } from '../../src/utils/eclatStorage';
import {
  HomeIcon,
  SettingsIcon,
  PinIcon,
  MicIcon,
  GlobeIcon,
  CreateIcon,
} from '../../src/components/icons/KoraIcons';

const { width: SW } = Dimensions.get('window');

// Mock user location (Fort-de-France - sovereign territory, UTC-4)
const USER_LOCATION = { lat: 14.6, lng: -61.0 };
const IS_USER_SOVEREIGN = true;

// AsyncStorage key for first eclat state
const FIRST_ECLAT_KEY = 'hasCreatedFirstEclat';

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
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [eclats, setEclats] = useState<Eclat[]>([]);
  const [selectedEclat, setSelectedEclat] = useState<Eclat | null>(null);
  const [eclatPlayerVisible, setEclatPlayerVisible] = useState(false);
  
  // First launch state
  const [hasCreatedFirstEclat, setHasCreatedFirstEclat] = useState(true); // Default true to hide animations initially
  const [showFirstHint, setShowFirstHint] = useState(false);
  
  // Globe ref for camera control and adding eclats
  const globeRef = useRef<GlobeRef>(null);

  // Animations
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const gpsToastOpacity = useRef(new Animated.Value(0)).current;
  
  // UPGRADE 2 — First launch animations
  const fabPulseAnim = useRef(new Animated.Value(1)).current;
  const fabAuraAnim = useRef(new Animated.Value(0)).current;
  const fabTextOpacity = useRef(new Animated.Value(1)).current;
  const firstHintOpacity = useRef(new Animated.Value(0)).current;
  const fabPulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const fabAuraAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load first eclat state and eclats on mount
  useEffect(() => {
    loadFirstEclatState();
    loadEclats();
  }, []);

  const loadFirstEclatState = async () => {
    try {
      const value = await AsyncStorage.getItem(FIRST_ECLAT_KEY);
      const hasCreated = value === 'true';
      setHasCreatedFirstEclat(hasCreated);
      
      // If first time user, show hint and start FAB animations
      if (!hasCreated) {
        setShowFirstHint(true);
      }
    } catch (e) {
      console.log('Error loading first eclat state:', e);
    }
  };

  const loadEclats = async () => {
    const storedEclats = await getEclats();
    setEclats(storedEclats);
    console.log('Éclats chargés:', storedEclats.length);
    
    // If user has eclats but hasCreatedFirstEclat wasn't set, fix it
    if (storedEclats.length > 0) {
      setHasCreatedFirstEclat(true);
      setShowFirstHint(false);
      await AsyncStorage.setItem(FIRST_ECLAT_KEY, 'true');
    }
  };

  // Start FAB pulse and aura animations for first-time users
  useEffect(() => {
    if (!hasCreatedFirstEclat && globeReady) {
      // FAB Pulse animation: Scale 1 → 1.12 → 1, duration 1.5s, loop
      fabPulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fabPulseAnim, { 
            toValue: 1.12, 
            duration: 750, 
            useNativeDriver: true 
          }),
          Animated.timing(fabPulseAnim, { 
            toValue: 1, 
            duration: 750, 
            useNativeDriver: true 
          }),
        ])
      );
      fabPulseAnimRef.current.start();

      // FAB Aura animation: expand and fade
      fabAuraAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fabAuraAnim, { 
            toValue: 1, 
            duration: 1500, 
            useNativeDriver: true 
          }),
          Animated.timing(fabAuraAnim, { 
            toValue: 0, 
            duration: 0, 
            useNativeDriver: true 
          }),
        ])
      );
      fabAuraAnimRef.current.start();

      // Show first hint on globe after 1 second
      setTimeout(() => {
        if (!hasCreatedFirstEclat) {
          Animated.timing(firstHintOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          // Auto-hide after 5 seconds
          setTimeout(() => {
            Animated.timing(firstHintOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setShowFirstHint(false);
            });
          }, 5000);
        }
      }, 1000);
    }

    return () => {
      fabPulseAnimRef.current?.stop();
      fabAuraAnimRef.current?.stop();
    };
  }, [hasCreatedFirstEclat, globeReady]);

  // Mark globe as ready after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobeReady(true);
      // Add existing eclats to globe after it's ready
      setTimeout(() => {
        eclats.forEach(eclat => {
          globeRef.current?.addEclat(eclat);
        });
      }, 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Add eclats to globe when they change (and globe is ready)
  useEffect(() => {
    if (globeReady && eclats.length > 0) {
      eclats.forEach(eclat => {
        globeRef.current?.addEclat(eclat);
      });
    }
  }, [globeReady]);

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
    
    // Focus camera on selected territory
    globeRef.current?.focusOnTarget(territory.lat, territory.lng);
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

  // Focus on user's sovereign territory
  const handleFocusHome = useCallback(() => {
    haptic.medium();
    globeRef.current?.focusOnTarget(USER_LOCATION.lat, USER_LOCATION.lng);
  }, []);

  // Open voice recording modal
  const handleOpenVoiceCapture = useCallback(() => {
    haptic.eveille();
    setVoiceModalVisible(true);
  }, []);

  // Handle new eclat created
  const handleEclatCreated = useCallback(async (eclat: Eclat) => {
    console.log('Nouvel Éclat créé:', eclat);
    
    // Add to local state
    setEclats(prev => [...prev, eclat]);
    
    // Add to globe immediately
    globeRef.current?.addEclat(eclat);
    
    // Focus on the new eclat location
    setTimeout(() => {
      globeRef.current?.focusOnTarget(eclat.lat, eclat.lng);
    }, 500);
    
    // UPGRADE 2: Stop first-launch animations after first Eclat
    if (!hasCreatedFirstEclat) {
      setHasCreatedFirstEclat(true);
      setShowFirstHint(false);
      
      // Stop animations
      fabPulseAnimRef.current?.stop();
      fabAuraAnimRef.current?.stop();
      fabPulseAnim.setValue(1);
      fabAuraAnim.setValue(0);
      
      // Fade out the text
      Animated.timing(fabTextOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Fade out first hint
      Animated.timing(firstHintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Save state
      await AsyncStorage.setItem(FIRST_ECLAT_KEY, 'true');
    }
    
    haptic.propulse();
  }, [hasCreatedFirstEclat]);

  // Handle eclat tap on globe
  const handleEclatTap = useCallback((eclat: Eclat) => {
    console.log('Éclat tappé:', eclat);
    setSelectedEclat(eclat);
    setEclatPlayerVisible(true);
  }, []);

  // Handle eclat delete
  const handleDeleteEclat = useCallback(async (id: string) => {
    await deleteEclat(id);
    setEclats(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="globe-screen">
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoText} testID="globe-logo">KORA</Text>
        <View style={styles.topBarRight}>
          {/* Eclat count badge */}
          {eclats.length > 0 && (
            <View style={styles.eclatBadge}>
              <Text style={styles.eclatBadgeText}>{eclats.length}</Text>
              <Text style={styles.eclatBadgeLabel}>éclats</Text>
            </View>
          )}
          {/* Home button */}
          <TouchableOpacity 
            style={styles.homeBtn} 
            onPress={handleFocusHome}
            activeOpacity={0.7}
          >
            <HomeIcon size={18} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} testID="globe-settings-btn" activeOpacity={0.7}>
            <SettingsIcon size={16} color={COLORS.cream} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Native Globe */}
      <View style={styles.globeContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <LinearGradient
              colors={['#0a1829', '#060d17', '#000000']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.webGlobeCircle}>
              <GlobeIcon size={60} color={COLORS.blue} />
            </View>
            <Text style={styles.webFallbackText}>Globe 3D interactif</Text>
            <Text style={styles.webFallbackSubtext}>Disponible sur l'app mobile</Text>
          </View>
        ) : (
          <KoraGlobe
            ref={globeRef}
            onTerritorySelect={handleTerritorySelect}
            onTerritoryDoubleTap={handleTerritoryDoubleTap}
            onGPSClick={handleGPSClick}
            onEclatTap={handleEclatTap}
            userLocation={USER_LOCATION}
            isUserSovereign={IS_USER_SOVEREIGN}
            eclats={eclats}
          />
        )}

        {/* Loading overlay */}
        {!globeReady && Platform.OS !== 'web' && <GlobeLoader />}

        {/* UPGRADE 2: First hint on globe center */}
        {showFirstHint && eclats.length === 0 && (
          <Animated.View 
            style={[
              styles.firstHintContainer,
              { opacity: firstHintOpacity }
            ]}
            pointerEvents="none"
          >
            <View style={styles.firstHintBubble}>
              <Text style={styles.firstHintText}>
                Appuie sur ✦ pour créer ton premier Éclat
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* GPS Coordinates Toast */}
      <Animated.View
        style={[styles.gpsToast, { opacity: gpsToastOpacity }]}
        pointerEvents="none"
      >
        <View style={styles.gpsToastContent}>
          <View style={styles.gpsToastIconContainer}>
            <PinIcon size={22} color={COLORS.gold} />
          </View>
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
          {'✋ Glissez pour explorer · Double-tap pour plonger'}
        </Text>
      </Animated.View>

      {/* UPGRADE 2: FAB with pulse animation for first-time users */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 90 }]}>
        {/* Expanding aura (first launch only) */}
        {!hasCreatedFirstEclat && (
          <Animated.View
            style={[
              styles.fabAura,
              {
                transform: [
                  {
                    scale: fabAuraAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ],
                opacity: fabAuraAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 0.3, 0],
                }),
              },
            ]}
          />
        )}
        
        {/* Main FAB button */}
        <Animated.View
          style={[
            styles.fabButtonAnimated,
            {
              transform: [{ scale: hasCreatedFirstEclat ? 1 : fabPulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleOpenVoiceCapture}
            activeOpacity={0.8}
            testID="voice-capture-fab"
          >
            <MicIcon size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* First launch text */}
        {!hasCreatedFirstEclat && (
          <Animated.Text
            style={[
              styles.fabInviteText,
              { opacity: fabTextOpacity },
            ]}
          >
            Parle. Ton monde t'écoute.
          </Animated.Text>
        )}
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecordModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onEclatCreated={handleEclatCreated}
        userLocation={USER_LOCATION}
        territoire="Fort-de-France"
      />

      {/* Eclat Player Modal */}
      <EclatPlayerModal
        visible={eclatPlayerVisible}
        eclat={selectedEclat}
        onClose={() => {
          setEclatPlayerVisible(false);
          setSelectedEclat(null);
        }}
        onDelete={handleDeleteEclat}
      />
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 2,
  },
  eclatBadge: {
    backgroundColor: 'rgba(166, 93, 71, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(166, 93, 71, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eclatBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.terra,
  },
  eclatBadgeLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.terra,
  },
  homeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnIcon: {
    fontSize: 18,
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
  // UPGRADE 2: First hint on globe
  firstHintContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstHintBubble: {
    backgroundColor: 'rgba(13, 13, 13, 0.7)',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  firstHintText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(244, 241, 234, 0.8)',
    letterSpacing: 0.5,
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
  // UPGRADE 2: FAB with animations
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fabAura: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
  },
  fabButtonAnimated: {
    // Wrapper for scale animation
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  fabInviteText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: 'rgba(244, 241, 234, 0.5)',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
});
