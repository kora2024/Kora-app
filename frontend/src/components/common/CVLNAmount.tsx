import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

interface CVLNAmountProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function CVLNAmount({ amount, size = 'md' }: CVLNAmountProps) {
  const fontSize = size === 'sm' ? 16 : size === 'md' ? 22 : 32;
  const labelSize = size === 'sm' ? 9 : size === 'md' ? 11 : 14;

  return (
    <View style={styles.container} testID="cvln-amount">
      <Text style={[styles.amount, { fontSize }]}>{amount.toLocaleString()}</Text>
      <Text style={[styles.label, { fontSize: labelSize }]}> CVLN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontFamily: FONTS.playfairRegular,
    color: COLORS.gold,
  },
  label: {
    fontFamily: FONTS.jostLight,
    color: COLORS.gray,
    letterSpacing: 1,
  },
});
