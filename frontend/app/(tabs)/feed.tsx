import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/theme';
import { useKoraStore } from '../../src/store/useKoraStore';
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
const TAB_BAR_HEIGHT = 80; // approximate tab bar height

// ──────────── DATA ────────────

interface FeedItem {
  id: string;
  emoji: string;
  gradient: [string, string];
  author: string;
  location: string;
  role: string;
  initial: string;
  avatarColors: [string, string];
  text: string;
  reactions: { key: string; IconComponent: React.FC<{size?: number; color?: string}>; label: string; count: number }[];
}

const FEED_DATA: FeedItem[] = [
  {
    id: '1',
    emoji: '',
    gradient: ['#0a1a12', '#081510'],
    author: 'Kévin Désir',
    location: 'Fort-de-France',
    role: 'Griot',
    initial: 'K',
    avatarColors: [COLORS.terra, COLORS.gold],
    text: 'La kora résonne dans chaque algorithme. Nos ancêtres codaient en musique, chaque note une ligne de code vivante.',
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, label: 'Résonne', count: 127 },
      { key: 'propulse', IconComponent: PropulseIcon, label: 'Propulse', count: 34 },
      { key: 'eveille', IconComponent: EveillIcon, label: 'Éveille', count: 22 },
      { key: 'ancre', IconComponent: AncreIcon, label: 'Ancre', count: 89 },
      { key: 'transmet', IconComponent: TransmetIcon, label: 'Transmet', count: 67 },
    ],
  },
  {
    id: '2',
    emoji: '',
    gradient: ['#0a0f1e', '#060a15'],
    author: 'Marcel Théodore',
    location: 'Saint-Pierre',
    role: 'Griot',
    initial: 'M',
    avatarColors: [COLORS.blue, '#2a5a7a'],
    text: "L'océan ne connaît pas de frontières. Notre mémoire voyage sur chaque vague, de continent en continent.",
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, label: 'Résonne', count: 203 },
      { key: 'propulse', IconComponent: PropulseIcon, label: 'Propulse', count: 56 },
      { key: 'eveille', IconComponent: EveillIcon, label: 'Éveille', count: 41 },
      { key: 'ancre', IconComponent: AncreIcon, label: 'Ancre', count: 178 },
      { key: 'transmet', IconComponent: TransmetIcon, label: 'Transmet', count: 92 },
    ],
  },
  {
    id: '3',
    emoji: '',
    gradient: ['#1a0a08', '#120605'],
    author: 'Pulse Records',
    location: 'Lagos',
    role: 'Bâtisseur',
    initial: 'P',
    avatarColors: ['#C9A84C', '#A65D47'],
    text: 'Le feu ne demande pas la permission de brûler. Créer, c\'est allumer des incendies qui éclairent.',
    reactions: [
      { key: 'resonne', IconComponent: ResonneIcon, label: 'Résonne', count: 445 },
      { key: 'propulse', IconComponent: PropulseIcon, label: 'Propulse', count: 112 },
      { key: 'eveille', IconComponent: EveillIcon, label: 'Éveille', count: 67 },
      { key: 'ancre', IconComponent: AncreIcon, label: 'Ancre', count: 234 },
      { key: 'transmet', IconComponent: TransmetIcon, label: 'Transmet', count: 189 },
    ],
  },
];

// ──────────── REACTION BUBBLE ────────────

function ReactionBubble({
  IconComponent,
  label,
  count,
  active,
  onPress,
}: {
  IconComponent: React.FC<{size?: number; color?: string}>;
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptic.medium();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onPress();
  };

  const iconColor = active ? COLORS.terra : 'rgba(255,255,255,0.7)';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.reactionBubble,
          active && styles.reactionBubbleActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.reactionIconContainer}>
          <IconComponent size={14} color={iconColor} />
        </View>
        <Text style={[styles.reactionLabel, active && styles.reactionLabelActive]}>{label}</Text>
        <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>
          {active ? count + 1 : count}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ──────────── ACTION BUTTON ────────────

