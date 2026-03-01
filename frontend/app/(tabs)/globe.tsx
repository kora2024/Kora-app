import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore, TERRITORIES, Territory } from '../../src/store/useKoraStore';
import { getGlobeHTML } from '../../src/globe/globeHTML';
import { haptic } from '../../src/utils/haptics';

const { width: SW } = Dimensions.get('window');

export default function GlobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTerritory, setActiveTerritory } = useKoraStore();
  const [globeReady, setGlobeReady] = useState(false);

  // Hint animation
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Timeout fallback for globe loading (web/iframe)
  useEffect(() => {
    const timer = setTimeout(() => setGlobeReady(true), 3000);
    // Listen for iframe messages on web
    if (Platform.OS === 'web') {
      const handler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'ready') setGlobeReady(true);
          else if (data.type === 'select') {
            const territory = TERRITORIES.find((t) => t.id === data.territory.id);
            if (territory) setActiveTerritory(territory);
          } else if (data.type === 'doubletap') {
            const territory = TERRITORIES.find((t) => t.id === data.territory);
            if (territory) setActiveTerritory(territory);
            router.push('/(tabs)/feed');
          } else if (data.type === 'longpress_navigate') {
            router.push('/(tabs)/feed');
          }
        } catch {}
      };
      window.addEventListener('message', handler);
      return () => { clearTimeout(timer); window.removeEventListener('message', handler); };
    }
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

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setGlobeReady(true);
      } else if (data.type === 'select') {
        const territory = TERRITORIES.find((t) => t.id === data.territory.id);
        if (territory) setActiveTerritory(territory);
      } else if (data.type === 'doubletap') {
        const territory = TERRITORIES.find((t) => t.id === data.territory);
        if (territory) setActiveTerritory(territory);
        router.push('/(tabs)/feed');
      } else if (data.type === 'longpress_navigate') {
        router.push('/(tabs)/feed');
      }
    } catch (e) {
      // ignore
    }
  }, [setActiveTerritory, router]);

  const globeHtml = getGlobeHTML();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="globe-screen">
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoText} testID="globe-logo">KORA</Text>
        <TouchableOpacity style={styles.settingsBtn} testID="globe-settings-btn" activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Globe - Platform adaptive */}
      <View style={styles.globeContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={globeHtml}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0D0D0D' } as any}
            title="KORA Globe"
            allowFullScreen
          />
        ) : (
          <WebView
            testID="globe-webview"
            source={{ html: globeHtml }}
            style={styles.webview}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            onMessage={handleWebViewMessage}
            originWhitelist={['*']}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            overScrollMode="never"
            {...(Platform.OS === 'android' ? { hardwareAccelerationDisabledAndroid: false } : {})}
          />
        )}
        {/* Loading overlay */}
        {!globeReady && (
          <View style={styles.loadingOverlay}>
            <LinearGradient
              colors={['#0a1829', '#060d17']}
              style={styles.loadingGlobe}
            >
              <Text style={styles.loadingText}>◉</Text>
            </LinearGradient>
            <Text style={styles.loadingLabel}>Chargement du globe...</Text>
          </View>
        )}
      </View>

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
          onPress={() => router.push('/(tabs)/territoire')}
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
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
  loadingText: {
    fontSize: 24,
    color: COLORS.blue,
  },
  loadingLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    letterSpacing: 1,
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
