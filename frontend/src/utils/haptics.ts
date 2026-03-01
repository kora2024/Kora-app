import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Safe haptic wrapper (no-op on web/unsupported)
function safe(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  
  // ============================================
  // AXE 4 — ANCRAGE HAPTIQUE (Transmission Types)
  // ============================================
  
  /** Résonne : Heavy impact - deep resonance */
  resonne: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  
  /** Éveille : Light x2 (double pulse) - awakening */
  eveille: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await delay(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },
  
  /** Propulse : Success notification - propulsion */
  propulse: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  
  /** Ancre : Medium slow - anchoring */
  ancre: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await delay(200);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch {}
  },
  
  /** Transmet : Light rapid x3 - transmission */
  transmet: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await delay(50);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await delay(50);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },
};
