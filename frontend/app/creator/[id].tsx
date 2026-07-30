/**
 * KORA Page Créateur — Profil Artiste Complet
 * 
 * FREK-ID • Droits • Catalogue • Bio • Score
 * Niveau Apple Music Artist / Spotify for Artists
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../../src/theme';
import { PlayIcon, BackIcon } from '../../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════════════════════════

function VerifiedBadge({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="10" fill={COLORS.terra} />
      <Path d="M6 10L9 13L14 7" stroke={COLORS.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function FrekBadge() {
  return (
    <View style={styles.frekBadge}>
      <Text style={styles.frekBadgeText}>FREK</Text>
      <VerifiedBadge size={14} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED FREK SCORE
// ══════════════════════════════════════════════════════════════════════════════

function AnimatedFrekScore({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    animValue.addListener(({ value }) => {
      setDisplayScore(Math.floor(value));
    });

    return () => animValue.removeAllListeners();
  }, [score]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, maxScore],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.frekScoreContainer}>
      <Svg width={120} height={120} viewBox="0 0 100 100">
        {/* Background circle */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Animated progress circle */}
        <AnimatedCircle
          cx="50"
          cy="50"
          r="45"
          stroke={COLORS.terra}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </Svg>
      <View style={styles.frekScoreCenter}>
        <Text style={styles.frekScoreValue}>{displayScore}</Text>
        <Text style={styles.frekScoreLabel}>FREK Score</Text>
      </View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ══════════════════════════════════════════════════════════════════════════════
// TABS COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function TabSelector({ tabs, activeTab, onTabChange }: { tabs: string[]; activeTab: string; onTabChange: (t: string) => void }) {
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = (SW - 48) / tabs.length;

  useEffect(() => {
    const index = tabs.indexOf(activeTab);
    Animated.spring(indicatorAnim, {
      toValue: index * tabWidth,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabWidth]);

  return (
    <View style={styles.tabContainer}>
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            width: tabWidth - 8,
            transform: [{ translateX: Animated.add(indicatorAnim, 4) }],
          },
        ]}
      />
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, { width: tabWidth }]}
          onPress={() => {
            try { Haptics.selectionAsync(); } catch {}
            onTabChange(tab);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT CARDS
// ══════════════════════════════════════════════════════════════════════════════

function MusicCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.musicCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.musicCardImage} />
      <View style={styles.musicCardInfo}>
        <Text style={styles.musicCardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.musicCardMeta}>{item.type} • {item.year}</Text>
      </View>
      <View style={styles.musicCardPlay}>
        <PlayIcon size={18} color={COLORS.dark} />
      </View>
    </TouchableOpacity>
  );
}

