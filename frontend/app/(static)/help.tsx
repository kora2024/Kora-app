/**
 * KORA - Centre d'Aide / FAQ
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

function ChevronIcon({ size = 20, color = CINEMA.cream, expanded }: { size?: number; color?: string; expanded: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
      <Path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const FAQ_DATA = [
  {
    category: 'Compte & Abonnement',
    questions: [
      { q: 'Comment créer un compte KORA ?', a: 'Téléchargez l\'application, cliquez sur "S\'inscrire" et suivez les étapes. Vous pouvez utiliser votre email ou vous connecter via Google/Apple.' },
      { q: 'Comment annuler mon abonnement Premium ?', a: 'Allez dans Paramètres > Abonnement > Gérer l\'abonnement. Vous pouvez annuler à tout moment. Votre accès reste actif jusqu\'à la fin de la période payée.' },
      { q: 'Qu\'est-ce que le Pack Famille ?', a: 'Le Pack Famille (7,98€/mois) permet jusqu\'à 6 comptes avec tous les avantages Premium. Parfait pour partager avec vos proches.' },
    ]
  },
  {
    category: 'Lecture & Téléchargement',
    questions: [
      { q: 'Comment télécharger pour écouter hors-ligne ?', a: 'Sur n\'importe quel contenu, appuyez sur l\'icône de téléchargement. Les contenus téléchargés sont disponibles dans votre bibliothèque même sans connexion.' },
      { q: 'Quelle qualité audio est disponible ?', a: 'Gratuit : 128kbps. Premium : jusqu\'à FLAC Hi-Res (24-bit/96kHz) selon votre connexion et appareil.' },
      { q: 'Pourquoi la lecture s\'arrête-t-elle ?', a: 'Vérifiez votre connexion internet. En mode hors-ligne, assurez-vous que le contenu a été téléchargé au préalable.' },
    ]
  },
  {
    category: 'Créateurs',
    questions: [
      { q: 'Comment devenir créateur sur KORA ?', a: 'Créez un compte, puis allez dans Paramètres > Devenir Créateur. Remplissez le formulaire et soumettez votre premier contenu pour validation.' },
      { q: 'Combien gagnent les créateurs ?', a: 'Les créateurs reçoivent 70% des revenus générés par leur contenu. Les paiements sont effectués mensuellement via Stripe.' },
      { q: 'Comment uploader du contenu ?', a: 'Dans le Creator Studio, cliquez sur "Nouveau contenu", uploadez votre fichier (audio ou vidéo), ajoutez les métadonnées et soumettez.' },
    ]
  },
  {
    category: 'Technique',
    questions: [
      { q: 'Sur quels appareils fonctionne KORA ?', a: 'KORA est disponible sur iOS, Android, Web, Smart TV (Samsung, LG, Android TV), Apple TV, Fire TV et Roku.' },
      { q: 'L\'application plante, que faire ?', a: 'Essayez de redémarrer l\'app. Si le problème persiste, désinstallez et réinstallez. Contactez-nous si le problème continue.' },
    ]
  },
];

export default function HelpPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre d'Aide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
        
        {/* Contact Card */}
        <TouchableOpacity style={styles.contactCard} onPress={() => router.push('/(static)/contact')}>
          <Text style={styles.contactTitle}>Besoin d'aide personnalisée ?</Text>
          <Text style={styles.contactText}>Contactez notre équipe support</Text>
        </TouchableOpacity>

        {/* FAQ */}
        {FAQ_DATA.map((category, catIndex) => (
          <View key={catIndex} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            {category.questions.map((item, qIndex) => {
              const id = `${catIndex}-${qIndex}`;
              const isExpanded = expanded === id;
              return (
                <TouchableOpacity key={qIndex} style={styles.questionCard} onPress={() => toggleQuestion(id)} activeOpacity={0.8}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionText}>{item.q}</Text>
                    <ChevronIcon expanded={isExpanded} />
                  </View>
                  {isExpanded && (
                    <Text style={styles.answerText}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
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
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 28, color: CINEMA.cream, marginTop: 20, marginBottom: 24 },
  contactCard: { backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 12, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  contactTitle: { fontFamily: FONTS.jostMedium, fontSize: 16, color: CINEMA.gold, marginBottom: 4 },
  contactText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  categorySection: { marginBottom: 32 },
  categoryTitle: { fontFamily: FONTS.jostMedium, fontSize: 12, color: CINEMA.gold, letterSpacing: 2, marginBottom: 16 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16, marginBottom: 8 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { fontFamily: FONTS.jostMedium, fontSize: 15, color: CINEMA.cream, flex: 1, marginRight: 12 },
  answerText: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 22 },
});
