/**
 * KORA for Developers - Portail Développeur
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6', terra: '#A65D47' };

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CodeIcon({ size = 28, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Path d="M16 18l6-6-6-6M8 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ApiIcon({ size = 28, color = CINEMA.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
      <Rect x="2" y="3" width="20" height="14" rx="2" />
      <Path d="M8 21h8M12 17v4" />
    </Svg>
  );
}

export default function DevelopersPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const API_FEATURES = [
    { icon: 'catalog', title: 'Catalog API', desc: 'Accédez à notre catalogue de 100K+ titres' },
    { icon: 'playback', title: 'Playback SDK', desc: 'Intégrez le streaming KORA dans vos apps' },
    { icon: 'metadata', title: 'Metadata API', desc: 'Artistes, albums, playlists, analytics' },
    { icon: 'webhooks', title: 'Webhooks', desc: 'Events en temps réel pour vos intégrations' },
  ];

  const USE_CASES = [
    'Applications musicales tierces',
    'Widgets et intégrations web',
    'Smart speakers et IoT',
    'Dashboards analytics',
    'Outils pour créateurs',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Développeurs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <CodeIcon size={48} />
          <Text style={styles.heroTitle}>KORA for Developers</Text>
          <Text style={styles.heroSubtitle}>Construisez avec l'API KORA</Text>
        </View>

        {/* Intro */}
        <Text style={styles.introText}>
          Intégrez la puissance du streaming culturel dans vos applications. Notre API RESTful vous donne accès au catalogue KORA, aux métadonnées et aux fonctionnalités de lecture.
        </Text>

        {/* API Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FONCTIONNALITÉS API</Text>
          <View style={styles.featuresGrid}>
            {API_FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureCard}>
                <ApiIcon size={24} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Code Sample */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXEMPLE</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeLang}>cURL</Text>
            <Text style={styles.codeText}>
{`curl -X GET "https://api.kora.tv/v1/catalog/tracks" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"`}
            </Text>
          </View>
        </View>

        {/* Use Cases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAS D'USAGE</Text>
          {USE_CASES.map((useCase, i) => (
            <View key={i} style={styles.useCaseItem}>
              <View style={styles.useCaseDot} />
              <Text style={styles.useCaseText}>{useCase}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/auth/signup')}>
            <LinearGradient colors={[CINEMA.gold, '#B8963F']} style={styles.ctaGradient}>
              <Text style={styles.primaryCtaText}>CRÉER UN COMPTE DÉVELOPPEUR</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryCta}>
            <Text style={styles.secondaryCtaText}>CONSULTER LA DOCUMENTATION</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.supportEmail}>developers@kora.tv</Text>

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
  hero: { alignItems: 'center', paddingVertical: 40 },
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 28, color: CINEMA.cream, marginTop: 16 },
  heroSubtitle: { fontFamily: FONTS.jostLight, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  introText: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginBottom: 40 },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 11, color: CINEMA.gold, letterSpacing: 2, marginBottom: 20 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 },
  featureTitle: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream, marginTop: 12, marginBottom: 6 },
  featureDesc: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  codeBlock: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  codeLang: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.gold, marginBottom: 12 },
  codeText: { fontFamily: 'monospace', fontSize: 12, color: CINEMA.cream, lineHeight: 20 },
  useCaseItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  useCaseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CINEMA.gold, marginRight: 12 },
  useCaseText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  ctaSection: { gap: 12, marginBottom: 24 },
  primaryCta: { borderRadius: 8, overflow: 'hidden' },
  ctaGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryCtaText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: CINEMA.black, letterSpacing: 1 },
  secondaryCta: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  secondaryCtaText: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.cream, letterSpacing: 1 },
  supportEmail: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
