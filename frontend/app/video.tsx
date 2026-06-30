/**
 * KORA - Vidéo
 * Page de découverte vidéo
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

function PlayIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

export default function VideoPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const CATEGORIES = [
    { id: 'all', label: 'Tous' },
    { id: 'clips', label: 'Clips' },
    { id: 'concerts', label: 'Concerts' },
    { id: 'docs', label: 'Documentaires' },
    { id: 'films', label: 'Films' },
  ];

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/catalog/featured?limit=20&type=video`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.tracks || DEMO_VIDEOS);
      } else {
        setVideos(DEMO_VIDEOS);
      }
    } catch (error) {
      setVideos(DEMO_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: any) => {
    router.push({
      pathname: '/player',
      params: {
        id: video.id,
        title: video.title,
        artist: video.artist,
        type: 'video',
        artwork: video.artwork || video.thumbnail,
        stream_url: video.stream_url,
      }
    });
  };

  const featuredVideo = videos[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vidéo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={CINEMA.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Featured Video */}
            {featuredVideo && (
              <TouchableOpacity style={styles.featuredCard} onPress={() => handleVideoPress(featuredVideo)} activeOpacity={0.9}>
                <ImageBackground
                  source={{ uri: featuredVideo.artwork || featuredVideo.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' }}
                  style={styles.featuredImage}
                  imageStyle={{ borderRadius: 16 }}
                >
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.featuredGradient} />
                  <View style={styles.featuredPlayBtn}>
                    <PlayIcon size={28} />
                  </View>
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>NOUVEAU</Text>
                    </View>
                    <Text style={styles.featuredTitle}>{featuredVideo.title}</Text>
                    <Text style={styles.featuredMeta}>{featuredVideo.artist} • {featuredVideo.duration || '45 min'}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}

            {/* Video Grid */}
            <Text style={styles.sectionTitle}>POPULAIRES</Text>
            <View style={styles.videosGrid}>
              {videos.slice(1).map((video, index) => (
                <TouchableOpacity
                  key={video.id || index}
                  style={styles.videoCard}
                  onPress={() => handleVideoPress(video)}
                  activeOpacity={0.9}
                >
                  <View style={styles.videoImageWrapper}>
                    <Image
                      source={{ uri: video.artwork || video.thumbnail || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' }}
                      style={styles.videoImage}
                    />
                    <View style={styles.videoDuration}>
                      <Text style={styles.videoDurationText}>{video.duration || '3:45'}</Text>
                    </View>
                    <View style={styles.videoPlayBtn}>
                      <PlayIcon size={16} />
                    </View>
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.videoMeta}>{video.artist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const DEMO_VIDEOS = [
  { id: 'v1', title: 'Concert Live Kassav\' - Zénith Paris', artist: 'Kassav\'', duration: '1:45:00', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800' },
  { id: 'v2', title: 'Documentaire: Les Racines du Zouk', artist: 'KORA Docs', duration: '52 min' },
  { id: 'v3', title: 'Admiral T - Clip Officiel', artist: 'Admiral T', duration: '4:12' },
  { id: 'v4', title: 'Fally Ipupa Live à Abidjan', artist: 'Fally Ipupa', duration: '2:15:00' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINEMA.black },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.playfairBold, fontSize: 20, color: CINEMA.cream },
  categoryScroll: { paddingHorizontal: 20, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  categoryChipActive: { backgroundColor: CINEMA.terra },
  categoryText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  categoryTextActive: { color: CINEMA.cream },
  scroll: { flex: 1, paddingHorizontal: 20 },
  featuredCard: { marginBottom: 24 },
  featuredImage: { height: 220, borderRadius: 16, justifyContent: 'flex-end', position: 'relative' },
  featuredGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  featuredPlayBtn: { position: 'absolute', top: '50%', left: '50%', marginTop: -28, marginLeft: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featuredContent: { padding: 20 },
  featuredBadge: { alignSelf: 'flex-start', backgroundColor: CINEMA.terra, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  featuredBadgeText: { fontFamily: FONTS.jostMedium, fontSize: 9, color: CINEMA.cream, letterSpacing: 1 },
  featuredTitle: { fontFamily: FONTS.playfairBold, fontSize: 22, color: CINEMA.cream, marginBottom: 4 },
  featuredMeta: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.gold, letterSpacing: 2, marginBottom: 16 },
  videosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  videoCard: { width: '48%', marginBottom: 16 },
  videoImageWrapper: { aspectRatio: 16/9, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  videoImage: { width: '100%', height: '100%' },
  videoDuration: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  videoDurationText: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.cream },
  videoPlayBtn: { position: 'absolute', top: '50%', left: '50%', marginTop: -16, marginLeft: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  videoTitle: { fontFamily: FONTS.jostMedium, fontSize: 13, color: CINEMA.cream, marginTop: 8, lineHeight: 18 },
  videoMeta: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});
