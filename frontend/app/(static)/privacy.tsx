/**
 * KORA - Politique de Confidentialité
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

export default function PrivacyPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const SECTIONS = [
    {
      title: 'Données Collectées',
      content: 'Nous collectons uniquement les données nécessaires au fonctionnement du service :\n\n• Identifiants de compte (email, nom d\'utilisateur)\n• Données de paiement (via Stripe, nous ne stockons pas vos coordonnées bancaires)\n• Historique d\'écoute (pour les recommandations)\n• Données techniques (appareil, système d\'exploitation)'
    },
    {
      title: 'Utilisation des Données',
      content: 'Vos données sont utilisées pour :\n\n• Fournir le service de streaming\n• Personnaliser vos recommandations\n• Améliorer l\'expérience utilisateur\n• Rémunérer les créateurs (données d\'écoute anonymisées)'
    },
    {
      title: 'Partage des Données',
      content: 'Nous ne vendons JAMAIS vos données personnelles. Nous partageons uniquement :\n\n• Avec Stripe pour le traitement des paiements\n• Avec les créateurs (statistiques d\'écoute anonymisées)\n• Si requis par la loi'
    },
    {
      title: 'Vos Droits (RGPD)',
      content: 'Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d\'accès à vos données\n• Droit de rectification\n• Droit à l\'effacement ("droit à l\'oubli")\n• Droit à la portabilité\n• Droit d\'opposition\n\nContactez privacy@kora.tv pour exercer ces droits.'
    },
    {
      title: 'Sécurité',
      content: 'Nous utilisons les mesures de sécurité suivantes :\n\n• Chiffrement TLS/SSL pour toutes les communications\n• Authentification sécurisée avec hachage bcrypt\n• Stockage des données en Union Européenne\n• Audits de sécurité réguliers'
    },
    {
      title: 'Conservation',
      content: 'Vos données sont conservées tant que votre compte est actif. Après suppression du compte, les données sont effacées sous 30 jours, sauf obligation légale de conservation.'
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdate}>Dernière mise à jour : Juin 2024</Text>
        <Text style={styles.intro}>Chez KORA, la protection de vos données personnelles est une priorité absolue. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.</Text>
        
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
  lastUpdate: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20 },
  intro: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginTop: 16, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.gold, marginBottom: 12 },
  sectionContent: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
});
