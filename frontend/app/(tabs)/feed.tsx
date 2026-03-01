import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore } from '../../src/store/useKoraStore';

const { width: SW, height: SH } = Dimensions.get('window');

const FEED_ITEMS = [
  {
    id: '1',
    emoji: '🎵',
    bg: ['#2a1520', '#1a2535'] as const,
    author: 'Amina Diallo',
    location: 'Dakar, Sénégal',
    text: 'La kora résonne dans chaque algorithme. Nos ancêtres codaient en musique.',
    auras: [
      { emoji: '🔥', label: 'Feu', count: 234 },
      { emoji: '💎', label: 'Rare', count: 89 },
      { emoji: '🌊', label: 'Flow', count: 156 },
    ],
  },
  {
    id: '2',
    emoji: '🎨',
    bg: ['#1a2a20', '#201a2a'] as const,
    author: 'Kwame Asante',
    location: 'Accra, Ghana',
    text: "L'art n'est pas ce que tu vois, c'est ce que tu fais voir aux autres.",
    auras: [
      { emoji: '✨', label: 'Étoile', count: 312 },
      { emoji: '🔥', label: 'Feu', count: 178 },
    ],
  },
  {
    id: '3',
    emoji: '💭',
    bg: ['#1a1a2e', '#2a1a1a'] as const,
    author: 'Fatoumata Keita',
    location: 'Bamako, Mali',
    text: 'Chaque pensée est une graine. Le territoire est notre jardin collectif.',
    auras: [
      { emoji: '🌱', label: 'Pousse', count: 445 },
      { emoji: '💎', label: 'Rare', count: 67 },
    ],
  },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="feed-screen">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.territoryTag}>
          <LinearGradient
            colors={[COLORS.terra, COLORS.gold]}
            style={styles.territoryDot}
          />
          <Text style={styles.territoryName}>Territoire Dakar</Text>
        </View>
      </View>

      {/* Feed items */}
      <ScrollView
        style={styles.feedScroll}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SH - insets.top - 60 - 78}
      >
        {FEED_ITEMS.map((item) => (
          <View key={item.id} style={[styles.feedItem, { height: SH - insets.top - 60 - 78 }]}>
            <LinearGradient
              colors={[...item.bg]}
              style={styles.feedItemBg}
            >
              <Text style={styles.feedEmoji}>{item.emoji}</Text>
            </LinearGradient>

            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(13,13,13,0.8)', COLORS.dark]}
              style={styles.feedGradient}
            />

            {/* Content */}
            <View style={styles.feedContent}>
              {/* Author */}
              <View style={styles.authorRow}>
                <LinearGradient
                  colors={[COLORS.terra, COLORS.gold]}
                  style={styles.authorAvatar}
                >
                  <Text style={styles.authorInitial}>{item.author[0]}</Text>
                </LinearGradient>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{item.author}</Text>
                  <Text style={styles.authorLocation}>{item.location}</Text>
                </View>
                <TouchableOpacity style={styles.followBtn} activeOpacity={0.7}>
                  <Text style={styles.followText}>Suivre</Text>
                </TouchableOpacity>
              </View>

              {/* Text */}
              <Text style={styles.feedText}>{item.text}</Text>

              {/* Auras */}
              <View style={styles.aurasRow}>
                {item.auras.map((aura, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.auraBubble}
                    onPress={() => router.push('/orbite' as any)}
                    activeOpacity={0.7}
                    testID={`aura-${item.id}-${idx}`}
                  >
                    <Text style={styles.auraEmoji}>{aura.emoji}</Text>
                    <Text style={styles.auraCount}>{aura.count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  territoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  territoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  territoryName: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
  },
  feedScroll: {
    flex: 1,
  },
  feedItem: {
    width: SW,
    position: 'relative',
  },
  feedItemBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedEmoji: {
    fontSize: 120,
    opacity: 0.15,
  },
  feedGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  feedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontFamily: FONTS.playfairBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
  authorLocation: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  followBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  followText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  feedText: {
    fontFamily: FONTS.jostLight,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: 20,
  },
  aurasRow: {
    flexDirection: 'row',
    gap: 8,
  },
  auraBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  auraEmoji: {
    fontSize: 14,
  },
  auraCount: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});
