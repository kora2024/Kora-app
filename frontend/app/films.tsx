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
// TYPES & DEMO DATA
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
}

const CATEGORIES = [
  { id: 'continue', title: 'Reprendre la lecture', icon: 'play-circle' },
  { id: 'trending', title: 'Tendances KORA', icon: 'trending-up' },
  { id: 'new', title: 'Nouveautés', icon: 'sparkles' },
  { id: 'docs', title: 'Documentaires', icon: 'film' },
  { id: 'series', title: 'Séries', icon: 'tv' },
  { id: 'concerts', title: 'Concerts & Lives', icon: 'musical-notes' },
];

const DEMO_CONTENT: VideoItem[] = [
  {
    id: 'v1',
    title: "SAYD — C'est Nous L'Avenir",
    type: 'documentary',
    poster: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    backdrop: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=1280',
    year: 2024,
    duration: '1h 30min',
    rating: '16+',
    genres: ['Documentaire', 'Culture', 'Diaspora'],
    description: "Un documentaire puissant sur la diaspora africaine et son impact culturel mondial.",
    progress: 35,
  },
  {
    id: 'v2',
    title: 'Diaspora Rising',
    type: 'series',
    poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    year: 2024,
    duration: '8 épisodes',
    rating: '12+',
    genres: ['Drame', 'Histoire'],
  },
  {
    id: 'v3',
    title: 'Afrobeat Origins',
    type: 'documentary',
    poster: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    year: 2023,
    duration: '2h 15min',
    rating: 'Tous publics',
    genres: ['Musique', 'Histoire'],
  },
  {
    id: 'v4',
    title: 'Lagos to Paris',
    type: 'film',
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    year: 2024,
    duration: '1h 45min',
    rating: '12+',
    genres: ['Drame', 'Romance'],
  },
  {
    id: 'v5',
    title: 'Youssou N\'Dour Live',
    type: 'concert',
    poster: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
    year: 2024,
    duration: '2h',
    rating: 'Tous publics',
    genres: ['Concert', 'Mbalax'],
  },
  {
    id: 'v6',
    title: 'Roots of Zouk',
    type: 'documentary',
    poster: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400',
    year: 2023,
    duration: '1h 20min',
    genres: ['Musique', 'Antilles'],
  },
  {
    id: 'v7',
    title: 'Kinshasa Symphony',
    type: 'documentary',
    poster: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
    year: 2024,
    duration: '1h 35min',
    genres: ['Musique', 'Classique'],
  },
  {
    id: 'v8',
    title: 'Caribbean Dreams',
    type: 'series',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    year: 2024,
    duration: '6 épisodes',
    genres: ['Drame', 'Caraïbes'],
  },
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
        onPress={() => router.push('/video-player')}
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
  
  const featuredContent = DEMO_CONTENT[0];
  
  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const genres = ['Tout', 'Films', 'Séries', 'Documentaires', 'Concerts', 'Diaspora', 'Afrique'];
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[CINEMA.obsidian, CINEMA.void]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={CINEMA.gold} />
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
            source={{ uri: featuredContent.backdrop || featuredContent.poster }}
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
              
              <Text style={styles.heroTitle}>{featuredContent.title}</Text>
              
              <View style={styles.heroMeta}>
                <Text style={styles.heroYear}>{featuredContent.year}</Text>
                <Text style={styles.heroDot}>•</Text>
                <Text style={styles.heroDuration}>{featuredContent.duration}</Text>
                <Text style={styles.heroDot}>•</Text>
                <Text style={styles.heroRating}>{featuredContent.rating}</Text>
              </View>
              
              <Text style={styles.heroDescription} numberOfLines={2}>
                {featuredContent.description}
              </Text>
              
              <View style={styles.heroActions}>
                <TouchableOpacity 
                  style={styles.playNowButton}
                  onPress={() => router.push('/video-player')}
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
        <CategoryRow
          title="Reprendre la lecture"
          icon="play-circle"
          items={DEMO_CONTENT.filter(i => i.progress)}
          showProgress={true}
        />
        
        {/* Trending */}
        <CategoryRow
          title="Tendances KORA"
          icon="trending-up"
          items={DEMO_CONTENT.slice(0, 4)}
        />
        
        {/* Documentaries */}
        <CategoryRow
          title="Documentaires"
          icon="film"
          items={DEMO_CONTENT.filter(i => i.type === 'documentary')}
        />
        
        {/* Series */}
        <CategoryRow
          title="Séries"
          icon="tv"
          items={DEMO_CONTENT.filter(i => i.type === 'series')}
        />
        
        {/* Concerts */}
        <CategoryRow
          title="Concerts & Lives"
          icon="musical-notes"
          items={DEMO_CONTENT.filter(i => i.type === 'concert')}
        />
        
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
  scrollView: {
    flex: 1,
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
