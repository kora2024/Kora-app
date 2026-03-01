import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../src/theme';

const { width: SW, height: SHH } = Dimensions.get('window');

// ──────────── DATA ────────────

const CENTRAL_ECLAT = {
  emoji: '🎵',
  text: 'La kora résonne dans chaque algorithme. Nos ancêtres codaient en musique.',
  author: '— Kévin Désir',
};

const ORBITAL_BUBBLES = [
  { id: '1', emoji: '✦', text: 'Résonne mwen', speed: 10000, radius: 125, startAngle: 0 },
  { id: '2', emoji: '🌊', text: 'Eau pure', speed: 13000, radius: 140, startAngle: 60 },
  { id: '3', emoji: '⚡', text: 'Ancestral', speed: 8500, radius: 110, startAngle: 120 },
  { id: '4', emoji: '🔥', text: 'Feu sacré', speed: 15000, radius: 150, startAngle: 180 },
  { id: '5', emoji: '🌱', text: 'Mémoire vive', speed: 11000, radius: 130, startAngle: 240 },
  { id: '6', emoji: '💎', text: 'Trésor rare', speed: 17000, radius: 155, startAngle: 300 },
];

const DEPTH_DIALOGUES = [
  { author: 'Fatou', text: "C'est exactement ça. La kora est notre premier code.", sent: false },
  { author: 'Kwame', text: 'Chaque corde est une variable, chaque mélodie un algorithme. 🎵', sent: false },
  { author: 'Moi', text: 'Et nous sommes les compilateurs de cette tradition.', sent: true },
];

// ──────────── ORBITAL BUBBLE ────────────

