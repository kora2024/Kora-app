import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/theme';

const { width: SW } = Dimensions.get('window');

const CONTACTS = [
  { name: 'Amina', x: 0.2, y: 0.2, temp: 'hot', initial: 'A' },
  { name: 'Kwame', x: 0.7, y: 0.15, temp: 'warm', initial: 'K' },
  { name: 'Fatou', x: 0.15, y: 0.55, temp: 'cool', initial: 'F' },
  { name: 'Omar', x: 0.75, y: 0.5, temp: 'hot', initial: 'O' },
  { name: 'Yara', x: 0.5, y: 0.35, temp: 'warm', initial: 'Y' },
  { name: 'Ibra', x: 0.4, y: 0.7, temp: 'cool', initial: 'I' },
];

const MESSAGES = [
  { text: "As-tu vu l'éclat de Kwame ?", sent: false },
  { text: 'Oui ! La fréquence monte 🔥', sent: true },
  { text: 'On devrait collaborer sur ce territoire', sent: false },
];

const tempColors: Record<string, string> = {
  hot: COLORS.terra,
  warm: COLORS.gold,
  cool: COLORS.blue,
};

function StarContact({ contact, delay }: { contact: typeof CONTACTS[0]; delay: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const canvasW = SW - 48;
  const canvasH = 300;
  const color = tempColors[contact.temp];

  return (
    <Animated.View
      style={[
        styles.starContainer,
        {
          left: contact.x * canvasW,
          top: contact.y * canvasH,
          opacity,
        },
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 1,
          borderColor: color,
          opacity: 0.3,
          transform: [{ scale: pulse }],
          left: -13,
          top: -13,
        }}
      />
      <LinearGradient
        colors={[color, 'rgba(13,13,13,0.8)']}
        style={styles.starAvatar}
      >
        <Text style={styles.starInitial}>{contact.initial}</Text>
      </LinearGradient>
      <Text style={styles.starName}>{contact.name}</Text>
    </Animated.View>
  );
}

export default function NebuleuseScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="nebuleuse-screen">
      <LinearGradient
        colors={['transparent', 'rgba(74,127,165,0.06)', 'transparent']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nébuleuse</Text>
        <Text style={styles.subtitle}>6 connexions actives</Text>
      </View>

      {/* Star map */}
      <View style={styles.canvas}>
        {CONTACTS.map((c, i) => (
          <StarContact key={i} contact={c} delay={i * 150} />
        ))}
      </View>

      {/* Conversation preview */}
      <View style={styles.convoPanel}>
        <View style={styles.convoHeader}>
          <LinearGradient
            colors={[COLORS.terra, COLORS.gold]}
            style={styles.convoAvatar}
          >
            <Text style={styles.convoAvatarText}>A</Text>
          </LinearGradient>
          <View>
            <Text style={styles.convoName}>Amina Diallo</Text>
            <Text style={styles.convoStatus}>En résonance</Text>
          </View>
        </View>

        {MESSAGES.map((msg, i) => (
          <View key={i} style={[styles.msgBubble, msg.sent ? styles.msgSent : styles.msgReceived]}>
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}
      </View>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 1,
    marginTop: 4,
  },
  canvas: {
    height: 300,
    marginHorizontal: SPACING.lg,
    position: 'relative',
  },
  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 50,
  },
  starAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starInitial: {
    fontFamily: FONTS.jostMedium,
    fontSize: 11,
    color: COLORS.cream,
  },
  starName: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  convoPanel: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: SPACING.md,
  },
  convoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  convoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convoAvatarText: {
    fontFamily: FONTS.playfairBold,
    fontSize: 14,
    color: COLORS.cream,
  },
  convoName: {
    fontFamily: FONTS.jostRegular,
    fontSize: 14,
    color: COLORS.cream,
  },
  convoStatus: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 11,
    color: COLORS.terra,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
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
});
