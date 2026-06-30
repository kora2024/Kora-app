/**
 * KORA Mini-Player — DSP-Style Bottom Bar
 * 
 * Spotify/Apple Music level persistent player
 * Animated touch feedback, expandable to full-screen
 */

import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';
import { usePlayerStore } from '../stores/playerStore';

const { width: SW } = Dimensions.get('window');

const MINI_PLAYER_HEIGHT = 72;

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function PlayIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function PauseIcon({ size = 24, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </Svg>
  );
}

function SkipForwardIcon({ size = 22, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 4l10 8-10 8V4zm14-1v14h-2V5h2z" />
    </Svg>
  );
}

function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
        fill={filled ? COLORS.terra : 'transparent'}
        stroke={filled ? COLORS.terra : 'rgba(255,255,255,0.5)'}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

function QueueIcon({ size = 20, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <Path d="M3 6h18M3 10h18M3 14h12M3 18h12" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M18 15l-6-6-6 6" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED WAVEFORM
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedWaveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = [0, 1, 2, 3];
  const animations = useRef(bars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (isPlaying) {
      bars.forEach((_, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations[i], {
              toValue: 0.5 + Math.random() * 0.5,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(animations[i], {
              toValue: 0.3,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      bars.forEach((_, i) => {
        animations[i].stopAnimation();
        Animated.timing(animations[i], {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.waveform}>
      {bars.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              backgroundColor: i % 2 === 0 ? COLORS.terra : COLORS.gold,
              transform: [{ scaleY: animations[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI PLAYER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Store state
  const {
    currentTrack,
    isPlaying,
    progress,
    isLiked,
    isMiniPlayerVisible,
    setIsPlaying,
    toggleLike,
    setExpanded,
    playNext,
  } = usePlayerStore();

  // Animations
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const artworkRotate = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Show/hide animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isMiniPlayerVisible && currentTrack ? 0 : 100,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isMiniPlayerVisible, currentTrack]);

  // Artwork rotation when playing
  useEffect(() => {
    if (isPlaying) {
      rotationRef.current = Animated.loop(
        Animated.timing(artworkRotate, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      rotationRef.current.start();
    } else {
      if (rotationRef.current) {
        rotationRef.current.stop();
      }
    }
  }, [isPlaying]);

  const rotation = artworkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Touch feedback animation
  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, []);

  // Actions
  const handlePlayPause = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setIsPlaying(!isPlaying);
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [isPlaying, setIsPlaying]);

  const handleSkipNext = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    playNext();
  }, [playNext]);

  const handleLike = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    toggleLike();
  }, [toggleLike]);

  const handleExpand = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    // Navigate to player with current track
    if (currentTrack) {
      router.push({
        pathname: '/player',
        params: {
          id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          type: currentTrack.type || 'audio',
          source: currentTrack.source || 'kora',
          stream_url: currentTrack.stream_url || '',
          artwork: currentTrack.artwork || '',
        },
      });
    }
  }, [currentTrack, router]);

  // Don't render if no track or not visible
  if (!currentTrack || !isMiniPlayerVisible) {
    return null;
  }

  const bottomOffset = insets.bottom > 0 ? insets.bottom : 16;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.blurContainer}>
        {/* Progress Bar at top */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <Pressable
          style={styles.content}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleExpand}
        >
          {/* Left: Artwork + Waveform */}
          <View style={styles.leftSection}>
            <Animated.View style={[styles.artworkContainer, { transform: [{ rotate: rotation }] }]}>
              <Image
                source={{ uri: currentTrack.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200' }}
                style={styles.artwork}
              />
            </Animated.View>
            <AnimatedWaveform isPlaying={isPlaying} />
          </View>

          {/* Center: Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>

          {/* Right: Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleLike} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <HeartIcon filled={isLiked} size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
              <LinearGradient
                colors={[COLORS.terra, '#8B4D3B']}
                style={styles.playBtnGradient}
              >
                {isPlaying ? (
                  <PauseIcon size={18} color={COLORS.cream} />
                ) : (
                  <PlayIcon size={18} color={COLORS.cream} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleSkipNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <SkipForwardIcon size={20} color={COLORS.cream} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.expandBtn} onPress={handleExpand} hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}>
              <ChevronUpIcon size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'android' ? 'rgba(20,20,20,0.95)' : 'rgba(20,20,20,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trackTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  },
  trackArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtn: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
