/**
 * KORA Feed Screen — UPGRADE 5 (Épure et respiration)
 * 
 * Principes appliqués :
 * - Un seul auteur visible à la fois (plein écran)
 * - Réactions : uniquement icônes, pas de labels texte
 * - Chiffres en petit sous l'icône
 * - Maximum 3 couleurs : dark, cream, terra
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';
import {
  ResonneIcon,
  PropulseIcon,
  EveillIcon,
  AncreIcon,
  TransmetIcon,
  OrbiteIcon,
  LinkIcon,
  GlobeIcon,
} from '../../src/components/icons/KoraIcons';

const { width: SW, height: SH } = Dimensions.get('window');

// ──────────── DATA ────────────

interface FeedItem {
  id: string;
  gradient: [string, string];
  author: string;
  location: string;
  role: string;
  initial: string;
  avatarColors: [string, string];
  text: string;
  reactions: { key: string; IconComponent: React.FC<{size?: number; color?: string}>; count: number }[];
}

const FEED_DATA: FeedItem[] = [
  {
    id: '1',
    gradient: ['#0a1a12', '#081510'],
    author: 'Kévin Désir',
    location: 'Fort-de-France',
    role: 'Griot',
    initial: 'K',
    avatarColors: [COLORS.terra, COLORS.gold],
    text: 'La kora résonne dans chaque algorithme. Nos ancêtres codaient en musique, chaque note une ligne de code vivante.',
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, count: 127 },
      { key: 'propulse', IconComponent: PropulseIcon, count: 34 },
      { key: 'eveille', IconComponent: EveillIcon, count: 22 },
      { key: 'ancre', IconComponent: AncreIcon, count: 89 },
      { key: 'transmet', IconComponent: TransmetIcon, count: 67 },
    ],
  },
  {
    id: '2',
    gradient: ['#0a0f1e', '#060a15'],
    author: 'Marcel Théodore',
    location: 'Saint-Pierre',
    role: 'Griot',
    initial: 'M',
    avatarColors: [COLORS.blue, '#2a5a7a'],
    text: "L'océan ne connaît pas de frontières. Notre mémoire voyage sur chaque vague, de continent en continent.",
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, count: 203 },
      { key: 'propulse', IconComponent: PropulseIcon, count: 56 },
      { key: 'eveille', IconComponent: EveillIcon, count: 41 },
      { key: 'ancre', IconComponent: AncreIcon, count: 178 },
      { key: 'transmet', IconComponent: TransmetIcon, count: 92 },
    ],
  },
  {
    id: '3',
    gradient: ['#1a0a08', '#120605'],
    author: 'Pulse Records',
    location: 'Lagos',
    role: 'Bâtisseur',
    initial: 'P',
    avatarColors: ['#C9A84C', '#A65D47'],
    text: 'Le feu ne demande pas la permission de brûler. Créer, c\'est allumer des incendies qui éclairent.',
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, count: 445 },
      { key: 'propulse', IconComponent: PropulseIcon, count: 112 },
      { key: 'eveille', IconComponent: EveillIcon, count: 67 },
      { key: 'ancre', IconComponent: AncreIcon, count: 234 },
      { key: 'transmet', IconComponent: TransmetIcon, count: 189 },
    ],
  },
];

// ──────────── REACTION ICON (MINIMALIST) ────────────

function ReactionIcon({
  IconComponent,
  count,
  active,
  onPress,
  testId,
}: {
  IconComponent: React.FC<{size?: number; color?: string}>;
  count: number;
  active: boolean;
  onPress: () => void;
  testId: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptic.medium();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onPress();
  };

  const iconColor = active ? COLORS.terra : 'rgba(255,255,255,0.5)';
  const displayCount = active ? count + 1 : count;

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      testID={testId}
      style={styles.reactionTouchable}
    >
      <Animated.View style={[styles.reactionIconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <IconComponent size={22} color={iconColor} />
        <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>
          {displayCount}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ──────────── ACTION ICON (MINIMALIST) ────────────

function ActionIcon({
  IconComponent,
  onPress,
  testId,
}: {
  IconComponent: React.FC<{size?: number; color?: string}>;
  onPress?: () => void;
  testId: string;
}) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testId}
    >
      <IconComponent size={22} color="rgba(255,255,255,0.6)" />
    </TouchableOpacity>
  );
}

// ──────────── FEED ITEM ────────────

function FeedItemCard({ item, itemHeight }: { item: FeedItem; itemHeight: number }) {
  const router = useRouter();
  const [activeReactions, setActiveReactions] = useState<Record<string, boolean>>({});

  const toggleReaction = (key: string) => {
    setActiveReactions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[styles.feedItem, { height: itemHeight }]} testID={`feed-item-${item.id}`}>
      {/* Full-screen gradient background */}
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
        locations={[0.35, 0.55, 1]}
        style={styles.overlayGradient}
      />

      {/* Right side actions */}
      <View style={styles.actionsColumn}>
        <ActionIcon
          IconComponent={OrbiteIcon}
          testId={`action-orbite-${item.id}`}
          onPress={() => router.push('/orbite')}
        />
        <ActionIcon IconComponent={LinkIcon} testId={`action-lien-${item.id}`} />
      </View>

      {/* Bottom content — épuré */}
      <View style={styles.bottomContent}>
        {/* Author row — minimal */}
        <View style={styles.authorRow}>
          <LinearGradient colors={item.avatarColors} style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{item.initial}</Text>
          </LinearGradient>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.authorMeta}>{item.role}</Text>
          </View>
        </View>

        {/* Text — breathing room */}
        <Text style={styles.feedText}>{item.text}</Text>

        {/* Reactions — icons only, no labels */}
        <View style={styles.reactionsRow}>
          {item.reactions.map((r) => (
            <ReactionIcon
              key={r.key}
              IconComponent={r.IconComponent}
              count={r.count}
              active={!!activeReactions[r.key]}
              onPress={() => toggleReaction(r.key)}
              testId={`reaction-${r.key}-${item.id}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ──────────── MAIN ────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const itemHeight = SH - insets.bottom;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <View style={styles.container} testID="feed-screen">
      {/* Minimal header — just logo and globe */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.logo}>KORA</Text>
        <TouchableOpacity
          style={styles.globeBtn}
          activeOpacity={0.7}
          testID="feed-globe-btn"
          onPress={() => router.push('/(tabs)/globe')}
        >
          <GlobeIcon size={18} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      {/* Full-screen feed */}
      <FlatList
        data={FEED_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedItemCard item={item} itemHeight={itemHeight} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        testID="feed-list"
      />
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  // Header — minimal
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  logo: {
    fontFamily: FONTS.playfairBold,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: 4,
  },
  globeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Feed item
  feedItem: {
    width: SW,
    position: 'relative',
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Actions column — minimal
  actionsColumn: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 200,
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom content — épuré
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  // Author — minimal
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  authorInfo: {
    marginLeft: SPACING.sm,
  },
  authorName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 16 * 1.6,
  },
  authorMeta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  // Text — breathing room
  feedText: {
    fontFamily: FONTS.jostLight,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 18 * 1.6,
    marginBottom: SPACING.lg,
  },
  // Reactions — icons only
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  reactionTouchable: {
    alignItems: 'center',
  },
  reactionIconWrap: {
    alignItems: 'center',
  },
  reactionCount: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  reactionCountActive: {
    color: COLORS.terra,
  },
});
