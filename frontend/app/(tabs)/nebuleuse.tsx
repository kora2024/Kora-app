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
import { COLORS, FONTS, SPACING } from '../../src/theme';

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
  theme?: string;
  messages: { text: string; sent: boolean; isVoice?: boolean; duration?: string }[];
}

const CONTACTS: StarContact[] = [
  {
    id: 'kevin',
    name: 'Kévin',
    initial: 'K',
    size: 48,
    radius: 80,
    angle: -30,
    temp: 'hot',
    active: true,
    theme: 'Musique',
    messages: [
      { text: "Yo ! T'as entendu le nouveau set de Dakar ?", sent: false },
      { text: '', sent: false, isVoice: true, duration: '0:34' },
      { text: 'Grave, les fréquences sont incroyables 🔥', sent: true },
    ],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    initial: 'P',
    size: 44,
    radius: 90,
    angle: 45,
    temp: 'hot',
    active: true,
    theme: 'Musique',
    messages: [
      { text: 'Le drop arrive ce soir', sent: false },
      { text: 'Ready pour la transmission 📡', sent: true },
      { text: 'Les territoires vont résonner', sent: false },
    ],
  },
  {
    id: 'aurelie',
    name: 'Aurélie',
    initial: 'A',
    size: 40,
    radius: 130,
    angle: 150,
    temp: 'warm',
    active: false,
    messages: [
      { text: "L'exposition commence vendredi", sent: false },
      { text: "J'y serai ! On se retrouve au territoire ?", sent: true },
      { text: 'Parfait 🎨', sent: false },
    ],
  },
  {
    id: 'alan',
    name: 'Alan',
    initial: 'A',
    size: 40,
    radius: 140,
    angle: 220,
    temp: 'warm',
    active: false,
    messages: [
      { text: 'Le projet avance bien', sent: false },
      { text: "Envoi-moi les maquettes quand c'est prêt", sent: true },
      { text: "C'est fait, check ton noyau", sent: false },
    ],
  },
  {
    id: 'marcel',
    name: 'Marcel',
    initial: 'M',
    size: 36,
    radius: 190,
    angle: 300,
    temp: 'cold',
    active: false,
    messages: [
      { text: 'Ça fait longtemps frère', sent: false },
      { text: 'Trop longtemps ! On se capte bientôt ?', sent: true },
    ],
  },
  {
    id: 'fatou',
    name: 'Fatou',
    initial: 'F',
    size: 34,
    radius: 210,
    angle: 100,
    temp: 'cold',
    active: false,
    messages: [
      { text: 'Salut depuis Dakar 🌍', sent: false },
      { text: 'Mwen ka pansé à ou ! Bientôt ?', sent: true },
    ],
  },
];

const TEMP_COLORS: Record<TempType, { border: string; glow: string; gradient: [string, string] }> = {
  hot: { border: COLORS.gold, glow: COLORS.gold, gradient: [COLORS.terra, COLORS.gold] },
  warm: { border: COLORS.terra, glow: COLORS.terra, gradient: [COLORS.terra, '#8B4A3A'] },
  cold: { border: 'rgba(255,255,255,0.15)', glow: 'rgba(74,127,165,0.3)', gradient: ['#2a3a4a', '#1a2535'] },
};

// Connection lines between nearby stars
const CONNECTIONS = [
  { from: 'kevin', to: 'pulse' },
  { from: 'kevin', to: 'aurelie' },
  { from: 'pulse', to: 'alan' },
  { from: 'aurelie', to: 'alan' },
];

// ──────────── WAVE BAR ────────────

