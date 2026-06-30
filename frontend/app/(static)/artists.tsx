/**
 * KORA - Découvrir les Artistes
 * Page publique pour explorer les créateurs KORA
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };
const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon({ size = 16, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function VerifiedIcon({ size = 14, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Svg>
  );
}

interface Creator {
  _id: string;
  display_name: string;
  avatar?: string;
  role_culturel?: string;
  is_verified?: boolean;
  track_count?: number;
}

export default function ArtistsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');

  const GENRES = [
    { id: 'all', label: 'Tous' },
    { id: 'zouk', label: 'Zouk' },
    { id: 'reggae', label: 'Reggae' },
    { id: 'afrobeats', label: 'Afrobeats' },
    { id: 'kompa', label: 'Kompa' },
    { id: 'dancehall', label: 'Dancehall' },
  ];

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      // Fetch creators from API (users with is_creator = true)
      const response = await fetch(`${API_BASE}/api/creators`);
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators || []);
      } else {
        // Fallback to demo data
        setCreators(DEMO_CREATORS);
      }
    } catch (error) {
      console.log('Using demo creators');
      setCreators(DEMO_CREATORS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorPress = (creator: Creator) => {
    router.push({
      pathname: '/creator/[id]',
      params: { id: creator._id }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artistes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Découvrez nos artistes</Text>
        <Text style={styles.heroSubtitle}>Les talents de la diaspora caribéenne et africaine</Text>

        {/* Genre Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={[styles.genreChip, selectedGenre === genre.id && styles.genreChipActive]}
              onPress={() => setSelectedGenre(genre.id)}
            >
              <Text style={[styles.genreText, selectedGenre === genre.id && styles.genreTextActive]}>
                {genre.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Artists Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={CINEMA.gold} />
          </View>
        ) : (
          <View style={styles.artistsGrid}>
            {creators.map((creator) => (
              <TouchableOpacity
                key={creator._id}
                style={styles.artistCard}
                onPress={() => handleCreatorPress(creator)}
                activeOpacity={0.9}
              >
                <View style={styles.artistImageWrapper}>
                  <Image
                    source={{ uri: creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.display_name)}&background=C9A84C&color=0A0A0A&size=200` }}
                    style={styles.artistImage}
                  />
                  <View style={styles.artistPlayBtn}>
                    <PlayIcon size={14} />
                  </View>
                </View>
                <View style={styles.artistInfo}>
                  <View style={styles.artistNameRow}>
                    <Text style={styles.artistName} numberOfLines={1}>{creator.display_name}</Text>
                    {creator.is_verified && <VerifiedIcon />}
                  </View>
                  <Text style={styles.artistRole}>{creator.role_culturel || 'Artiste'}</Text>
                  {creator.track_count && (
                    <Text style={styles.artistTracks}>{creator.track_count} titres</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Become Creator CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Vous êtes artiste ?</Text>
          <Text style={styles.ctaText}>Rejoignez KORA et partagez votre musique avec le monde</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/creator/studio')}>
            <Text style={styles.ctaBtnText}>DEVENIR CRÉATEUR</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// Demo creators fallback
const DEMO_CREATORS: Creator[] = [
  { _id: '1', display_name: 'Kassav\' Legacy', role_culturel: 'Groupe Zouk', is_verified: true, track_count: 45 },
  { _id: '2', display_name: 'Aya Nakamura', role_culturel: 'Pop Urbaine', is_verified: true, track_count: 32 },
  { _id: '3', display_name: 'Fally Ipupa', role_culturel: 'Rumba Congolaise', is_verified: true, track_count: 58 },
  { _id: '4', display_name: 'Tiken Jah Fakoly', role_culturel: 'Reggae', is_verified: true, track_count: 67 },
  { _id: '5', display_name: 'Jocelyne Labylle', role_culturel: 'Zouk', is_verified: false, track_count: 28 },
  { _id: '6', display_name: 'Admiral T', role_culturel: 'Dancehall', is_verified: true, track_count: 52 },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINEMA.black },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, letterSpacing: 1 },
  scroll: { flex: 1 },
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 32, color: CINEMA.cream, paddingHorizontal: 20, marginTop: 20 },
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', paddingHorizontal: 20, marginTop: 8, marginBottom: 24 },
  genreScroll: { paddingHorizontal: 20, marginBottom: 24 },
  genreChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  genreChipActive: { backgroundColor: CINEMA.gold },
  genreText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  genreTextActive: { color: CINEMA.black },
  loadingContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  artistsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  artistCard: { width: '47%', marginBottom: 16 },
  artistImageWrapper: { aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  artistImage: { width: '100%', height: '100%' },
  artistPlayBtn: { position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  artistInfo: { marginTop: 10 },
  artistNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  artistName: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream, flex: 1 },
  artistRole: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  artistTracks: { fontFamily: FONTS.jostLight, fontSize: 11, color: CINEMA.gold, marginTop: 4 },
  ctaSection: { marginTop: 40, marginHorizontal: 20, backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 16, padding: 24, alignItems: 'center' },
  ctaTitle: { fontFamily: FONTS.playfairBold, fontSize: 22, color: CINEMA.cream, marginBottom: 8 },
  ctaText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 },
  ctaBtn: { backgroundColor: CINEMA.gold, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 },
  ctaBtnText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: CINEMA.black, letterSpacing: 1 },
});
