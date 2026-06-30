/**
 * KORA Player — Lecteur Audio/Vidéo Ultra Premium
 * 
 * Expérience immersive niveau Apple Music / Netflix
 * Support audio (expo-audio) et vidéo (expo-video)
 * Transitions cinématiques, contrôles gestuels
 * 
 * FIXED: Proper expo-audio SDK 54 usage
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { COLORS, FONTS } from '../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function PlayPauseIcon({ isPlaying, size = 64 }: { isPlaying: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {isPlaying ? (
        <>
          <Path d="M22 16H26V48H22V16Z" fill={COLORS.cream} />
          <Path d="M38 16H42V48H38V16Z" fill={COLORS.cream} />
        </>
      ) : (
        <Path d="M20 12L52 32L20 52V12Z" fill={COLORS.cream} />
      )}
    </Svg>
  );
}

function SkipIcon({ direction, size = 32 }: { direction: 'back' | 'forward'; size?: number }) {
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
        stroke={active ? COLORS.terra : COLORS.gray}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function RepeatIcon({ mode, size = 24 }: { mode: 'off' | 'all' | 'one'; size?: number }) {
  const color = mode === 'off' ? COLORS.gray : COLORS.terra;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17 1L21 5L17 9M3 11V9C3 7.89543 3.89543 7 5 7H21M7 23L3 19L7 15M21 13V15C21 16.1046 20.1046 17 19 17H3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WAVEFORM VISUALIZER (Audio only)
// ══════════════════════════════════════════════════════════════════════════════

function WaveformVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) => i);
  const animations = useRef(bars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (isPlaying) {
      bars.forEach((_, i) => {
        const randomDuration = 300 + Math.random() * 400;
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations[i], {
              toValue: 0.3 + Math.random() * 0.7,
              duration: randomDuration,
              useNativeDriver: true,
            }),
            Animated.timing(animations[i], {
              toValue: 0.3,
              duration: randomDuration,
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
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveformBar,
            {
              backgroundColor: i % 3 === 0 ? COLORS.terra : 'rgba(255,255,255,0.2)',
              transform: [{ scaleY: animations[i] }],
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

function ProgressBar({ progress, duration, onSeek }: { progress: number; duration: number; onSeek?: (p: number) => void }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(progress * duration)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIO PLAYER USING EXPO-AV (More stable on Expo Go)
// ══════════════════════════════════════════════════════════════════════════════

function AudioPlayerView({
  streamUrl,
  content,
  isLiked,
  onLike,
  shuffle,
  onShuffle,
  repeat,
  onRepeat,
  insets,
  onClose,
}: any) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const artworkScale = useRef(new Animated.Value(1)).current;
  const artworkRotate = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Configure audio mode
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log('Audio mode config error:', e);
      }
    };
    configureAudio();
  }, []);

  // Load audio
  useEffect(() => {
    let isMounted = true;
    
    const loadAudio = async () => {
      if (!streamUrl) {
        setLoadError('Aucune URL audio');
        return;
      }

      try {
        setIsBuffering(true);
        setLoadError(null);
        
        // Unload previous sound
        if (sound) {
          await sound.unloadAsync();
        }

        console.log('Loading audio:', streamUrl);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        if (isMounted) {
          setSound(newSound);
          setIsLoaded(true);
          setIsBuffering(false);
        }
      } catch (e: any) {
        console.error('Audio load error:', e);
        if (isMounted) {
          setLoadError(e.message || 'Erreur chargement audio');
          setIsBuffering(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [streamUrl]);

  // Playback status callback
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log('Playback error:', status.error);
        setLoadError(status.error);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
    setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
  };

  // Vinyl rotation effect
  useEffect(() => {
    if (isPlaying) {
      rotationRef.current = Animated.loop(
        Animated.timing(artworkRotate, {
          toValue: 1,
          duration: 20000,
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

  const handlePlayPause = useCallback(async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (e) {
      console.error('Play/Pause error:', e);
    }

    Animated.sequence([
      Animated.timing(artworkScale, { toValue: isPlaying ? 0.95 : 1.02, duration: 150, useNativeDriver: true }),
      Animated.spring(artworkScale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [isPlaying, sound]);

  const handleSkip = useCallback(async (direction: 'back' | 'forward') => {
    try { Haptics.selectionAsync(); } catch {}
    if (!sound) return;
    
    const delta = direction === 'back' ? -15 : 15;
    const newPosition = Math.max(0, Math.min(duration, position + delta));
    
    try {
      await sound.setPositionAsync(newPosition * 1000);
    } catch (e) {
      console.error('Seek error:', e);
    }
  }, [sound, position, duration]);

  const progress = duration > 0 ? position / duration : 0;

  const rotation = artworkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <ChevronDownIcon size={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>EN LECTURE</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{content.album || 'Album'}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreText}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Artwork with vinyl rotation */}
      <View style={styles.artworkContainer}>
        <Animated.View
          style={[
            styles.artworkWrapper,
            { transform: [{ scale: artworkScale }, { rotate: rotation }] },
          ]}
        >
          <Image 
            source={{ uri: content.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600' }} 
            style={styles.artwork} 
          />
          <View style={styles.vinylHole} />
        </Animated.View>
        <WaveformVisualizer isPlaying={isPlaying} />
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <View style={styles.trackTitleRow}>
          <View style={styles.trackTitleContainer}>
            <Text style={styles.trackTitle} numberOfLines={2}>{content.title || 'Titre inconnu'}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{content.artist || 'Artiste'}</Text>
          </View>
          <TouchableOpacity onPress={onLike} style={styles.likeBtn}>
            <HeartIcon filled={isLiked} size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar progress={progress} duration={duration} />

      {/* Status indicators */}
      {loadError && (
        <View style={styles.errorIndicator}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      {isBuffering && (
        <View style={styles.bufferingIndicator}>
          <ActivityIndicator color={COLORS.terra} size="small" />
          <Text style={styles.bufferingText}>Chargement...</Text>
        </View>
      )}

      {/* Stream indicator */}
      {isLoaded && !loadError && (
        <View style={styles.streamIndicator}>
          <View style={styles.streamDot} />
          <Text style={styles.streamText}>Audio • KORA DSP</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={onShuffle} style={styles.controlBtn}>
          <ShuffleIcon active={shuffle} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSkip('back')} style={styles.skipBtn}>
          <SkipIcon direction="back" size={32} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn} disabled={!isLoaded || !!loadError}>
          <LinearGradient colors={[COLORS.terra, '#8B4D3B']} style={styles.playBtnGradient}>
            {isBuffering ? (
              <ActivityIndicator color={COLORS.cream} size="small" />
            ) : (
              <PlayPauseIcon isPlaying={isPlaying} size={40} />
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSkip('forward')} style={styles.skipBtn}>
          <SkipIcon direction="forward" size={32} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRepeat} style={styles.controlBtn}>
          <RepeatIcon mode={repeat} size={24} />
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>Paroles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>File d'attente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEO PLAYER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function VideoPlayerView({
  streamUrl,
  content,
  isLiked,
  onLike,
  insets,
  onClose,
}: any) {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize video player with useVideoPlayer hook
  const videoPlayer = useVideoPlayer(streamUrl || null, (player) => {
    player.loop = false;
  });

  // Get playing state using useEvent
  const { isPlaying } = useEvent(videoPlayer, 'playingChange', { isPlaying: videoPlayer?.playing || false });

  // Get status for duration/time
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoPlayer) {
      const interval = setInterval(() => {
        try {
          setCurrentTime(videoPlayer.currentTime || 0);
          setDuration(videoPlayer.duration || 0);
        } catch {}
      }, 500);
      return () => clearInterval(interval);
    }
  }, [videoPlayer]);

  const progress = duration > 0 ? currentTime / duration : 0;

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) hideControlsAfterDelay();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying, hideControlsAfterDelay]);

  const handleTap = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  const handlePlayPause = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    if (!videoPlayer) return;

    try {
      if (isPlaying) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
    } catch (e) {
      console.error('Video Play/Pause error:', e);
    }
    setShowControls(true);
    hideControlsAfterDelay();
  }, [isPlaying, videoPlayer, hideControlsAfterDelay]);

  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    try { Haptics.selectionAsync(); } catch {}
    if (!videoPlayer) return;
    const delta = direction === 'back' ? -10 : 10;
    const newTime = Math.max(0, Math.min(duration, currentTime + delta));
    try { videoPlayer.currentTime = newTime; } catch (e) { console.error('Video seek error:', e); }
    setShowControls(true);
    hideControlsAfterDelay();
  }, [videoPlayer, currentTime, duration, hideControlsAfterDelay]);

  return (
    <TouchableOpacity
      style={styles.videoContainer}
      activeOpacity={1}
      onPress={handleTap}
    >
      {/* Video View */}
      {streamUrl && videoPlayer && (
        <VideoView
          player={videoPlayer}
          style={styles.videoView}
          contentFit="contain"
          allowsFullscreen={true}
          allowsPictureInPicture={true}
        />
      )}

      {/* Overlay controls */}
      {showControls && (
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent', 'transparent', 'rgba(0,0,0,0.9)']}
          style={styles.videoOverlay}
        >
          {/* Top bar */}
          <View style={[styles.videoTopBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <ChevronDownIcon size={28} />
            </TouchableOpacity>
            <Text style={styles.videoTitle} numberOfLines={1}>{content.title}</Text>
            <TouchableOpacity onPress={onLike} style={styles.closeBtn}>
              <HeartIcon filled={isLiked} size={24} />
            </TouchableOpacity>
          </View>

          {/* Center play button */}
          <View style={styles.videoCenterControls}>
            <TouchableOpacity onPress={() => handleSkip('back')} style={styles.videoSkipBtn}>
              <SkipIcon direction="back" size={36} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.videoPlayBtn}>
              <PlayPauseIcon isPlaying={isPlaying} size={50} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSkip('forward')} style={styles.videoSkipBtn}>
              <SkipIcon direction="forward" size={36} />
            </TouchableOpacity>
          </View>

          {/* Bottom bar with progress */}
          <View style={[styles.videoBottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.videoProgressContainer}>
              <ProgressBar progress={progress} duration={duration} />
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoArtist}>{content.artist}</Text>
              <View style={styles.streamIndicator}>
                <View style={[styles.streamDot, { backgroundColor: '#FF3B30' }]} />
                <Text style={styles.streamText}>Vidéo • {content.type === 'live' ? 'LIVE' : 'Streaming'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Loading state when no URL */}
      {!streamUrl && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.terra} />
          <Text style={styles.videoLoadingText}>Chargement de la vidéo...</Text>
        </View>
      )}
    </TouchableOpacity>
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
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [trackDetails, setTrackDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // API Base
  const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

  // Determine content type
  const contentType = (params.type as string) || 'audio';
  const isVideo = contentType === 'video' || contentType === 'live' || contentType === 'replay';

  // Content from params
  const content = {
    id: params.id as string || '',
    title: trackDetails?.title || params.title as string || 'Titre inconnu',
    artist: trackDetails?.artist || params.artist as string || 'Artiste KORA',
    album: trackDetails?.album || params.album as string || 'Album',
    artwork: trackDetails?.artwork || params.artwork as string || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    type: contentType,
    source: params.source as string || 'kora',
  };

  // Load track/stream URL
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check for direct stream URL from params (stream_url or streamUrl)
        const directUrl = params.stream_url || params.streamUrl;
        if (directUrl) {
          const url = directUrl as string;
          console.log('🎬 Direct stream URL from params:', url);
          setStreamUrl(url);
          setIsLoading(false);
          return;
        }

        // Fetch from API if we have id and source
        if (params.id && params.source) {
          console.log('📡 Fetching track details from API...');
          const res = await fetch(`${API_BASE}/api/catalog/track/${params.source}/${params.id}`);
          if (res.ok) {
            const data = await res.json();
            console.log('📡 Track data:', data);
            setTrackDetails(data);
            if (data.stream_url) {
              console.log('🎵 Stream URL from API:', data.stream_url);
              setStreamUrl(data.stream_url);
            } else {
              setError('Aucune URL de streaming');
            }
          } else {
            setError('Track non trouvé');
          }
        } else {
          // No stream URL and no way to fetch one
          setError('Informations manquantes');
        }
      } catch (err: any) {
        console.error('Error loading content:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [params.id, params.source, params.stream_url, params.streamUrl, API_BASE]);

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
    ]).start();
  }, []);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SH, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      router.back();
    });
  }, [router]);

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

  // Loading state
  if (isLoading) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={COLORS.terra} />
          <Text style={styles.loadingScreenText}>Préparation...</Text>
        </View>
      </Animated.View>
    );
  }

  // Error state
  if (error && !streamUrl) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingScreen}>
          <Text style={styles.errorScreenText}>{error}</Text>
          <TouchableOpacity style={styles.errorBackBtn} onPress={handleClose}>
            <Text style={styles.errorBackBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Background (audio only) */}
      {!isVideo && (
        <>
          <Image source={{ uri: content.artwork }} style={styles.bgImage} blurRadius={50} />
          <View style={styles.bgOverlay} />
        </>
      )}

      {/* Render appropriate player */}
      {isVideo ? (
        <VideoPlayerView
          streamUrl={streamUrl}
          content={content}
          isLiked={isLiked}
          onLike={handleLike}
          insets={insets}
          onClose={handleClose}
        />
      ) : (
        <AudioPlayerView
          streamUrl={streamUrl}
          content={content}
          isLiked={isLiked}
          onLike={handleLike}
          shuffle={shuffle}
          onShuffle={handleShuffle}
          repeat={repeat}
          onRepeat={handleRepeat}
          insets={insets}
          onClose={handleClose}
        />
      )}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

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
    flex: 1,
    marginHorizontal: 8,
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
    width: SW - 100,
    height: SW - 100,
    maxWidth: 320,
    maxHeight: 320,
    borderRadius: (SW - 100) / 2,
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
    marginRight: 12,
  },
  trackTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  trackArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
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
  // Buffering
  bufferingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  bufferingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  // Error indicator
  errorIndicator: {
    alignItems: 'center',
    marginTop: 16,
  },
  errorText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
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
  // Loading/Error screens
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingScreenText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
  },
  errorScreenText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBackBtn: {
    backgroundColor: COLORS.terra,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  errorBackBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  // VIDEO PLAYER STYLES
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  videoTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  videoTitle: {
    flex: 1,
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  videoCenterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  videoSkipBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(166,93,71,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBottomBar: {
    paddingHorizontal: 20,
  },
  videoProgressContainer: {
    marginBottom: 12,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoadingText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 16,
  },
});