function VoiceWaveBar({ delay, maxH }: { delay: number; maxH: number }) {
  const h = useRef(new Animated.Value(3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(h, { toValue: maxH, duration: 200, useNativeDriver: false }),
        Animated.timing(h, { toValue: 3, duration: 300, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.voiceBar, { height: h }]} />;
}

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
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const angleRad = (contact.angle * Math.PI) / 180;
  const baseX = centerX + Math.cos(angleRad) * contact.radius - contact.size / 2;
  const baseY = centerY + Math.sin(angleRad) * contact.radius - contact.size / 2;

  useEffect(() => {
    // Float X
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, {
          toValue: 5,
          duration: 3000 + Math.random() * 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatX, {
          toValue: -5,
          duration: 3000 + Math.random() * 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    // Float Y
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -5,
          duration: 4000 + Math.random() * 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 5,
          duration: 4000 + Math.random() * 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    // Pulse for active contacts
    if (contact.active) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
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
      {/* Pulse ring (active only) */}
      {contact.active && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: contact.size,
              height: contact.size,
              borderRadius: contact.size / 2,
              borderColor: colors.glow,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={() => onTap(contact)}
        activeOpacity={0.8}
        testID={`star-${contact.id}`}
        style={styles.starTouchable}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.starAvatar,
            {
              width: contact.size,
              height: contact.size,
              borderRadius: contact.size / 2,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.starInitial, { fontSize: contact.size * 0.38 }]}>
            {contact.initial}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.starName}>{contact.name}</Text>
      {contact.active && <View style={[styles.activeDot, { backgroundColor: colors.glow }]} />}
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

  const isHot = fromContact.temp === 'hot' || toContact.temp === 'hot';

  return (
    <View
      style={[
        styles.connectionLine,
        {
          left: fx,
          top: fy,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: isHot ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.06)',
        },
      ]}
    />
  );
}

// ──────────── BOTTOM SHEET ────────────

function ConversationSheet({
  contact,
  onClose,
}: {
  contact: StarContact;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(260)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colors = TEMP_COLORS[contact.temp];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 260, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
      testID="conversation-sheet"
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
        <LinearGradient colors={colors.gradient} style={styles.sheetAvatar}>
          <Text style={styles.sheetAvatarText}>{contact.initial}</Text>
        </LinearGradient>
        <View style={styles.sheetHeaderInfo}>
          <Text style={styles.sheetName}>{contact.name}</Text>
          {contact.active && (
            <Text style={styles.sheetStatus}>● Actif maintenant</Text>
          )}
          {!contact.active && (
            <Text style={styles.sheetStatusInactive}>Hors ligne</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.sheetClose}
          testID="sheet-close-btn"
          activeOpacity={0.7}
        >
          <Text style={styles.sheetCloseText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={styles.sheetMessages}>
        {contact.messages.map((m, i) => (
          <View key={i} style={[styles.msgBubble, m.sent ? styles.msgSent : styles.msgReceived]}>
            {m.isVoice ? (
              <View style={styles.voiceMsg}>
                <View style={styles.voiceBars}>
                  {[10, 16, 8, 20, 12, 6, 14, 18, 10].map((h, j) => (
                    <VoiceWaveBar key={j} delay={j * 50} maxH={h} />
                  ))}
                </View>
                <Text style={styles.voiceDuration}>{m.duration}</Text>
              </View>
            ) : (
              <Text style={styles.msgText}>{m.text}</Text>
            )}
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

  // Backdrop glow
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.8, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const centerX = SW / 2;
  const centerY = SHH * 0.42;

  const handleStarTap = useCallback((contact: StarContact) => {
    setSelectedContact(contact);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="nebuleuse-screen">
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} testID="nebuleuse-title">Nébuleuse</Text>
        <Text style={styles.subtitle}>Vos transmissions actives</Text>
      </View>

      {/* Constellation space */}
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
              centerY={centerY - 120}
            />
          );
        })}

        {/* Theme label */}
        <View style={[styles.themeLabel, { left: centerX - 60, top: centerY - 155 }]}>
          <Text style={styles.themeLabelText}>Musique</Text>
        </View>

        {/* YOU (center) */}
        <View style={[styles.youNode, { left: centerX - 28, top: centerY - 148 }]}>
          <LinearGradient
            colors={[COLORS.terra, COLORS.gold]}
            style={styles.youAvatar}
          >
            <Text style={styles.youText}>MOI</Text>
          </LinearGradient>
          <Text style={styles.youLabel}>Vous</Text>
        </View>

        {/* Star contacts */}
        {CONTACTS.map((contact) => (
          <StarNode
            key={contact.id}
            contact={contact}
            centerX={centerX}
            centerY={centerY - 120}
            onTap={handleStarTap}
          />
        ))}
      </View>

      {/* Bottom sheet conversation */}
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
  bgGlow: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: 'rgba(26,58,92,0.08)',
    left: SW * 0.1,
    top: SHH * 0.2,
  },
  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 13,
    color: COLORS.gray,
    letterSpacing: 1,
    marginTop: 4,
  },
  // Constellation
  constellation: {
    flex: 1,
    position: 'relative',
  },
  // Connection lines
  connectionLine: {
    position: 'absolute',
    height: 1,
    transformOrigin: 'left center',
  },
  // Theme label
  themeLabel: {
    position: 'absolute',
    zIndex: 1,
  },
  themeLabelText: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: 'rgba(201,168,76,0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // YOU node
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
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  youText: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  youLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  // Star nodes
  starNode: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3,
  },
  starTouchable: {
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    top: 0,
    left: 0,
  },
  starAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  starInitial: {
    fontFamily: FONTS.playfairBold,
    color: COLORS.cream,
  },
  starName: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  // Sheet
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: 18,
    zIndex: 50,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  sheetHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  sheetName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
  sheetStatus: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.terra,
    marginTop: 1,
  },
  sheetStatusInactive: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  sheetMessages: {
    flex: 1,
    gap: 6,
  },
  msgBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  msgReceived: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  msgSent: {
    backgroundColor: 'rgba(166,93,71,0.25)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  },
  // Voice message
  voiceMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 22,
  },
  voiceBar: {
    width: 3,
    backgroundColor: COLORS.terra,
    borderRadius: 1.5,
    opacity: 0.7,
  },
  voiceDuration: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: COLORS.gray,
  },
});
