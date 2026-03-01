import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

export default function FREKBadge() {
  return (
    <View style={styles.badge} testID="frek-badge">
      <Text style={styles.text}>FREK ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#2D5A3D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3D7A4D',
  },
  text: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: '#7FD89A',
    letterSpacing: 0.5,
  },
});
