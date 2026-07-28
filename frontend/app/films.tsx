/**
 * KORA Audiovisual Catalog — Netflix-Style Browser
 * ================================================
 * 
 * Master Prompt Section 18
 * 
 * Features:
 * - Hero featured content
 * - Category rows (Continue Watching, Trending, New Releases)
 * - Genre filtering
 * - Series vs Films distinction
 * 
 * UPDATED: Fetches content from FrekCore API (Living Catalog)
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
  Platform,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInRight,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

// API Base URL
const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const CINEMA = {
  void: '#000000',
  obsidian: '#0A0A0C',
  charcoal: '#121214',
  slate: '#1A1A1E',
  gold: '#D4AF37',
  goldMuted: '#A68B2A',
  ivory: '#FAF9F6',
  silver: 'rgba(255,255,255,0.7)',
  mist: 'rgba(255,255,255,0.4)',
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

interface VideoItem {
  id: string;
  title: string;
  type: 'film' | 'series' | 'documentary' | 'concert';
  poster: string;
  backdrop?: string;
  year: number;
  duration?: string;
  rating?: string;
  genres: string[];
  description?: string;
  progress?: number; // 0-100 for continue watching
  artist?: string;
  stream_url?: string;
  frekcore_ref?: string;
}

const CATEGORIES = [
  { id: 'continue', title: 'Reprendre la lecture', icon: 'play-circle' },
  { id: 'trending', title: 'Tendances KORA', icon: 'trending-up' },
  { id: 'new', title: 'Nouveautés', icon: 'sparkles' },
  { id: 'docs', title: 'Documentaires', icon: 'film' },
  { id: 'series', title: 'Séries', icon: 'tv' },
  { id: 'concerts', title: 'Concerts & Lives', icon: 'musical-notes' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: Content Card
// ═══════════════════════════════════════════════════════════════════════════

const ContentCard = ({ 
  item, 
  size = 'normal',
  showProgress = false,
  index = 0,
}: { 
  item: VideoItem; 
  size?: 'normal' | 'large';
  showProgress?: boolean;
  index?: number;
}) => {
  const cardWidth = size === 'large' ? SW * 0.7 : SW * 0.4;
  const cardHeight = size === 'large' ? cardWidth * 0.6 : cardWidth * 1.5;
  
  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>
      <TouchableOpacity 
        style={[styles.card, { width: cardWidth }]}
        onPress={() => router.push({
          pathname: '/video-player',
          params: {
            id: item.id,
            title: item.title,
            artist: item.artist || 'KORA Originals',
            poster: item.poster,
            stream_url: item.stream_url || '',
          }
        })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.poster }}
          style={[styles.cardImage, { height: cardHeight }]}
        />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardGradient}
        >
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'documentary' ? 'DOC' :
               item.type === 'series' ? 'SÉRIE' :
               item.type === 'concert' ? 'LIVE' : 'FILM'}
            </Text>
          </View>
          
          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          
          {/* Meta */}
          <View style={styles.cardMeta}>
            <Text style={styles.cardYear}>{item.year}</Text>
            {item.duration && (
              <Text style={styles.cardDuration}>{item.duration}</Text>
            )}
          </View>
          
          {/* Progress Bar */}
          {showProgress && item.progress && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
          )}
        </LinearGradient>
        
        {/* Play Button Overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color={CINEMA.void} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: Category Row
// ═══════════════════════════════════════════════════════════════════════════

const CategoryRow = ({ 
  title, 
  icon, 
  items,
  showProgress = false,
}: { 
  title: string; 
  icon: string;
  items: VideoItem[];
  showProgress?: boolean;
}) => {
  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Ionicons name={icon as any} size={20} color={CINEMA.gold} />
        <Text style={styles.categoryTitle}>{title}</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Voir tout</Text>
          <Ionicons name="chevron-forward" size={16} color={CINEMA.gold} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ContentCard item={item} showProgress={showProgress} index={index} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AudiovisualCatalog() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const scrollY = useSharedValue(0);
  
  // Dynamic content from API
  const [allContent, setAllContent] = useState<VideoItem[]>([]);
  const [featuredContent, setFeaturedContent] = useState<VideoItem | null>(null);
  
  // Load audiovisual content from FrekCore API
  const loadAudiovisualContent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/frekcore/feed/audiovisual?limit=30`);
      if (res.ok) {
        const data = await res.json();
        const transformed = (data.works || []).map((w: any) => ({
          id: w.id,
          title: w.title,
          type: w.type || 'documentary',
          poster: w.poster || w.artwork || 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
          backdrop: w.backdrop || w.poster,
          year: w.year || 2024,
          duration: w.duration || '1h 30min',
          rating: w.rating || 'Tous publics',
          genres: w.genres || ['Documentaire'],
          description: w.description || '',
          artist: w.artist,
          stream_url: w.stream_url,
          frekcore_ref: w.frekcore_ref,
          progress: Math.random() > 0.7 ? Math.floor(Math.random() * 80) + 10 : undefined,
        }));
        
        setAllContent(transformed);
        if (transformed.length > 0) {
          setFeaturedContent(transformed[0]);
        }
        console.log(`[KORA Films] Loaded ${transformed.length} audiovisual works`);
      }
    } catch (error) {
      console.error('Error loading audiovisual content:', error);
    }
  }, []);
  
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAudiovisualContent();
      setLoading(false);
    };
    init();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAudiovisualContent();
    setRefreshing(false);
  };
  
  const genres = ['Tout', 'Films', 'Séries', 'Documentaires', 'Concerts', 'Diaspora', 'Afrique'];
  
  // Filter content based on active genre
  const getFilteredContent = useCallback(() => {
    if (!activeGenre || activeGenre === 'Tout') return allContent;
    
    const genreMap: Record<string, string[]> = {
      'Films': ['film'],
      'Séries': ['series'],
      'Documentaires': ['documentary'],
      'Concerts': ['concert'],
    };
    
    const types = genreMap[activeGenre];
    if (types) {
      return allContent.filter(item => types.includes(item.type));
    }
    
    // Search in genres array
    return allContent.filter(item => 
      item.genres.some(g => g.toLowerCase().includes(activeGenre.toLowerCase()))
    );
  }, [allContent, activeGenre]);
  
  const filteredContent = getFilteredContent();
  
  // Fallback featured content if API didn't return any
  const displayFeatured = featuredContent || {
    id: 'default',
    title: "SAYD — C'est Nous L'Avenir",
    type: 'documentary' as const,
    poster: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    backdrop: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=1280',
    year: 2024,
    duration: '1h 30min',
    rating: '16+',
    genres: ['Documentaire', 'Culture', 'Diaspora'],
    description: "Un documentaire puissant sur la diaspora africaine et son impact culturel mondial.",
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[CINEMA.obsidian, CINEMA.void]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={CINEMA.gold} />
        <Text style={styles.loadingText}>Chargement du catalogue...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[CINEMA.obsidian, CINEMA.void]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CINEMA.gold} />
        }
      >
        {/* Hero Section */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.heroSection}>
          <Image
            source={{ uri: displayFeatured.backdrop || displayFeatured.poster }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', CINEMA.void]}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={['top']} style={styles.heroHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={CINEMA.ivory} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>KORA Films</Text>
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={24} color={CINEMA.ivory} />
              </TouchableOpacity>
            </SafeAreaView>
            
            <View style={styles.heroContent}>
              <View style={styles.heroBadges}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOUVEAU</Text>
                </View>
                <View style={styles.hdrBadge}>
                  <Text style={styles.hdrBadgeText}>4K HDR</Text>
                </View>
              </View>
              
              <Text style={styles.heroTitle}>{displayFeatured.title}</Text>
              
              <View style={styles.heroMeta}>
                <Text style={styles.heroYear}>{displayFeatured.year}</Text>
                <Text style={styles.heroDot}>•</Text>
                <Text style={styles.heroDuration}>{displayFeatured.duration}</Text>
                <Text style={styles.heroDot}>•</Text>
                <Text style={styles.heroRating}>{displayFeatured.rating}</Text>
              </View>
              
              <Text style={styles.heroDescription} numberOfLines={2}>
                {displayFeatured.description || 'Contenu exclusif KORA.'}
              </Text>
              
              <View style={styles.heroActions}>
                <TouchableOpacity 
                  style={styles.playNowButton}
                  onPress={() => router.push({
                    pathname: '/video-player',
                    params: {
                      id: displayFeatured.id,
                      title: displayFeatured.title,
                    }
                  })}
                >
                  <Ionicons name="play" size={24} color={CINEMA.void} />
                  <Text style={styles.playNowText}>Regarder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.addListButton}>
                  <Ionicons name="add" size={24} color={CINEMA.ivory} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={24} color={CINEMA.ivory} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Genre Filter */}
        <View style={styles.genreFilter}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreList}
          >
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreChip,
                  (activeGenre === genre || (!activeGenre && genre === 'Tout')) && styles.genreChipActive
                ]}
                onPress={() => setActiveGenre(genre === 'Tout' ? null : genre)}
              >
                <Text style={[
                  styles.genreChipText,
                  (activeGenre === genre || (!activeGenre && genre === 'Tout')) && styles.genreChipTextActive
                ]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Continue Watching */}
        {filteredContent.filter(i => i.progress).length > 0 && (
          <CategoryRow
            title="Reprendre la lecture"
            icon="play-circle"
            items={filteredContent.filter(i => i.progress)}
            showProgress={true}
          />
        )}
        
        {/* Trending */}
        {filteredContent.length > 0 && (
          <CategoryRow
            title="Tendances KORA"
            icon="trending-up"
            items={filteredContent.slice(0, 6)}
          />
        )}
        
        {/* Documentaries */}
        {filteredContent.filter(i => i.type === 'documentary').length > 0 && (
          <CategoryRow
            title="Documentaires"
            icon="film"
            items={filteredContent.filter(i => i.type === 'documentary')}
          />
        )}
        
        {/* Series */}
        {filteredContent.filter(i => i.type === 'series').length > 0 && (
          <CategoryRow
            title="Séries"
            icon="tv"
            items={filteredContent.filter(i => i.type === 'series')}
          />
        )}
        
        {/* Concerts */}
        {filteredContent.filter(i => i.type === 'concert').length > 0 && (
          <CategoryRow
            title="Concerts & Lives"
            icon="musical-notes"
            items={filteredContent.filter(i => i.type === 'concert')}
          />
        )}
        
        {/* Empty State */}
        {filteredContent.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={64} color={CINEMA.mist} />
            <Text style={styles.emptyStateTitle}>Aucun contenu</Text>
            <Text style={styles.emptyStateText}>
              Le catalogue audiovisuel sera bientôt disponible.
            </Text>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: CINEMA.silver,
    fontFamily: FONTS.jostLight,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 20,
    fontFamily: FONTS.playfairBold,
    color: CINEMA.ivory,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONTS.jostLight,
    color: CINEMA.mist,
    textAlign: 'center',
  },
  
  // Hero
  heroSection: {
    height: SH * 0.65,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: CINEMA.gold,
    letterSpacing: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 32,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  newBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: CINEMA.gold,
    borderRadius: 4,
  },
  newBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.void,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hdrBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  hdrBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: CINEMA.ivory,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: CINEMA.ivory,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroYear: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.silver,
  },
  heroDot: {
    color: CINEMA.mist,
  },
  heroDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.silver,
  },
  heroRating: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: CINEMA.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderRadius: 4,
  },
  heroDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: CINEMA.mist,
    lineHeight: 22,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CINEMA.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  playNowText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: CINEMA.void,
  },
  addListButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Genre Filter
  genreFilter: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  genreList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genreChipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: CINEMA.gold,
  },
  genreChipText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.mist,
  },
  genreChipTextActive: {
    color: CINEMA.gold,
  },
  
  // Category
  categorySection: {
    marginTop: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  categoryTitle: {
    flex: 1,
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: CINEMA.ivory,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.gold,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  
  // Card
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: CINEMA.charcoal,
  },
  cardImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 40,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(212,175,55,0.8)',
    borderRadius: 4,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: CINEMA.void,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.ivory,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  cardYear: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.mist,
  },
  cardDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: CINEMA.mist,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: CINEMA.gold,
    borderRadius: 2,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CINEMA.gold,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
});
