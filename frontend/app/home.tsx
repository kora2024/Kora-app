/**
 * KORA Home — Expérience Unifiée
 * 
 * UN SEUL ÉCRAN. TOUT KORA.
 * 
 * Sections fluides:
 * - Hero immersif
 * - Globe miniature interactif (navigation territoriale)
 * - Continuer (reprise de lecture)
 * - Lives en cours
 * - Tendances par territoire
 * - Playlists & Collections
 * - Créateurs à suivre
 * - Nébuleuse (recommandations IA)
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
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, TYPOGRAPHY } from '../src/theme';
import { PlayIcon, SearchIcon, PlusIcon } from '../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// MINI GLOBE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function MiniGlobe({ selectedTerritory, onSelectTerritory }: { 
  selectedTerritory: string | null; 
  onSelectTerritory: (t: string) => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const territories = [
    { id: 'caraibe', name: 'Caraïbe', x: 25, y: 35, color: COLORS.terra },
    { id: 'afrique', name: 'Afrique', x: 55, y: 40, color: '#C9A84C' },
    { id: 'europe', name: 'Europe', x: 50, y: 25, color: '#4A7FA5' },
    { id: 'ameriques', name: 'Amériques', x: 20, y: 45, color: '#7B4B94' },
  ];

  return (
    <View style={styles.miniGlobeContainer}>
      <View style={styles.miniGlobeWrapper}>
        {/* Globe SVG */}
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <RadialGradient id="globeGrad" cx="40%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#2a2a35" />
              <Stop offset="100%" stopColor="#0d0d0d" />
            </RadialGradient>
          </Defs>
          {/* Globe base */}
          <Circle cx="60" cy="60" r="55" fill="url(#globeGrad)" stroke="rgba(166,93,71,0.3)" strokeWidth="1" />
          {/* Grid lines */}
          <Path d="M60 5 Q90 60 60 115" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
          <Path d="M60 5 Q30 60 60 115" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
          <Path d="M5 60 Q60 30 115 60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
          <Path d="M5 60 Q60 90 115 60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
          {/* Territory points */}
          {territories.map((t) => (
            <G key={t.id}>
              <Circle 
                cx={t.x * 1.2} 
                cy={t.y * 1.2} 
                r={selectedTerritory === t.id ? 8 : 5} 
                fill={t.color} 
                opacity={selectedTerritory === t.id ? 1 : 0.6}
              />
              {selectedTerritory === t.id && (
                <Circle cx={t.x * 1.2} cy={t.y * 1.2} r="12" stroke={t.color} strokeWidth="2" fill="none" opacity={0.4} />
              )}
            </G>
          ))}
        </Svg>
      </View>
      {/* Territory selector */}
      <View style={styles.territorySelector}>
        {territories.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.territoryChip,
              selectedTerritory === t.id && { backgroundColor: t.color, borderColor: t.color },
            ]}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              onSelectTerritory(t.id);
            }}
          >
            <View style={[styles.territoryDot, { backgroundColor: t.color }]} />
            <Text style={[
              styles.territoryChipText,
              selectedTerritory === t.id && styles.territoryChipTextActive
            ]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

const HERO_CONTENT = {
  id: 'hero_1',
  title: 'RACINES',
  subtitle: 'Série documentaire',
  description: 'Voyage au cœur des diasporas africaines.',
  image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=1200',
  type: 'video',
  match: 97,
};

const CONTINUE_WATCHING = [
  { id: 'cw1', title: 'Lagos Session', type: 'Album', progress: 0.65, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', remaining: '12 titres' },
  { id: 'cw2', title: 'La Traversée', type: 'Film', progress: 0.45, image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400', remaining: '32 min' },
  { id: 'cw3', title: 'Zouk Classics', type: 'Playlist', progress: 0.30, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', remaining: '24 titres' },
];

const LIVE_NOW = [
  { id: 'l1', title: 'Studio Live', creator: 'Fela Jr.', viewers: '2.4K', territory: 'Lagos', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400' },
  { id: 'l2', title: 'Culture Talk', creator: 'Marie-Claire', viewers: '890', territory: 'Paris', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400' },
];

const TRENDING = {
  caraibe: [
    { id: 'tc1', title: 'Zouk Forever', artist: "Kassav'", type: 'Album', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
    { id: 'tc2', title: 'Créole Dreams', artist: 'Jocelyne Labylle', type: 'Single', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'tc3', title: 'Antilles 2024', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
    { id: 'tc4', title: 'Island Vibes', artist: 'DJ Kora', type: 'Mix', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
  ],
  afrique: [
    { id: 'ta1', title: 'Afrobeats Rising', artist: 'Burna Boy', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'ta2', title: 'Lagos Nights', artist: 'Wizkid', type: 'Single', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
    { id: 'ta3', title: 'Dakar Sound', artist: 'Youssou N\'Dour', type: 'Album', image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400' },
    { id: 'ta4', title: 'Naija Hits', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  ],
  europe: [
    { id: 'te1', title: 'Diaspora Paris', artist: 'Aya Nakamura', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'te2', title: 'London Afro', artist: 'J Hus', type: 'Single', image: 'https://images.unsplash.com/photo-1571266028243-d220c6a8b855?w=400' },
  ],
  ameriques: [
    { id: 'tam1', title: 'Brooklyn Vibes', artist: 'Wyclef Jean', type: 'Album', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400' },
    { id: 'tam2', title: 'Miami Bass', artist: 'Various', type: 'Playlist', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400' },
  ],
};

const CREATORS = [
  { id: 'cr1', name: "Kassav'", role: 'Groupe', followers: '2.1M', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', verified: true },
  { id: 'cr2', name: 'Fela Jr.', role: 'Producteur', followers: '890K', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', verified: true },
  { id: 'cr3', name: 'Marie-Claire', role: 'Réalisatrice', followers: '340K', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', verified: false },
  { id: 'cr4', name: 'Burna Boy', role: 'Artiste', followers: '5.2M', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', verified: true },
];

const NEBULEUSE = [
  { id: 'n1', title: 'Pour toi', description: 'Basé sur tes écoutes', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', color: COLORS.terra },
  { id: 'n2', title: 'Découvertes', description: 'Nouveaux artistes', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', color: '#4A7FA5' },
  { id: 'n3', title: 'Mix du jour', description: 'Sélection quotidienne', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', color: '#C9A84C' },
];

const CINEMA = [
  { id: 'cin1', title: 'Retour aux Sources', duration: '1h 45min', image: 'https://images.unsplash.com/photo-1590845947676-fa3b6a0b6faa?w=400' },
  { id: 'cin2', title: "L'Or Noir", duration: '52 min', image: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400' },
  { id: 'cin3', title: 'Génération Afro', duration: '1h 20min', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400' },
];

// ══════════════════════════════════════════════════════════════════════════════
// CARD COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function ContinueCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.continueImageWrapper}>
        <Image source={{ uri: item.image }} style={styles.continueImage} />
        <View style={styles.continuePlayOverlay}>
          <View style={styles.playCircle}>
            <PlayIcon size={18} color={COLORS.dark} />
          </View>
        </View>
        <View style={styles.continueTypeBadge}>
          <Text style={styles.continueTypeText}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.continueProgressBar}>
        <View style={[styles.continueProgressFill, { width: `${item.progress * 100}%` }]} />
      </View>
      <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.continueRemaining}>{item.remaining}</Text>
    </TouchableOpacity>
  );
}

function LiveCard({ item, onPress }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity style={styles.liveCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.liveImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.liveGradient} />
      <View style={styles.liveBadge}>
        <Animated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
        <Text style={styles.liveViewers}>{item.viewers}</Text>
      </View>
      <View style={styles.liveInfo}>
        <Text style={styles.liveTitle}>{item.title}</Text>
        <Text style={styles.liveCreator}>{item.creator} • {item.territory}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ContentCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.contentCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.contentImage} />
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.contentArtist} numberOfLines={1}>{item.artist}</Text>
        <Text style={styles.contentType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CreatorCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.creatorCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.creatorImage} />
      <View style={styles.creatorInfo}>
        <View style={styles.creatorNameRow}>
          <Text style={styles.creatorName}>{item.name}</Text>
          {item.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>}
        </View>
        <Text style={styles.creatorRole}>{item.role}</Text>
        <Text style={styles.creatorFollowers}>{item.followers}</Text>
      </View>
      <TouchableOpacity style={styles.followBtn}>
        <PlusIcon size={16} color={COLORS.cream} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function NebuleuseCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.nebuleuseCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.nebuleuseImage} />
      <LinearGradient colors={['transparent', item.color]} style={styles.nebuleuseGradient} />
      <View style={styles.nebuleuseInfo}>
        <Text style={styles.nebuleuseTitle}>{item.title}</Text>
        <Text style={styles.nebuleuseDesc}>{item.description}</Text>
      </View>
      <View style={[styles.nebuleusePlayBtn, { backgroundColor: item.color }]}>
        <PlayIcon size={20} color={COLORS.cream} />
      </View>
    </TouchableOpacity>
  );
}

function CinemaCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.cinemaCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.cinemaImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cinemaGradient} />
      <View style={styles.cinemaPlayOverlay}>
        <View style={styles.cinemaPlayCircle}>
          <PlayIcon size={24} color={COLORS.dark} />
        </View>
      </View>
      <View style={styles.cinemaInfo}>
        <Text style={styles.cinemaTitle}>{item.title}</Text>
        <Text style={styles.cinemaDuration}>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, subtitle, action, onAction }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function KoraHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedTerritory, setSelectedTerritory] = useState<string>('caraibe');
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handlePlay = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    // Navigate to player
  }, []);

  const handleSearch = useCallback(() => {
    setSearchVisible(!searchVisible);
    try { Haptics.selectionAsync(); } catch {}
  }, [searchVisible]);

  const handleProfile = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleCreate = useCallback(() => {
    router.push('/(tabs)/create');
  }, [router]);

  const currentTrending = TRENDING[selectedTerritory as keyof typeof TRENDING] || TRENDING.caraibe;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <Animated.View style={[styles.fixedHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <LinearGradient colors={[COLORS.dark, 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logoText}>KORA</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleCreate}>
            <PlusIcon size={22} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleSearch}>
            <SearchIcon size={22} color={COLORS.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={handleProfile}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>K</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar (conditionally visible) */}
      {searchVisible && (
        <Animated.View style={[styles.searchContainer, { top: insets.top + 56 }]}>
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Artistes, albums, films..."
              placeholderTextColor={COLORS.gray}
              autoFocus
            />
          </View>
        </Animated.View>
      )}

      {/* Main Scroll */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.terra}
            colors={[COLORS.terra]}
          />
        }
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <ImageBackground source={{ uri: HERO_CONTENT.image }} style={styles.heroImage}>
            <LinearGradient
              colors={['rgba(13,13,13,0.2)', 'rgba(13,13,13,0.4)', COLORS.dark]}
              locations={[0, 0.5, 1]}
              style={styles.heroGradient}
            />
          </ImageBackground>
          <View style={[styles.heroContent, { paddingTop: insets.top + 80 }]}>
            <Text style={styles.heroSubtitle}>{HERO_CONTENT.subtitle}</Text>
            <Text style={styles.heroTitle}>{HERO_CONTENT.title}</Text>
            <Text style={styles.heroDescription}>{HERO_CONTENT.description}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMatch}>{HERO_CONTENT.match}% Match</Text>
            </View>
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
                <PlayIcon size={20} color={COLORS.dark} />
                <Text style={styles.playBtnText}>Lecture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.listBtn}>
                <PlusIcon size={20} color={COLORS.cream} />
                <Text style={styles.listBtnText}>Ma liste</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Sections */}
        <View style={styles.sectionsContainer}>
          
          {/* Mini Globe + Territory Selector */}
          <View style={styles.section}>
            <SectionHeader title="Explorer par territoire" />
            <MiniGlobe 
              selectedTerritory={selectedTerritory} 
              onSelectTerritory={setSelectedTerritory} 
            />
          </View>

          {/* Continue */}
          {CONTINUE_WATCHING.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Reprendre" action="Tout voir" />
              <FlatList
                horizontal
                data={CONTINUE_WATCHING}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => <ContinueCard item={item} onPress={handlePlay} />}
              />
            </View>
          )}

          {/* Live Now */}
          {LIVE_NOW.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="En direct" subtitle={`${LIVE_NOW.length} lives`} action="Tout voir" />
              <FlatList
                horizontal
                data={LIVE_NOW}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => <LiveCard item={item} onPress={handlePlay} />}
              />
            </View>
          )}

          {/* Trending by Territory */}
          <View style={styles.section}>
            <SectionHeader 
              title={`Tendances ${selectedTerritory === 'caraibe' ? 'Caraïbe' : selectedTerritory === 'afrique' ? 'Afrique' : selectedTerritory === 'europe' ? 'Europe' : 'Amériques'}`}
              action="Tout voir" 
            />
            <FlatList
              horizontal
              data={currentTrending}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => <ContentCard item={item} onPress={handlePlay} />}
            />
          </View>

          {/* Nébuleuse (AI Recommendations) */}
          <View style={styles.section}>
            <SectionHeader title="Nébuleuse" subtitle="Tes recommandations" />
            <FlatList
              horizontal
              data={NEBULEUSE}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => <NebuleuseCard item={item} onPress={handlePlay} />}
            />
          </View>

          {/* Cinéma */}
          <View style={styles.section}>
            <SectionHeader title="Cinéma" subtitle="Films & Documentaires" action="Tout voir" />
            <FlatList
              horizontal
              data={CINEMA}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => <CinemaCard item={item} onPress={handlePlay} />}
            />
          </View>

          {/* Creators */}
          <View style={styles.section}>
            <SectionHeader title="Créateurs" subtitle="À suivre" action="Tout voir" />
            <FlatList
              horizontal
              data={CREATORS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => <CreatorCard item={item} onPress={() => {}} />}
            />
          </View>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 40 }} />
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 90,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logoText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.terra,
    letterSpacing: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    marginLeft: 4,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  
  // ────── Search ──────
  searchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
  },
  
  // ────── Hero ──────
  heroSection: {
    height: SH * 0.55,
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
  heroSubtitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 44,
    color: COLORS.cream,
    letterSpacing: 4,
    marginBottom: 8,
  },
  heroDescription: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroMatch: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: '#46D369',
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
    paddingHorizontal: 24,
    borderRadius: 4,
    gap: 8,
  },
  playBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
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
  
  // ────── Sections ──────
  sectionsContainer: {
    backgroundColor: COLORS.dark,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 20,
    color: COLORS.cream,
  },
  sectionSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  sectionAction: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.terra,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  
  // ────── Mini Globe ──────
  miniGlobeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  miniGlobeWrapper: {
    marginBottom: 20,
  },
  territorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  territoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  territoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  territoryChipText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  territoryChipTextActive: {
    color: COLORS.cream,
  },
  
  // ────── Continue Card ──────
  continueCard: {
    width: 150,
  },
  continueImageWrapper: {
    width: '100%',
    height: 85,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.dark2,
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
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTypeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  continueTypeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
  },
  continueProgressBar: {
    height: 3,
    backgroundColor: COLORS.dark3,
    borderRadius: 2,
    marginTop: 4,
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: COLORS.terra,
    borderRadius: 2,
  },
  continueTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 8,
  },
  continueRemaining: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
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
  liveImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
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
  liveInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  liveTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  liveCreator: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  
  // ────── Content Card ──────
  contentCard: {
    width: 130,
  },
  contentImage: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: COLORS.dark2,
  },
  contentInfo: {
    marginTop: 10,
  },
  contentTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  contentArtist: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  contentType: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // ────── Creator Card ──────
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  creatorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.dark2,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorName: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.cream,
  },
  creatorRole: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  creatorFollowers: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.terra,
    marginTop: 2,
  },
  followBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ────── Nébuleuse Card ──────
  nebuleuseCard: {
    width: 160,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  nebuleuseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nebuleuseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  nebuleuseInfo: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
  },
  nebuleuseTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  nebuleuseDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  nebuleusePlayBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ────── Cinema Card ──────
  cinemaCard: {
    width: 240,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cinemaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cinemaGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cinemaPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaPlayCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  cinemaTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  cinemaDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});
