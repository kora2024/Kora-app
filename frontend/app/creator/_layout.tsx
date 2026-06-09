/**
 * Creator Layout
 */

import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme';

export default function CreatorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.dark },
        animation: 'slide_from_right',
        animationDuration: 320,
      }}
    />
  );
}
