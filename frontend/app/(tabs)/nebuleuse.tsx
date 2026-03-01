/**
 * KORA Nébuleuse Screen — UPGRADE 5 (Épure et respiration)
 * 
 * Principes appliqués :
 * - Titre + constellation. Rien d'autre dans le header.
 * - Maximum 3 couleurs : dark, cream, terra
 * - Suppression des bordures décoratives
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, TYPOGRAPHY } from '../../src/theme';
import { haptic } from '../../src/utils/haptics';
import { CloseIcon } from '../../src/components/icons/KoraIcons';

const { width: SW, height: SHH } = Dimensions.get('window');

// ──────────── DATA ────────────

type TempType = 'hot' | 'warm' | 'cold';

interface StarContact {
  id: string;
  name: string;
  initial: string;
  size: number;
  radius: number;
  angle: number;
  temp: TempType;
  active: boolean;
  messages: { text: string; sent: boolean; isVoice?: boolean; duration?: string }[];
}

const CONTACTS: StarContact[] = [
  {
    id: 'kevin',
    name: 'Kévin',
    initial: 'K',
    size: 48,
    radius: 85,
    angle: -30,
    temp: 'hot',
    active: true,
    messages: [
      { text: "Yo ! T'as entendu le nouveau set ?", sent: false },
      { text: 'Grave, les fréquences sont incroyables', sent: true },
    ],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    initial: 'P',
    size: 44,
    radius: 95,
    angle: 50,
    temp: 'hot',
    active: true,
    messages: [
      { text: 'Le drop arrive ce soir', sent: false },
      { text: 'Ready pour la transmission', sent: true },
    ],
  },
  {
    id: 'aurelie',
    name: 'Aurélie',
    initial: 'A',
    size: 38,
    radius: 140,
    angle: 150,
    temp: 'warm',
    active: false,
    messages: [
      { text: "L'exposition commence vendredi", sent: false },
      { text: "J'y serai !", sent: true },
    ],
  },
  {
    id: 'marcel',
    name: 'Marcel',
    initial: 'M',
    size: 34,
    radius: 180,
    angle: 280,
    temp: 'cold',
    active: false,
    messages: [
      { text: 'Ça fait longtemps frère', sent: false },
      { text: 'On se capte bientôt ?', sent: true },
    ],
  },
];

const TEMP_COLORS: Record<TempType, { gradient: [string, string] }> = {
  hot: { gradient: [COLORS.terra, COLORS.gold] },
  warm: { gradient: [COLORS.terra, '#8B4A3A'] },
  cold: { gradient: ['#3a3a4a', '#2a2a3a'] },
};

// Connection lines
const CONNECTIONS = [
  { from: 'kevin', to: 'pulse' },
  { from: 'kevin', to: 'aurelie' },
];

// ──────────── STAR COMPONENT ────────────

function StarNode({
  contact,
  centerX,
  centerY,
  onTap,
}: {
  contact: StarContact;
  centerX: number;
  centerY: number;
  onTap: (c: StarContact) => void;
}) {
  const floatX = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  const angleRad = (contact.angle * Math.PI) / 180;
  const baseX = centerX + Math.cos(angleRad) * contact.radius - contact.size / 2;
  const baseY = centerY + Math.sin(angleRad) * contact.radius - contact.size / 2;

  useEffect(() => {
    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, { toValue: 4, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatX, { toValue: -4, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 4, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    // Pulse for active
    if (contact.active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const colors = TEMP_COLORS[contact.temp];

  return (
    <Animated.View
      style={[
        styles.starNode,
        {
          left: baseX,
          top: baseY,
          width: contact.size,
          height: contact.size,
          transform: [{ translateX: floatX }, { translateY: floatY }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onTap(contact)}
        activeOpacity={0.8}
        testID={`star-${contact.id}`}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.starAvatar,
            { width: contact.size, height: contact.size, borderRadius: contact.size / 2 },
          ]}
        >
          <Text style={[styles.starInitial, { fontSize: contact.size * 0.38 }]}>
            {contact.initial}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.starName}>{contact.name}</Text>
      {contact.active && (
        <Animated.View style={[styles.activeDot, { opacity: pulseOpacity }]} />
      )}
    </Animated.View>
  );
}

// ──────────── CONNECTION LINE ────────────

function ConnectionLine({
  fromContact,
  toContact,
  centerX,
  centerY,
}: {
  fromContact: StarContact;
  toContact: StarContact;
  centerX: number;
  centerY: number;
}) {
  const fa = (fromContact.angle * Math.PI) / 180;
  const ta = (toContact.angle * Math.PI) / 180;
  const fx = centerX + Math.cos(fa) * fromContact.radius;
  const fy = centerY + Math.sin(fa) * fromContact.radius;
  const tx = centerX + Math.cos(ta) * toContact.radius;
  const ty = centerY + Math.sin(ta) * toContact.radius;

  const dx = tx - fx;
  const dy = ty - fy;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={[
        styles.connectionLine,
        {
          left: fx,
          top: fy,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

// ──────────── CONVERSATION SHEET ────────────

function ConversationSheet({
  contact,
  onClose,
}: {
  contact: StarContact;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(280)).current;
  const colors = TEMP_COLORS[contact.temp];

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14 }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: 280, duration: 200, useNativeDriver: true }).start(onClose);
  };

  return (
    <Animated.View
      style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}
      testID="conversation-sheet"
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
        <LinearGradient colors={colors.gradient} style={styles.sheetAvatar}>
          <Text style={styles.sheetAvatarText}>{contact.initial}</Text>
        </LinearGradient>
        <View style={styles.sheetHeaderInfo}>
          <Text style={styles.sheetName}>{contact.name}</Text>
          <Text style={contact.active ? styles.sheetStatusActive : styles.sheetStatusInactive}>
            {contact.active ? 'Actif' : 'Hors ligne'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.sheetClose}
          testID="sheet-close-btn"
          activeOpacity={0.7}
        >
          <CloseIcon size={16} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.sheetMessages}>
        {contact.messages.map((m, i) => (
          <View key={i} style={[styles.msgBubble, m.sent ? styles.msgSent : styles.msgReceived]}>
            <Text style={styles.msgText}>{m.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ──────────── MAIN ────────────

export default function NebuleuseScreen() {
  const insets = useSafeAreaInsets();
  const [selectedContact, setSelectedContact] = useState<StarContact | null>(null);

  const centerX = SW / 2;
  const centerY = SHH * 0.4;

  const handleStarTap = useCallback((contact: StarContact) => {
    haptic.light();
    setSelectedContact(contact);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="nebuleuse-screen">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Titre uniquement, rien d'autre
      ═══════════════════════════════════════════════════════════════ */}
      <View style={styles.header}>
        <Text style={styles.title} testID="nebuleuse-title">Nébuleuse</Text>
      </View>

      {/* ═══════════════════════════════════════════════════════════════
          CONSTELLATION — L'espace respire
      ═══════════════════════════════════════════════════════════════ */}
      <View style={styles.constellation}>
        {/* Connection lines */}
        {CONNECTIONS.map((conn, i) => {
          const from = CONTACTS.find((c) => c.id === conn.from)!;
          const to = CONTACTS.find((c) => c.id === conn.to)!;
          return (
            <ConnectionLine
              key={i}
              fromContact={from}
              toContact={to}
              centerX={centerX}
              centerY={centerY - 100}
            />
          );
        })}

        {/* YOU (center) */}
        <View style={[styles.youNode, { left: centerX - 28, top: centerY - 128 }]}>
          <LinearGradient colors={[COLORS.terra, COLORS.gold]} style={styles.youAvatar}>
            <Text style={styles.youText}>MOI</Text>
          </LinearGradient>
        </View>

        {/* Star contacts */}
        {CONTACTS.map((contact) => (
          <StarNode
            key={contact.id}
            contact={contact}
            centerX={centerX}
            centerY={centerY - 100}
            onTap={handleStarTap}
          />
        ))}
      </View>

      {/* Conversation sheet */}
      {selectedContact && (
        <ConversationSheet
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  
  // ═══════════ HEADER — Épuré ═══════════
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.heading1,
    letterSpacing: 1,
  },
  
  // ═══════════ CONSTELLATION ═══════════
  constellation: {
    flex: 1,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transformOrigin: 'left center',
  },
  
  // ═══════════ YOU NODE ═══════════
  youNode: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  youAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  
  // ═══════════ STAR NODES ═══════════
  starNode: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3,
  },
  starAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starInitial: {
    fontFamily: FONTS.playfairBold,
    color: COLORS.cream,
  },
  starName: {
    ...TYPOGRAPHY.meta,
    marginTop: 8,
    textAlign: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.terra,
    marginTop: 4,
  },
  
  // ═══════════ CONVERSATION SHEET ═══════════
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: COLORS.dark2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    zIndex: 50,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sheetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 18,
    color: COLORS.cream,
  },
  sheetHeaderInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  sheetName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 16,
    color: COLORS.cream,
  },
  sheetStatusActive: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.terra,
    marginTop: 2,
  },
  sheetStatusInactive: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetMessages: {
    flex: 1,
    gap: 8,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  msgReceived: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'flex-start',
  },
  msgSent: {
    backgroundColor: 'rgba(166,93,71,0.15)',
    alignSelf: 'flex-end',
  },
  msgText: {
    fontFamily: FONTS.jostLight,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 14 * 1.6,
  },
});
