/**
 * KORA Emission Mode — UPGRADE 12
 * 
 * Long press 800ms sur le Noyau → Mode Émission
 * Interface immersive de création d'Éclat vocal
 * 
 * - Noyau transformé (scale, couleur or, glow)
 * - Micro activé automatiquement
 * - Timer circulaire (2 min max)
 * - Swipe down pour annuler
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, FONTS, TYPOGRAPHY } from '../theme';
import { haptic } from '../utils/haptics';
import { saveEclatAudio, createEclat, Eclat } from '../utils/eclatStorage';
import { MicIcon } from './icons/KoraIcons';
import VoiceWave, { VoiceWavePlaceholder } from './VoiceWave';

const { width: SW, height: SH } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface EmissionModeProps {
  visible: boolean;
  onClose: () => void;
  onEclatCreated: (eclat: Eclat) => void;
  userLocation: { lat: number; lng: number };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const MAX_DURATION_MS = 120000; // 2 minutes
const NOYAU_SIZE = 180;
const NOYAU_RADIUS = NOYAU_SIZE / 2;

// ══════════════════════════════════════════════════════════════════════════════
// CIRCULAR PROGRESS TIMER
// ══════════════════════════════════════════════════════════════════════════════

function CircularTimer({ progress, size }: { progress: number; size: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Color interpolation: terracotta → gold
  const r = Math.round(166 + (255 - 166) * progress);
  const g = Math.round(93 + (215 - 93) * progress);
  const b = Math.round(71 + (0 - 71) * progress);
  const strokeColor = `rgb(${r},${g},${b})`;

  return (
    <Svg width={size} height={size} style={styles.timerSvg}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EMISSION MODE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function EmissionMode({
  visible,
  onClose,
  onEclatCreated,
  userLocation,
}: EmissionModeProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [metering, setMetering] = useState(-160); // Audio metering in dB
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation refs
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const noyauScale = useRef(new Animated.Value(1)).current;
  const noyauGlow = useRef(new Animated.Value(1)).current;
  const micOpacity = useRef(new Animated.Value(0)).current;
  const cvlnOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Swipe to dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          // Swipe down threshold reached — cancel
          handleCancel();
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ────────────────────────────────────────────────────────────────────────────
  // ENTER EMISSION MODE
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      enterEmissionMode();
    } else {
      resetState();
    }
  }, [visible]);

  const enterEmissionMode = async () => {
    // Haptic feedback
    haptic.heavy();

    // Animate overlay and noyau transformation
    Animated.parallel([
      // Overlay fade in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Noyau scale up
      Animated.spring(noyauScale, {
        toValue: 1.3,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      // Glow intensifies
      Animated.timing(noyauGlow, {
        toValue: 3,
        duration: 400,
        useNativeDriver: true,
      }),
      // CVLN text fades out
      Animated.timing(cvlnOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      // Mic icon fades in
      Animated.timing(micOpacity, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
      // Title fades in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start recording automatically
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RECORDING
  // ────────────────────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission denied');
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording with metering enabled
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);

      haptic.light();

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDuration(elapsed);

        // Auto-stop at 2 minutes
        if (elapsed >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      // Start metering updates
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              setMetering(status.metering);
            }
          } catch (e) {
            // Ignore errors during status check
          }
        }
      }, 50); // Update metering every 50ms for smooth visualization
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      setMetering(-160); // Reset metering

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri && recordingDuration > 1000) {
        // Save the Éclat
        setIsSaving(true);
        haptic.success();

        const audioPath = await saveEclatAudio(uri);
        const newEclat = await createEclat({
          audioPath,
          duration: recordingDuration,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        // Animate out
        await animateOut();

        onEclatCreated(newEclat);
        onClose();
      } else {
        // Too short — cancel
        handleCancel();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      handleCancel();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CANCEL / CLOSE
  // ────────────────────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    // Stop recording if active
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
    }
    setMetering(-160);

    haptic.light();
    await animateOut();
    onClose();
  };

  const animateOut = () => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(noyauScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SH,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  };

  const resetState = () => {
    overlayOpacity.setValue(0);
    noyauScale.setValue(1);
    noyauGlow.setValue(1);
    micOpacity.setValue(0);
    cvlnOpacity.setValue(1);
    titleOpacity.setValue(0);
    translateY.setValue(0);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsSaving(false);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  if (!visible) return null;

  const progress = recordingDuration / MAX_DURATION_MS;
  const minutes = Math.floor(recordingDuration / 60000);
  const seconds = Math.floor((recordingDuration % 60000) / 1000);
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Noyau glow color interpolation
  const glowColor = progress > 0.5 ? COLORS.gold : COLORS.terra;

  return (
    <Animated.View
      style={[styles.container, { opacity: overlayOpacity }]}
      {...panResponder.panHandlers}
    >
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Swipe indicator */}
      <View style={styles.swipeIndicator}>
        <View style={styles.swipeBar} />
        <Text style={styles.swipeHint}>Glisse vers le bas pour annuler</Text>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Title */}
        <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
          <Text style={styles.title}>Émets ton éclat</Text>
          <Text style={styles.subtitle}>Parle. 2 minutes max.</Text>
        </Animated.View>

        {/* Transformed Noyau */}
        <Animated.View
          style={[
            styles.noyauContainer,
            {
              transform: [
                { scale: Animated.multiply(noyauScale, pulseAnim) },
              ],
            },
          ]}
        >
          {/* Glow aura */}
          <Animated.View
            style={[
              styles.noyauGlow,
              {
                opacity: Animated.multiply(noyauGlow, 0.2),
                backgroundColor: glowColor,
              },
            ]}
          />

          {/* Circular timer */}
          <CircularTimer progress={progress} size={NOYAU_SIZE + 20} />

          {/* Noyau sphere */}
          <LinearGradient
            colors={
              progress > 0.5
                ? ['#FFD700', '#FFA500', '#CC8400']
                : ['#e8a882', COLORS.terra, '#6b2d1a']
            }
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.8, y: 0.9 }}
            style={styles.noyauSphere}
          >
            {/* Light reflection */}
            <View style={styles.noyauHighlight} />

            {/* CVLN text (fades out) */}
            <Animated.View style={{ opacity: cvlnOpacity }}>
              <Text style={styles.cvlnValue}>2 847</Text>
              <Text style={styles.cvlnLabel}>CVLN</Text>
            </Animated.View>

            {/* Mic icon (fades in) */}
            <Animated.View
              style={[styles.micContainer, { opacity: micOpacity }]}
            >
              <MicIcon size={48} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Voice Wave Visualization — UPGRADE 13 */}
        <View style={styles.voiceWaveContainer}>
          {Platform.OS === 'web' ? (
            <VoiceWavePlaceholder isRecording={isRecording} />
          ) : (
            <VoiceWave metering={metering} isRecording={isRecording} />
          )}
        </View>

        {/* Timer display */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeDisplay}</Text>
          <Text style={styles.timerMax}>/ 2:00</Text>
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Enregistrement en cours...</Text>
          </View>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <View style={styles.savingContainer}>
            <Text style={styles.savingText}>Création de l'Éclat...</Text>
          </View>
        )}

        {/* Release hint */}
        <Text style={styles.releaseHint}>
          Relâche pour terminer
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.95)',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  swipeHint: {
    ...TYPOGRAPHY.meta,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontFamily: FONTS.playfairItalic,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.meta,
    marginTop: 12,
  },
  // Noyau
  noyauContainer: {
    width: NOYAU_SIZE + 20,
    height: NOYAU_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noyauGlow: {
    position: 'absolute',
    width: NOYAU_SIZE * 1.8,
    height: NOYAU_SIZE * 1.8,
    borderRadius: NOYAU_SIZE * 0.9,
  },
  timerSvg: {
    position: 'absolute',
  },
  noyauSphere: {
    width: NOYAU_SIZE,
    height: NOYAU_SIZE,
    borderRadius: NOYAU_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noyauHighlight: {
    position: 'absolute',
    width: NOYAU_SIZE * 0.4,
    height: NOYAU_SIZE * 0.2,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 25,
    left: 30,
    transform: [{ rotate: '-20deg' }],
  },
  cvlnValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cvlnLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    textAlign: 'center',
  },
  micContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Voice Wave
  voiceWaveContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 20,
  },
  timerText: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 36,
    color: COLORS.cream,
  },
  timerMax: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 16,
    color: COLORS.gray,
    marginLeft: 8,
  },
  // Recording indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 8,
  },
  recordingText: {
    ...TYPOGRAPHY.meta,
    color: '#FF4444',
  },
  // Saving
  savingContainer: {
    marginTop: 24,
  },
  savingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gold,
  },
  // Release hint
  releaseHint: {
    ...TYPOGRAPHY.meta,
    marginTop: 60,
  },
});
