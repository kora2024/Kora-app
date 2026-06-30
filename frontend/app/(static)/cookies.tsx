/**
 * KORA - Politique des Cookies
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
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

export default function CookiesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [essential, setEssential] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [personalization, setPersonalization] = useState(true);

  const COOKIE_TYPES = [
    {
      name: 'Cookies Essentiels',
      desc: 'Nécessaires au fonctionnement du site (authentification, sécurité, préférences).',
      required: true,
      value: essential,
      setValue: setEssential,
    },
    {
      name: 'Cookies Analytics',
      desc: 'Nous aident à comprendre comment vous utilisez KORA pour améliorer nos services.',
      required: false,
      value: analytics,
      setValue: setAnalytics,
    },
    {
      name: 'Cookies Marketing',
      desc: 'Utilisés pour vous proposer des publicités pertinentes sur KORA et ailleurs.',
      required: false,
      value: marketing,
      setValue: setMarketing,
    },
    {
      name: 'Cookies Personnalisation',
      desc: 'Permettent de personnaliser votre expérience (recommandations, préférences d\'affichage).',
      required: false,
      value: personalization,
      setValue: setPersonalization,
    },
  ];

  const handleSavePreferences = () => {
    // Save cookie preferences
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cookies</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Gestion des Cookies</Text>
        <Text style={styles.heroSubtitle}>Contrôlez vos préférences de confidentialité</Text>

        <Text style={styles.introText}>
          KORA utilise des cookies et technologies similaires pour vous offrir la meilleure expérience possible. Vous pouvez personnaliser vos préférences ci-dessous.
        </Text>

        {/* Cookie Types */}
        <View style={styles.cookiesList}>
          {COOKIE_TYPES.map((cookie, i) => (
            <View key={i} style={styles.cookieCard}>
              <View style={styles.cookieHeader}>
                <Text style={styles.cookieName}>{cookie.name}</Text>
                {cookie.required ? (
                  <Text style={styles.requiredBadge}>Requis</Text>
                ) : (
                  <Switch
                    value={cookie.value}
                    onValueChange={cookie.setValue}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(201,168,76,0.4)' }}
                    thumbColor={cookie.value ? CINEMA.gold : 'rgba(255,255,255,0.5)'}
                  />
                )}
              </View>
              <Text style={styles.cookieDesc}>{cookie.desc}</Text>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Qu'est-ce qu'un cookie ?</Text>
          <Text style={styles.infoText}>
            Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. Il permet de mémoriser vos préférences et d'améliorer votre expérience.
          </Text>
          
          <Text style={styles.infoTitle}>Durée de conservation</Text>
          <Text style={styles.infoText}>
            • Cookies de session : supprimés à la fermeture du navigateur{"\n"}
            • Cookies persistants : jusqu'à 12 mois maximum{"\n"}
            • Cookies tiers : selon la politique du partenaire
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePreferences}>
          <Text style={styles.saveBtnText}>ENREGISTRER MES PRÉFÉRENCES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(static)/privacy')}>
          <Text style={styles.linkBtnText}>Consulter notre Politique de Confidentialité</Text>
        </TouchableOpacity>

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
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 24 },
  introText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 32 },
  cookiesList: { gap: 12, marginBottom: 40 },
  cookieCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20 },
  cookieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cookieName: { fontFamily: FONTS.jostMedium, fontSize: 15, color: CINEMA.cream },
  requiredBadge: { fontFamily: FONTS.jostMedium, fontSize: 10, color: CINEMA.gold, backgroundColor: 'rgba(201,168,76,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  cookieDesc: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  infoSection: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, marginBottom: 32 },
  infoTitle: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.cream, marginBottom: 8, marginTop: 16 },
  infoText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  saveBtn: { backgroundColor: CINEMA.gold, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  saveBtnText: { fontFamily: FONTS.jostMedium, fontSize: 13, color: CINEMA.black, letterSpacing: 1 },
  linkBtn: { paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: CINEMA.gold },
});
