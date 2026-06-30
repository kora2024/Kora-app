/**
 * KORA Mini-Player — DSP-Style Bottom Bar (Spotify/Apple Music Level)
 * 
 * Features:
 * - Swipe UP to expand to full player
 * - Swipe DOWN to dismiss
 * - Interactive progress bar (seek by dragging)
 * - Animated waveform & rotating artwork
 * - Smooth transitions & haptic feedback
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';
import { usePlayerStore } from '../stores/playerStore';

const { width: SW, height: SH } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 68;
const SWIPE_THRESHOLD = 50;

// ══════════════════════════════════════════════════════════════════════════════
// ICONS (Animated versions)
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
      <Rect x="6" y="4" width="4" height="16" rx="1" />
      <Rect x="14" y="4" width="4" height="16" rx="1" />
    </Svg>
  );
}

function SkipBackIcon({ size = 20, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 20l-10-8 10-8V20zM5 19V5h2v14H5z" />
    </Svg>
  );
}

function SkipForwardIcon({ size = 20, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 4l10 8-10 8V4zm14-1v18h-2V3h2z" />
    </Svg>
  );
}

function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
        fill={filled ? COLORS.terra : 'transparent'}
        stroke={filled ? COLORS.terra : 'rgba(255,255,255,0.4)'}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED EQUALIZER (More dynamic)
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedEqualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = [0, 1, 2, 3, 4];
  const animations = useRef(bars.map(() => new Animated.Value(0.2))).current;
  const heights = [12, 18, 14, 20, 16];

  useEffect(() => {
    if (isPlaying) {
      bars.forEach((_, i) => {
        const animate = () => {
          Animated.sequence([
            Animated.timing(animations[i], {
              toValue: 0.4 + Math.random() * 0.6,
              duration: 150 + Math.random() * 150,
              useNativeDriver: true,
            }),
            Animated.timing(animations[i], {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 150 + Math.random() * 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isPlaying) animate();
          });
        };
        setTimeout(animate, i * 80);
      });
    } else {
      bars.forEach((_, i) => {
        animations[i].stopAnimation();
        Animated.timing(animations[i], {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.equalizer}>
      {bars.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.equalizerBar,
            {
              height: heights[i],
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
// PROGRESS BAR (Interactive with seek)
// ══════════════════════════════════════════════════════════════════════════════

function InteractiveProgressBar({ 
  progress, 
  onSeek 
}: { 
  progress: number; 
  onSeek: (progress: number) => void;
}) {
  const [seeking, setSeeking] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const barWidth = useRef(SW - 24);

  useEffect(() => {
    if (!seeking) {
      setLocalProgress(progress);
    }
  }, [progress, seeking]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setSeeking(true);
        try { Haptics.selectionAsync(); } catch {}
        const x = evt.nativeEvent.locationX;
        setLocalProgress(Math.max(0, Math.min(1, x / barWidth.current)));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        setLocalProgress(Math.max(0, Math.min(1, x / barWidth.current)));
      },
      onPanResponderRelease: () => {
        setSeeking(false);
        onSeek(localProgress);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      },
    })
  ).current;

  return (
    <View style={styles.progressContainer} {...panResponder.panHandlers}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { width: `${localProgress * 100}%` },
            seeking && styles.progressFillSeeking,
          ]} 
        />
        <View 
          style={[
            styles.progressThumb,
            { left: `${localProgress * 100}%` },
            seeking && styles.progressThumbActive,
          ]} 
        />
      </View>
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
    setMiniPlayerVisible,
    playNext,
    playPrevious,
    setProgress,
  } = usePlayerStore();

  // Animations
  const translateY = useRef(new Animated.Value(150)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const artworkRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Rotation animation for artwork
  useEffect(() => {
    let rotationAnim: Animated.CompositeAnimation;
    
    if (isPlaying) {
      rotationAnim = Animated.loop(
        Animated.timing(artworkRotate, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        })
      );
      rotationAnim.start();
      
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      artworkRotate.stopAnimation();
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (rotationAnim) rotationAnim.stop();
    };
  }, [isPlaying]);

  // Show/hide animation
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isMiniPlayerVisible && currentTrack ? 0 : 150,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [isMiniPlayerVisible, currentTrack]);

  const rotation = artworkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        try { Haptics.selectionAsync(); } catch {}
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward swipe for dismiss
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        } else if (gestureState.dy < -20) {
          // Swipe up - expand to full player
          dragY.setValue(gestureState.dy * 0.3);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          // Swipe down - dismiss
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
          setMiniPlayerVisible(false);
        } else if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swipe up - expand to full player
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
          handleExpand();
        }
        
        Animated.spring(dragY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Actions
  const handlePlayPause = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setIsPlaying(!isPlaying);
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [isPlaying, setIsPlaying]);

  const handleSkipNext = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    playNext();
  }, [playNext]);

  const handleSkipPrevious = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    playPrevious();
  }, [playPrevious]);

  const handleLike = useCallback(() => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    toggleLike();
  }, [toggleLike]);

  const handleExpand = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
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

  const handleSeek = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, [setProgress]);

  // Don't render if no track
  if (!currentTrack || !isMiniPlayerVisible) {
    return null;
  }

  const bottomOffset = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          transform: [
            { translateY: Animated.add(translateY, dragY) },
            { scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Interactive Progress Bar at top */}
      <InteractiveProgressBar progress={progress} onSeek={handleSeek} />

      <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(30,30,30,0.95)', 'rgba(20,20,20,0.98)']}
          style={styles.gradientOverlay}
        />

        <View style={styles.content}>
          {/* Left: Animated Artwork */}
          <TouchableOpacity onPress={handleExpand} activeOpacity={0.8}>
            <Animated.View 
              style={[
                styles.artworkContainer, 
                { 
                  transform: [
                    { rotate: rotation },
                    { scale: pulseAnim },
                  ] 
                }
              ]}
            >
              <Image
                source={{ uri: currentTrack.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200' }}
                style={styles.artwork}
              />
              {/* Vinyl effect */}
              <View style={styles.vinylCenter} />
            </Animated.View>
          </TouchableOpacity>

          {/* Equalizer */}
          <AnimatedEqualizer isPlaying={isPlaying} />

          {/* Track Info */}
          <TouchableOpacity style={styles.trackInfo} onPress={handleExpand} activeOpacity={0.8}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={handleLike}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HeartIcon filled={isLiked} size={18} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={handleSkipPrevious}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <SkipBackIcon size={18} color="rgba(255,255,255,0.7)" />
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

            <TouchableOpacity 
              style={styles.controlBtn} 
              onPress={handleSkipNext}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <SkipForwardIcon size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Swipe indicator */}
        <View style={styles.swipeIndicator} />
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
    left: 8,
    right: 8,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 14,
    overflow: 'visible',
    zIndex: 1000,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  progressContainer: {
    position: 'absolute',
    top: -6,
    left: 12,
    right: 12,
    height: 20,
    justifyContent: 'center',
    zIndex: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  progressFillSeeking: {
    backgroundColor: COLORS.terra,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    marginLeft: -5,
    opacity: 0,
  },
  progressThumbActive: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  blurContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  artworkContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.4)',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  vinylCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: 10,
    marginTop: -5,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    marginLeft: 10,
    gap: 2,
  },
  equalizerBar: {
    width: 3,
    borderRadius: 2,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trackTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 1,
  },
  trackArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  playBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