function OrbitalBubble({
  bubble,
  centerX,
  centerY,
}: {
  bubble: typeof ORBITAL_BUBBLES[0];
  centerX: number;
  centerY: number;
}) {
  const rotAnim = useRef(new Animated.Value(0)).current;
  const [tapped, setTapped] = useState(false);
  const tapScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotAnim, {
        toValue: 1,
        duration: bubble.speed,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleTap = () => {
    setTapped((p) => !p);
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 1.2, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(tapScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const startAngleRad = (bubble.startAngle * Math.PI) / 180;

  const translateX = rotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.cos(startAngleRad) * bubble.radius,
      Math.cos(startAngleRad + Math.PI * 2) * bubble.radius,
    ],
  });

  const translateY = rotAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      Math.sin(startAngleRad) * bubble.radius,
      Math.sin(startAngleRad + Math.PI / 2) * bubble.radius,
      Math.sin(startAngleRad + Math.PI) * bubble.radius,
      Math.sin(startAngleRad + Math.PI * 1.5) * bubble.radius,
      Math.sin(startAngleRad + Math.PI * 2) * bubble.radius,
    ],
  });

  return (
    <Animated.View
      style={[
        styles.orbitalBubble,
        tapped && styles.orbitalBubbleTapped,
        {
          left: centerX - 42,
          top: centerY - 18,
          transform: [{ translateX }, { translateY }, { scale: tapScale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={0.8}
        style={styles.orbitalTouchable}
        testID={`orbital-bubble-${bubble.id}`}
      >
        <Text style={styles.orbitalEmoji}>{bubble.emoji}</Text>
        <Text style={[styles.orbitalText, tapped && styles.orbitalTextTapped]}>{bubble.text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ──────────── WAVE BARS ────────────

function WaveBar({ delay, maxH }: { delay: number; maxH: number }) {
  const height = useRef(new Animated.Value(3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(height, { toValue: maxH, duration: 250, useNativeDriver: false }),
        Animated.timing(height, { toValue: 3, duration: 350, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.waveBar, { height }]} />;
}

// ──────────── MAIN ────────────

export default function OrbiteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [depthRevealed, setDepthRevealed] = useState(false);

  // Hint animation
  const hintOpacity = useRef(new Animated.Value(0)).current;
  // Depth layer animation
  const depthOpacity = useRef(new Animated.Value(0)).current;
  const depthSlide = useRef(new Animated.Value(40)).current;
  // Card entrance
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  // Orbit entrance
  const orbitOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card entrance
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 5, delay: 200 }),
    ]).start();
    // Orbits fade in
    Animated.timing(orbitOpacity, { toValue: 1, duration: 800, delay: 500, useNativeDriver: true }).start();
    // Hint
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(hintOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(hintOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const revealDepth = useCallback(() => {
    if (depthRevealed) return;
    setDepthRevealed(true);
    Animated.timing(hintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(depthOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(depthSlide, { toValue: 0, useNativeDriver: true, speed: 12 }),
    ]).start();
  }, [depthRevealed]);

  const hideDepth = useCallback(() => {
    setDepthRevealed(false);
    Animated.parallel([
      Animated.timing(depthOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(depthSlide, { toValue: 40, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pinch detection via two-finger spread (PanResponder fallback)
  const lastDist = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length >= 2) {
          const t = evt.nativeEvent.touches;
          const dx = t[0].pageX - t[1].pageX;
          const dy = t[0].pageY - t[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastDist.current > 0 && dist > lastDist.current + 20) {
            revealDepth();
          } else if (lastDist.current > 0 && dist < lastDist.current - 20) {
            hideDepth();
          }
          lastDist.current = dist;
        }
      },
      onPanResponderRelease: () => {
        lastDist.current = 0;
      },
    })
  ).current;

  const centerX = SW / 2;
  const centerY = SHH * 0.38;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="orbite-screen"
      {...panResponder.panHandlers}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="orbite-back-btn"
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'L\'ORBITE'}</Text>
        {/* Toggle depth button as fallback for pinch */}
        <TouchableOpacity
          testID="orbite-depth-toggle"
          style={[styles.depthToggle, depthRevealed && styles.depthToggleActive]}
          onPress={depthRevealed ? hideDepth : revealDepth}
          activeOpacity={0.7}
        >
          <Text style={[styles.depthToggleText, depthRevealed && styles.depthToggleTextActive]}>
            {depthRevealed ? '◉' : '◎'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orbit zone */}
      <View style={styles.orbitZone}>
        {/* Orbital track rings (decorative) */}
        <View style={[styles.orbitRing, { width: 240, height: 240, left: centerX - 120, top: centerY - 120 }]} />
        <View style={[styles.orbitRing, { width: 300, height: 300, left: centerX - 150, top: centerY - 150, opacity: 0.02 }]} />

        {/* Orbital bubbles */}
        <Animated.View style={{ opacity: orbitOpacity }}>
          {ORBITAL_BUBBLES.map((b) => (
            <OrbitalBubble key={b.id} bubble={b} centerX={centerX} centerY={centerY} />
          ))}
        </Animated.View>

        {/* Central card */}
        <Animated.View
          style={[
            styles.centralCard,
            {
              left: centerX - 140,
              top: centerY - 80,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Text style={styles.centralEmoji}>{CENTRAL_ECLAT.emoji}</Text>
          <Text style={styles.centralText}>{CENTRAL_ECLAT.text}</Text>
          <Text style={styles.centralAuthor}>{CENTRAL_ECLAT.author}</Text>
        </Animated.View>
      </View>

      {/* Depth layer (dialogues + Griot) */}
      <Animated.View
        style={[
          styles.depthLayer,
          {
            opacity: depthOpacity,
            transform: [{ translateY: depthSlide }],
          },
        ]}
        pointerEvents={depthRevealed ? 'auto' : 'none'}
      >
        {/* Dialogues */}
        <View style={styles.dialoguesContainer}>
          {DEPTH_DIALOGUES.map((d, i) => (
            <View key={i} style={[styles.dialogBubble, d.sent ? styles.dialogSent : styles.dialogReceived]}>
              {!d.sent && <Text style={styles.dialogAuthor}>{d.author}</Text>}
              <Text style={styles.dialogText}>{d.text}</Text>
            </View>
          ))}
        </View>

        {/* Griot response */}
        <View style={styles.griotCard} testID="orbite-griot-card">
          <View style={styles.griotHeader}>
            <Text style={styles.griotLabel}>RÉPONSE GRIOT · FREK</Text>
            <View style={styles.frekBadge}>
              <Text style={styles.frekBadgeText}>FREK ✓</Text>
            </View>
          </View>
          <View style={styles.griotContent}>
            <View style={styles.griotAvatar}>
              <Text style={styles.griotAvatarText}>K</Text>
            </View>
            <View style={styles.griotInfo}>
              <Text style={styles.griotName}>Kévin Désir</Text>
              <View style={styles.griotAudioRow}>
                <View style={styles.waveBars}>
                  {[12, 18, 8, 22, 14, 10, 20, 6, 16, 12, 18, 8].map((h, i) => (
                    <WaveBar key={i} delay={i * 60} maxH={h} />
                  ))}
                </View>
                <Text style={styles.griotDuration}>1:47</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Hint */}
      <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
        <Text style={styles.hintText} testID="orbite-hint">
          Tap ◎ ou pinch out pour révéler les dialogues
        </Text>
      </Animated.View>
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    zIndex: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    marginTop: -1,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 3,
    marginLeft: 12,
  },
  depthToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depthToggleActive: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.15)',
  },
  depthToggleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  depthToggleTextActive: {
    color: COLORS.terra,
  },
  // Orbit zone
  orbitZone: {
    flex: 1,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
  },
  // Central card
  centralCard: {
    position: 'absolute',
    width: 280,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    zIndex: 5,
  },
  centralEmoji: {
    fontSize: 40,
    marginBottom: 14,
  },
  centralText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  centralAuthor: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  // Orbital bubbles
  orbitalBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    zIndex: 10,
  },
  orbitalBubbleTapped: {
    borderColor: COLORS.terra,
    backgroundColor: 'rgba(166,93,71,0.15)',
  },
  orbitalTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  orbitalEmoji: {
    fontSize: 13,
  },
  orbitalText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  orbitalTextTapped: {
    color: COLORS.terra,
  },
  // Depth layer
  depthLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 24,
    zIndex: 15,
  },
  dialoguesContainer: {
    marginBottom: 14,
    gap: 8,
  },
  dialogBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  dialogReceived: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  dialogSent: {
    backgroundColor: 'rgba(166,93,71,0.2)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  dialogAuthor: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
    marginBottom: 4,
  },
  dialogText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  },
  // Griot card
  griotCard: {
    backgroundColor: COLORS.dark2,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.3)',
    borderRadius: 16,
    padding: 16,
  },
  griotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  griotLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.terra,
    letterSpacing: 2,
  },
  frekBadge: {
    backgroundColor: 'rgba(166,93,71,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166,93,71,0.4)',
  },
  frekBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: COLORS.terra,
    letterSpacing: 0.5,
  },
  griotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  griotAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  griotAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  griotInfo: {
    flex: 1,
  },
  griotName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 6,
  },
  griotAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.terra,
    borderRadius: 2,
    opacity: 0.7,
  },
  griotDuration: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: COLORS.gray,
  },
  // Hint
  hintContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  hintText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
});
