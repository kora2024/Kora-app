/**
 * KORA - Contact
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
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

export default function ContactPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      setSending(false);
      Alert.alert('Message envoyé', 'Nous vous répondrons dans les plus brefs délais.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  const CONTACTS = [
    { label: 'Support général', email: 'support@kora.tv' },
    { label: 'Créateurs & Artistes', email: 'creators@kora.tv' },
    { label: 'Partenariats', email: 'partners@kora.tv' },
    { label: 'Presse', email: 'press@kora.tv' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>Contactez-nous</Text>
        <Text style={styles.heroSubtitle}>Notre équipe est là pour vous aider</Text>

        {/* Quick Contacts */}
        <View style={styles.quickContacts}>
          {CONTACTS.map((c, i) => (
            <View key={i} style={styles.quickContactItem}>
              <Text style={styles.quickContactLabel}>{c.label}</Text>
              <Text style={styles.quickContactEmail}>{c.email}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Envoyez-nous un message</Text>
          
          <Text style={styles.inputLabel}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />

          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Sujet</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Sujet de votre message"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Décrivez votre demande..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={sending} activeOpacity={0.9}>
            <Text style={styles.submitBtnText}>{sending ? 'Envoi en cours...' : 'Envoyer le message'}</Text>
          </TouchableOpacity>
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
  heroTitle: { fontFamily: FONTS.playfairBold, fontSize: 32, color: CINEMA.cream, marginTop: 20 },
  heroSubtitle: { fontFamily: FONTS.jostRegular, fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 32 },
  quickContacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  quickContactItem: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 16, minWidth: '45%', flex: 1 },
  quickContactLabel: { fontFamily: FONTS.jostMedium, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  quickContactEmail: { fontFamily: FONTS.jostRegular, fontSize: 14, color: CINEMA.gold },
  form: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24 },
  formTitle: { fontFamily: FONTS.jostMedium, fontSize: 18, color: CINEMA.cream, marginBottom: 24 },
  inputLabel: { fontFamily: FONTS.jostMedium, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 14, fontFamily: FONTS.jostRegular, fontSize: 15, color: CINEMA.cream, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  textarea: { minHeight: 120 },
  submitBtn: { backgroundColor: CINEMA.gold, borderRadius: 8, padding: 16, marginTop: 24, alignItems: 'center' },
  submitBtnText: { fontFamily: FONTS.jostMedium, fontSize: 14, color: CINEMA.black, letterSpacing: 1 },
});
