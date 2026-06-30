/**
 * KORA - Presse & Médias
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 20, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function PressPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const PRESS_RELEASES = [
    { date: 'Juin 2024', title: 'KORA lève 2M€ pour révolutionner le streaming culturel', excerpt: 'La plateforme dédiée aux cultures caribéennes et afro-diasporiques annonce sa première levée de fonds.' },
    { date: 'Mai 2024', title: 'Partenariat avec Universal Africa', excerpt: 'KORA signe un accord de distribution exclusif avec le label Universal Africa.' },
    { date: 'Avril 2024', title: 'Lancement officiel de KORA', excerpt: 'La première plateforme de streaming souveraine pour les cultures caribéennes est officiellement lancée.' },
  ];

  const PRESS_KIT = [
    { name: 'Logo KORA (PNG/SVG)', size: '2.4 MB' },
    { name: 'Charte graphique', size: '1.8 MB' },
    { name: 'Photos fondateurs', size: '12 MB' },
    { name: 'Communiqué de presse', size: '156 KB' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presse</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Espace Presse</Text>
        <Text style={styles.heroSubtitle}>Ressources pour les médias et journalistes</Text>

        {/* Contact Presse */}
        <View style={styles.contactCard}>
          <Text style={styles.contactLabel}>CONTACT PRESSE</Text>
          <Text style={styles.contactName}>Relations Médias KORA</Text>
          <Text style={styles.contactEmail}>press@kora.tv</Text>
          <Text style={styles.contactPhone}>+33 1 XX XX XX XX</Text>
        </View>

        {/* Press Kit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kit Presse</Text>
          <Text style={styles.sectionDesc}>Téléchargez nos ressources média officielles</Text>
          {PRESS_KIT.map((item, i) => (
            <TouchableOpacity key={i} style={styles.downloadItem}>
              <View style={styles.downloadInfo}>
                <Text style={styles.downloadName}>{item.name}</Text>
                <Text style={styles.downloadSize}>{item.size}</Text>
              </View>
              <DownloadIcon />
            </TouchableOpacity>
          ))}
        </View>

        {/* Press Releases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communiqués de Presse</Text>
          {PRESS_RELEASES.map((item, i) => (
            <TouchableOpacity key={i} style={styles.releaseCard}>
              <Text style={styles.releaseDate}>{item.date}</Text>
              <Text style={styles.releaseTitle}>{item.title}</Text>
              <Text style={styles.releaseExcerpt}>{item.excerpt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>KORA en Chiffres</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Utilisateurs actifs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5K+</Text>
              <Text style={styles.statLabel}>Créateurs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100K+</Text>
              <Text style={styles.statLabel}>Titres disponibles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Territoires couverts</Text>
            </View>
          </View>
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
  headerTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, letterSpacing: 1 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 36, color: CINEMA.cream, marginTop: 20 },
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 32 },
  contactCard: { backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 16, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  contactLabel: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.gold, letterSpacing: 2, marginBottom: 12 },
  contactName: { fontFamily: FONTS.jostMedium, fontSize: 18, color: CINEMA.cream, marginBottom: 8 },
  contactEmail: { fontFamily: FONTS.jostRegular, fontSize: 15, color: CINEMA.gold, marginBottom: 4 },
  contactPhone: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream, letterSpacing: 1, marginBottom: 8 },
  sectionDesc: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  downloadItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16, marginBottom: 8 },
  downloadInfo: { flex: 1 },
  downloadName: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream },
  downloadSize: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  releaseCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 12 },
  releaseDate: { fontFamily: FONTS.jostMedium, fontSize: 11, color: CINEMA.gold, letterSpacing: 1, marginBottom: 8 },
  releaseTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, marginBottom: 8 },
  releaseExcerpt: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  statsSection: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, marginBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  statItem: { width: '50%', marginBottom: 24 },
  statNumber: { fontFamily: FONTS.playfairBold, fontSize: 32, color: CINEMA.gold },
  statLabel: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
});
