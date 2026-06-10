/**
 * Creator Layout
 * Routes: /creator/[id], /creator/studio
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
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="studio" />
    </Stack>
  );
}