function ActionButton({
  IconComponent,
  label,
  onPress,
  testId,
}: {
  IconComponent: React.FC<{size?: number; color?: string}>;
  label: string;
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
      <View style={styles.actionIconContainer}>
        <IconComponent size={20} color={COLORS.cream} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
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
      {/* Full-screen background */}
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
        locations={[0.3, 0.5, 1]}
        style={styles.overlayGradient}
      />

      {/* Right side actions */}
      <View style={styles.actionsColumn}>
        <ActionButton IconComponent={ResonneIcon} label="Résonne" testId={`action-resonne-${item.id}`} />
        <ActionButton
          IconComponent={OrbiteIcon}
          label="Orbite"
          testId={`action-orbite-${item.id}`}
          onPress={() => router.push('/orbite')}
        />
        <ActionButton
          IconComponent={TransmetIcon}
          label="Transmet"
          testId={`action-transmet-${item.id}`}
          onPress={() => router.push('/(tabs)/nebuleuse')}
        />
        <ActionButton IconComponent={LinkIcon} label="Lien" testId={`action-lien-${item.id}`} />
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <LinearGradient colors={item.avatarColors} style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{item.initial}</Text>
          </LinearGradient>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.authorMeta}>{item.role} · {item.location}</Text>
          </View>
          <TouchableOpacity style={styles.habiterBtn} activeOpacity={0.7} testID={`habiter-btn-${item.id}`}>
            <Text style={styles.habiterText}>Habiter</Text>
          </TouchableOpacity>
        </View>

        {/* Text */}
        <Text style={styles.feedText} numberOfLines={3}>{item.text}</Text>

        {/* Frequency reactions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reactionsScroll}
        >
          {item.reactions.map((r) => (
            <ReactionBubble
              key={r.key}
              IconComponent={r.IconComponent}
              label={r.label}
              count={r.count}
              active={!!activeReactions[r.key]}
              onPress={() => toggleReaction(r.key)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ──────────── SCROLL DOTS ────────────

function ScrollDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={styles.dotsColumn} testID="feed-scroll-dots">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ──────────── MAIN ────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTerritory } = useKoraStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(SH - TAB_BAR_HEIGHT);

  const itemHeight = containerHeight;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <FeedItemCard item={item} itemHeight={itemHeight} />,
    [itemHeight]
  );

  return (
    <View
      style={styles.container}
      testID="feed-screen"
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {/* Floating header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={[COLORS.dark, 'rgba(13,13,13,0.6)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          style={styles.territoryTag}
          activeOpacity={0.8}
          testID="feed-territory-tag"
        >
          <View style={[styles.territoryDot, { backgroundColor: activeTerritory.color }]} />
          <Text style={styles.territoryName}>{activeTerritory.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.globeBtn}
          activeOpacity={0.7}
          testID="feed-globe-btn"
          onPress={() => router.push('/(tabs)/globe')}
        >
          <GlobeIcon size={18} color={COLORS.cream} />
        </TouchableOpacity>
      </View>

      {/* Feed list */}
      <FlatList
        data={FEED_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />

      {/* Scroll indicator dots */}
      <ScrollDots total={FEED_DATA.length} active={currentIndex} />
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  // Floating header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
  },
  territoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 50,
    paddingVertical: 7,
    paddingHorizontal: 14,
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
  globeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeIcon: {
    fontSize: 16,
    color: COLORS.cream,
  },
  // Feed item
  feedItem: {
    width: SW,
    position: 'relative',
  },
  emojiCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  emojiGiant: {
    fontSize: 80,
    opacity: 0.12,
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Right actions
  actionsColumn: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    gap: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    bottom: -15,
    width: 60,
    textAlign: 'center',
  },
  // Bottom content
  bottomContent: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingLeft: SPACING.lg,
    paddingRight: 80,
    zIndex: 10,
  },
  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
  authorMeta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  habiterBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  habiterText: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  // Text
  feedText: {
    fontFamily: FONTS.playfairItalic,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: 14,
  },
  // Reactions
  reactionsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 5,
  },
  reactionBubbleActive: {
    backgroundColor: 'rgba(166,93,71,0.2)',
    borderColor: COLORS.terra,
  },
  reactionIcon: {
    fontSize: 12,
  },
  reactionIconActive: {
    // Same icon, active state handled by bubble
  },
  reactionLabel: {
    fontFamily: FONTS.jostLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  reactionLabelActive: {
    color: COLORS.terra,
  },
  reactionCount: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 2,
  },
  reactionCountActive: {
    color: COLORS.terra,
  },
  // Scroll dots
  dotsColumn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -30 }],
    gap: 8,
    alignItems: 'center',
    zIndex: 15,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.terra,
  },
  dotInactive: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
