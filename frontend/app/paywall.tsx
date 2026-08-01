/**
 * KORA Paywall — Module 7 Monétisation
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Section 10: "Auditeur : la couche Wallet reste entièrement invisible"
 * 
 * Offres: FREE (0€ + pub) | PREMIUM (3,98€/mois, sans pub, HQ, 2x royalties)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/theme';

const CheckIcon = ({ size = 20, color = '#C9A84C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const CloseIcon = ({ size = 12, color = 'rgba(255,255,255,0.3)' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const CrownIcon = ({ size = 48, color = '#C9A84C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 1L9 9l-7-4 3 12h14l3-12-7 4-3-8z" />
  </Svg>
);

const PLANS = {
  premium: {
    id: 'premium',
    name: 'PREMIUM',
    price: '3,98€',
    period: '/mois',
    description: 'L\'expérience KORA complète',
    badge: 'RECOMMANDÉ',
    features: [
      { text: 'Catalogue complet', included: true },
      { text: 'Qualité HQ / Lossless', included: true },
      { text: 'Sans publicité', included: true },
      { text: 'Mode hors-ligne', included: true },
      { text: '2x royalties aux créateurs', included: true, highlight: true },
    ],
  },
  free: {
    id: 'free',
    name: 'FREE',
    price: '0€',
    period: '',
    description: 'Avec publicités',
    features: [
      { text: 'Catalogue complet', included: true },
      { text: 'Qualité standard', included: true },
      { text: 'Publicités', included: true, isNegative: true },
      { text: 'Mode hors-ligne', included: false },
      { text: 'Priorité créateurs', included: false },
    ],
  },
};

const FeatureRow = ({ text, included, isNegative, highlight }: any) => (
  <View style={styles.featureRow}>
    <View style={[styles.featureIcon, included ? styles.featureIconOk : styles.featureIconNo, highlight && styles.featureIconGold]}>
      {included ? <CheckIcon size={12} color={highlight ? '#0A0A0F' : '#C9A84C'} /> : <CloseIcon />}
    </View>
    <Text style={[styles.featureText, !included && styles.featureTextNo, isNegative && styles.featureTextNeg, highlight && styles.featureTextGold]}>
      {text}
    </Text>
  </View>
);

const PlanCard = ({ plan, selected, onPress }: any) => (
  <TouchableOpacity style={[styles.card, selected && styles.cardSelected]} onPress={onPress} activeOpacity={0.8}>
    {plan.badge && <View style={styles.badge}><Text style={styles.badgeText}>{plan.badge}</Text></View>}
    <Text style={styles.planName}>{plan.name}</Text>
    <View style={styles.priceRow}>
      <Text style={styles.price}>{plan.price}</Text>
      <Text style={styles.period}>{plan.period}</Text>
    </View>
    <Text style={styles.desc}>{plan.description}</Text>
    <View style={styles.features}>
      {plan.features.map((f: any, i: number) => <FeatureRow key={i} {...f} />)}
    </View>
    {selected && <View style={styles.check}><CheckIcon size={14} color="#0A0A0F" /></View>}
  </TouchableOpacity>
);

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<'free' | 'premium'>('premium');
  const [loading, setLoading] = useState(false);

  const handleContinue = useCallback(async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setLoading(true);
    await AsyncStorage.setItem('kora_subscription_plan', plan);
    await AsyncStorage.setItem('kora_is_premium', plan === 'premium' ? 'true' : 'false');
    if (plan === 'premium') await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    router.replace('/home');
  }, [plan, router]);

  const handleSkip = useCallback(() => {
    AsyncStorage.setItem('kora_subscription_plan', 'free');
    router.replace('/home');
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0A0A0F', '#1A1A24', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}><Text style={styles.skip}>Plus tard</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.crown}><CrownIcon /></View>
          <Text style={styles.title}>Choisis ton expérience</Text>
          <Text style={styles.subtitle}>Premium redistribue 2x plus aux créateurs</Text>
        </View>

        <View style={styles.plans}>
          <PlanCard plan={PLANS.premium} selected={plan === 'premium'} onPress={() => setPlan('premium')} />
          <PlanCard plan={PLANS.free} selected={plan === 'free'} onPress={() => setPlan('free')} />
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.btn} onPress={handleContinue} disabled={loading}>
          <LinearGradient colors={plan === 'premium' ? ['#C9A84C', '#D4B55A'] : ['#333', '#444']} style={styles.btnGrad}>
            {loading ? <ActivityIndicator color={plan === 'premium' ? '#0A0A0F' : '#FFF'} /> :
              <Text style={[styles.btnText, plan !== 'premium' && styles.btnTextFree]}>
                {plan === 'premium' ? 'ESSAI GRATUIT 7 JOURS' : 'CONTINUER AVEC FREE'}
              </Text>}
          </LinearGradient>
        </TouchableOpacity>
        {plan === 'premium' && <Text style={styles.trial}>Puis 3,98€/mois. Annulable à tout moment.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  skip: { fontFamily: FONTS.jostRegular, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 140 },
  hero: { alignItems: 'center', marginBottom: 32 },
  crown: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,168,76,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontFamily: FONTS.playfairBold, fontSize: 28, color: '#FAF9F6', marginBottom: 8 },
  subtitle: { fontFamily: FONTS.jostLight, fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  plans: { gap: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  cardSelected: { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.05)' },
  badge: { position: 'absolute', top: -10, left: 20, backgroundColor: '#C9A84C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontFamily: FONTS.jostMedium, fontSize: 10, color: '#0A0A0F', letterSpacing: 1 },
  planName: { fontFamily: FONTS.jostMedium, fontSize: 12, color: '#C9A84C', letterSpacing: 2, marginTop: 8, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  price: { fontFamily: FONTS.playfairBold, fontSize: 32, color: '#FAF9F6' },
  period: { fontFamily: FONTS.jostLight, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 },
  desc: { fontFamily: FONTS.jostLight, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  features: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureIconOk: { backgroundColor: 'rgba(201,168,76,0.15)' },
  featureIconNo: { backgroundColor: 'rgba(255,255,255,0.05)' },
  featureIconGold: { backgroundColor: '#C9A84C' },
  featureText: { fontFamily: FONTS.jostRegular, fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1 },
  featureTextNo: { color: 'rgba(255,255,255,0.3)', textDecorationLine: 'line-through' },
  featureTextNeg: { color: 'rgba(166,93,71,0.8)' },
  featureTextGold: { color: '#C9A84C', fontFamily: FONTS.jostMedium },
  check: { position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: 13, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0A0A0F', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  btn: { borderRadius: 8, overflow: 'hidden' },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { fontFamily: FONTS.jostMedium, fontSize: 14, color: '#0A0A0F', letterSpacing: 1 },
  btnTextFree: { color: '#FAF9F6' },
  trial: { fontFamily: FONTS.jostLight, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 12 },
});
