/**
 * KORA Eclat Detail Modal — UPGRADE 14
 * 
 * Modal affichant les détails d'un Éclat :
 * - Onde sonore
 * - Transcription
 * - Bouton play
 * - Informations de localisation
 * 
 * // La transcription permet de comprendre sans écouter
 * // KORA respecte tous les modes de vie.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, TYPOGRAPHY, SPACING } from '../theme';
import { haptic } from '../utils/haptics';
import { Eclat } from '../utils/eclatStorage';
import { VoiceWavePlaceholder } from './VoiceWave';
import TranscriptionText from './TranscriptionText';
import { PlayIcon, CloseIcon, GlobeIcon } from './icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface EclatDetailModalProps {
  visible: boolean;
  eclat: Eclat | null;
  onClose: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function EclatDetailModal({
  visible,
  eclat,
  onClose,
}: EclatDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Animate in when visible
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
    }
  }, [visible]);

  // Cleanup sound on unmount or close
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Stop playback when modal closes
  useEffect(() => {
    if (!visible && soundRef.current) {
      soundRef.current.stopAsync();
      setIsPlaying(false);
      setPlaybackProgress(0);
    }
  }, [visible]);

  const handlePlayPause = async () => {
    if (!eclat) return;

    haptic.light();

    if (isPlaying) {
      // Pause
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } else {
      // Play
      try {
        if (soundRef.current) {
          await soundRef.current.playAsync();
        } else {
          const { sound } = await Audio.Sound.createAsync(
            { uri: eclat.audioPath },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          soundRef.current = sound;
        }
        setIsPlaying(true);
      } catch (e) {
        console.error('Error playing audio:', e);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        setPlaybackProgress(status.positionMillis / status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackProgress(0);
      }
    }
  };

  const handleClose = async () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!eclat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.locationRow}>
              <GlobeIcon size={14} color={COLORS.gray} />
              <Text style={styles.locationText}>{eclat.territoire}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={COLORS.cream} />
            </TouchableOpacity>
          </View>

          {/* Wave visualization */}
          <View style={styles.waveSection}>
            <VoiceWavePlaceholder isRecording={isPlaying} />
            
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${playbackProgress * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Play button */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isPlaying ? [COLORS.gold, '#FFA500'] : [COLORS.terra, '#8B4A3A']}
              style={styles.playBtnGradient}
            >
              {isPlaying ? (
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              ) : (
                <PlayIcon size={28} color={COLORS.cream} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Duration */}
          <Text style={styles.duration}>{formatDuration(eclat.duration)}</Text>

          {/* Transcription */}
          <View style={styles.transcriptionSection}>
            <TranscriptionText text={eclat.transcription} maxLines={3} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.dateText}>{formatDate(eclat.createdAt)}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SW * 0.9,
    maxWidth: 400,
    backgroundColor: COLORS.dark2,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    ...TYPOGRAPHY.meta,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 2,
  },
  playBtn: {
    marginVertical: SPACING.md,
  },
  playBtnGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 8,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: COLORS.cream,
    borderRadius: 2,
  },
  duration: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  transcriptionSection: {
    width: '100%',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footer: {
    width: '100%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  dateText: {
    ...TYPOGRAPHY.meta,
  },
});
