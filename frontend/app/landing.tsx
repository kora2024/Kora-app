/**
 * KORA Landing — Netflix-Style Cinematic Interface
 * 
 * "La Culture en Mouvement"
 * Design: TV-first, 16:9 poster ratios, horizontal scrolling hubs
 * Theme: Dark #0A0A0A / Gold #C9A84C / Terra #A65D47
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { COLORS, FONTS } from '../src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
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
// MOCK DATA — Matching the mockup exactly
// ══════════════════════════════════════════════════════════════════════════════

const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
  },
];

const FEATURED_MAIN = {
  id: 'featured-1',
  badge: 'Featured',
  title: 'GOOD MOOD LIVE',
  subtitle: 'Concert exclusif',
  description: 'Un show. Une énergie.\nUne culture qui unit les mondes.',
  image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
};

const FEATURED_SIDEBAR = [
  {
    id: 'fs-1',
    badge: 'NOUVEAU CLIP',
    title: 'TAYC',
    subtitle: 'N.Y.X',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  },
  {
    id: 'fs-2',
    badge: 'COURT MÉTRAGE',
    title: 'BLACK SUN',
    subtitle: 'Réalisé par\nNadir El Fassi',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
  },
  {
    id: 'fs-3',
    badge: 'DOCUMENTAIRE',
    title: 'DIASPORA',
    subtitle: 'Un voyage. Des racines.\nDes histoires.',
    image: 'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=400',
  },
];

const CATEGORY_ITEMS = [
  { id: 'music', icon: 'music', label: 'MUSIQUE', sublabel: 'Écouter' },
  { id: 'video', icon: 'video', label: 'VIDÉO', sublabel: 'Regarder' },
  { id: 'live', icon: 'live', label: 'LIVE', sublabel: 'En direct' },
  { id: 'creators', icon: 'creators', label: 'CRÉATEURS', sublabel: 'Découvrir' },
  { id: 'playlists', icon: 'playlists', label: 'PLAYLISTS', sublabel: 'Vos sélections' },
  { id: 'territories', icon: 'territories', label: 'TERRITOIRES', sublabel: 'Explorer' },
  { id: 'podcasts', icon: 'podcasts', label: 'PODCASTS', sublabel: 'Écouter' },
];

const TRENDING_ARTISTS = [
  { id: 't1', name: 'Asake', track: 'MMS', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' },
  { id: 't2', name: 'Tiakola', track: 'PONA NINI', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
  { id: 't3', name: 'Burnaboy', track: 'City Boys', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
  { id: 't4', name: 'Aya Nakamura', track: 'Baby', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
  { id: 't5', name: 'Wizkid', track: 'Piece of My Heart', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
  { id: 't6', name: 'Tems', track: 'Me & U', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
  { id: 't7', name: 'Rema', track: 'Calm Down', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
];

const CONTINUE_WATCHING = [
  { id: 'cw1', title: 'KABEAUSHÉ LIVE', type: 'Performance', duration: '24:37', progress: 0.6, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  { id: 'cw2', title: 'BEHIND THE VISION', type: 'Documentaire', duration: '18:52', progress: 0.3, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
  { id: 'cw3', title: 'DIASPORA TALES', type: 'Film', duration: '26:11', progress: 0.75, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
];

const CREATORS_TO_FOLLOW = [
  { id: 'cr1', name: 'Nadir El Fassi', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'cr2', name: 'Lakecia Benjamin', role: 'Musicienne', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { id: 'cr3', name: 'Adama Sanogo', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { id: 'cr4', name: 'Lous and The Yakuza', role: 'Artiste', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { id: 'cr5', name: 'Junior Roy', role: 'Réalisateur', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
];

const PLATFORMS = [
  { id: 'smarttv', label: 'Smart TV', sublabel: 'Samsung, LG, Android TV' },
  { id: 'appletv', label: 'Apple TV', sublabel: '' },
  { id: 'firetv', label: 'Fire TV', sublabel: '' },
  { id: 'roku', label: 'Roku', sublabel: '' },
  { id: 'ios', label: 'iOS', sublabel: '' },
  { id: 'android', label: 'Android', sublabel: '' },
  { id: 'web', label: 'Web', sublabel: 'kora.tv' },
];

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
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
// HEADER COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function Header({ onLogin }: { onLogin: () => void }) {
  const insets = useSafeAreaInsets();
  const navItems = ['ACCUEIL', 'MUSIQUE', 'VIDÉO', 'LIVE', 'CRÉATEURS', 'PLAYLISTS'];
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerLogo}>KORA</Text>
        <View style={styles.headerTagline}>
          <Text style={styles.headerTaglineText}>BEYOND SOUND.</Text>
          <Text style={styles.headerTaglineText}>BEYOND TIME.</Text>
        </View>
      </View>
      
      <View style={styles.headerNav}>
        {navItems.map((item, index) => (
          <TouchableOpacity key={item} style={styles.headerNavItem}>
            <Text style={[styles.headerNavText, index === 0 && styles.headerNavTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerSearchBtn}>
          <SearchIcon size={20} color={CINEMA.cream} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerLoginBtn} onPress={onLogin}>
          <Text style={styles.headerLoginText}>SE CONNECTER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ══════════════════════════════════════════════════════════════════════════════

function HeroSection({ onStart, onTrailer }: { onStart: () => void; onTrailer: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={{ uri: HERO_SLIDES[0].image }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,10,0.5)', 'rgba(10,10,10,0.3)', 'rgba(10,10,10,0.9)']}
          style={styles.heroGradient}
        />
      </ImageBackground>

      <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.heroHeadline}>LA CULTURE{'\n'}EN MOUVEMENT</Text>
        <Text style={styles.heroSubheadline}>
          ÉCOUTE GRATUITE • PREMIUM SANS PUB À 3,98€
        </Text>

        <View style={styles.heroCTAContainer}>
          <TouchableOpacity style={styles.heroPrimaryCTA} onPress={onStart} activeOpacity={0.9}>
            <LinearGradient
              colors={[CINEMA.gold, CINEMA.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroPrimaryCTAGradient}
            >
              <Text style={styles.heroPrimaryCTAText}>ÉCOUTER GRATUITEMENT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.heroSecondaryCTA} onPress={onTrailer} activeOpacity={0.8}>
            <PlayIcon size={16} color={CINEMA.cream} />
            <Text style={styles.heroSecondaryCTAText}>REGARDER LE TRAILER</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURED CONTENT GRID
// ══════════════════════════════════════════════════════════════════════════════

function FeaturedContentGrid({ onItemPress }: { onItemPress: (item: any) => void }) {
  return (
    <View style={styles.featuredContainer}>
      {/* Main Featured Card */}
      <View style={styles.featuredMain}>
        <ImageBackground source={{ uri: FEATURED_MAIN.image }} style={styles.featuredMainImage} imageStyle={styles.featuredMainImageStyle}>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featuredMainGradient} />
          <View style={styles.featuredMainContent}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{FEATURED_MAIN.badge}</Text>
            </View>
            <Text style={styles.featuredMainTitle}>{FEATURED_MAIN.title}</Text>
            <Text style={styles.featuredMainSubtitle}>{FEATURED_MAIN.subtitle}</Text>
            <Text style={styles.featuredMainDescription}>{FEATURED_MAIN.description}</Text>
            <TouchableOpacity style={styles.featuredMainCTA} onPress={() => onItemPress(FEATURED_MAIN)} activeOpacity={0.9}>
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
        {FEATURED_SIDEBAR.map((item) => (
          <TouchableOpacity key={item.id} style={styles.sidebarCard} onPress={() => onItemPress(item)} activeOpacity={0.9}>
            <ImageBackground source={{ uri: item.image }} style={styles.sidebarCardImage} imageStyle={styles.sidebarCardImageStyle}>
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} style={styles.sidebarCardGradient} />
              <View style={styles.sidebarCardContent}>
                <View style={styles.sidebarBadge}>
                  <Text style={styles.sidebarBadgeText}>{item.badge}</Text>
                </View>
                <Text style={styles.sidebarTitle}>{item.title}</Text>
                <Text style={styles.sidebarSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.sidebarPlayBtn}>
                <PlayIcon size={18} color={CINEMA.cream} />
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.sidebarNavArrow}>
          <ChevronRightIcon size={24} color={CINEMA.cream} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY ROW
// ══════════════════════════════════════════════════════════════════════════════

function CategoryRow({ onCategoryPress }: { onCategoryPress: (cat: any) => void }) {
  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryRow}>
        {CATEGORY_ITEMS.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryItem} onPress={() => onCategoryPress(cat)} activeOpacity={0.8}>
            <View style={styles.categoryIconWrapper}>
              {getCategoryIcon(cat.icon)}
            </View>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            <Text style={styles.categorySublabel}>{cat.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRENDING ARTISTS HUB
// ══════════════════════════════════════════════════════════════════════════════

function TrendingHub({ onArtistPress }: { onArtistPress: (artist: any) => void }) {
  return (
    <View style={styles.hubContainer}>
      <View style={styles.hubHeader}>
        <Text style={styles.hubTitle}>EN TENDANCE</Text>
        <ChevronRightIcon size={18} color={CINEMA.cream} />
      </View>
      <FlatList
        horizontal
        data={TRENDING_ARTISTS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hubList}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.trendingCard, index === 0 && { marginLeft: 20 }]}
            onPress={() => onArtistPress(item)}
            activeOpacity={0.9}
          >
            <View style={styles.trendingImageWrapper}>
              <Image source={{ uri: item.image }} style={styles.trendingImage} />
              <View style={styles.trendingPlayBtn}>
                <PlayIcon size={16} color={CINEMA.white} />
              </View>
            </View>
            <Text style={styles.trendingName}>{item.name}</Text>
            <Text style={styles.trendingTrack}>{item.track}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTINUE WATCHING + MINI PLAYER
// ══════════════════════════════════════════════════════════════════════════════

function ContinueWatchingSection({ onItemPress }: { onItemPress: (item: any) => void }) {
  return (
    <View style={styles.continueSection}>
      <View style={styles.continueLeft}>
        <Text style={styles.hubTitle}>CONTINUEZ À REGARDER</Text>
        <View style={styles.continueCards}>
          {CONTINUE_WATCHING.map((item) => (
            <TouchableOpacity key={item.id} style={styles.continueCard} onPress={() => onItemPress(item)} activeOpacity={0.9}>
              <ImageBackground source={{ uri: item.image }} style={styles.continueCardImage} imageStyle={styles.continueCardImageStyle}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.continueCardGradient} />
                <View style={styles.continueCardContent}>
                  <Text style={styles.continueCardTitle}>{item.title}</Text>
                  <Text style={styles.continueCardMeta}>{item.type} • {item.duration}</Text>
                </View>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mini Player */}
      <View style={styles.miniPlayerContainer}>
        <Text style={styles.miniPlayerLabel}>LECTURE EN COURS</Text>
        <View style={styles.miniPlayer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300' }}
            style={styles.miniPlayerArt}
          />
          <Text style={styles.miniPlayerTitle}>GOOD ENERGY</Text>
          <Text style={styles.miniPlayerArtist}>Kora Collective</Text>
          
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

function CreatorsToFollow({ onCreatorPress }: { onCreatorPress: (creator: any) => void }) {
  return (
    <View style={styles.creatorsContainer}>
      <Text style={styles.hubTitle}>CRÉATEURS À SUIVRE</Text>
      <View style={styles.creatorsRow}>
        {CREATORS_TO_FOLLOW.map((creator) => (
          <TouchableOpacity key={creator.id} style={styles.creatorCard} onPress={() => onCreatorPress(creator)} activeOpacity={0.9}>
            <Image source={{ uri: creator.image }} style={styles.creatorAvatar} />
            <Text style={styles.creatorName}>{creator.name}</Text>
            <Text style={styles.creatorRole}>{creator.role}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.creatorNavArrow}>
          <ChevronRightIcon size={24} color={CINEMA.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORMS BANNER
// ══════════════════════════════════════════════════════════════════════════════

function PlatformsBanner() {
  return (
    <View style={styles.platformsContainer}>
      <Text style={styles.platformsTitle}>DISPONIBLE SUR TOUS VOS ÉCRANS</Text>
      <View style={styles.platformsRow}>
        {PLATFORMS.map((p) => (
          <View key={p.id} style={styles.platformItem}>
            <View style={styles.platformIcon}>
              <Text style={styles.platformIconText}>{p.label.charAt(0)}</Text>
            </View>
            <Text style={styles.platformLabel}>{p.label}</Text>
            {p.sublabel ? <Text style={styles.platformSublabel}>{p.sublabel}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════

function Footer({ onJoin }: { onJoin: () => void }) {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerTop}>
        {/* Logo + Links */}
        <View style={styles.footerLogoSection}>
          <Text style={styles.footerLogo}>KORA</Text>
          <Text style={styles.footerTagline}>BEYOND SOUND.{'\n'}BEYOND TIME.</Text>
          <View style={styles.footerSocials}>
            <View style={styles.footerSocialIcon}><Text style={styles.footerSocialText}>IG</Text></View>
            <View style={styles.footerSocialIcon}><Text style={styles.footerSocialText}>YT</Text></View>
            <View style={styles.footerSocialIcon}><Text style={styles.footerSocialText}>TK</Text></View>
            <View style={styles.footerSocialIcon}><Text style={styles.footerSocialText}>X</Text></View>
          </View>
        </View>

        {/* KORA Column */}
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>KORA</Text>
          <Text style={styles.footerLink}>À propos</Text>
          <Text style={styles.footerLink}>Carrières</Text>
          <Text style={styles.footerLink}>Presse</Text>
          <Text style={styles.footerLink}>Partenaires</Text>
        </View>

        {/* LÉGAL Column */}
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>LÉGAL</Text>
          <Text style={styles.footerLink}>Conditions d'utilisation</Text>
          <Text style={styles.footerLink}>Politique de confidentialité</Text>
          <Text style={styles.footerLink}>Cookies</Text>
          <Text style={styles.footerLink}>Mentions légales</Text>
        </View>

        {/* AIDE Column */}
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>AIDE</Text>
          <Text style={styles.footerLink}>Centre d'aide</Text>
          <Text style={styles.footerLink}>Contact</Text>
          <Text style={styles.footerLink}>Abonnement</Text>
          <Text style={styles.footerLink}>FAQ</Text>
        </View>

        {/* Pricing CTA */}
        <View style={styles.footerPricing}>
          <Text style={styles.footerPrice}>3,98€</Text>
          <Text style={styles.footerPriceLabel}>/ MOIS</Text>
          <Text style={styles.footerPriceSubtext}>ACCÉDEZ À TOUT KORA</Text>
          <TouchableOpacity style={styles.footerCTA} onPress={onJoin} activeOpacity={0.9}>
            <Text style={styles.footerCTAText}>ESSAYER MAINTENANT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>© 2024 KORA. TOUS DROITS RÉSERVÉS.</Text>
        <View style={styles.footerLang}>
          <Text style={styles.footerLangText}>FR</Text>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const hapticFeedback = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try { Haptics.impactAsync(style); } catch {}
  }, []);

  const handleLogin = useCallback(() => {
    hapticFeedback();
    router.push('/auth/login');
  }, [router, hapticFeedback]);

  const handleStart = useCallback(() => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    // NOUVEAU FLUX: Écoute gratuite d'abord, pas d'inscription forcée
    router.push('/home');
  }, [router, hapticFeedback]);

  const handleTrailer = useCallback(() => {
    hapticFeedback();
    // Ouvrir le player avec un track featured
    router.push({
      pathname: '/player',
      params: {
        title: 'GOOD MOOD LIVE',
        artist: 'KORA Featured',
        type: 'video',
        stream_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      }
    });
  }, [router, hapticFeedback]);

  const handleItemPress = useCallback((item: any) => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Light);
    // NOUVEAU: Aller au home pour écouter, pas forcer login
    router.push('/home');
  }, [router, hapticFeedback]);

  const handleJoin = useCallback(() => {
    hapticFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/paywall');
  }, [router, hapticFeedback]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <Header onLogin={handleLogin} />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero */}
        <HeroSection onStart={handleStart} onTrailer={handleTrailer} />
        
        {/* Featured Content Grid */}
        <FeaturedContentGrid onItemPress={handleItemPress} />
        
        {/* Category Row */}
        <CategoryRow onCategoryPress={handleItemPress} />
        
        {/* Trending Hub */}
        <TrendingHub onArtistPress={handleItemPress} />
        
        {/* Continue Watching + Mini Player */}
        <ContinueWatchingSection onItemPress={handleItemPress} />
        
        {/* Creators to Follow */}
        <CreatorsToFollow onCreatorPress={handleItemPress} />
        
        {/* Platforms Banner */}
        <PlatformsBanner />
        
        {/* Footer */}
        <Footer onJoin={handleJoin} />
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
    backgroundColor: CINEMA.black,
  },
  scrollView: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.gold,
    letterSpacing: 3,
  },
  headerTagline: {
    marginLeft: 8,
  },
  headerTaglineText: {
    fontFamily: FONTS.jostLight,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerNavItem: {
    paddingVertical: 4,
  },
  headerNavText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  headerNavTextActive: {
    color: CINEMA.cream,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerSearchBtn: {
    padding: 8,
  },
  headerLoginBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  headerLoginText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.cream,
    letterSpacing: 1,
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
    bottom: 60,
    left: 24,
    right: 24,
  },
  heroHeadline: {
    fontFamily: FONTS.playfairBold,
    fontSize: 52,
    color: CINEMA.white,
    lineHeight: 58,
    marginBottom: 16,
  },
  heroSubheadline: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    lineHeight: 22,
    marginBottom: 28,
  },
  heroCTAContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroPrimaryCTA: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroPrimaryCTAGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  heroPrimaryCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  heroSecondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  heroSecondaryCTAText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 12,
    color: CINEMA.cream,
    letterSpacing: 1,
  },

  // ─── Featured Grid ────────────────────────────────────────────────────────────
  featuredContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  featuredMain: {
    flex: 2,
    height: 320,
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
    height: '70%',
    borderRadius: 12,
  },
  featuredMainContent: {
    padding: 20,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CINEMA.gold,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  featuredBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  featuredMainTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: CINEMA.white,
    marginBottom: 4,
  },
  featuredMainSubtitle: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: CINEMA.cream,
    marginBottom: 8,
  },
  featuredMainDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 16,
  },
  featuredMainCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: CINEMA.cream,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 4,
    gap: 8,
  },
  featuredMainCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.black,
    letterSpacing: 1,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 20,
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
    flex: 1,
    gap: 8,
    position: 'relative',
  },
  sidebarCard: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sidebarCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 12,
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
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 6,
  },
  sidebarBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 8,
    color: CINEMA.gold,
    letterSpacing: 1,
  },
  sidebarTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 16,
    color: CINEMA.white,
  },
  sidebarSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  sidebarPlayBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sidebarNavArrow: {
    position: 'absolute',
    right: -12,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Category Row ─────────────────────────────────────────────────────────────
  categoryContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201,168,76,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CINEMA.cream,
    letterSpacing: 1,
    marginBottom: 2,
  },
  categorySublabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
  },

  // ─── Hubs ─────────────────────────────────────────────────────────────────────
  hubContainer: {
    marginTop: 32,
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 6,
  },
  hubTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.cream,
    letterSpacing: 2,
  },
  hubList: {
    paddingRight: 24,
  },
  trendingCard: {
    width: 120,
    marginRight: 14,
  },
  trendingImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: CINEMA.cream,
  },
  trendingTrack: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  // ─── Continue Watching ────────────────────────────────────────────────────────
  continueSection: {
    flexDirection: 'row',
    marginTop: 40,
    paddingHorizontal: 24,
    gap: 20,
  },
  continueLeft: {
    flex: 2,
  },
  continueCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  continueCard: {
    flex: 1,
    height: 140,
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
    padding: 12,
  },
  continueCardTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 14,
    color: CINEMA.white,
    marginBottom: 2,
  },
  continueCardMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
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

  // ─── Mini Player ──────────────────────────────────────────────────────────────
  miniPlayerContainer: {
    flex: 1,
  },
  miniPlayerLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  miniPlayer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniPlayerArt: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  miniPlayerTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 16,
    color: CINEMA.cream,
    marginBottom: 4,
  },
  miniPlayerArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  miniPlayerProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  miniPlayerTime: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  miniPlayerSlider: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CINEMA.cream,
    marginLeft: -5,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  miniPlayerPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CINEMA.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Creators ─────────────────────────────────────────────────────────────────
  creatorsContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  creatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  creatorCard: {
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.3)',
    marginBottom: 10,
  },
  creatorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
    textAlign: 'center',
    marginBottom: 2,
  },
  creatorRole: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  creatorNavArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  // ─── Platforms ────────────────────────────────────────────────────────────────
  platformsContainer: {
    marginTop: 48,
    paddingVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  platformsTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 20,
  },
  platformsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  platformItem: {
    alignItems: 'center',
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  platformIconText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: CINEMA.cream,
  },
  platformLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CINEMA.cream,
  },
  platformSublabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
  },

  // ─── Footer ───────────────────────────────────────────────────────────────────
  footerContainer: {
    marginTop: 32,
    backgroundColor: CINEMA.black,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerTop: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 40,
  },
  footerLogoSection: {
    flex: 1,
  },
  footerLogo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 32,
    color: CINEMA.gold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  footerTagline: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 14,
    marginBottom: 16,
  },
  footerSocials: {
    flexDirection: 'row',
    gap: 12,
  },
  footerSocialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSocialText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: CINEMA.cream,
  },
  footerColumn: {
    flex: 0.8,
  },
  footerColumnTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: CINEMA.cream,
    letterSpacing: 1,
    marginBottom: 16,
  },
  footerLink: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  footerPricing: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerPrice: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: CINEMA.gold,
  },
  footerPriceLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  footerPriceSubtext: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 16,
  },
  footerCTA: {
    backgroundColor: CINEMA.terra,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  footerCTAText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: CINEMA.cream,
    letterSpacing: 1,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerCopyright: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  footerLang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLangText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
