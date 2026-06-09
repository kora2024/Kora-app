/**
 * KORA Stream — Premium Cultural Streaming Platform
 * 
 * Interface Netflix + Spotify hybride
 * Compétiteur à 1,99€/mois
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../../src/theme';
import { 
  PlayIcon, 
  SearchIcon,
  InfoIcon,
  PlusIcon,
  VolumeIcon,
} from '../../src/components/icons/KoraIcons';
import Svg, { Path, Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// ICONS — Streaming Specific
// ══════════════════════════════════════════════════════════════════════════════

function PlayCircleIcon({ size = 56, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx="28" cy="28" r="27" fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth="2" />
      <Path
        d="M22 18L40 28L22 38V18Z"
        fill={color}
      />
    </Svg>
  );
}

function MuteIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23 9L17 15M17 9L23 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10L12 15L17 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShareIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
      <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA — Premium Content
// ══════════════════════════════════════════════════════════════════════════════

const HERO_CONTENT = {
  id: 'hero_1',
  title: 'RACINES',
  subtitle: 'Série documentaire',
  description: 'Voyage au cœur des diasporas africaines. Une exploration intime de l\'identité, de la mémoire et de l\'appartenance.',
  image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=1200',
  logo: null,
  tags: ['Documentaire', 'Culture', '2024'],
  rating: '16+',
  seasons: 2,
  match: 97,
};

const CATEGORIES = [
  { id: 'all', label: 'Accueil' },
  { id: 'video', label: 'Vidéo' },
  { id: 'audio', label: 'Audio' },
  { id: 'live', label: 'Live' },
  { id: 'cinema', label: 'Cinéma' },
];

const TOP_10 = [
  {
    id: 't1',
    rank: 1,
    title: 'Lagos Session',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    type: 'Série',
  },
  {
    id: 't2',
    rank: 2,
    title: 'Mémoires Vivantes',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    type: 'Film',
  },
  {
    id: 't3',
    rank: 3,
    title: 'Zouk Forever',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    type: 'Concert',
  },
  {
    id: 't4',
    rank: 4,
    title: 'Cuisine Créole',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    type: 'Émission',
  },
  {
    id: 't5',
    rank: 5,
    title: 'Beats de Dakar',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400',
    type: 'Musique',
  },
];

const CONTINUE_WATCHING = [
  {
    id: 'cw1',
    title: 'La Traversée',
    episode: 'S1:E4',
    progress: 0.45,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    remaining: '32 min',
  },
  {
    id: 'cw2',
    title: 'Mémoires Vivantes',
    episode: '',
    progress: 0.72,
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    remaining: '18 min',
  },
  {
    id: 'cw3',
    title: 'Afro Futur',
    episode: 'S2:E1',
    progress: 0.15,
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
    remaining: '45 min',
  },
];

const TRENDING_NOW = [
  {
    id: 'tr1',
    title: 'Session Studio',
    territory: 'Lagos',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    isNew: true,
  },
  {
    id: 'tr2',
    title: 'Histoires d\'Haïti',
    territory: 'Port-au-Prince',
    image: 'https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=400',
    isNew: false,
  },
  {
    id: 'tr3',
    title: 'Afrobeats 101',
    territory: 'Accra',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    isNew: true,
  },
  {
    id: 'tr4',
    title: 'La Route du Sel',
    territory: 'Dakar',
    image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400',
    isNew: false,
  },
  {
    id: 'tr5',
    title: 'Poésie Urbaine',
    territory: 'Paris',
    image: 'https://images.unsplash.com/photo-1559510981-10719ce4266a?w=400',
    isNew: true,
  },
];

const LIVE_NOW = [
  {
    id: 'live1',
    title: 'Concert Zouk Live',
    creator: 'Kassav\'',
    viewers: '12.4K',
    territory: 'Guadeloupe',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
  },
  {
    id: 'live2',
    title: 'Culture Talk',
    creator: 'Manu Dibango Jr',
    viewers: '3.2K',
    territory: 'Paris',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
  },
  {
    id: 'live3',
    title: 'Studio Session',
    creator: 'Wizkid',
    viewers: '45.1K',
    territory: 'Lagos',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400',
  },
];

const AUDIO_PLAYLISTS = [
  {
    id: 'pl1',
    title: 'Afro Essentiel',
    tracks: 45,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    color: '#A65D47',
  },
  {
    id: 'pl2',
    title: 'Zouk Classics',
    tracks: 32,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    color: '#4A7FA5',
  },
  {
    id: 'pl3',
    title: 'Chill Diaspora',
    tracks: 28,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    color: '#C9A84C',
  },
  {
    id: 'pl4',
    title: 'Afrobeats Hot',
    tracks: 50,
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400',
    color: '#7B4B94',
  },
];

const DOCUMENTARIES = [
  {
    id: 'doc1',
    title: 'Retour aux Sources',
    duration: '1h 45min',
    image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=400',
  },
  {
    id: 'doc2',
    title: 'L\'Or Noir',
    duration: '52 min',
    image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400',
  },
  {
    id: 'doc3',
    title: 'Génération Afro',
    duration: '1h 20min',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  },
  {
    id: 'doc4',
    title: 'Les Gardiens',
    duration: '1h 10min',
    image: 'https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=400',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// CARD COMPONENTS — Netflix/Spotify Style
// ══════════════════════════════════════════════════════════════════════════════

// Standard content card (Netflix poster style)
function ContentCard({ item, width = 110, height = 165, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.contentCard, { width, height }]} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.contentCardImage} />
      {item.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>N</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Top 10 card with large rank number
function Top10Card({ item, index, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.top10Card} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.top10Rank}>{item.rank}</Text>
      <View style={styles.top10ImageContainer}>
        <Image source={{ uri: item.image }} style={styles.top10Image} />
        <View style={styles.top10Type}>
          <Text style={styles.top10TypeText}>{item.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Continue watching card with progress bar
function ContinueCard({ item, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.continueCard} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.continueImageWrapper}>
        <Image source={{ uri: item.image }} style={styles.continueImage} />
        <View style={styles.continuePlayOverlay}>
          <PlayCircleIcon size={44} color="#fff" />
        </View>
        <View style={styles.continueInfo}>
          <Text style={styles.continueRemaining}>{item.remaining}</Text>
        </View>
      </View>
      <View style={styles.continueProgressBar}>
        <View style={[styles.continueProgressFill, { width: `${item.progress * 100}%` }]} />
      </View>
      <View style={styles.continueDetails}>
        <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
        {item.episode && <Text style={styles.continueEpisode}>{item.episode}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// Live card with red indicator
function LiveCard({ item, onPress }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <TouchableOpacity 
      style={styles.liveCard} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.liveCardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.liveCardGradient}
      />
      <View style={styles.liveIndicatorBadge}>
        <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
        <Text style={styles.liveViewers}>{item.viewers}</Text>
      </View>
      <View style={styles.liveCardInfo}>
        <Text style={styles.liveCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.liveCardCreator}>{item.creator}</Text>
        <Text style={styles.liveCardTerritory}>{item.territory}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Audio playlist card (Spotify style)
function PlaylistCard({ item, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.playlistCard} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.playlistImage} />
      <LinearGradient
        colors={['transparent', item.color]}
        style={styles.playlistGradient}
      />
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle}>{item.title}</Text>
        <Text style={styles.playlistTracks}>{item.tracks} titres</Text>
      </View>
      <TouchableOpacity style={styles.playlistPlayBtn}>
        <PlayIcon size={24} color={COLORS.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// Documentary card (wide format)
function DocCard({ item, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.docCard} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.docImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.docGradient}
      />
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{item.title}</Text>
        <Text style={styles.docDuration}>{item.duration}</Text>
      </View>
      <View style={styles.docPlayOverlay}>
        <PlayCircleIcon size={48} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// Section header with "See all" link
function SectionHeader({ title, subtitle, showAll, onSeeAll }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {showAll && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Tout voir</Text>
          <ChevronRightIcon size={16} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function StreamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isMuted, setIsMuted] = useState(true);

  // Header animation
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.1, 1],
    extrapolate: 'clamp',
  });

  const handleCategoryPress = (catId: string) => {
    setActiveCategory(catId);
    try { Haptics.selectionAsync(); } catch {}
  };

  const handlePlay = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    // TODO: Navigate to player
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            paddingTop: insets.top,
            backgroundColor: scrollY.interpolate({
              inputRange: [0, 200],
              outputRange: ['transparent', COLORS.dark],
              extrapolate: 'clamp',
            }),
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>KORA</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <SearchIcon size={22} color={COLORS.cream} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                activeCategory === cat.id && styles.categoryTabActive,
              ]}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.categoryTabText,
                  activeCategory === cat.id && styles.categoryTabTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Main Scroll */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
          <ImageBackground
            source={{ uri: HERO_CONTENT.image }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                'rgba(13,13,13,0.3)',
                'rgba(13,13,13,0.1)',
                'rgba(13,13,13,0.5)',
                COLORS.dark,
              ]}
              locations={[0, 0.3, 0.7, 1]}
              style={styles.heroGradient}
            />
          </ImageBackground>
          
          <View style={[styles.heroContent, { paddingTop: insets.top + 100 }]}>
            {/* Tags */}
            <View style={styles.heroTags}>
              {HERO_CONTENT.tags.map((tag, i) => (
                <React.Fragment key={tag}>
                  <Text style={styles.heroTag}>{tag}</Text>
                  {i < HERO_CONTENT.tags.length - 1 && (
                    <Text style={styles.heroTagDot}>•</Text>
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.heroTitle}>{HERO_CONTENT.title}</Text>
            
            {/* Match & Rating */}
            <View style={styles.heroMeta}>
              <Text style={styles.heroMatch}>{HERO_CONTENT.match}% Match</Text>
              <View style={styles.heroRating}>
                <Text style={styles.heroRatingText}>{HERO_CONTENT.rating}</Text>
              </View>
              <Text style={styles.heroSeasons}>{HERO_CONTENT.seasons} Saisons</Text>
            </View>

            {/* Description */}
            <Text style={styles.heroDescription} numberOfLines={2}>
              {HERO_CONTENT.description}
            </Text>

            {/* Buttons */}
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
                <PlayIcon size={22} color={COLORS.dark} />
                <Text style={styles.playBtnText}>Lecture</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.listBtn}>
                <PlusIcon size={22} color={COLORS.cream} />
                <Text style={styles.listBtnText}>Ma liste</Text>
              </TouchableOpacity>
            </View>

            {/* Mute button */}
            <TouchableOpacity 
              style={styles.muteBtn}
              onPress={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <MuteIcon size={18} color={COLORS.cream} />
              ) : (
                <VolumeIcon size={18} color={COLORS.cream} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          
          {/* Continue Watching */}
          {CONTINUE_WATCHING.length > 0 && (
            <View style={styles.section}>
              <SectionHeader 
                title="Reprendre" 
                showAll 
                onSeeAll={() => {}} 
              />
              <FlatList
                horizontal
                data={CONTINUE_WATCHING}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <ContinueCard item={item} onPress={() => {}} />
                )}
              />
            </View>
          )}

          {/* Live Now */}
          {LIVE_NOW.length > 0 && (
            <View style={styles.section}>
              <SectionHeader 
                title="En direct maintenant"
                subtitle={`${LIVE_NOW.length} diffusions`}
                showAll 
                onSeeAll={() => {}} 
              />
              <FlatList
                horizontal
                data={LIVE_NOW}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <LiveCard item={item} onPress={() => {}} />
                )}
              />
            </View>
          )}

          {/* Top 10 */}
          <View style={styles.section}>
            <SectionHeader 
              title="Top 10 aujourd'hui"
              showAll={false}
            />
            <FlatList
              horizontal
              data={TOP_10}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item, index }) => (
                <Top10Card item={item} index={index} onPress={() => {}} />
              )}
            />
          </View>

          {/* Audio Playlists (Spotify style) */}
          <View style={styles.section}>
            <SectionHeader 
              title="Playlists audio"
              subtitle="La bande-son de la diaspora"
              showAll 
              onSeeAll={() => {}} 
            />
            <FlatList
              horizontal
              data={AUDIO_PLAYLISTS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <PlaylistCard item={item} onPress={() => {}} />
              )}
            />
          </View>

          {/* Trending */}
          <View style={styles.section}>
            <SectionHeader 
              title="Tendances"
              showAll 
              onSeeAll={() => {}} 
            />
            <FlatList
              horizontal
              data={TRENDING_NOW}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ContentCard 
                  item={item} 
                  width={110} 
                  height={165} 
                  onPress={() => {}} 
                />
              )}
            />
          </View>

          {/* Documentaries */}
          <View style={styles.section}>
            <SectionHeader 
              title="Documentaires"
              subtitle="Histoires qui comptent"
              showAll 
              onSeeAll={() => {}} 
            />
            <FlatList
              horizontal
              data={DOCUMENTARIES}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <DocCard item={item} onPress={() => {}} />
              )}
            />
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>
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
  scrollView: {
    flex: 1,
  },
  
  // ────── Header ──────
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.terra,
    letterSpacing: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ────── Categories ──────
  categoryScroll: {
    marginTop: 4,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.cream,
  },
  categoryTabText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  categoryTabTextActive: {
    color: COLORS.dark,
  },

  // ────── Hero ──────
  heroSection: {
    height: SH * 0.7,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTag: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.8,
  },
  heroTagDot: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.5,
    marginHorizontal: 8,
  },
  heroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 52,
    color: COLORS.cream,
    letterSpacing: 6,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  heroMatch: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: '#46D369',
  },
  heroRating: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroRatingText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
  },
  heroSeasons: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
  },
  heroDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: '90%',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 4,
    gap: 8,
  },
  playBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.dark,
  },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    gap: 8,
  },
  listBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  muteBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // ────── Sections ──────
  sectionsContainer: {
    marginTop: -20,
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.cream,
  },
  sectionSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.gray,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // ────── Content Card ──────
  contentCard: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  contentCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.terra,
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
  },

  // ────── Top 10 Card ──────
  top10Card: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 8,
  },
  top10Rank: {
    fontFamily: FONTS.playfairBold,
    fontSize: 100,
    color: COLORS.dark,
    marginRight: -24,
    zIndex: 0,
    // Outline effect using text shadow
    textShadow: `-2px 0 0 ${COLORS.cream}, 2px 0 0 ${COLORS.cream}, 0 -2px 0 ${COLORS.cream}, 0 2px 0 ${COLORS.cream}`,
  } as any,
  top10ImageContainer: {
    width: 90,
    height: 135,
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 1,
  },
  top10Image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  top10Type: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  top10TypeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
  },

  // ────── Continue Card ──────
  continueCard: {
    width: 140,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.dark2,
  },
  continueImageWrapper: {
    width: '100%',
    height: 80,
    position: 'relative',
  },
  continueImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  continuePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  continueInfo: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  continueRemaining: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  continueProgressBar: {
    height: 3,
    backgroundColor: COLORS.dark3,
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
  },
  continueDetails: {
    padding: 10,
  },
  continueTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  continueEpisode: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },

  // ────── Live Card ──────
  liveCard: {
    width: 200,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  liveCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveIndicatorBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229,9,20,0.95)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    gap: 6,
  },
  livePulse: {
    position: 'absolute',
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1,
  },
  liveViewers: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  liveCardInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  liveCardTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  liveCardCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.9,
  },
  liveCardTerritory: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },

  // ────── Playlist Card (Spotify style) ──────
  playlistCard: {
    width: 160,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  playlistImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playlistGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  playlistInfo: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
  },
  playlistTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 4,
  },
  playlistTracks: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  playlistPlayBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    // Cross-platform shadow
    boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
  } as any,

  // ────── Documentary Card ──────
  docCard: {
    width: 280,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  docImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  docInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
  },
  docTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 4,
  },
  docDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
  },
  docPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    opacity: 0.9,
  },
});
