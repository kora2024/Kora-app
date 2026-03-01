import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS } from '../theme';

interface GlowTextProps {
  children: string;
  style?: any;
  glowColor?: string;
}

export default function GlowText({ children, style, glowColor = COLORS.terra }: GlowTextProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.glow, { textShadowColor: glowColor }, style]} testID="glow-text">
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  glow: {
    fontFamily: FONTS.playfairBold,
    color: COLORS.cream,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
