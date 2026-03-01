import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Safe haptic wrapper (no-op on web/unsupported)
function safe(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

export const haptic = {
  /** Sélection fréquence / réaction Feed */
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Entrée dans un territoire */
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** Activation orbitale / tap étoile nébuleuse */
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** FREK badge tap / success */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Selection change */
  selection: () => safe(() => Haptics.selectionAsync()),
};
