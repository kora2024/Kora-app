/**
 * KORA Player — Lecteur Audio/Vidéo Ultra Premium
 * 
 * Expérience immersive niveau Apple Music / Netflix
 * Transitions cinématiques, contrôles gestuels
 * Streaming audio réel depuis Internet Archive / Jamendo
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function PlayPauseIcon({ isPlaying, size = 64 }: { isPlaying: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {isPlaying ? (
        // Pause icon
        <>
          <Path d="M22 16H26V48H22V16Z" fill={COLORS.cream} />
          <Path d="M38 16H42V48H38V16Z" fill={COLORS.cream} />
        </>
      ) : (
        // Play icon
        <Path d="M20 12L52 32L20 52V12Z" fill={COLORS.cream} />
      )}
    </Svg>
  );
}

function SkipIcon({ direction, size = 32 }: { direction: 'back' | 'forward'; size?: number }) {
  const flip = direction === 'back' ? 'scale(-1, 1)' : 'scale(1, 1)';
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" style={{ transform: [{ scaleX: direction === 'back' ? -1 : 1 }] }}>
      <Path
        d="M6 16C6 10.477 10.477 6 16 6C21.523 6 26 10.477 26 16C26 21.523 21.523 26 16 26"
        stroke={COLORS.cream}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M16 10V16L20 18" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Text style={{ position: 'absolute', fontSize: 8 }}>15</Text>
    </Svg>
  );
}

function ChevronDownIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M7 10L14 17L21 10" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function HeartIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
        fill={filled ? COLORS.terra : 'none'}
        stroke={filled ? COLORS.terra : COLORS.cream}
        strokeWidth="2"
      />
    </Svg>
  );
}

function ShuffleIcon({ active, size = 24 }: { active: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16 3H21V8M4 20L21 3M21 16V21H16M15 15L21 21M4 4L9 9"
        stroke={active ? COLORS.terra : COLORS.cream}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function RepeatIcon({ mode, size = 24 }: { mode: 'off' | 'all' | 'one'; size?: number }) {
  const color = mode === 'off' ? COLORS.cream : COLORS.terra;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17 2L21 6L17 10M3 11V9C3 7.34 4.34 6 6 6H21M7 22L3 18L7 14M21 13V15C21 16.66 19.66 18 18 18H3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {mode === 'one' && (
        <Text style={{ position: 'absolute', fontSize: 8, color }}></Text>
      )}
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WAVEFORM VISUALIZER
// ══════════════════════════════════════════════════════════════════════════════

function WaveformVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = 40;
  const barAnims = useRef(
    Array.from({ length: bars }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      barAnims.forEach((anim, i) => {
        const randomDuration = 300 + Math.random() * 400;
        const randomDelay = i * 20;
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: randomDuration,
              delay: randomDelay,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: randomDuration,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      barAnims.forEach((anim) => {
        anim.stopAnimation();
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.waveformContainer}>
      {barAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              transform: [{ scaleY: anim }],
              backgroundColor: i % 3 === 0 ? COLORS.terra : 'rgba(255,255,255,0.3)',
            },
          ]}
        />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════════════════════════════════════

function ProgressBar({ progress, duration, onSeek }: { progress: number; duration: number; onSeek: (p: number) => void }) {
  const progressWidth = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.progressThumb,
            {
              left: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(progress * duration)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PLAYER SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const artworkScale = useRef(new Animated.Value(0.9)).current;
  const artworkRotate = useRef(new Animated.Value(0)).current;

  // API Base
  const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

  // Track state
  const [trackDetails, setTrackDetails] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(245);

  // Audio Player ref (we'll create it when we have the URL)
  const playerRef = useRef<any>(null);

  // Derived state
  const progress = duration > 0 ? currentTime / duration : 0;

  // Content from params or fetched
  const content = {
    id: params.id as string || '',
    title: trackDetails?.title || params.title as string || 'Titre inconnu',
    artist: trackDetails?.artist || params.artist as string || 'Artiste',
    album: trackDetails?.album || params.album as string || 'Album',
    artwork: trackDetails?.artwork || params.artwork as string || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    type: params.type as string || 'audio',
    source: params.source as string || 'archive',
  };

  // Initialize audio when streamUrl changes
  useEffect(() => {
    if (!streamUrl) return;

    const initAudio = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { createAudioPlayer } = await import('expo-audio');
        
        // Create player with URL source
        const newPlayer = createAudioPlayer({ uri: streamUrl });
        playerRef.current = newPlayer;
        
        console.log('🎵 Audio player initialized for:', streamUrl);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Audio init error:', err);
        setError('Erreur initialisation audio');
        setIsLoading(false);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.release();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [streamUrl]);

  // Fetch track details and stream URL
  useEffect(() => {
    const loadTrack = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If we have a direct stream_url from params, use it
        if (params.stream_url) {
          setStreamUrl(params.stream_url as string);
          return;
        }

        // Otherwise fetch from API
        if (params.id && params.source) {
          const res = await fetch(`${API_BASE}/api/catalog/track/${params.source}/${params.id}`);
          if (res.ok) {
            const data = await res.json();
            setTrackDetails(data);
            
            if (data.stream_url) {
              console.log('🎵 Stream URL loaded:', data.stream_url);
              setStreamUrl(data.stream_url);
            } else {
              setError('Aucune URL de streaming disponible');
              setIsLoading(false);
            }
          } else {
            setError('Track non trouvé');
            setIsLoading(false);
          }
        } else {
          setError('Informations de track manquantes');
        }
      } catch (err) {
        console.error('Error loading track:', err);
        setError('Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [params.id, params.source, params.stream_url]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(artworkScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Artwork rotation when playing (vinyl effect)
  useEffect(() => {
    if (isPlaying && content.type === 'audio') {
      Animated.loop(
        Animated.timing(artworkRotate, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      artworkRotate.stopAnimation();
    }
  }, [isPlaying, content.type]);

  const handleClose = useCallback(() => {
    // Stop audio before closing
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (e) {}
    }
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  }, [router]);

  const handlePlayPause = useCallback(async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    
    if (!streamUrl || !playerRef.current) {
      setError('Aucune piste audio chargée');
      return;
    }

    try {
      if (isPlaying) {
        await playerRef.current.pause();
        setIsPlaying(false);
      } else {
        await playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Play/Pause error:', e);
    }
    
    // Scale animation on tap
    Animated.sequence([
      Animated.timing(artworkScale, {
        toValue: isPlaying ? 0.95 : 1.02,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(artworkScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isPlaying, streamUrl]);

  const handleSkip = useCallback(async (direction: 'back' | 'forward') => {
    try { Haptics.selectionAsync(); } catch {}
    if (!playerRef.current) return;
    
    const delta = direction === 'back' ? -15 : 15;
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    try {
      await playerRef.current.seekTo(newTime * 1000); // Convert to milliseconds
      setCurrentTime(newTime);
    } catch (e) {
      console.error('Seek error:', e);
    }
  }, [duration, currentTime]);

  const handleSeek = useCallback(async (newProgress: number) => {
    if (!playerRef.current) return;
    
    const newTime = newProgress * duration;
    try {
      await playerRef.current.seekTo(newTime * 1000); // Convert to milliseconds
      setCurrentTime(newTime);
    } catch (e) {
      console.error('Seek error:', e);
    }
  }, [duration]);

  const handleLike = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setIsLiked(!isLiked);
  }, [isLiked]);

  const handleShuffle = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    setShuffle(!shuffle);
  }, [shuffle]);

  const handleRepeat = useCallback(() => {
    try { Haptics.selectionAsync(); } catch {}
    setRepeat((r) => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off');
  }, []);

  const rotation = artworkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Background blur */}
      <Image source={{ uri: content.artwork }} style={styles.bgImage} blurRadius={50} />
      <View style={styles.bgOverlay} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <ChevronDownIcon size={28} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSubtitle}>EN LECTURE</Text>
            <Text style={styles.headerTitle}>{content.album}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreText}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Animated.View
            style={[
              styles.artworkWrapper,
              {
                transform: [
                  { scale: artworkScale },
                  { rotate: content.type === 'audio' ? rotation : '0deg' },
                ],
              },
            ]}
          >
            <Image source={{ uri: content.artwork }} style={styles.artwork} />
            {content.type === 'audio' && (
              <View style={styles.vinylHole} />
            )}
          </Animated.View>
          
          {/* Waveform for audio */}
          {content.type === 'audio' && (
            <WaveformVisualizer isPlaying={isPlaying} />
          )}
        </View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackTitleRow}>
            <View style={styles.trackTitleContainer}>
              <Text style={styles.trackTitle}>{content.title}</Text>
              <Text style={styles.trackArtist}>{content.artist}</Text>
            </View>
            <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
              <HeartIcon filled={isLiked} size={28} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        <ProgressBar progress={progress} duration={duration} onSeek={handleSeek} />

        {/* Loading/Error states */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stream URL indicator */}
        {streamUrl && (
          <View style={styles.streamIndicator}>
            <View style={styles.streamDot} />
            <Text style={styles.streamText}>Streaming depuis {content.source}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleShuffle} style={styles.controlBtn}>
            <ShuffleIcon active={shuffle} size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleSkip('back')} style={styles.skipBtn}>
            <SkipIcon direction="back" size={32} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
            <LinearGradient
              colors={[COLORS.terra, '#8B4D3B']}
              style={styles.playBtnGradient}
            >
              <PlayPauseIcon isPlaying={isPlaying} size={40} />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => handleSkip('forward')} style={styles.skipBtn}>
            <SkipIcon direction="forward" size={32} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleRepeat} style={styles.controlBtn}>
            <RepeatIcon mode={repeat} size={24} />
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>Paroles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnText}>File d&apos;attente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.85)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 2,
  },
  headerTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  },
  moreBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 2,
  },
  // Artwork
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  artworkWrapper: {
    width: SW - 80,
    height: SW - 80,
    borderRadius: (SW - 80) / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vinylHole: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.dark,
    marginTop: -10,
    marginLeft: -10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginTop: 16,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
  },
  // Track info
  trackInfo: {
    marginTop: 20,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackTitleContainer: {
    flex: 1,
  },
  trackTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 26,
    color: COLORS.cream,
  },
  trackArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 18,
    color: COLORS.gray,
    marginTop: 4,
  },
  likeBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Progress
  progressContainer: {
    marginTop: 24,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.cream,
    marginLeft: -6,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 20,
  },
  controlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  playBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    gap: 40,
  },
  bottomBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bottomBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
    letterSpacing: 1,
  },
  // Loading & Error
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  errorOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: '#FF6B6B',
  },
  // Stream indicator
  streamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  streamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#46D369',
  },
  streamText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
});