function VideoCard({ item, onPress }: any) {
  return (
    <TouchableOpacity style={styles.videoCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.image }} style={styles.videoCardImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.videoCardGradient} />
      <View style={styles.videoCardPlay}>
        <PlayIcon size={28} color={COLORS.cream} />
      </View>
      <View style={styles.videoCardInfo}>
        <Text style={styles.videoCardTitle}>{item.title}</Text>
        <Text style={styles.videoCardDuration}>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RIGHTS & CRITERIA SECTION
// ══════════════════════════════════════════════════════════════════════════════

function RightsSection() {
  const rights = [
    { icon: '©', title: 'Droits d\'auteur', desc: 'Propriété intellectuelle protégée par FREK-ID' },
    { icon: '♫', title: 'Droits voisins', desc: 'Interprétation et production certifiées' },
    { icon: '⚖', title: 'Licence exclusive', desc: 'Distribution exclusive sur KORA' },
    { icon: '🔒', title: 'Blockchain', desc: 'Horodatage immuable de chaque dépôt' },
  ];

  return (
    <View style={styles.rightsSection}>
      <Text style={styles.rightsSectionTitle}>Droits & Certifications</Text>
      {rights.map((right, i) => (
        <View key={i} style={styles.rightItem}>
          <View style={styles.rightIcon}>
            <Text style={styles.rightIconText}>{right.icon}</Text>
          </View>
          <View style={styles.rightInfo}>
            <Text style={styles.rightTitle}>{right.title}</Text>
            <Text style={styles.rightDesc}>{right.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CriteriaSection() {
  // Critères basés sur les standards des majors (Universal, Sony, Warner)
  const audioSpecs = [
    { label: 'Format audio', value: 'WAV/AIFF 24-bit', standard: '48kHz minimum', status: 'verified' },
    { label: 'Master audio', value: 'Sans compression', standard: 'Pas de MP3/AAC', status: 'verified' },
    { label: 'Niveau sonore', value: '-14 LUFS', standard: 'Standard streaming', status: 'verified' },
    { label: 'Pic maximal', value: '-1 dB True Peak', standard: 'Anti-clipping', status: 'verified' },
  ];

  const videoSpecs = [
    { label: 'Format vidéo', value: 'ProRes 422 HQ', standard: 'Qualité broadcast', status: 'verified' },
    { label: 'Résolution', value: '4K (3840×2160)', standard: 'Minimum 1080p', status: 'verified' },
    { label: 'Frame rate', value: 'Natif (24/25/30 fps)', standard: 'Pas de conversion', status: 'verified' },
    { label: 'HDR', value: 'HLG / Dolby Vision', standard: 'Optionnel', status: 'pending' },
  ];

  const metadata = [
    { label: 'ISRC', value: 'FR-KOR-26-00001', standard: 'Code unique', status: 'verified' },
    { label: 'ISWC', value: 'T-123.456.789-C', standard: 'Œuvre musicale', status: 'verified' },
    { label: 'UPC/EAN', value: '5060123456789', standard: 'Code barre produit', status: 'verified' },
    { label: 'Split sheets', value: 'Signés', standard: 'Tous co-auteurs', status: 'verified' },
    { label: 'Artwork', value: '3000×3000px', standard: 'RGB, 300dpi', status: 'verified' },
    { label: 'Paroles sync.', value: 'LRC/SRT', standard: 'Timecode précis', status: 'pending' },
  ];

  const legal = [
    { label: 'Droits master', value: 'Propriétaire', standard: '100% clearé', status: 'verified' },
    { label: 'Droits édition', value: 'SACEM déclaré', standard: 'Société collecte', status: 'verified' },
    { label: 'Samples', value: 'Clearés', standard: 'Autorisation écrite', status: 'verified' },
    { label: 'Contrat KORA', value: 'Signé', standard: 'Licence exclusive', status: 'verified' },
  ];

  const renderCriteriaGroup = (title: string, items: any[]) => (
    <View style={styles.criteriaGroup}>
      <Text style={styles.criteriaGroupTitle}>{title}</Text>
      {items.map((c, i) => (
        <View key={i} style={styles.criteriaItem}>
          <View style={styles.criteriaLabelCol}>
            <Text style={styles.criteriaLabel}>{c.label}</Text>
            <Text style={styles.criteriaStandard}>{c.standard}</Text>
          </View>
          <View style={styles.criteriaValueRow}>
            <Text style={styles.criteriaValue}>{c.value}</Text>
            <View style={[styles.criteriaStatus, c.status === 'verified' ? styles.criteriaStatusVerified : styles.criteriaStatusPending]}>
              <Text style={[styles.criteriaStatusText, c.status !== 'verified' && styles.criteriaStatusTextPending]}>
                {c.status === 'verified' ? '✓' : '○'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.criteriaSection}>
      <Text style={styles.criteriaSectionTitle}>Standards de dépôt</Text>
      <Text style={styles.criteriaSectionSubtitle}>
        Critères niveau majors (Universal, Sony, Warner)
      </Text>
      {renderCriteriaGroup('🎵 Spécifications Audio', audioSpecs)}
      {renderCriteriaGroup('🎬 Spécifications Vidéo', videoSpecs)}
      {renderCriteriaGroup('📋 Métadonnées', metadata)}
      {renderCriteriaGroup('⚖️ Légal & Droits', legal)}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface CreatorData {
  creator_id: string;
  display_name: string;
  bio: string;
  profile_image: string | null;
  cover_image: string | null;
  verified: boolean;
  territories: string[];
  genres: string[];
  stats: {
    total_works: number;
    total_tracks: number;
    total_films: number;
    total_streams: number;
    followers: number;
  };
  featured_works: Array<{
    work_id: string;
    title: string;
    type: string;
    cover_url: string | null;
    stream_url?: string;
    genres: string[];
    release_date?: string;
  }>;
  all_works: Array<{
    work_id: string;
    title: string;
    type: string;
    cover_url: string | null;
  }>;
  social_links: Record<string, string>;
}

// ══════════════════════════════════════════════════════════════════════════════
// FALLBACK DATA (utilisé si l'API ne retourne rien)
// ══════════════════════════════════════════════════════════════════════════════

const FALLBACK_CREATOR: CreatorData = {
  creator_id: 'unknown',
  display_name: 'Artiste',
  bio: 'Artiste présent sur KORA.',
  profile_image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  cover_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
  verified: false,
  territories: [],
  genres: [],
  stats: {
    total_works: 0,
    total_tracks: 0,
    total_films: 0,
    total_streams: 0,
    followers: 0,
  },
  featured_works: [],
  all_works: [],
  social_links: {},
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CREATOR SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function CreatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('Musique');
  
  // Dynamic data state
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get creator ID from URL params
  const creatorId = params.id as string;

  // Fetch creator data from API
  useEffect(() => {
    const fetchCreator = async () => {
      if (!creatorId) {
        setError('ID créateur manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
        const response = await fetch(`${apiUrl}/api/creators/public/${encodeURIComponent(creatorId)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(`Créateur "${creatorId}" non trouvé`);
          } else {
            setError('Erreur lors du chargement');
          }
          setCreator(FALLBACK_CREATOR);
          return;
        }

        const data = await response.json();
        setCreator(data);
      } catch (err) {
        console.error('Error fetching creator:', err);
        setError('Erreur de connexion');
        setCreator(FALLBACK_CREATOR);
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [creatorId]);

  // Animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const coverTranslate = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleFollow = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  }, []);

  const handlePlay = useCallback(() => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    router.push('/player');
  }, [router]);

  const tabs = ['Musique', 'Vidéo', 'À propos', 'Droits'];

  // Helper to format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // If no creator data, use fallback
  const displayCreator = creator || FALLBACK_CREATOR;
  
  // Separate works by type
  const musicWorks = displayCreator.featured_works.filter(w => w.type === 'track');
  const videoWorks = displayCreator.featured_works.filter(w => ['film', 'video', 'movie'].includes(w.type));

  return (
    <View style={styles.container}>
      {/* Error banner if applicable */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Fixed header */}
      <Animated.View style={[styles.fixedHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <LinearGradient colors={[COLORS.dark, 'rgba(13,13,13,0.95)']} style={StyleSheet.absoluteFill} />
        <View style={styles.fixedHeaderContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <BackIcon size={24} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.fixedHeaderTitle}>{displayCreator.display_name}</Text>
          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      {/* Back button overlay */}
      <TouchableOpacity
        style={[styles.backBtnOverlay, { top: insets.top + 8 }]}
        onPress={handleBack}
      >
        <BackIcon size={24} color={COLORS.cream} />
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Cover with parallax */}
        <Animated.View
          style={[
            styles.coverContainer,
            {
              transform: [
                { scale: coverScale },
                { translateY: coverTranslate },
              ],
            },
          ]}
        >
          <Image 
            source={{ uri: displayCreator.cover_image || displayCreator.profile_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200' }} 
            style={styles.coverImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(13,13,13,0.5)', COLORS.dark]}
            locations={[0, 0.6, 1]}
            style={styles.coverGradient}
          />
        </Animated.View>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: displayCreator.profile_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800' }} 
              style={styles.profileImage} 
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{displayCreator.display_name}</Text>
                {displayCreator.verified && <VerifiedBadge size={24} />}
              </View>
              <FrekBadge />
              <Text style={styles.frekIdText}>{displayCreator.creator_id}</Text>
              <Text style={styles.profileRole}>
                {displayCreator.genres.length > 0 
                  ? displayCreator.genres.slice(0, 2).join(' • ')
                  : 'Artiste'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(displayCreator.stats.followers)}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(displayCreator.stats.total_streams)}</Text>
              <Text style={styles.statLabel}>Écoutes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayCreator.stats.total_works}</Text>
              <Text style={styles.statLabel}>Œuvres</Text>
            </View>
          </View>

          {/* FREK Score (placeholder - would come from CVE) */}
          <AnimatedFrekScore score={displayCreator.verified ? 85 : 50} />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
              <Text style={styles.followBtnText}>Suivre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playAllBtn} onPress={handlePlay}>
              <PlayIcon size={20} color={COLORS.dark} />
              <Text style={styles.playAllBtnText}>Lecture</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'Musique' && (
            <View>
              {musicWorks.length > 0 ? (
                musicWorks.map((item) => (
                  <MusicCard 
                    key={item.work_id} 
                    item={{
                      id: item.work_id,
                      title: item.title,
                      type: 'Track',
                      year: item.release_date ? new Date(item.release_date).getFullYear() : 2024,
                      image: item.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
                    }} 
                    onPress={handlePlay} 
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Aucune musique disponible</Text>
              )}
            </View>
          )}
          
          {activeTab === 'Vidéo' && (
            <View style={styles.videoGrid}>
              {videoWorks.length > 0 ? (
                videoWorks.map((item) => (
                  <VideoCard 
                    key={item.work_id} 
                    item={{
                      id: item.work_id,
                      title: item.title,
                      duration: '',
                      image: item.cover_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
                    }} 
                    onPress={handlePlay} 
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Aucune vidéo disponible</Text>
              )}
            </View>
          )}
          
          {activeTab === 'À propos' && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Biographie</Text>
              <Text style={styles.aboutText}>{displayCreator.bio || 'Aucune biographie disponible.'}</Text>
              <View style={styles.aboutMeta}>
                <View style={styles.aboutMetaItem}>
                  <Text style={styles.aboutMetaLabel}>Territoires</Text>
                  <Text style={styles.aboutMetaValue}>
                    {displayCreator.territories.length > 0 
                      ? displayCreator.territories.join(', ')
                      : 'International'}
                  </Text>
                </View>
                <View style={styles.aboutMetaItem}>
                  <Text style={styles.aboutMetaLabel}>Genres</Text>
                  <Text style={styles.aboutMetaValue}>
                    {displayCreator.genres.length > 0 
                      ? displayCreator.genres.join(', ')
                      : 'Divers'}
                  </Text>>
                  <Text style={styles.aboutMetaLabel}>Genre</Text>
                  <Text style={styles.aboutMetaValue}>Zouk, Kompa, Afro-Caribbean</Text>
                </View>
              </View>
            </View>
          )}
          
          {activeTab === 'Droits' && (
            <View>
              <RightsSection />
              <CriteriaSection />
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scrollView: {
    flex: 1,
  },
  // Fixed header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 100,
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fixedHeaderTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 18,
    color: COLORS.cream,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnOverlay: {
    position: 'absolute',
    left: 16,
    zIndex: 101,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Cover
  coverContainer: {
    height: 300,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Profile
  profileSection: {
    paddingHorizontal: 24,
    marginTop: -80,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.dark,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
  },
  frekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(166,93,71,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  frekBadgeText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  frekIdText: {
    fontFamily: FONTS.jostLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  profileRole: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.jostMedium,
    fontSize: 20,
    color: COLORS.cream,
  },
  statLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // FREK Score
  frekScoreContainer: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  frekScoreCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frekScoreValue: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: COLORS.cream,
  },
  frekScoreLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  followBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.cream,
    alignItems: 'center',
  },
  followBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: COLORS.terra,
    gap: 8,
  },
  playAllBtnText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(166,93,71,0.3)',
    borderRadius: 8,
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 13,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.cream,
  },
  tabContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  // Music card
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  musicCardImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.dark2,
  },
  musicCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  musicCardTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  musicCardMeta: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  musicCardPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Video card
  videoGrid: {
    gap: 16,
  },
  videoCard: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  videoCardPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCardInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
  },
  videoCardTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 16,
    color: COLORS.cream,
  },
  videoCardDuration: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // About
  aboutSection: {},
  aboutTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: 12,
  },
  aboutText: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 24,
  },
  aboutMeta: {
    marginTop: 24,
    gap: 16,
  },
  aboutMetaItem: {},
  aboutMetaLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.terra,
    marginBottom: 4,
  },
  aboutMetaValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.cream,
  },
  // Rights
  rightsSection: {
    marginBottom: 32,
  },
  rightsSectionTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: 16,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(166,93,71,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconText: {
    fontSize: 20,
  },
  rightInfo: {
    marginLeft: 14,
    flex: 1,
  },
  rightTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  rightDesc: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Criteria
  criteriaSection: {},
  criteriaSectionTitle: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: 4,
  },
  criteriaSectionSubtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 20,
  },
  criteriaGroup: {
    marginBottom: 24,
  },
  criteriaGroupTitle: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.terra,
    marginBottom: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  criteriaLabelCol: {
    flex: 1,
  },
  criteriaLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  criteriaStandard: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
  },
  criteriaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  criteriaValue: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.gray,
  },
  criteriaStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaStatusVerified: {
    backgroundColor: 'rgba(70,211,105,0.2)',
  },
  criteriaStatusPending: {
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  criteriaStatusText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: '#46D369',
  },
  criteriaStatusTextPending: {
    color: '#C9A84C',
  },
  // Loading and Error states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(166,93,71,0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 100,
  },
  errorText: {
    fontFamily: FONTS.jostRegular,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
