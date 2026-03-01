import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/theme';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();

  const options = [
    { icon: '✍️', label: 'Éclat Texte', desc: 'Partage une pensée' },
    { icon: '🎵', label: 'Éclat Sonore', desc: 'Enregistre un son' },
    { icon: '🎨', label: 'Éclat Visuel', desc: 'Crée une image' },
    { icon: '📹', label: 'Éclat Vidéo', desc: 'Capture un moment' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="create-screen">
      <LinearGradient
        colors={['rgba(166,93,71,0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.title}>Créer un Éclat</Text>
      <Text style={styles.subtitle}>Que veux-tu partager avec ton territoire ?</Text>

      <View style={styles.grid}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.7}
            testID={`create-option-${i}`}
          >
            <Text style={styles.cardIcon}>{opt.icon}</Text>
            <Text style={styles.cardLabel}>{opt.label}</Text>
            <Text style={styles.cardDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    marginTop: 24,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.dark2,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
  },
});
