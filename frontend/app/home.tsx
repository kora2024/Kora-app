/**
 * KORA Home — Netflix/Apple TV Premium Interface
 * 
 * "La Culture en Mouvement"
 * Design TV-first identique au mockup de référence
 * Palette: Dark #0A0A0A / Gold #C9A84C / Terra #A65D47
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  FlatList,
  ImageBackground,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — Netflix Premium
// ══════════════════════════════════════════════════════════════════════════════

const CINEMA = {
  black: '#0A0A0A',
  darkGray: '#141414',
  gold: '#C9A84C',
  goldLight: '#D4B55A',
  amber: '#D4A853',
  terra: '#A65D47',
  cream: '#F5F0E6',
  white: '#FFFFFF',
  red: '#E50914',
};

// ══════════════════════════════════════════════════════════════════════════════
// API Configuration
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// ══════════════════════════════════════════════════════════════════════════════
// ICONS — SVG Premium
// ══════════════════════════════════════════════════════════════════════════════

function PlayIcon({ size = 24, color = CINEMA.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function SearchIcon({ size = 24, color = CINEMA.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  );
}

function MusicIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

function VideoIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M10 9l5 3-5 3V9z" fill={CINEMA.gold} />
    </Svg>
  );
}

function LiveIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="3" fill={CINEMA.gold} />
      <Path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </Svg>
  );
}

function CreatorsIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function PlaylistIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Path d="M3 6h18M3 10h18M3 14h12M3 18h12" />
      <Circle cx="19" cy="16" r="3" />
    </Svg>
  );
}

function TerritoriesIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

function PodcastIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CINEMA.gold} strokeWidth={1.5}>
      <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="2" fill={CINEMA.gold} />
    </Svg>
  );
}

function ChevronRightIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

function ShuffleIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </Svg>
  );
}

function SkipBackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 20L9 12l10-8v16zM7 19V5H5v14h2z" />
    </Svg>
  );
}

function SkipForwardIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 4l10 8-10 8V4zm14-1v14h-2V5h2z" />
    </Svg>
  );
}

function PauseIcon({ size = 28, color = CINEMA.black }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </Svg>
  );
}

function HeartIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'music': return <MusicIcon />;
    case 'video': return <VideoIcon />;
    case 'live': return <LiveIcon />;
    case 'creators': return <CreatorsIcon />;
    case 'playlists': return <PlaylistIcon />;
    case 'territories': return <TerritoriesIcon />;
    case 'podcasts': return <PodcastIcon />;
    default: return <MusicIcon />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STATIC DATA — Category Navigation
// ══════════════════════════════════════════════════════════════════════════════

const CATEGORY_ITEMS = [
  { id: 'music', icon: 'music', label: 'MUSIQUE', sublabel: 'Écouter' },
  { id: 'video', icon: 'video', label: 'VIDÉO', sublabel: 'Regarder' },
  { id: 'live', icon: 'live', label: 'LIVE', sublabel: 'En direct' },
  { id: 'creators', icon: 'creators', label: 'CRÉATEURS', sublabel: 'Découvrir' },
  { id: 'playlists', icon: 'playlists', label: 'PLAYLISTS', sublabel: 'Vos sélections' },
  { id: 'territories', icon: 'territories', label: 'TERRITOIRES', sublabel: 'Explorer' },
  { id: 'podcasts', icon: 'podcasts', label: 'PODCASTS', sublabel: 'Écouter' },
];

// ══════════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function Header({ onSettings, onSearch }: { onSettings: () => void; onSearch: () => void }) {
  const insets = useSafeAreaInsets();
  const navItems = ['ACCUEIL', 'MUSIQUE', 'VIDÉO', 'LIVE', 'CRÉATEURS', 'PLAYLISTS'];
  
  return (
    <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerLogo}>KORA</Text>
        <View style={styles.headerTagline}>
          <Text style={styles.headerTaglineText}>BEYOND SOUND.</Text>
          <Text style={styles.headerTaglineText}>BEYOND TIME.</Text>
        </View>
      </View>
      
      <View style={styles.headerNav}>
        {navItems.slice(0, SW > 600 ? 6 : 3).map((item, index) => (
          <TouchableOpacity key={item} style={styles.headerNavItem}>
            <Text style={[styles.headerNavText, index === 0 && styles.headerNavTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerSearchBtn} onPress={onSearch}>
          <SearchIcon size={20} color={CINEMA.cream} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerProfileBtn} onPress={onSettings}>
          <LinearGradient
            colors={[CINEMA.terra, '#8B4D3B']}
            style={styles.headerProfileGradient}
          >
            <Text style={styles.headerProfileInitial}>K</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO SECTION — Cinematic Landing
// ══════════════════════════════════════════════════════════════════════════════

function HeroSection({ onPlay, featuredContent }: { onPlay: (item: any) => void; featuredContent: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const heroImage = featuredContent?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200';
  const heroTitle = featuredContent?.title || 'LA CULTURE EN MOUVEMENT';

  return (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={{ uri: heroImage }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,10,0.4)', 'rgba(10,10,10,0.2)', 'rgba(10,10,10,0.95)']}
          style={styles.heroGradient}
        />
      </ImageBackground>

      <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.heroHeadline}>LA CULTURE{'\n'}EN MOUVEMENT</Text>
        <Text style={styles.heroSubheadline}>
          MUSIQUE. CINÉMA. PERFORMANCES.{'\n'}UNE SEULE EXPÉRIENCE.
        </Text>

        <View style={styles.heroCTAContainer}>
          <TouchableOpacity 
            style={styles.heroPrimaryCTA} 
            onPress={() => onPlay(featuredContent)} 
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[CINEMA.gold, CINEMA.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroPrimaryCTAGradient}
            >
              <Text style={styles.heroPrimaryCTAText}>COMMENCER L'EXPÉRIENCE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroSecondaryCTA} onPress={() => onPlay(featuredContent)} activeOpacity={0.8}>
            <PlayIcon size={16} color={CINEMA.cream} />
            <Text style={styles.heroSecondaryCTAText}>REGARDER LE TRAILER</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURED CONTENT GRID — Main + Sidebar Layout
// ══════════════════════════════════════════════════════════════════════════════

function FeaturedContentGrid({ items, onItemPress }: { items: any[]; onItemPress: (item: any) => void }) {
  const mainItem = items[0];
  const sidebarItems = items.slice(1, 4);

  if (!mainItem) {
    return (
      <View style={styles.featuredContainer}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={CINEMA.gold} />
          <Text style={styles.loadingText}>Chargement du catalogue...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.featuredContainer}>
      {/* Main Featured Card */}
      <View style={styles.featuredMain}>
        <ImageBackground 
          source={{ uri: mainItem.artwork || mainItem.image }} 
          style={styles.featuredMainImage} 
          imageStyle={styles.featuredMainImageStyle}
        >
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.featuredMainGradient} />
          <View style={styles.featuredMainContent}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
            <Text style={styles.featuredMainTitle}>{mainItem.title}</Text>
            <Text style={styles.featuredMainSubtitle}>{mainItem.artist || 'KORA Exclusive'}</Text>
            <Text style={styles.featuredMainDescription}>
              Un show. Une énergie.{'\n'}Une culture qui unit les mondes.
            </Text>
            <TouchableOpacity style={styles.featuredMainCTA} onPress={() => onItemPress(mainItem)} activeOpacity={0.9}>
              <PlayIcon size={14} color={CINEMA.black} />
              <Text style={styles.featuredMainCTAText}>REGARDER MAINTENANT</Text>
            </TouchableOpacity>
          </View>
          {/* Carousel Dots */}
          <View style={styles.carouselDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.carouselDot, i === 0 && styles.carouselDotActive]} />
            ))}
          </View>
        </ImageBackground>
      </View>

      {/* Sidebar Items */}
      <View style={styles.featuredSidebar}>
        {sidebarItems.map((item, index) => (
          <TouchableOpacity key={item.id || index} style={styles.sidebarCard} onPress={() => onItemPress(item)} activeOpacity={0.9}>
            <ImageBackground 
              source={{ uri: item.artwork || item.image }} 
              style={styles.sidebarCardImage} 
              imageStyle={styles.sidebarCardImageStyle}
            >
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)']} style={styles.sidebarCardGradient} />
              <View style={styles.sidebarCardContent}>
                <View style={styles.sidebarBadge}>
                  <Text style={styles.sidebarBadgeText}>
                    {item.type === 'video' ? 'NOUVEAU CLIP' : item.type === 'audio' ? 'AUDIO' : 'CONTENU'}
                  </Text>
                </View>
                <Text style={styles.sidebarTitle}>{item.title}</Text>
                <Text style={styles.sidebarSubtitle}>{item.artist}</Text>
              </View>
              <View style={styles.sidebarPlayBtn}>
                <PlayIcon size={18} color={CINEMA.cream} />
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
        {sidebarItems.length > 0 && (
          <TouchableOpacity style={styles.sidebarNavArrow}>
            <ChevronRightIcon size={24} color={CINEMA.cream} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY ROW — Icon Navigation
// ══════════════════════════════════════════════════════════════════════════════

function CategoryRow({ onCategoryPress }: { onCategoryPress: (cat: any) => void }) {
  return (
    <View style={styles.categoryContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {CATEGORY_ITEMS.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => onCategoryPress(cat)} activeOpacity={0.8}>
            <View style={styles.categoryIconWrapper}>
              {getCategoryIcon(cat.icon)}
            </View>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categorySublabel}>{cat.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRENDING HUB — Artists with Play Buttons
// ══════════════════════════════════════════════════════════════════════════════

function TrendingHub({ items, onItemPress }: { items: any[]; onItemPress: (item: any) => void }) {
  if (items.length === 0) return null;

  return (
    <View style={styles.hubContainer}>
      <View style={styles.hubHeader}>
        <Text style={styles.hubTitle}>EN TENDANCE</Text>
        <ChevronRightIcon size={18} color={CINEMA.cream} />
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item, index) => item.id || `trending-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hubList}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.trendingCard, index === 0 && { marginLeft: 20 }]}
            onPress={() => onItemPress(item)}
            activeOpacity={0.9}
          >
            <View style={styles.trendingImageWrapper}>
              <Image source={{ uri: item.artwork || item.image }} style={styles.trendingImage} />
              <View style={styles.trendingPlayBtn}>
                <PlayIcon size={16} color={CINEMA.white} />
              </View>
            </View>
            <Text style={styles.trendingName} numberOfLines={1}>{item.artist || item.title}</Text>
            <Text style={styles.trendingTrack} numberOfLines={1}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTINUE WATCHING SECTION + MINI PLAYER
// ══════════════════════════════════════════════════════════════════════════════

function ContinueWatchingSection({ items, currentTrack, onItemPress }: { 
  items: any[]; 
  currentTrack: any;
  onItemPress: (item: any) => void 
}) {
  const watchItems = items.slice(0, 3);

  return (
    <View style={styles.continueSection}>
      <View style={styles.continueLeft}>
        <Text style={styles.hubTitle}>CONTINUEZ À REGARDER</Text>
        <View style={styles.continueCards}>
          {watchItems.length > 0 ? watchItems.map((item, index) => (
            <TouchableOpacity 
              key={item.id || index} 
              style={styles.continueCard} 
              onPress={() => onItemPress(item)} 
              activeOpacity={0.9}
            >
              <ImageBackground 
                source={{ uri: item.artwork || item.image }} 
                style={styles.continueCardImage} 
                imageStyle={styles.continueCardImageStyle}
              >
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.continueCardGradient} />
                <View style={styles.continueCardContent}>
                  <Text style={styles.continueCardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.continueCardMeta}>{item.type || 'Audio'} • {item.duration || '3:45'}</Text>
                </View>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${(item.progress || Math.random()) * 100}%` }]} />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Commencez à écouter pour voir votre historique</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mini Player */}
      <View style={styles.miniPlayerContainer}>
        <Text style={styles.miniPlayerLabel}>LECTURE EN COURS</Text>
        <View style={styles.miniPlayer}>
          <Image
            source={{ uri: currentTrack?.artwork || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300' }}
            style={styles.miniPlayerArt}
          />
          <Text style={styles.miniPlayerTitle}>{currentTrack?.title || 'GOOD ENERGY'}</Text>
          <Text style={styles.miniPlayerArtist}>{currentTrack?.artist || 'Kora Collective'}</Text>
          
          <View style={styles.miniPlayerProgress}>
            <Text style={styles.miniPlayerTime}>1:32</Text>
            <View style={styles.miniPlayerSlider}>
              <View style={styles.miniPlayerSliderFill} />
              <View style={styles.miniPlayerSliderThumb} />
            </View>
            <Text style={styles.miniPlayerTime}>3:45</Text>
          </View>

          <View style={styles.miniPlayerControls}>
            <TouchableOpacity><ShuffleIcon size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
            <TouchableOpacity><SkipBackIcon size={22} color={CINEMA.cream} /></TouchableOpacity>
            <TouchableOpacity style={styles.miniPlayerPlayBtn}>
              <PauseIcon size={24} color={CINEMA.black} />
            </TouchableOpacity>
            <TouchableOpacity><SkipForwardIcon size={22} color={CINEMA.cream} /></TouchableOpacity>
            <TouchableOpacity><HeartIcon size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATORS TO FOLLOW
// ══════════════════════════════════════════════════════════════════════════════

function CreatorsToFollow({ creators, onCreatorPress }: { creators: any[]; onCreatorPress: (creator: any) => void }) {
  const displayCreators = creators.length > 0 ? creators : [
    { id: 'cr1', name: 'Nadir El Fassi', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    { id: 'cr2', name: 'Lakecia Benjamin', role: 'Musicienne', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
    { id: 'cr3', name: 'Adama Sanogo', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
    { id: 'cr4', name: 'Lous and The Yakuza', role: 'Artiste', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
    { id: 'cr5', name: 'Junior Roy', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  ];

  return (
    <View style={styles.creatorsContainer}>
      <Text style={styles.hubTitle}>CRÉATEURS À SUIVRE</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.creatorsScrollContent}
      >
        {displayCreators.map((creator) => (
          <TouchableOpacity 
            key={creator.id} 
            style={styles.creatorCard} 
            onPress={() => onCreatorPress(creator)} 
            activeOpacity={0.9}
          >
            <Image source={{ uri: creator.image || creator.avatar }} style={styles.creatorAvatar} />
            <Text style={styles.creatorName} numberOfLines={1}>{creator.name || creator.display_name}</Text>
            <Text style={styles.creatorRole}>{creator.role || 'Artiste'}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.creatorNavArrow}>
          <ChevronRightIcon size={24} color={CINEMA.gold} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PREMIUM PRICING SECTION — Netflix/Spotify Level + Pack Famille
// ══════════════════════════════════════════════════════════════════════════════

function PremiumPricingSection({ onSelectPlan }: { onSelectPlan: (plan: 'premium' | 'family') => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [activeUsers, setActiveUsers] = useState(47832);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Subtle live counter animation
    counterRef.current = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, []);

  const PREMIUM_FEATURES = [
    { id: 'noads', label: 'Sans publicité', sublabel: 'Écoute ininterrompue' },
    { id: 'hd', label: 'Qualité Lossless', sublabel: 'Audio Hi-Res 24-bit' },
    { id: 'download', label: 'Téléchargement', sublabel: 'Écoute hors-ligne' },
    { id: 'exclusive', label: 'Contenus exclusifs', sublabel: 'Lives, documentaires' },
  ];

  const FAMILY_FEATURES = [
    { id: 'accounts', label: 'Jusqu\'à 6 comptes', sublabel: 'Chacun son profil' },
    { id: 'noads', label: 'Sans publicité', sublabel: 'Pour toute la famille' },
    { id: 'hd', label: 'Qualité Lossless', sublabel: 'Sur tous les comptes' },
    { id: 'parental', label: 'Contrôle parental', sublabel: 'Contenus adaptés' },
  ];

  return (
    <Animated.View style={[styles.pricingSectionContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={['rgba(201,168,76,0.03)', 'rgba(10,10,10,0)', 'rgba(166,93,71,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pricingGradientBg}
      />

      {/* Social Proof - Animated */}
      <View style={styles.socialProofContainer}>
        <View style={styles.socialProofDot} />
        <Text style={styles.socialProofText}>
          <Text style={styles.socialProofNumber}>{activeUsers.toLocaleString('fr-FR')}</Text>
          {' '}auditeurs en ce moment
        </Text>
      </View>

      {/* Comparison Cards */}
      <View style={styles.comparisonContainer}>
        {/* Free Tier */}
        <View style={styles.tierCard}>
          <Text style={styles.tierLabel}>GRATUIT</Text>
          <Text style={styles.tierPrice}>0€</Text>
          <View style={styles.tierFeatures}>
            <View style={styles.tierFeatureRow}>
              <View style={styles.tierFeatureIconFree}>
                <Text style={styles.tierFeatureIconText}>✓</Text>
              </View>
              <Text style={styles.tierFeatureText}>Catalogue limité</Text>
            </View>
            <View style={styles.tierFeatureRow}>
              <View style={styles.tierFeatureIconFree}>
                <Text style={styles.tierFeatureIconText}>✓</Text>
              </View>
              <Text style={styles.tierFeatureText}>Avec publicités</Text>
            </View>
            <View style={styles.tierFeatureRow}>
              <View style={[styles.tierFeatureIconFree, styles.tierFeatureIconDisabled]}>
                <Text style={styles.tierFeatureIconTextDisabled}>—</Text>
              </View>
              <Text style={styles.tierFeatureTextDisabled}>Téléchargement</Text>
            </View>
            <View style={styles.tierFeatureRow}>
              <View style={[styles.tierFeatureIconFree, styles.tierFeatureIconDisabled]}>
                <Text style={styles.tierFeatureIconTextDisabled}>—</Text>
              </View>
              <Text style={styles.tierFeatureTextDisabled}>Qualité HD</Text>
            </View>
          </View>
        </View>

        {/* Premium Tier */}
        <View style={[styles.tierCard, styles.tierCardPremium]}>
          <LinearGradient
            colors={['rgba(201,168,76,0.15)', 'rgba(201,168,76,0.05)']}
            style={styles.tierCardPremiumGlow}
          />
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>POPULAIRE</Text>
          </View>
          <Text style={styles.tierLabelPremium}>PREMIUM</Text>
          <View style={styles.tierPriceRow}>
            <Text style={styles.tierPricePremium}>3,98€</Text>
            <Text style={styles.tierPricePeriod}>/mois</Text>
          </View>
          <View style={styles.tierFeatures}>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.tierFeatureRow}>
                <View style={styles.tierFeatureIconPremium}>
                  <CheckIcon size={12} color={CINEMA.gold} />
                </View>
                <View style={styles.tierFeatureTextContainer}>
                  <Text style={styles.tierFeatureTextPremium}>{feature.label}</Text>
                  <Text style={styles.tierFeatureSublabel}>{feature.sublabel}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.tierCTA} onPress={() => onSelectPlan('premium')} activeOpacity={0.9}>
            <LinearGradient
              colors={[CINEMA.gold, '#B8963F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tierCTAGradient}
            >
              <Text style={styles.tierCTAText}>S'ABONNER</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.tierCTASubtext}>7 jours gratuits puis 3,98€/mois</Text>
        </View>

        {/* Family Tier */}
        <View style={[styles.tierCard, styles.tierCardFamily]}>
          <LinearGradient
            colors={['rgba(166,93,71,0.15)', 'rgba(166,93,71,0.05)']}
            style={styles.tierCardPremiumGlow}
          />
          <View style={[styles.tierBadge, styles.tierBadgeFamily]}>
            <Text style={styles.tierBadgeText}>FAMILLE</Text>
          </View>
          <Text style={styles.tierLabelFamily}>PACK FAMILLE</Text>
          <View style={styles.tierPriceRow}>
            <Text style={styles.tierPriceFamily}>7,98€</Text>
            <Text style={styles.tierPricePeriod}>/mois</Text>
          </View>
          <View style={styles.tierFeatures}>
            {FAMILY_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.tierFeatureRow}>
                <View style={styles.tierFeatureIconFamily}>
                  <CheckIcon size={12} color={CINEMA.terra} />
                </View>
                <View style={styles.tierFeatureTextContainer}>
                  <Text style={styles.tierFeatureTextPremium}>{feature.label}</Text>
                  <Text style={styles.tierFeatureSublabel}>{feature.sublabel}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[styles.tierCTA, styles.tierCTAFamily]} onPress={() => onSelectPlan('family')} activeOpacity={0.9}>
            <LinearGradient
              colors={[CINEMA.terra, '#8B4D3B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tierCTAGradient}
            >
              <Text style={styles.tierCTAText}>CHOISIR FAMILLE</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.tierCTASubtext}>7 jours gratuits puis 7,98€/mois</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Check Icon for premium features
function CheckIcon({ size = 16, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}>
      <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER — Major DSP Level avec Vraies Routes
// ══════════════════════════════════════════════════════════════════════════════

function Footer({ onNavigate }: { onNavigate: (route: string) => void }) {
  return (
    <View style={styles.footerContainer}>
      {/* Top Section - Branding + Links */}
      <View style={styles.footerTop}>
        {/* Brand Column */}
        <View style={styles.footerBrand}>
          <Text style={styles.footerLogo}>KORA</Text>
          <Text style={styles.footerTagline}>La culture en mouvement</Text>
          
          {/* Social Icons */}
          <View style={styles.footerSocials}>
            <TouchableOpacity style={styles.footerSocialBtn}>
              <InstagramIcon size={18} color={CINEMA.cream} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerSocialBtn}>
              <YoutubeIcon size={18} color={CINEMA.cream} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerSocialBtn}>
              <TiktokIcon size={18} color={CINEMA.cream} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerSocialBtn}>
              <XIcon size={18} color={CINEMA.cream} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Links Grid */}
        <View style={styles.footerLinksGrid}>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkTitle}>Entreprise</Text>
            <TouchableOpacity onPress={() => onNavigate('/(static)/about')}><Text style={styles.footerLinkItem}>À propos</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/(static)/contact')}><Text style={styles.footerLinkItem}>Contact</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/(static)/about')}><Text style={styles.footerLinkItem}>Presse</Text></TouchableOpacity>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkTitle}>Communautés</Text>
            <TouchableOpacity onPress={() => onNavigate('/creator/studio')}><Text style={styles.footerLinkItem}>Artistes</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/(static)/about')}><Text style={styles.footerLinkItem}>Développeurs</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/(static)/contact')}><Text style={styles.footerLinkItem}>Publicité</Text></TouchableOpacity>
          </View>
          <View style={styles.footerLinkColumn}>
            <Text style={styles.footerLinkTitle}>Aide</Text>
            <TouchableOpacity onPress={() => onNavigate('/(static)/help')}><Text style={styles.footerLinkItem}>Centre d'aide</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/paywall')}><Text style={styles.footerLinkItem}>Abonnement</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate('/settings')}><Text style={styles.footerLinkItem}>Compte</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.footerDivider} />

      {/* Bottom Section - Legal + Platform badges */}
      <View style={styles.footerBottom}>
        <View style={styles.footerLegal}>
          <TouchableOpacity onPress={() => onNavigate('/(static)/legal')}><Text style={styles.footerLegalLink}>Mentions légales</Text></TouchableOpacity>
          <Text style={styles.footerLegalDot}>•</Text>
          <TouchableOpacity onPress={() => onNavigate('/(static)/privacy')}><Text style={styles.footerLegalLink}>Confidentialité</Text></TouchableOpacity>
          <Text style={styles.footerLegalDot}>•</Text>
          <TouchableOpacity onPress={() => onNavigate('/(static)/privacy')}><Text style={styles.footerLegalLink}>Cookies</Text></TouchableOpacity>
        </View>

        <View style={styles.footerMeta}>
          <TouchableOpacity style={styles.footerLangBtn}>
            <GlobeIcon size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.footerLangText}>France (FR)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Copyright */}
      <Text style={styles.footerCopyright}>© 2024 KORA Technologies. Tous droits réservés.</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL ICONS (SVG)
// ══════════════════════════════════════════════════════════════════════════════

function InstagramIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x="2" y="2" width="20" height="20" rx="5" />
      <Circle cx="12" cy="12" r="4" />
      <Circle cx="18" cy="6" r="1" fill={color} />
    </Svg>
  );
}

function YoutubeIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
      <Path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill={color} />
    </Svg>
  );
}

function TiktokIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
    </Svg>
  );
}

function XIcon({ size = 20, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.4-8M20 4l-6.4 8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GlobeIcon({ size = 16, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function KoraHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data states
  const [featuredTracks, setFeaturedTracks] = useState<any[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    loadCatalogData();
  }, []);

  const loadCatalogData = async () => {
    try {
      setIsLoading(true);
      
      // Load featured tracks
      const featuredRes = await fetch(`${API_BASE}/api/catalog/featured?limit=12`);
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedTracks(data.tracks || []);
        if (data.tracks?.length > 0) {
          setCurrentTrack(data.tracks[0]);
        }
      }

      // Load trending (can be same endpoint with different params)
      const trendingRes = await fetch(`${API_BASE}/api/catalog/featured?limit=10&sort=plays`);
      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingTracks(data.tracks || []);
      }
      
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hapticFeedback = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try { Haptics.impactAsync(style); } catch {}
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    await loadCatalogData();
    setRefreshing(false);
  }, []);

  const handlePlay = useCallback((item?: any) => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    if (item) {
      setCurrentTrack(item);
    }
    router.push({
      pathname: '/player',
      params: item ? { 
        id: item.id,
        title: item.title, 
        artist: item.artist || 'KORA',
        type: item.type || 'audio',
        source: item.source || 'jamendo',
        stream_url: item.stream_url || '',
        artwork: item.artwork || item.image || '',
      } : {}
    });
  }, [router, hapticFeedback]);

  const handleCategoryPress = useCallback((cat: any) => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    switch (cat.id) {
      case 'playlists':
        router.push('/playlists');
        break;
      case 'podcasts':
        router.push('/podcasts');
        break;
      case 'live':
        router.push('/live');
        break;
      case 'creators':
        router.push('/creator/studio');
        break;
      default:
        // Stay on home, could filter by category
        break;
    }
  }, [router, hapticFeedback]);

  const handleSettings = useCallback(() => {
    hapticFeedback();
    router.push('/settings');
  }, [router, hapticFeedback]);

  const handleSearch = useCallback(() => {
    setSearchVisible(!searchVisible);
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
  }, [searchVisible, hapticFeedback]);

  const handleCreatorPress = useCallback((creator: any) => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/creator/[id]',
      params: { id: creator.id }
    });
  }, [router, hapticFeedback]);

  const handleSelectPlan = useCallback((plan: 'premium' | 'family') => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/paywall',
      params: { plan }
    });
  }, [router, hapticFeedback]);

  const handleNavigate = useCallback((route: string) => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }, [router, hapticFeedback]);

  // Transform tracks for display
  const transformedFeatured = featuredTracks.map((track) => ({
    ...track,
    image: track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <Header onSettings={handleSettings} onSearch={handleSearch} />

      {/* Search Overlay */}
      {searchVisible && (
        <View style={[styles.searchOverlay, { top: insets.top + 60 }]}>
          <BlurView intensity={90} style={styles.searchBlur} tint="dark">
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={CINEMA.gold} />
              <TextInput
                style={styles.searchInput}
                placeholder="Artistes, albums, films..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <Text style={styles.searchClose}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, flexGrow: 1 }}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={CINEMA.gold}
            colors={[CINEMA.gold]}
          />
        }
      >
        {/* Hero */}
        <HeroSection onPlay={handlePlay} featuredContent={featuredTracks[0]} />
        
        {/* Featured Content Grid */}
        <FeaturedContentGrid items={transformedFeatured} onItemPress={handlePlay} />
        
        {/* Category Row */}
        <CategoryRow onCategoryPress={handleCategoryPress} />
        
        {/* Trending Hub */}
        <TrendingHub items={trendingTracks} onItemPress={handlePlay} />
        
        {/* Continue Watching + Mini Player */}
        <ContinueWatchingSection 
          items={featuredTracks.slice(0, 3)} 
          currentTrack={currentTrack}
          onItemPress={handlePlay} 
        />
        
        {/* Creators to Follow */}
        <CreatorsToFollow creators={creators} onCreatorPress={handleCreatorPress} />
        
        {/* Premium Pricing Section */}
        <PremiumPricingSection onSelectPlan={handleSelectPlan} />
        
        {/* Footer */}
        <Footer onNavigate={handleNavigate} />
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES — Netflix Premium Theme
// ══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CINEMA.black,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100%',
      overflowY: 'auto',
    } as any),
  },

  // ─── Header ───────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,10,10,0.9)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: CINEMA.gold,
    letterSpacing: 3,
  },
  headerTagline: {
    marginLeft: 6,
  },
  headerTaglineText: {
    fontFamily: FONTS.jostLight,
    fontSize: 7,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerNavItem: {
    paddingVertical: 4,
  },
  headerNavText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  headerNavTextActive: {
    color: CINEMA.cream,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSearchBtn: {
    padding: 8,
  },
  headerProfileBtn: {
    // Profile button
  },
  headerProfileGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileInitial: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.cream,
  },

  // ─── Search ───────────────────────────────────────────────────────────────────
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
  },
  searchBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.jostRegular,
    fontSize: 15,
    color: CINEMA.cream,
  },
  searchClose: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.gold,
  },

  // ─── Hero ─────────────────────────────────────────────────────────────────────
  heroContainer: {
    height: SH * 0.55,
    width: SW,
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  heroHeadline: {
    fontFamily: FONTS.playfairBold,
    fontSize: SW > 400 ? 48 : 36,
    color: CINEMA.white,
    lineHeight: SW > 400 ? 54 : 42,
    marginBottom: 12,
  },
  heroSubheadline: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    lineHeight: 20,
    marginBottom: 24,
  },
  heroCTAContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroPrimaryCTA: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroPrimaryCTAGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  heroPrimaryCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  heroSecondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  heroSecondaryCTAText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: CINEMA.cream,
    letterSpacing: 1,
  },

  // ─── Featured Grid ────────────────────────────────────────────────────────────
  featuredContainer: {
    flexDirection: SW > 600 ? 'row' : 'column',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  loadingState: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  featuredMain: {
    flex: SW > 600 ? 2 : undefined,
    height: SW > 600 ? 300 : 260,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredMainImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  featuredMainImageStyle: {
    borderRadius: 12,
  },
  featuredMainGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
    borderRadius: 12,
  },
  featuredMainContent: {
    padding: 18,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CINEMA.gold,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  featuredBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  featuredMainTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 24,
    color: CINEMA.white,
    marginBottom: 4,
  },
  featuredMainSubtitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: CINEMA.cream,
    marginBottom: 6,
  },
  featuredMainDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 17,
    marginBottom: 14,
  },
  featuredMainCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: CINEMA.cream,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    gap: 8,
  },
  featuredMainCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    flexDirection: 'row',
    gap: 6,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  carouselDotActive: {
    backgroundColor: CINEMA.gold,
  },
  featuredSidebar: {
    flex: SW > 600 ? 1 : undefined,
    gap: 8,
    position: 'relative',
    flexDirection: SW > 600 ? 'column' : 'row',
    marginTop: SW > 600 ? 0 : 12,
  },
  sidebarCard: {
    flex: 1,
    height: SW > 600 ? undefined : 100,
    minHeight: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sidebarCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 10,
  },
  sidebarCardImageStyle: {
    borderRadius: 8,
  },
  sidebarCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebarCardContent: {
    zIndex: 1,
  },
  sidebarBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  sidebarBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 7,
    color: CINEMA.gold,
    letterSpacing: 1,
  },
  sidebarTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 14,
    color: CINEMA.white,
  },
  sidebarSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  sidebarPlayBtn: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sidebarNavArrow: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    display: SW > 600 ? 'flex' : 'none',
  },

  // ─── Category Row ─────────────────────────────────────────────────────────────
  categoryContainer: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: SW > 600 ? 28 : 18,
  },
  categoryItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  categoryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201,168,76,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: CINEMA.cream,
    letterSpacing: 1,
    marginBottom: 2,
  },
  categorySublabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
  },

  // ─── Trending Hub ─────────────────────────────────────────────────────────────
  hubContainer: {
    marginTop: 28,
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 6,
  },
  hubTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
    letterSpacing: 2,
  },
  hubList: {
    paddingRight: 20,
  },
  trendingCard: {
    width: 110,
    marginRight: 12,
  },
  trendingImageWrapper: {
    width: 110,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
  },
  trendingTrack: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
  },

  // ─── Continue Watching ────────────────────────────────────────────────────────
  continueSection: {
    flexDirection: SW > 600 ? 'row' : 'column',
    marginTop: 36,
    paddingHorizontal: 20,
    gap: 16,
  },
  continueLeft: {
    flex: SW > 600 ? 2 : undefined,
  },
  continueCards: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  continueCard: {
    flex: 1,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  continueCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  continueCardImageStyle: {
    borderRadius: 8,
  },
  continueCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  continueCardContent: {
    padding: 10,
  },
  continueCardTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 12,
    color: CINEMA.white,
    marginBottom: 2,
  },
  continueCardMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: CINEMA.terra,
  },
  emptyState: {
    flex: 1,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  emptyStateText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },

  // ─── Mini Player ──────────────────────────────────────────────────────────────
  miniPlayerContainer: {
    flex: SW > 600 ? 1 : undefined,
    marginTop: SW > 600 ? 0 : 24,
  },
  miniPlayerLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
    marginBottom: 14,
  },
  miniPlayer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  miniPlayerArt: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 14,
  },
  miniPlayerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 14,
    color: CINEMA.cream,
    marginBottom: 4,
  },
  miniPlayerArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
  },
  miniPlayerProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 14,
  },
  miniPlayerTime: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
  },
  miniPlayerSlider: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    position: 'relative',
  },
  miniPlayerSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: CINEMA.cream,
    borderRadius: 2,
  },
  miniPlayerSliderThumb: {
    position: 'absolute',
    left: '40%',
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: CINEMA.cream,
    marginLeft: -4,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  miniPlayerPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CINEMA.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Creators ─────────────────────────────────────────────────────────────────
  creatorsContainer: {
    marginTop: 36,
    paddingHorizontal: 20,
  },
  creatorsScrollContent: {
    marginTop: 14,
    gap: 18,
  },
  creatorCard: {
    alignItems: 'center',
    width: 70,
  },
  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.25)',
    marginBottom: 8,
  },
  creatorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.cream,
    textAlign: 'center',
    marginBottom: 2,
  },
  creatorRole: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
  },
  creatorNavArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },

  // ─── Platforms ────────────────────────────────────────────────────────────────
  platformsContainer: {
    marginTop: 40,
    paddingVertical: 22,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  platformsTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginBottom: 18,
  },
  platformsScrollContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  platformItem: {
    alignItems: 'center',
  },
  platformIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  platformIconText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.cream,
  },
  platformLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 9,
    color: CINEMA.cream,
  },
  platformSublabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 7,
    color: 'rgba(255,255,255,0.35)',
  },

  // ─── Footer ───────────────────────────────────────────────────────────────────
  footerContainer: {
    marginTop: 32,
    backgroundColor: CINEMA.black,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerTop: {
    flexDirection: SW > 600 ? 'row' : 'column',
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: SW > 600 ? 32 : 24,
  },
  footerLogoSection: {
    flex: SW > 600 ? 1 : undefined,
    marginBottom: SW > 600 ? 0 : 20,
  },
  footerLogo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.gold,
    letterSpacing: 3,
    marginBottom: 6,
  },
  footerTagline: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 13,
    marginBottom: 14,
  },
  footerSocials: {
    flexDirection: 'row',
    gap: 10,
  },

  // ─── Premium Pricing Section ──────────────────────────────────────────────────
  pricingSectionContainer: {
    marginTop: 48,
    paddingHorizontal: 20,
    paddingVertical: 40,
    position: 'relative',
  },
  pricingGradientBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  socialProofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  socialProofDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  socialProofText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  socialProofNumber: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.cream,
  },
  comparisonContainer: {
    flexDirection: SW > 500 ? 'row' : 'column',
    gap: 16,
    justifyContent: 'center',
    alignItems: SW > 500 ? 'stretch' : 'center',
  },
  tierCard: {
    flex: SW > 500 ? 1 : undefined,
    maxWidth: SW > 500 ? 280 : 320,
    width: SW > 500 ? undefined : '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tierCardPremium: {
    borderColor: 'rgba(201,168,76,0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardPremiumGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  tierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: CINEMA.gold,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 8,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  tierLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tierLabelPremium: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.gold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tierPrice: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  tierPricePremium: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CINEMA.gold,
  },
  tierPricePeriod: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  tierFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  tierFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tierFeatureIconFree: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierFeatureIconDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tierFeatureIconText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  tierFeatureIconTextDisabled: {
    color: 'rgba(255,255,255,0.15)',
  },
  tierFeatureIconPremium: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tierFeatureText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  tierFeatureTextDisabled: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.2)',
    textDecorationLine: 'line-through',
  },
  tierFeatureTextContainer: {
    flex: 1,
  },
  tierFeatureTextPremium: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.cream,
  },
  tierFeatureSublabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  tierCTA: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  tierCTAGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tierCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  tierCTASubtext: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 10,
  },

  // Pack Famille specific styles
  tierCardFamily: {
    borderColor: 'rgba(166,93,71,0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  tierBadgeFamily: {
    backgroundColor: CINEMA.terra,
  },
  tierLabelFamily: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.terra,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tierPriceFamily: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CINEMA.terra,
  },
  tierFeatureIconFamily: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(166,93,71,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tierCTAFamily: {
    // Inherits from tierCTA, gradient is set in component
  },

  // ─── Footer (DSP Level) ───────────────────────────────────────────────────────
  footerContainer: {
    marginTop: 40,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  footerTop: {
    flexDirection: SW > 600 ? 'row' : 'column',
    gap: 32,
    marginBottom: 32,
  },
  footerBrand: {
    flex: SW > 600 ? 1 : undefined,
    marginBottom: SW > 600 ? 0 : 20,
  },
  footerLogo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.gold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  footerTagline: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 20,
  },
  footerSocialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinksGrid: {
    flex: SW > 600 ? 2 : undefined,
    flexDirection: 'row',
    gap: SW > 600 ? 40 : 24,
    flexWrap: 'wrap',
  },
  footerLinkColumn: {
    minWidth: 90,
  },
  footerLinkTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  footerLinkItem: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 10,
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  footerLegal: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  footerLegalLink: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
  footerLegalDot: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerLangText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  footerCopyright: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
});
