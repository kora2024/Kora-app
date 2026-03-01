/**
 * KORA Design System — UPGRADE 6 (Typographie Souveraine)
 * 
 * RÈGLE ABSOLUE :
 * Playfair Display → titres, noms, moments poétiques, chiffres CVLN
 * Jost → tout le reste (labels, boutons, corps de texte, métadonnées)
 * JetBrains Mono → IDs, codes, données techniques uniquement
 * 
 * La typographie est l'identité sonore de KORA
 * Playfair = la mémoire. Jost = le présent. Mono = la machine.
 */

import { TextStyle } from 'react-native';

// ══════════════════════════════════════════════════════════════════════════════
// COLORS — La palette du joyau sombre
// ══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  terra: '#A65D47',
  terraLight: '#C07055',
  gold: '#C9A84C',
  dark: '#0D0D0D',
  dark2: '#1A1A1A',
  dark3: '#242424',
  cream: '#F4F1EA',
  gray: '#888888',
  blue: '#4A7FA5',
  white: '#FFFFFF',
  transparent: 'transparent',
};

// ══════════════════════════════════════════════════════════════════════════════
// FONTS — Noms des polices chargées
// ══════════════════════════════════════════════════════════════════════════════

export const FONTS = {
  // Playfair Display — La mémoire
  playfairBold: 'PlayfairDisplay_700Bold',
  playfairRegular: 'PlayfairDisplay_400Regular',
  playfairItalic: 'PlayfairDisplay_400Regular_Italic',
  playfairBoldItalic: 'PlayfairDisplay_700Bold_Italic',
  
  // Jost — Le présent
  jostExtraLight: 'Jost_200ExtraLight',
  jostLight: 'Jost_300Light',
  jostRegular: 'Jost_400Regular',
  jostMedium: 'Jost_500Medium',
  
  // JetBrains Mono — La machine
  jetbrainsMono: 'JetBrainsMono_400Regular',
};

// ══════════════════════════════════════════════════════════════════════════════
// SPACING — Épure et respiration (UPGRADE 5)
// ══════════════════════════════════════════════════════════════════════════════

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 60,
  xxl: 80,
};

// ══════════════════════════════════════════════════════════════════════════════
// RADIUS
// ══════════════════════════════════════════════════════════════════════════════

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 50,
};

// ══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY — Le système souverain
// ══════════════════════════════════════════════════════════════════════════════

export const TYPOGRAPHY: Record<string, TextStyle> = {
  // ────────── Headings (Playfair — La mémoire) ──────────
  heading1: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: COLORS.cream,
    lineHeight: 36 * 1.3,
  },
  heading2: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 24,
    color: COLORS.cream,
    lineHeight: 24 * 1.4,
  },
  heading3: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 18 * 1.5,
  },
  
  // ────────── Poetic (Playfair Italic — Les moments suspendus) ──────────
  poetic: {
    fontFamily: FONTS.playfairItalic,
    fontSize: 20,
    color: COLORS.terra,
    lineHeight: 20 * 1.6,
  },
  
  // ────────── CVLN Values (Playfair Bold — L'or de l'économie) ──────────
  cvln: {
    fontFamily: FONTS.playfairBold,
    fontSize: 28,
    color: COLORS.gold,
    lineHeight: 28 * 1.2,
  },
  cvlnLarge: {
    fontFamily: FONTS.playfairBold,
    fontSize: 36,
    color: COLORS.gold,
    lineHeight: 36 * 1.2,
  },
  cvlnSmall: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 18,
    color: COLORS.gold,
    lineHeight: 18 * 1.3,
  },
  
  // ────────── Body (Jost — Le présent) ──────────
  body: {
    fontFamily: FONTS.jostLight,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 15 * 1.6,
  },
  bodySmall: {
    fontFamily: FONTS.jostLight,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 13 * 1.6,
  },
  bodyLarge: {
    fontFamily: FONTS.jostLight,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 18 * 1.6,
  },
  
  // ────────── Labels (Jost Regular — Les repères) ──────────
  label: {
    fontFamily: FONTS.jostRegular,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 10,
    color: COLORS.gray,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelLight: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 1,
  },
  
  // ────────── Buttons (Jost Medium — L'action) ──────────
  button: {
    fontFamily: FONTS.jostMedium,
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 1,
  },
  buttonSmall: {
    fontFamily: FONTS.jostMedium,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  
  // ────────── Meta (Jost Extra Light — Les murmures) ──────────
  meta: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 12 * 1.6,
  },
  
  // ────────── Names (Playfair — Les identités) ──────────
  name: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 16 * 1.4,
  },
  nameLarge: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 28 * 1.3,
  },
  
  // ────────── IDs & Codes (JetBrains Mono — La machine) ──────────
  id: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 12,
    color: COLORS.gray,
  },
  idSmall: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  code: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 14,
    color: COLORS.cream,
  },
  
  // ────────── Navigation (Jost Light — Discret mais présent) ──────────
  nav: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
  navActive: {
    fontFamily: FONTS.jostLight,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 0.5,
  },
  
  // ────────── Counts & Numbers (Jost Extra Light) ──────────
  count: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  countActive: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.terra,
  },
  
  // ────────── Stats (Playfair for values, Jost for labels) ──────────
  statValue: {
    fontFamily: FONTS.playfairRegular,
    fontSize: 28,
    color: COLORS.cream,
  },
  statLabel: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  
  // ────────── Role/Badge (Jost Extra Light — Les titres) ──────────
  role: {
    fontFamily: FONTS.jostExtraLight,
    fontSize: 12,
    color: COLORS.terra,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  badge: {
    fontFamily: FONTS.jostMedium,
    fontSize: 10,
    color: COLORS.terra,
    letterSpacing: 1,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER — Apply typography style
// ══════════════════════════════════════════════════════════════════════════════

export function typo(style: keyof typeof TYPOGRAPHY): TextStyle {
  return TYPOGRAPHY[style];
}
