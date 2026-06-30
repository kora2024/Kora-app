/**
 * KORA - À Propos
 * Page institutionnelle premium
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const { width: SW } = Dimensions.get('window');

const CINEMA = {
  black: '#0A0A0A',
  gold: '#C9A84C',
  terra: '#A65D47',
  cream: '#F5F0E6',
};

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function AboutPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const VALUES = [
    { title: 'Souveraineté Culturelle', desc: 'Nous protégeons et célébrons l\'identité unique des cultures caribéennes et afro-diasporiques.' },
    { title: 'Équité Créateurs', desc: '70% des revenus reversés aux artistes. Pas d\'intermédiaires, pas de compromis.' },
    { title: 'Excellence Technologique', desc: 'Audio Hi-Res, streaming adaptatif, expérience native sur tous les écrans.' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À Propos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>KORA</Text>
          <Text style={styles.heroSubtitle}>La Culture en Mouvement</Text>
          <Text style={styles.heroDesc}>
            KORA est née d'une vision : créer le premier DSP (Digital Service Provider) entièrement dédié aux cultures caribéennes et afro-diasporiques. Un espace où la musique, le cinéma et les performances trouvent leur véritable valeur.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTRE MISSION</Text>
          <Text style={styles.sectionTitle}>Réinventer le streaming culturel</Text>
          <Text style={styles.sectionText}>
            Dans un monde où les plateformes mainstream diluent les identités culturelles, KORA offre un sanctuaire. Nous ne sommes pas qu'une plateforme de streaming — nous sommes les gardiens d'un héritage, les amplificateurs d'une voix collective.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionLabel}>NOS VALEURS</Text>
          {VALUES.map((value, i) => (
            <View key={i} style={styles.valueCard}>
              <View style={styles.valueNumber}>
                <Text style={styles.valueNumberText}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDesc}>{value.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>L'ÉQUIPE</Text>
          <Text style={styles.sectionTitle}>Fondée par la diaspora, pour la diaspora</Text>
          <Text style={styles.sectionText}>
            Notre équipe réunit des talents de Paris, Londres, New York, Kingston et Dakar. Ingénieurs, artistes, producteurs et visionnaires unis par une même passion : faire rayonner nos cultures.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Auditeurs actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5K+</Text>
            <Text style={styles.statLabel}>Créateurs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>70%</Text>
            <Text style={styles.statLabel}>Reversés aux artistes</Text>
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
  scroll: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingVertical: 40, alignItems: 'center' },
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 48, color: CINEMA.gold, letterSpacing: 4 },
  heroSubtitle: { fontFamily: FONTS.jostLight, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, letterSpacing: 2 },
  heroDesc: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 24, lineHeight: 24, maxWidth: 500 },
  section: { paddingHorizontal: 20, paddingVertical: 32 },
  sectionLabel: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.gold, letterSpacing: 2, marginBottom: 12 },
  sectionTitle: { fontFamily: FONTS.playfairBold, fontSize: 28, color: CINEMA.cream, marginBottom: 16 },
  sectionText: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 24 },
  valuesSection: { paddingHorizontal: 20, paddingVertical: 32, backgroundColor: 'rgba(255,255,255,0.02)' },
  valueCard: { flexDirection: 'row', marginTop: 24, gap: 16 },
  valueNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center' },
  valueNumberText: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.gold },
  valueContent: { flex: 1 },
  valueTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.cream, marginBottom: 6 },
  valueDesc: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 32, gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 12, padding: 20, alignItems: 'center' },
  statNumber: { fontFamily: FONTS.playfairBold, fontSize: 28, color: CINEMA.gold },
  statLabel: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' },
});
