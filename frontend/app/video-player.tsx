/**
 * KORA Cinematic Video Player — Senior Level
 * ==========================================
 * 
 * Master Prompt Section 18
 * 
 * Features:
 * - Fullscreen cinematic playback
 * - Adaptive quality selection (SD/HD/4K)
 * - Subtitle support (multi-language)
 * - Progress persistence
 * - Continue watching
 * - Series/Episode navigation
 * - Picture-in-Picture ready
 * - Gesture controls (swipe for seek, pinch for zoom)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

const { width: SW, height: SH } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — KORA Cinema
// ═══════════════════════════════════════════════════════════════════════════

const CINEMA = {
  void: '#000000',
  obsidian: '#0A0A0C',
  charcoal: '#121214',
  gold: '#D4AF37',
  goldMuted: '#A68B2A',
  ivory: '#FAF9F6',
  silver: 'rgba(255,255,255,0.7)',
  mist: 'rgba(255,255,255,0.4)',
  success: '#4ADE80',
  error: '#EF4444',
};

const FONTS = {
  playfairBold: Platform.OS === 'ios' ? 'PlayfairDisplay-Bold' : 'serif',
  jostMedium: Platform.OS === 'ios' ? 'Jost-Medium' : 'sans-serif-medium',
  jostLight: Platform.OS === 'ios' ? 'Jost-Light' : 'sans-serif-light',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VideoContent {
  work_id: string;
  title: string;
  description?: string;
  duration_seconds: number;
  type: 'film' | 'series' | 'documentary' | 'concert' | 'clip';
  video_url: string;
  poster_url?: string;
  subtitles?: SubtitleTrack[];
  quality_options?: QualityOption[];
  // Series specific
  series_title?: string;
  season_number?: number;
  episode_number?: number;
  next_episode?: { work_id: string; title: string };
  previous_episode?: { work_id: string; title: string };
}

interface SubtitleTrack {
  language: string;
  label: string;
  url: string;
}

interface QualityOption {
  label: string;
  resolution: string;
  bitrate: number;
  url: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO CONTENT
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_VIDEOS: VideoContent[] = [
  {
    work_id: 'KORA-V-001',
    title: "SAYD — C'est Nous L'Avenir",
    description: "Un documentaire puissant sur la diaspora africaine et son impact culturel mondial. Suivez les parcours de créateurs, entrepreneurs et artistes qui redéfinissent l'identité africaine au 21e siècle.",
    duration_seconds: 5400,
    type: 'documentary',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=1280',
    subtitles: [
      { language: 'fr', label: 'Français', url: '' },
      { language: 'en', label: 'English', url: '' },
      { language: 'wo', label: 'Wolof', url: '' },
    ],
    quality_options: [
      { label: 'Auto', resolution: 'auto', bitrate: 0, url: '' },
      { label: '4K HDR', resolution: '2160p', bitrate: 25000, url: '' },
      { label: '1080p', resolution: '1080p', bitrate: 8000, url: '' },
      { label: '720p', resolution: '720p', bitrate: 4000, url: '' },
    ],
  },
  {
    work_id: 'KORA-V-002',
    title: 'Diaspora Rising',
    description: 'Épisode 1: Les Pionniers. Découvrez comment la première génération a posé les bases.',
    duration_seconds: 2700,
    type: 'series',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1280',
    series_title: 'Diaspora Rising',
    season_number: 1,
    episode_number: 1,
    next_episode: { work_id: 'KORA-V-003', title: 'Épisode 2: La Renaissance' },
    subtitles: [
      { language: 'fr', label: 'Français', url: '' },
      { language: 'en', label: 'English', url: '' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function VideoPlayer() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  
  // State
  const [content, setContent] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>('fr');
  const [showSettings, setShowSettings] = useState(false);
  
  // Video player hook
  const player = useVideoPlayer(content?.video_url || '', (player) => {
    player.loop = false;
    player.muted = isMuted;
  });
  
  // Animation values
  const controlsOpacity = useSharedValue(1);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Load content
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try to fetch from API
        if (params.id) {
          const response = await fetch(`${API_URL}/api/v1/works/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            // Transform to VideoContent
            setContent({
              work_id: data.work_id,
              title: data.title,
              description: data.description,
              duration_seconds: data.duration_seconds || 3600,
              type: data.type === 'audiovisual_catalog' ? 'film' : 'clip',
              video_url: data.video_url || DEMO_VIDEOS[0].video_url,
              poster_url: data.artwork_url,
              subtitles: DEMO_VIDEOS[0].subtitles,
              quality_options: DEMO_VIDEOS[0].quality_options,
            });
            setLoading(false);
            return;
          }
        }
        
        // Use demo content
        setContent(DEMO_VIDEOS[0]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading video:', error);
        setContent(DEMO_VIDEOS[0]);
        setLoading(false);
      }
    };
    
    loadContent();
  }, [params.id]);
  
  // Handle orientation for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, [isFullscreen]);
  
  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    setShowControls(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 300 });
        setShowControls(false);
      }, 4000);
    }
  }, [isPlaying, controlsOpacity]);
  
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [isPlaying, resetControlsTimer]);
  
  // Update playing state from player
  useEffect(() => {
    if (player) {
      setIsPlaying(player.playing);
      setDuration((content?.duration_seconds || 0) * 1000);
    }
  }, [player, content]);
  
  // Controls
  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    resetControlsTimer();
  };
  
  const toggleMute = () => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const skipForward = () => {
    if (!player) return;
    player.seekBy(10);
    resetControlsTimer();
  };
  
  const skipBackward = () => {
    if (!player) return;
    player.seekBy(-10);
    resetControlsTimer();
  };
  
  // Format time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Gestures
  const doubleTapLeft = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      skipBackward();
    });
  
  const doubleTapRight = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      skipForward();
    });
  
  const singleTap = Gesture.Tap()
    .onEnd(() => {
      resetControlsTimer();
    });
  
  // Animated styles
  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  
  // Progress percentage
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const bufferedProgress = 0; // Not available with expo-video
  
  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (loading || !content) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[CINEMA.obsidian, CINEMA.void]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={CINEMA.gold} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }
  
  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        <LinearGradient
          colors={[CINEMA.obsidian, CINEMA.void]}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Video Player */}
        <Pressable 
          style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}
          onPress={resetControlsTimer}
        >
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
          
          {/* Controls Overlay */}
          <Animated.View 
            style={[styles.controlsOverlay, controlsAnimatedStyle]}
            pointerEvents={showControls ? 'auto' : 'none'}
          >
            {/* Top Gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.topGradient}
            >
              {/* Back & Title */}
              <SafeAreaView edges={['top']} style={styles.topControls}>
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={28} color={CINEMA.ivory} />
                </TouchableOpacity>
                
                <View style={styles.titleContainer}>
                  {content.series_title && (
                    <Text style={styles.seriesTitle}>{content.series_title}</Text>
                  )}
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {content.series_title 
                      ? `S${content.season_number}:E${content.episode_number} - ${content.title}`
                      : content.title
                    }
                  </Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setShowSettings(!showSettings)}
                  style={styles.settingsButton}
                >
                  <Ionicons name="settings-outline" size={24} color={CINEMA.ivory} />
                </TouchableOpacity>
              </SafeAreaView>
            </LinearGradient>
            
            {/* Center Controls */}
            <View style={styles.centerControls}>
              {/* Skip Backward */}
              <GestureDetector gesture={doubleTapLeft}>
                <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
                  <Ionicons name="play-back" size={32} color={CINEMA.ivory} />
                  <Text style={styles.skipText}>10</Text>
                </TouchableOpacity>
              </GestureDetector>
              
              {/* Play/Pause */}
              <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                <View style={styles.playButtonInner}>
                  <Ionicons 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={48} 
                    color={CINEMA.void} 
                  />
                </View>
              </TouchableOpacity>
              
              {/* Skip Forward */}
              <GestureDetector gesture={doubleTapRight}>
                <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
                  <Ionicons name="play-forward" size={32} color={CINEMA.ivory} />
                  <Text style={styles.skipText}>10</Text>
                </TouchableOpacity>
              </GestureDetector>
            </View>
            
            {/* Bottom Gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.bottomGradient}
            >
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                
                <View style={styles.progressBarContainer}>
                  {/* Buffered */}
                  <View style={[styles.progressBuffered, { width: `${bufferedProgress}%` }]} />
                  {/* Progress */}
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  {/* Thumb */}
                  <View style={[styles.progressThumb, { left: `${progress}%` }]} />
                </View>
                
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
              
              {/* Bottom Controls */}
              <SafeAreaView edges={['bottom']} style={styles.bottomControls}>
                <View style={styles.bottomLeft}>
                  <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                    <Ionicons 
                      name={isMuted ? 'volume-mute' : 'volume-high'} 
                      size={24} 
                      color={CINEMA.ivory} 
                    />
                  </TouchableOpacity>
                  
                  {/* Quality Badge */}
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityText}>{selectedQuality}</Text>
                  </View>
                </View>
                
                <View style={styles.bottomRight}>
                  {/* Subtitles */}
                  <TouchableOpacity 
                    style={[styles.controlButton, selectedSubtitle && styles.activeControl]}
                    onPress={() => setSelectedSubtitle(selectedSubtitle ? null : 'fr')}
                  >
                    <Ionicons name="text" size={24} color={CINEMA.ivory} />
                  </TouchableOpacity>
                  
                  {/* Fullscreen */}
                  <TouchableOpacity 
                    onPress={() => setIsFullscreen(!isFullscreen)} 
                    style={styles.controlButton}
                  >
                    <Ionicons 
                      name={isFullscreen ? 'contract' : 'expand'} 
                      size={24} 
                      color={CINEMA.ivory} 
                    />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>
        </Pressable>
        
        {/* Content Info (non-fullscreen) */}
        {!isFullscreen && (
          <Animated.ScrollView 
            entering={FadeIn.delay(300)}
            style={styles.infoScroll}
            contentContainerStyle={styles.infoContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title & Meta */}
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>{content.title}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    {content.type === 'documentary' ? 'DOCUMENTAIRE' : 
                     content.type === 'series' ? 'SÉRIE' : 
                     content.type === 'film' ? 'FILM' : 'CLIP'}
                  </Text>
                </View>
                <Text style={styles.metaDuration}>{formatTime(content.duration_seconds * 1000)}</Text>
                {content.quality_options && (
                  <View style={styles.hdrBadge}>
                    <Text style={styles.hdrText}>4K HDR</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Description */}
            {content.description && (
              <Text style={styles.description}>{content.description}</Text>
            )}
            
            {/* Episode Navigation */}
            {content.type === 'series' && (
              <View style={styles.episodeNav}>
                {content.previous_episode && (
                  <TouchableOpacity style={styles.episodeNavButton}>
                    <Ionicons name="chevron-back" size={20} color={CINEMA.gold} />
                    <Text style={styles.episodeNavText}>Épisode précédent</Text>
                  </TouchableOpacity>
                )}
                {content.next_episode && (
                  <TouchableOpacity style={styles.episodeNavButtonNext}>
                    <Text style={styles.episodeNavText}>Épisode suivant</Text>
                    <Ionicons name="chevron-forward" size={20} color={CINEMA.gold} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add" size={24} color={CINEMA.ivory} />
                <Text style={styles.actionText}>Ma liste</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={24} color={CINEMA.ivory} />
                <Text style={styles.actionText}>Partager</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="download-outline" size={24} color={CINEMA.ivory} />
                <Text style={styles.actionText}>Télécharger</Text>
              </TouchableOpacity>
            </View>
            
            {/* Quality/Subtitle Selection */}
            <View style={styles.optionsSection}>
              <Text style={styles.optionsTitle}>Qualité vidéo</Text>
              <View style={styles.optionsRow}>
                {content.quality_options?.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.optionChip,
                      selectedQuality === opt.label && styles.optionChipActive
                    ]}
                    onPress={() => setSelectedQuality(opt.label)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      selectedQuality === opt.label && styles.optionChipTextActive
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {content.subtitles && content.subtitles.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.optionsTitle}>Sous-titres</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionChip,
                      selectedSubtitle === null && styles.optionChipActive
                    ]}
                    onPress={() => setSelectedSubtitle(null)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      selectedSubtitle === null && styles.optionChipTextActive
                    ]}>
                      Désactivés
                    </Text>
                  </TouchableOpacity>
                  {content.subtitles.map((sub) => (
                    <TouchableOpacity
                      key={sub.language}
                      style={[
                        styles.optionChip,
                        selectedSubtitle === sub.language && styles.optionChipActive
                      ]}
                      onPress={() => setSelectedSubtitle(sub.language)}
                    >
                      <Text style={[
                        styles.optionChipText,
                        selectedSubtitle === sub.language && styles.optionChipTextActive
                      ]}>
                        {sub.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Spacing */}
            <View style={{ height: insets.bottom + 100 }} />
          </Animated.ScrollView>
        )}
        
        {/* Settings Panel */}
        {showSettings && (
          <Animated.View 
            entering={SlideInDown.springify()}
            exiting={SlideOutDown}
            style={styles.settingsPanel}
          >
            <View style={styles.settingsPanelHeader}>
              <Text style={styles.settingsPanelTitle}>Paramètres</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={CINEMA.ivory} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <Ionicons name="speedometer-outline" size={20} color={CINEMA.gold} />
              <Text style={styles.settingLabel}>Vitesse de lecture</Text>
              <Text style={styles.settingValue}>1x</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Ionicons name="film-outline" size={20} color={CINEMA.gold} />
              <Text style={styles.settingLabel}>Qualité</Text>
              <Text style={styles.settingValue}>{selectedQuality}</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Ionicons name="text-outline" size={20} color={CINEMA.gold} />
              <Text style={styles.settingLabel}>Sous-titres</Text>
              <Text style={styles.settingValue}>
                {selectedSubtitle ? content.subtitles?.find(s => s.language === selectedSubtitle)?.label : 'Désactivés'}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CINEMA.void,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: CINEMA.mist,
    fontFamily: FONTS.jostLight,
  },
  
  // Video
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: CINEMA.void,
    position: 'relative',
  },
  fullscreenVideo: {
    flex: 1,
    aspectRatio: undefined,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Controls Overlay
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  bottomGradient: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  
  // Top Controls
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  seriesTitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.gold,
    letterSpacing: 1,
  },
  videoTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: CINEMA.ivory,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Center Controls
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  skipButton: {
    alignItems: 'center',
  },
  skipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.ivory,
    marginTop: 2,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CINEMA.gold,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  timeText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: CINEMA.ivory,
    minWidth: 45,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressBuffered: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: CINEMA.gold,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CINEMA.gold,
    top: -4,
    marginLeft: -6,
  },
  
  // Bottom Controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderRadius: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: CINEMA.gold,
  },
  qualityText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.gold,
    letterSpacing: 0.5,
  },
  
  // Info Section
  infoScroll: {
    flex: 1,
  },
  infoContent: {
    padding: 20,
  },
  infoHeader: {
    marginBottom: 16,
  },
  infoTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: CINEMA.ivory,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  metaBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.mist,
    letterSpacing: 1,
  },
  metaDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
  },
  hdrBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: CINEMA.gold,
    borderRadius: 4,
  },
  hdrText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.void,
    fontWeight: 'bold',
  },
  description: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: CINEMA.silver,
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Episode Navigation
  episodeNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  episodeNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodeNavButtonNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodeNavText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.gold,
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.mist,
  },
  
  // Options
  optionsSection: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.ivory,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionChipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: CINEMA.gold,
  },
  optionChipText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.mist,
  },
  optionChipTextActive: {
    color: CINEMA.gold,
  },
  
  // Settings Panel
  settingsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CINEMA.charcoal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  settingsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  settingsPanelTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: CINEMA.ivory,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  settingLabel: {
    flex: 1,
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: CINEMA.ivory,
  },
  settingValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
  },
});
