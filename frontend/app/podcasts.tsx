/**
 * KORA Podcasts — Studio Podcast Cinématique
 * 
 * Interface premium pour:
 * - Découvrir les podcasts par catégorie
 * - S'abonner aux shows
 * - Écouter les épisodes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/theme';

const { width: SW } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function BackIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PlayIcon({ size = 20, color = COLORS.dark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3L19 12L5 21V3Z" fill={color} />
    </Svg>
  );
}

function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1ZM19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.41 6.17 20.1 10.25 20.82V24H13.75V20.82C17.83 20.1 21 16.41 21 12V10H19Z" fill={COLORS.terra} />
    </Svg>
  );
}

function HeadphonesIcon({ size = 50 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 18V12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12V18M5 18C3.89543 18 3 18.8954 3 20V20C3 21.1046 3.89543 22 5 22H6C7.10457 22 8 21.1046 8 20V18C8 16.8954 7.10457 16 6 16H5C3.89543 16 3 16.8954 3 18ZM19 18C20.1046 18 21 18.8954 21 20V20C21 21.1046 20.1046 22 19 22H18C16.8954 22 16 21.1046 16 20V18C16 16.8954 16.8954 16 18 16H19C20.1046 16 21 16.8954 21 18Z" stroke={COLORS.terra} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY CHIP
// ══════════════════════════════════════════════════════════════════════════════

function CategoryChip({ category, isSelected, onPress, index }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 100,
      friction: 12,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PODCAST SHOW CARD
// ══════════════════════════════════════════════════════════════════════════════

function ShowCard({ show, onPress, index }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, tension: 180, friction: 14, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.showCard,
          {
            opacity: anim,
            transform: [
              { scale },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            ],
          },
        ]}
      >
        <Image source={{ uri: show.cover_url }} style={styles.showCover} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.95)']}
          style={styles.showGradient}
        />
        <View style={styles.showInfo}>
          <View style={styles.showCategoryBadge}>
            <Text style={styles.showCategoryText}>{show.category?.toUpperCase() || 'CULTURE'}</Text>
          </View>
          <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
          <Text style={styles.showCreator}>{show.creator_name}</Text>
          <View style={styles.showStats}>
            <Text style={styles.showStatText}>{show.episodes_count || 0} épisodes</Text>
            <Text style={styles.showStatDot}>•</Text>
            <Text style={styles.showStatText}>{show.subscribers_count || 0} abonnés</Text>
          </View>
        </View>
        <View style={styles.showPlayBtn}>
          <PlayIcon size={18} color={COLORS.dark} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EPISODE ROW
// ══════════════════════════════════════════════════════════════════════════════

function EpisodeRow({ episode, onPress, index }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.episodeRow,
          { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <View style={styles.episodeNumber}>
          <Text style={styles.episodeNumberText}>{episode.episode_number || index + 1}</Text>
        </View>
        <View style={styles.episodeInfo}>
          <Text style={styles.episodeTitle} numberOfLines={2}>{episode.title}</Text>
          <Text style={styles.episodeMeta}>
            S{episode.season || 1} E{episode.episode_number || 1} • {formatDuration(episode.duration_seconds || 0)}
          </Text>
        </View>
        <TouchableOpacity style={styles.episodePlayBtn} onPress={onPress}>
          <PlayIcon size={14} color={COLORS.dark} />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function PodcastsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shows, setShows] = useState<any[]>([]);
  const [selectedShow, setSelectedShow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToken();
    fetchCategories();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedCategory]);

  const loadToken = async () => {
    const t = await AsyncStorage.getItem('kora_token');
    setToken(t);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/podcasts/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback categories
      setCategories([
        { id: 'culture', name: 'Culture & Société' },
        { id: 'music', name: 'Musique' },
        { id: 'talk', name: 'Talk Show' },
        { id: 'education', name: 'Éducation' },
        { id: 'news', name: 'Actualités' },
        { id: 'history', name: 'Histoire' },
        { id: 'comedy', name: 'Humour' },
        { id: 'stories', name: 'Récits' },
      ]);
    }
  };

  const fetchShows = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/podcasts/shows?limit=20`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setShows(data.shows || []);
    } catch (err) {
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowDetails = async (showId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/podcasts/shows/${showId}`);
      const data = await res.json();
      setSelectedShow(data);
    } catch (err) {
      console.error('Error fetching show details:', err);
    }
  };

  const handleShowPress = (show: any) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    fetchShowDetails(show._id);
  };

  const handleEpisodePress = (episode: any) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    // Record play
    fetch(`${API_URL}/api/podcasts/episodes/${episode._id}/play`, { method: 'POST' }).catch(() => {});
    // Navigate to player
    router.push({
      pathname: '/player',
      params: {
        id: episode._id,
        title: episode.title,
        artist: selectedShow?.creator_name || 'Podcast KORA',
        streamUrl: episode.audio_url,
        artwork: selectedShow?.cover_url,
        type: 'podcast',
      },
    });
  };

  const handleSubscribe = async () => {
    if (!token || !selectedShow) return;
    try {
      await fetch(`${API_URL}/api/podcasts/shows/${selectedShow._id}/subscribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      // Refresh show details
      fetchShowDetails(selectedShow._id);
    } catch (err) {
      console.error('Error subscribing:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShows();
    setRefreshing(false);
  }, [selectedCategory]);

  // Show detail view
  if (selectedShow) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedShow(null)} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Podcast</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Show Hero */}
          <View style={styles.showHero}>
            <Image source={{ uri: selectedShow.cover_url }} style={styles.showHeroCover} />
            <LinearGradient
              colors={['transparent', COLORS.dark]}
              style={styles.showHeroGradient}
            />
            <View style={styles.showHeroInfo}>
              <Text style={styles.showHeroTitle}>{selectedShow.title}</Text>
              <Text style={styles.showHeroCreator}>{selectedShow.creator_name}</Text>
              <Text style={styles.showHeroDescription} numberOfLines={3}>
                {selectedShow.description}
              </Text>
              <View style={styles.showHeroActions}>
                <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
                  <Text style={styles.subscribeBtnText}>S'abonner</Text>
                </TouchableOpacity>
                <Text style={styles.showHeroStats}>
                  {selectedShow.subscribers_count || 0} abonnés
                </Text>
              </View>
            </View>
          </View>

          {/* Episodes */}
          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>Épisodes</Text>
            {selectedShow.episodes?.length > 0 ? (
              selectedShow.episodes.map((episode: any, index: number) => (
                <EpisodeRow
                  key={episode._id}
                  episode={episode}
                  onPress={() => handleEpisodePress(episode)}
                  index={index}
                />
              ))
            ) : (
              <View style={styles.noEpisodes}>
                <Text style={styles.noEpisodesText}>Aucun épisode disponible</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main list view
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Podcasts</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        <CategoryChip
          category={{ id: null, name: 'Tous' }}
          isSelected={selectedCategory === null}
          onPress={() => setSelectedCategory(null)}
          index={0}
        />
        {categories.map((cat, index) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            isSelected={selectedCategory === cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            index={index + 1}
          />
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.showsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.terra} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.terra} />
            <Text style={styles.loadingText}>Chargement des podcasts...</Text>
          </View>
        ) : shows.length === 0 ? (
          <View style={styles.emptyState}>
            <HeadphonesIcon size={60} />
            <Text style={styles.emptyTitle}>Aucun podcast</Text>
            <Text style={styles.emptySubtitle}>
              Les podcasts de la diaspora apparaîtront ici
            </Text>
          </View>
        ) : (
          shows.map((show, index) => (
            <ShowCard
              key={show._id}
              show={show}
              onPress={() => handleShowPress(show)}
              index={index}
            />
          ))
        )}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: COLORS.cream,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.terra,
  },
  categoryName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
  },
  categoryNameActive: {
    color: COLORS.cream,
  },
  content: {
    flex: 1,
  },
  showsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  // Show Card
  showCard: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  showCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  showGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  showInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 60,
  },
  showCategoryBadge: {
    backgroundColor: 'rgba(166,93,71,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  showCategoryText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  showTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.cream,
  },
  showCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  showStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  showStatText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  showStatDot: {
    color: COLORS.gray,
  },
  showPlayBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Show Detail
  showHero: {
    height: 350,
    position: 'relative',
  },
  showHeroCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  showHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  showHeroInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  showHeroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
  },
  showHeroCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  showHeroDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    lineHeight: 20,
  },
  showHeroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  subscribeBtn: {
    backgroundColor: COLORS.terra,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  subscribeBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  showHeroStats: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
  // Episodes
  episodesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: 20,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  episodeNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeNumberText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.gray,
  },
  episodeInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  episodeTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  episodeMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  episodePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEpisodes: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEpisodesText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
  },
});
