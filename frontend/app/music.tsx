/**
 * KORA - Musique
 * Page de découverte musicale
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../src/theme';

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

export default function MusicPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');

  const GENRES = [
    { id: 'all', label: 'Tous' },
    { id: 'zouk', label: 'Zouk' },
    { id: 'reggae', label: 'Reggae' },
    { id: 'afrobeats', label: 'Afrobeats' },
    { id: 'kompa', label: 'Kompa' },
    { id: 'dancehall', label: 'Dancehall' },
    { id: 'gwo_ka', label: 'Gwo Ka' },
  ];

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/catalog/featured?limit=30&type=audio`);
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPress = (track: any) => {
    router.push({
      pathname: '/player',
      params: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        type: 'audio',
        artwork: track.artwork,
        stream_url: track.stream_url,
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Musique</Text>
        <View style={{ width: 40 }} />
      </View>

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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Nouveautés */}
        <Text style={styles.sectionTitle}>Nouveautés</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={CINEMA.gold} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.tracksGrid}>
            {tracks.map((track, index) => (
              <TouchableOpacity
                key={track.id || index}
                style={styles.trackCard}
                onPress={() => handleTrackPress(track)}
                activeOpacity={0.9}
              >
                <View style={styles.trackImageWrapper}>
                  <Image
                    source={{ uri: track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' }}
                    style={styles.trackImage}
                  />
                  <View style={styles.trackPlayBtn}>
                    <PlayIcon size={14} />
                  </View>
                </View>
                <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINEMA.black },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.playfairBold, fontSize: 20, color: CINEMA.cream },
  genreScroll: { paddingHorizontal: 20, marginBottom: 16 },
  genreChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  genreChipActive: { backgroundColor: CINEMA.gold },
  genreText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  genreTextActive: { color: CINEMA.black },
  scroll: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.gold, letterSpacing: 2, marginBottom: 16, marginTop: 8 },
  tracksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trackCard: { width: '31%', marginBottom: 16 },
  trackImageWrapper: { aspectRatio: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  trackImage: { width: '100%', height: '100%' },
  trackPlayBtn: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  trackTitle: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.cream, marginTop: 8 },
  trackArtist: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
});
