/**
 * KORA - Mentions Légales & CGU
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../../src/theme';

const CINEMA = { black: '#0A0A0A', gold: '#C9A84C', cream: '#F5F0E6' };

function BackIcon({ size = 24, color = CINEMA.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function LegalPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const SECTIONS = [
    {
      title: 'Éditeur du Service',
      content: 'KORA Technologies SAS\nCapital social : 10 000€\nSiège social : 75001 Paris, France\nRCS Paris : XXX XXX XXX\nDirecteur de la publication : [Nom du Directeur]'
    },
    {
      title: 'Hébergement',
      content: 'Le service KORA est hébergé par :\n- Infrastructure cloud sécurisée\n- Données stockées en Union Européenne\n- Conformité RGPD assurée'
    },
    {
      title: 'Conditions d\'Utilisation',
      content: 'En utilisant KORA, vous acceptez nos conditions générales d\'utilisation. Le service est destiné à un usage personnel et non commercial. Toute reproduction ou distribution non autorisée du contenu est strictement interdite.'
    },
    {
      title: 'Propriété Intellectuelle',
      content: 'L\'ensemble des contenus présents sur KORA (musiques, vidéos, images, textes, logos) sont protégés par le droit d\'auteur. Les droits de diffusion sont acquis auprès des ayants droit ou via des licences Creative Commons.'
    },
    {
      title: 'Abonnement Premium',
      content: 'L\'abonnement KORA Premium est facturé mensuellement à 3,98€. Vous pouvez annuler à tout moment depuis votre compte. L\'abonnement reste actif jusqu\'à la fin de la période payée.'
    },
    {
      title: 'Contact',
      content: 'Pour toute question juridique :\nEmail : legal@kora.tv\n\nPour les demandes de retrait de contenu (DMCA) :\nEmail : dmca@kora.tv'
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mentions Légales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : Juin 2024</Text>
        
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

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
  lastUpdate: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.gold, marginBottom: 12 },
  sectionContent: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
});
