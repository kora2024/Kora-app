/**
 * KORA - Publicité & Partenariats
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 20, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function AdvertisingPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const AD_FORMATS = [
    { name: 'Audio Ads', desc: 'Spots audio entre les titres (15-30s)', reach: 'Tous les utilisateurs gratuits' },
    { name: 'Video Ads', desc: 'Publicités vidéo avant le contenu', reach: 'Streamers vidéo' },
    { name: 'Display Ads', desc: 'Bannières et placements sponsorisés', reach: 'Home, Playlists, Recherche' },
    { name: 'Playlists Sponsorisées', desc: 'Votre marque dans nos playlists curatées', reach: 'Auditeurs ciblés' },
  ];

  const BENEFITS = [
    'Audience unique : diaspora caribéenne et africaine',
    'Ciblage démographique précis',
    'Formats natifs non-intrusifs',
    'Reporting en temps réel',
    'Brand safety garantie',
    'Accompagnement dédié',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publicité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Touchez une audience unique</Text>
        <Text style={styles.heroSubtitle}>Connectez votre marque avec les cultures caribéennes et afro-diasporiques</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Auditeurs mensuels</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Taux de complétion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>18-45</Text>
            <Text style={styles.statLabel}>Tranche d'âge</Text>
          </View>
        </View>

        {/* Ad Formats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FORMATS PUBLICITAIRES</Text>
          {AD_FORMATS.map((format, i) => (
            <View key={i} style={styles.formatCard}>
              <Text style={styles.formatName}>{format.name}</Text>
              <Text style={styles.formatDesc}>{format.desc}</Text>
              <Text style={styles.formatReach}>{format.reach}</Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POURQUOI KORA ?</Text>
          <View style={styles.benefitsList}>
            {BENEFITS.map((benefit, i) => (
              <View key={i} style={styles.benefitItem}>
                <CheckIcon size={16} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaCard} onPress={() => router.push('/(static)/contact')}>
          <LinearGradient colors={[CINEMA.gold, '#B8963F']} style={styles.ctaGradient}>
            <Text style={styles.ctaTitle}>Devenez partenaire</Text>
            <Text style={styles.ctaSubtitle}>Contactez notre équipe commerciale</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.contactEmail}>ads@kora.tv</Text>

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
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 32, color: CINEMA.cream, marginTop: 20 },
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 32, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  statCard: { flex: 1, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNumber: { fontFamily: FONTS.playfairBold, fontSize: 24, color: CINEMA.gold },
  statLabel: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 11, color: CINEMA.gold, letterSpacing: 2, marginBottom: 20 },
  formatCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, marginBottom: 12 },
  formatName: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, marginBottom: 6 },
  formatDesc: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  formatReach: { fontFamily: FONTS.jostLight, fontSize: 12, color: CINEMA.gold },
  benefitsList: { gap: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 },
  ctaCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  ctaGradient: { padding: 24, alignItems: 'center' },
  ctaTitle: { fontFamily: FONTS.jostMedium, fontSize: 18, color: CINEMA.black, marginBottom: 4 },
  ctaSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(0,0,0,0.6)' },
  contactEmail: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 20 },
});
