/**
 * KORA - Territoires
 * Explorer le catalogue par territoire culturel
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../src/theme';

const { width: SW } = Dimensions.get('window');
const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 20, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const TERRITORIES = [
  {
    id: 'caraibes',
    name: 'Caraïbes',
    subtitle: 'Guadeloupe, Martinique, Haïti, Jamaïque...',
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
    color: '#1E88E5',
    genres: ['Zouk', 'Kompa', 'Reggae', 'Dancehall', 'Gwo Ka'],
    trackCount: '12K+ titres',
  },
  {
    id: 'afrique_ouest',
    name: 'Afrique de l\'Ouest',
    subtitle: 'Sénégal, Côte d\'Ivoire, Nigeria, Ghana...',
    image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
    color: '#F4511E',
    genres: ['Afrobeats', 'Mbalax', 'Coupé-Décalé', 'Highlife', 'Juju'],
    trackCount: '18K+ titres',
  },
  {
    id: 'afrique_centrale',
    name: 'Afrique Centrale',
    subtitle: 'Congo, Cameroun, Gabon...',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    color: '#43A047',
    genres: ['Rumba', 'Makossa', 'Bikutsi', 'Soukous'],
    trackCount: '8K+ titres',
  },
  {
    id: 'diaspora_europe',
    name: 'Diaspora Europe',
    subtitle: 'France, UK, Belgique, Pays-Bas...',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    color: '#7B1FA2',
    genres: ['Afro-Pop', 'UK Afrobeats', 'Afro-Trap', 'Zouk Bass'],
    trackCount: '15K+ titres',
  },
  {
    id: 'diaspora_usa',
    name: 'Diaspora Amériques',
    subtitle: 'États-Unis, Canada, Brésil...',
    image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800',
    color: '#C62828',
    genres: ['R&B', 'Soul', 'Gospel', 'Hip-Hop', 'Samba'],
    trackCount: '10K+ titres',
  },
  {
    id: 'ocean_indien',
    name: 'Océan Indien',
    subtitle: 'Réunion, Maurice, Madagascar, Comores...',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
    color: '#00897B',
    genres: ['Maloya', 'Séga', 'Salegy'],
    trackCount: '5K+ titres',
  },
];

export default function TerritoriesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleTerritoryPress = (territory: typeof TERRITORIES[0]) => {
    router.push({
      pathname: '/home',
      params: { territory: territory.id }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Territoires</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Explorez par territoire</Text>
        <Text style={styles.heroSubtitle}>Découvrez la richesse musicale de chaque région</Text>

        {/* Territory Cards */}
        <View style={styles.territoriesList}>
          {TERRITORIES.map((territory) => (
            <TouchableOpacity
              key={territory.id}
              style={styles.territoryCard}
              onPress={() => handleTerritoryPress(territory)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={{ uri: territory.image }}
                style={styles.territoryImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.territoryGradient}
                />
                <View style={styles.territoryContent}>
                  <View style={[styles.territoryIndicator, { backgroundColor: territory.color }]} />
                  <Text style={styles.territoryName}>{territory.name}</Text>
                  <Text style={styles.territorySubtitle}>{territory.subtitle}</Text>
                  <View style={styles.territoryMeta}>
                    <Text style={styles.territoryTrackCount}>{territory.trackCount}</Text>
                    <View style={styles.territoryGenres}>
                      {territory.genres.slice(0, 3).map((genre, i) => (
                        <Text key={i} style={styles.territoryGenre}>{genre}{i < 2 ? ' • ' : ''}</Text>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.territoryArrow}>
                  <ChevronRightIcon />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINEMA.black },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.playfairBold, fontSize: 20, color: CINEMA.cream },
  scroll: { flex: 1, paddingHorizontal: 20 },
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 32, color: CINEMA.cream, marginTop: 20 },
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 32 },
  territoriesList: { gap: 16 },
  territoryCard: { borderRadius: 16, overflow: 'hidden' },
  territoryImage: { height: 160, justifyContent: 'flex-end', position: 'relative' },
  territoryGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  territoryContent: { padding: 20 },
  territoryIndicator: { width: 4, height: 24, borderRadius: 2, marginBottom: 12 },
  territoryName: { fontFamily: FONTS.playfairBold, fontSize: 24, color: CINEMA.cream, marginBottom: 4 },
  territorySubtitle: { fontFamily: FONTS.jostLight, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  territoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  territoryTrackCount: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.gold },
  territoryGenres: { flexDirection: 'row' },
  territoryGenre: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  territoryArrow: { position: 'absolute', right: 20, top: '50%', marginTop: -10 },
});
