import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      testID="back-button"
      style={styles.btn}
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
    >
      <Text style={styles.arrow}>{'‹'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  arrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 22,
    marginTop: -2,
  },
});
