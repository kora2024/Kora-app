/**
 * KORA Design System — W3C Design Tokens (Master Blueprint 2055)
 * ===============================================================
 * 
 * Based on: kora_master_2055_emergent_blueprint.md
 * 
 * Format: W3C Design Tokens Community Group specification
 * https://design-tokens.github.io/community-group/format/
 * 
 * Features:
 * - Cultural palettes (500+ cultures supported)
 * - Motion system with cultural easing
 * - Typography scale
 * - Spacing (8pt grid)
 * - Semantic tokens
 */

// ══════════════════════════════════════════════════════════════════════════════
// W3C DESIGN TOKENS FORMAT (JSON Schema compatible)
// ══════════════════════════════════════════════════════════════════════════════

export interface DesignToken {
  $value: string | number | object;
  $type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'cubicBezier' | 'number';
  $description?: string;
}

export interface TokenGroup {
  [key: string]: DesignToken | TokenGroup;
}

// ══════════════════════════════════════════════════════════════════════════════
// CORE COLOR SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

export const KORA_TOKENS = {
  kora: {
    color: {
      // Brand colors
      primary: { $value: '#6B4EE6', $type: 'color' as const, $description: 'Primary purple' },
      secondary: { $value: '#D4A843', $type: 'color' as const, $description: 'Gold accent' },
      tertiary: { $value: '#E8A882', $type: 'color' as const, $description: 'Terracotta' },
      
      // Backgrounds
      background: { $value: '#0A0A0F', $type: 'color' as const, $description: 'Deep void' },
      surface: { $value: '#1A1A24', $type: 'color' as const, $description: 'Card surface' },
      surfaceElevated: { $value: '#242430', $type: 'color' as const },
      
      // Text
      textPrimary: { $value: '#FAF9F6', $type: 'color' as const, $description: 'Ivory' },
      textSecondary: { $value: 'rgba(255,255,255,0.7)', $type: 'color' as const },
      textMuted: { $value: 'rgba(255,255,255,0.4)', $type: 'color' as const },
      
      // Semantic
      success: { $value: '#4CAF50', $type: 'color' as const },
      warning: { $value: '#FF9800', $type: 'color' as const },
      error: { $value: '#F44336', $type: 'color' as const },
      info: { $value: '#2196F3', $type: 'color' as const },
      
      // Gradients (as string representations)
      gradientPrimary: { $value: 'linear-gradient(135deg, #6B4EE6 0%, #D4A843 100%)', $type: 'color' as const },
      gradientTerracotta: { $value: 'linear-gradient(180deg, #e8a882 0%, #A65D47 50%, #6b2d1a 100%)', $type: 'color' as const },
    },
    
    // Typography
    font: {
      family: {
        display: { $value: ['Playfair Display', 'Georgia', 'serif'], $type: 'fontFamily' as const },
        body: { $value: ['Jost', 'Inter', 'sans-serif'], $type: 'fontFamily' as const },
        mono: { $value: ['JetBrains Mono', 'Menlo', 'monospace'], $type: 'fontFamily' as const },
      },
      size: {
        xs: { $value: '11px', $type: 'dimension' as const },
        sm: { $value: '13px', $type: 'dimension' as const },
        base: { $value: '16px', $type: 'dimension' as const },
        lg: { $value: '18px', $type: 'dimension' as const },
        xl: { $value: '20px', $type: 'dimension' as const },
        '2xl': { $value: '24px', $type: 'dimension' as const },
        '3xl': { $value: '32px', $type: 'dimension' as const },
        '4xl': { $value: '40px', $type: 'dimension' as const },
        display: { $value: '48px', $type: 'dimension' as const },
        hero: { $value: '64px', $type: 'dimension' as const },
      },
      weight: {
        light: { $value: 300, $type: 'fontWeight' as const },
        regular: { $value: 400, $type: 'fontWeight' as const },
        medium: { $value: 500, $type: 'fontWeight' as const },
        semibold: { $value: 600, $type: 'fontWeight' as const },
        bold: { $value: 700, $type: 'fontWeight' as const },
      },
    },
    
    // Spacing (8pt grid)
    space: {
      '0': { $value: '0px', $type: 'dimension' as const },
      '1': { $value: '4px', $type: 'dimension' as const },
      '2': { $value: '8px', $type: 'dimension' as const },
      '3': { $value: '12px', $type: 'dimension' as const },
      '4': { $value: '16px', $type: 'dimension' as const },
      '5': { $value: '20px', $type: 'dimension' as const },
      '6': { $value: '24px', $type: 'dimension' as const },
      '8': { $value: '32px', $type: 'dimension' as const },
      '10': { $value: '40px', $type: 'dimension' as const },
      '12': { $value: '48px', $type: 'dimension' as const },
      '16': { $value: '64px', $type: 'dimension' as const },
      '20': { $value: '80px', $type: 'dimension' as const },
      '24': { $value: '96px', $type: 'dimension' as const },
    },
    
    // Border radius
    radius: {
      none: { $value: '0px', $type: 'dimension' as const },
      sm: { $value: '4px', $type: 'dimension' as const },
      md: { $value: '8px', $type: 'dimension' as const },
      lg: { $value: '12px', $type: 'dimension' as const },
      xl: { $value: '16px', $type: 'dimension' as const },
      '2xl': { $value: '24px', $type: 'dimension' as const },
      full: { $value: '9999px', $type: 'dimension' as const },
    },
    
    // Motion (from Master Blueprint)
    motion: {
      duration: {
        micro: { $value: '100ms', $type: 'duration' as const },
        fast: { $value: '150ms', $type: 'duration' as const },
        standard: { $value: '250ms', $type: 'duration' as const },
        slow: { $value: '400ms', $type: 'duration' as const },
        expressive: { $value: '500ms', $type: 'duration' as const },
        dramatic: { $value: '800ms', $type: 'duration' as const },
      },
      easing: {
        // Standard easings
        linear: { $value: [0, 0, 1, 1], $type: 'cubicBezier' as const },
        easeIn: { $value: [0.4, 0, 1, 1], $type: 'cubicBezier' as const },
        easeOut: { $value: [0, 0, 0.2, 1], $type: 'cubicBezier' as const },
        easeInOut: { $value: [0.4, 0, 0.2, 1], $type: 'cubicBezier' as const },
        
        // Cultural easings (from Master Blueprint)
        culturalZouk: { 
          $value: [0.4, 0.0, 0.2, 1], 
          $type: 'cubicBezier' as const,
          $description: 'Smooth, flowing movement like Zouk dance'
        },
        culturalAfrobeats: { 
          $value: [0.34, 1.56, 0.64, 1], 
          $type: 'cubicBezier' as const,
          $description: 'Bouncy, energetic movement'
        },
        culturalReggae: {
          $value: [0.25, 0.1, 0.25, 1],
          $type: 'cubicBezier' as const,
          $description: 'Laid-back, relaxed timing'
        },
        culturalSoca: {
          $value: [0.68, -0.55, 0.265, 1.55],
          $type: 'cubicBezier' as const,
          $description: 'High-energy carnival bounce'
        },
        culturalMbalax: {
          $value: [0.4, 0, 0.2, 1.2],
          $type: 'cubicBezier' as const,
          $description: 'Polyrhythmic pulse'
        },
        culturalKompa: {
          $value: [0.33, 0, 0.67, 1],
          $type: 'cubicBezier' as const,
          $description: 'Sensual, steady groove'
        },
      },
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CULTURAL PALETTES (from Master Blueprint)
// ══════════════════════════════════════════════════════════════════════════════

export interface CulturalPalette {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  textOnPrimary: string;
  surfaceTint: string;
}

export const CULTURAL_PALETTES: Record<string, CulturalPalette> = {
  // West Africa
  'afrique-ouest': {
    primary: '#8B4513',      // Terre ocre (Sahel)
    secondary: '#DAA520',    // Or (richesse culturelle)
    accent: '#228B22',       // Vert savane
    gradient: 'linear-gradient(135deg, #8B4513 0%, #DAA520 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(139, 69, 19, 0.1)',
  },
  
  // Caribbean
  'caraibes': {
    primary: '#00CED1',      // Turquoise (mer)
    secondary: '#FF69B4',    // Rose sunset
    accent: '#FFD700',       // Soleil
    gradient: 'linear-gradient(135deg, #00CED1 0%, #FF69B4 100%)',
    textOnPrimary: '#000000',
    surfaceTint: 'rgba(0, 206, 209, 0.1)',
  },
  
  // Martinique / Guadeloupe (Antilles Françaises)
  'antilles-francaises': {
    primary: '#E8A882',      // Terracotta (poterie)
    secondary: '#2E8B57',    // Vert forêt tropicale
    accent: '#FF4500',       // Flamboyant
    gradient: 'linear-gradient(135deg, #E8A882 0%, #2E8B57 100%)',
    textOnPrimary: '#1A1A24',
    surfaceTint: 'rgba(232, 168, 130, 0.1)',
  },
  
  // Haiti
  'haiti': {
    primary: '#00209F',      // Bleu (drapeau)
    secondary: '#D21034',    // Rouge (drapeau)
    accent: '#FFD700',       // Or (histoire)
    gradient: 'linear-gradient(135deg, #00209F 0%, #D21034 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 32, 159, 0.1)',
  },
  
  // Jamaica
  'jamaique': {
    primary: '#009B3A',      // Vert
    secondary: '#FED100',    // Jaune/Or
    accent: '#000000',       // Noir
    gradient: 'linear-gradient(135deg, #009B3A 0%, #FED100 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 155, 58, 0.1)',
  },
  
  // Nigeria / Afrobeats
  'nigeria': {
    primary: '#008751',      // Vert
    secondary: '#FFFFFF',    // Blanc
    accent: '#FFD700',       // Or (Lagos energy)
    gradient: 'linear-gradient(135deg, #008751 0%, #1A472A 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 135, 81, 0.1)',
  },
  
  // Senegal / Mbalax
  'senegal': {
    primary: '#00853F',      // Vert
    secondary: '#FDEF42',    // Jaune
    accent: '#E31B23',       // Rouge
    gradient: 'linear-gradient(135deg, #00853F 0%, #FDEF42 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 133, 63, 0.1)',
  },
  
  // Congo / Rumba
  'congo': {
    primary: '#007FFF',      // Bleu ciel
    secondary: '#CE1126',    // Rouge
    accent: '#F7D618',       // Jaune
    gradient: 'linear-gradient(135deg, #007FFF 0%, #CE1126 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 127, 255, 0.1)',
  },
  
  // Brazil
  'bresil': {
    primary: '#009C3B',      // Vert
    secondary: '#FFDF00',    // Jaune
    accent: '#002776',       // Bleu
    gradient: 'linear-gradient(135deg, #009C3B 0%, #FFDF00 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(0, 156, 59, 0.1)',
  },
  
  // Korea / K-Pop
  'coree': {
    primary: '#CD2E3A',      // Rouge traditionnel
    secondary: '#0047A0',    // Bleu
    accent: '#FFFFFF',       // Blanc
    gradient: 'linear-gradient(135deg, #CD2E3A 0%, #0047A0 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(205, 46, 58, 0.1)',
  },
  
  // India
  'inde': {
    primary: '#FF9933',      // Safran
    secondary: '#138808',    // Vert
    accent: '#FFFFFF',       // Blanc
    gradient: 'linear-gradient(135deg, #FF9933 0%, #138808 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(255, 153, 51, 0.1)',
  },
  
  // France / Diaspora Europe
  'france-diaspora': {
    primary: '#6B4EE6',      // Violet KORA
    secondary: '#D4A843',    // Or
    accent: '#E8A882',       // Terracotta
    gradient: 'linear-gradient(135deg, #6B4EE6 0%, #D4A843 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(107, 78, 230, 0.1)',
  },
  
  // UK / Grime & Afrobeats UK
  'uk-diaspora': {
    primary: '#1E1E2E',      // Noir urbain
    secondary: '#FF6B35',    // Orange énergie
    accent: '#7B68EE',       // Violet grime
    gradient: 'linear-gradient(135deg, #1E1E2E 0%, #FF6B35 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(30, 30, 46, 0.1)',
  },
  
  // USA / Hip-Hop & R&B
  'usa-diaspora': {
    primary: '#1A1A2E',      // Noir profond
    secondary: '#E94560',    // Rouge vif
    accent: '#0F3460',       // Bleu nuit
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #E94560 100%)',
    textOnPrimary: '#FFFFFF',
    surfaceTint: 'rgba(26, 26, 46, 0.1)',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CULTURAL MOTION TRANSITIONS (from Master Blueprint)
// ══════════════════════════════════════════════════════════════════════════════

export interface CulturalMotion {
  playlistTransition: {
    type: 'spring' | 'timing';
    stiffness?: number;
    damping?: number;
    mass?: number;
    duration?: number;
  };
  visualizerPattern: string;
  uiSoundBank: string;
}

export const CULTURAL_TRANSITIONS: Record<string, CulturalMotion> = {
  zouk: {
    // Fluidité ondulante - smooth wave-like movement
    playlistTransition: {
      type: 'spring',
      stiffness: 30,
      damping: 15,
      mass: 1.2,
    },
    visualizerPattern: 'wave_sine_slow',
    uiSoundBank: 'zouk_steeldrum',
  },
  
  afrobeats: {
    // Rythme syncopé - bouncy, energetic
    playlistTransition: {
      type: 'spring',
      stiffness: 80,
      damping: 10,
      mass: 0.8,
    },
    visualizerPattern: 'pulse_polyrhythm',
    uiSoundBank: 'afrobeats_percussion',
  },
  
  reggae: {
    // Laid-back, offbeat feel
    playlistTransition: {
      type: 'spring',
      stiffness: 25,
      damping: 20,
      mass: 1.5,
    },
    visualizerPattern: 'wave_offbeat',
    uiSoundBank: 'reggae_nyabinghi',
  },
  
  kompa: {
    // Sensual, steady groove
    playlistTransition: {
      type: 'spring',
      stiffness: 40,
      damping: 18,
      mass: 1.0,
    },
    visualizerPattern: 'pulse_steady',
    uiSoundBank: 'kompa_guitar',
  },
  
  soca: {
    // High-energy carnival
    playlistTransition: {
      type: 'spring',
      stiffness: 120,
      damping: 8,
      mass: 0.6,
    },
    visualizerPattern: 'burst_carnival',
    uiSoundBank: 'soca_steelpan',
  },
  
  mbalax: {
    // Polyrhythmic pulse
    playlistTransition: {
      type: 'spring',
      stiffness: 70,
      damping: 12,
      mass: 0.9,
    },
    visualizerPattern: 'pulse_sabar',
    uiSoundBank: 'mbalax_tama',
  },
  
  rumba: {
    // Flowing, circular
    playlistTransition: {
      type: 'spring',
      stiffness: 35,
      damping: 16,
      mass: 1.1,
    },
    visualizerPattern: 'wave_circular',
    uiSoundBank: 'rumba_congas',
  },
  
  kpop: {
    // Sharp, precise
    playlistTransition: {
      type: 'spring',
      stiffness: 100,
      damping: 14,
      mass: 0.7,
    },
    visualizerPattern: 'geometric_sharp',
    uiSoundBank: 'kpop_synth',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// TERRITORY TO CULTURE MAPPING
// ══════════════════════════════════════════════════════════════════════════════

export const TERRITORY_CULTURE_MAP: Record<string, { palette: string; motion: string }> = {
  // Caribbean
  'MQ': { palette: 'antilles-francaises', motion: 'zouk' },
  'GP': { palette: 'antilles-francaises', motion: 'zouk' },
  'HT': { palette: 'haiti', motion: 'kompa' },
  'JM': { palette: 'jamaique', motion: 'reggae' },
  'TT': { palette: 'caraibes', motion: 'soca' },
  'CU': { palette: 'caraibes', motion: 'rumba' },
  
  // West Africa
  'SN': { palette: 'senegal', motion: 'mbalax' },
  'CI': { palette: 'afrique-ouest', motion: 'afrobeats' },
  'NG': { palette: 'nigeria', motion: 'afrobeats' },
  'GH': { palette: 'afrique-ouest', motion: 'afrobeats' },
  'ML': { palette: 'afrique-ouest', motion: 'mbalax' },
  'BJ': { palette: 'afrique-ouest', motion: 'afrobeats' },
  
  // Central Africa
  'CD': { palette: 'congo', motion: 'rumba' },
  'CG': { palette: 'congo', motion: 'rumba' },
  'CM': { palette: 'afrique-ouest', motion: 'afrobeats' },
  
  // Diaspora
  'FR': { palette: 'france-diaspora', motion: 'zouk' },
  'GB': { palette: 'uk-diaspora', motion: 'afrobeats' },
  'US': { palette: 'usa-diaspora', motion: 'afrobeats' },
  'CA': { palette: 'france-diaspora', motion: 'kompa' },
  'BE': { palette: 'congo', motion: 'rumba' },
  
  // Latin America
  'BR': { palette: 'bresil', motion: 'soca' },
  
  // Asia
  'KR': { palette: 'coree', motion: 'kpop' },
  'JP': { palette: 'coree', motion: 'kpop' },
  'IN': { palette: 'inde', motion: 'afrobeats' },
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get cultural palette for a territory
 */
export function getCulturalPalette(territoryCode: string): CulturalPalette {
  const mapping = TERRITORY_CULTURE_MAP[territoryCode];
  if (mapping && CULTURAL_PALETTES[mapping.palette]) {
    return CULTURAL_PALETTES[mapping.palette];
  }
  // Default to KORA brand palette
  return CULTURAL_PALETTES['france-diaspora'];
}

/**
 * Get cultural motion config for a territory
 */
export function getCulturalMotion(territoryCode: string): CulturalMotion {
  const mapping = TERRITORY_CULTURE_MAP[territoryCode];
  if (mapping && CULTURAL_TRANSITIONS[mapping.motion]) {
    return CULTURAL_TRANSITIONS[mapping.motion];
  }
  // Default to zouk (smooth)
  return CULTURAL_TRANSITIONS['zouk'];
}

/**
 * Get easing curve for a genre
 */
export function getGenreEasing(genre: string): number[] {
  const genreToEasing: Record<string, keyof typeof KORA_TOKENS.kora.motion.easing> = {
    'zouk': 'culturalZouk',
    'afrobeats': 'culturalAfrobeats',
    'afrobeat': 'culturalAfrobeats',
    'reggae': 'culturalReggae',
    'soca': 'culturalSoca',
    'calypso': 'culturalSoca',
    'mbalax': 'culturalMbalax',
    'kompa': 'culturalKompa',
  };
  
  const easingKey = genreToEasing[genre.toLowerCase()] || 'easeInOut';
  const easing = KORA_TOKENS.kora.motion.easing[easingKey];
  return easing.$value as number[];
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

export default KORA_TOKENS;
