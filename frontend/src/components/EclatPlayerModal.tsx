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
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SPACING } from '../theme';
import { haptic } from '../utils/haptics';
import { Eclat } from '../utils/eclatStorage';

const { width: SW } = Dimensions.get('window');

interface EclatPlayerModalProps {
  visible: boolean;
  eclat: Eclat | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function EclatPlayerModal({
  visible,
  eclat,
  onClose,
  onDelete,
}: EclatPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setIsPlaying(false);
      setPlaybackProgress(0);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }
  }, [visible]);

  // Animate wave during playback
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  const handlePlayPause = async () => {
    if (!eclat) return;

    try {
      if (isPlaying && soundRef.current) {
        // Pause
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        haptic.light();
      } else {
        // Play
        haptic.eveille();
        
        if (!soundRef.current) {
          // Load sound
          const { sound } = await Audio.Sound.createAsync(
            { uri: eclat.audioPath },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );
          soundRef.current = sound;
        } else {
          await soundRef.current.playAsync();
        }
        
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Playback error:', e);
      setIsPlaying(false);
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
        haptic.propulse();
      }
    }
  };

  const handleDelete = () => {
    if (eclat && onDelete) {
      haptic.resonne();
      onDelete(eclat.id);
      onClose();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!eclat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <View style={styles.content}>
          {/* Avatar */}
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>✨</Text>
            </View>
            <View style={styles.avatarGlow} />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Mon Éclat</Text>
          <Text style={styles.subtitle}>
            {eclat.territoire} · {formatDate(eclat.createdAt)}
          </Text>

          {/* Waveform visualization */}
          <View style={styles.waveformContainer}>
            {[...Array(20)].map((_, i) => {
              const baseHeight = 8 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: isPlaying ? baseHeight + 10 : baseHeight,
                      opacity: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                      backgroundColor: i < playbackProgress * 20 ? COLORS.terra : 'rgba(166, 93, 71, 0.4)',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {formatTime(playbackProgress * eclat.duration)}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${playbackProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {formatTime(eclat.duration)}
            </Text>
          </View>

          {/* Play button */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <View style={styles.playBtnInner}>
              <Text style={styles.playBtnIcon}>
                {isPlaying ? '⏸' : '▶️'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
              <Text style={styles.actionBtnText}>🗑 Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xl,
    width: SW - 48,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.terra,
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 30,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 3,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  progressText: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 12,
    color: COLORS.gray,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 2,
  },
  playBtn: {
    marginBottom: 30,
  },
  playBtnInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnIcon: {
    fontSize: 28,
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  actionBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(166, 93, 71, 0.2)',
    borderRadius: 20,
  },
  closeBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.terra,
  },
});
