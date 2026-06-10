/**
 * KORA Content Charter — Pacte Souverain
 * 
 * Validation automatique du règlement pour protéger l'espace diaspora
 * contre le spam, les clashs et le démarchage sauvage.
 */

// ══════════════════════════════════════════════════════════════════════════════
// TERRITORIES
// ══════════════════════════════════════════════════════════════════════════════

export const KORA_TERRITORIES = ['caribbean', 'africa', 'diaspora', 'latin', 'world'] as const;
export type KoraTerritory = typeof KORA_TERRITORIES[number];

// ══════════════════════════════════════════════════════════════════════════════
// SACRED WORDS — Mots qui déclenchent une célébration visuelle
// ══════════════════════════════════════════════════════════════════════════════

export const SACRED_WORDS = [
  'souverain', 'ancêtres', 'territoire', 'noyau', 'éveil', 'fraternité',
  'diaspora', 'racines', 'mémoire', 'transmission', 'héritage', 'culture',
  'unité', 'fierté', 'respect', 'sagesse', 'ancrage', 'partage'
] as const;

// ══════════════════════════════════════════════════════════════════════════════
// BANNED KEYWORDS — Liste noire anti-spam / anti-clash
// ══════════════════════════════════════════════════════════════════════════════

export const BANNED_KEYWORDS = [
  // Spam & Démarchage
  'crypto pump', 'telegram group', 'follow me back', 'gagnez de l\'argent',
  'bénéfices garantis', 'whatsapp contact', 'cliquez ici', 'argent facile',
  'revenus passifs', 'mlm', 'investissement garanti', 'trading signal',
  'rejoignez mon groupe', 'lien dans ma bio', 'dm me', 'message privé',
  'opportunité en or', 'devenir riche', 'bitcoin gratuit', 'airdrop',
  
  // Clashs & Toxicité
  'traître', 'bounty', 'vendu', 'esclave', 'colonisé', 'blédard',
  'retourne chez toi', 'singe', 'nègre', 'sale',
  
  // Contenu inapproprié
  'nudes', 'onlyfans', 'xxx', 'porn', 'escort',
  
  // Violence
  'tuer', 'assassiner', 'bombe', 'attentat', 'terroriste'
] as const;

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export interface CharteValidationResult {
  isValid: boolean;
  reason?: string;
  detectedKeyword?: string;
  hasSacredWords?: boolean;
  sacredWordsFound?: string[];
}

/**
 * Valide si le texte soumis respecte la charte culturelle KORA
 */
export function validateContentCharte(text: string): CharteValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }
  
  const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Vérifier les mots interdits
  for (const keyword of BANNED_KEYWORDS) {
    const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lowerText.includes(normalizedKeyword)) {
      return {
        isValid: false,
        reason: "Votre publication contient des termes assimilés à du démarchage ou des éléments contraires au Pacte Kora.",
        detectedKeyword: keyword
      };
    }
  }
  
  // Vérifier les mots sacrés (pour effet visuel positif)
  const sacredWordsFound: string[] = [];
  for (const word of SACRED_WORDS) {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lowerText.includes(normalizedWord)) {
      sacredWordsFound.push(word);
    }
  }
  
  return {
    isValid: true,
    hasSacredWords: sacredWordsFound.length > 0,
    sacredWordsFound
  };
}

/**
 * Valide un titre (plus strict)
 */
export function validateTitle(title: string): CharteValidationResult {
  if (!title || title.length < 3) {
    return { isValid: false, reason: "Le titre doit contenir au moins 3 caractères." };
  }
  if (title.length > 100) {
    return { isValid: false, reason: "Le titre ne peut pas dépasser 100 caractères." };
  }
  return validateContentCharte(title);
}

/**
 * Valide une description
 */
export function validateDescription(description: string): CharteValidationResult {
  if (description && description.length > 2000) {
    return { isValid: false, reason: "La description ne peut pas dépasser 2000 caractères." };
  }
  return validateContentCharte(description);
}

// ══════════════════════════════════════════════════════════════════════════════
// REPUTATION SYSTEM TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type RoleCulturel = 'nouveau' | 'membre' | 'confirme' | 'veilleur' | 'ancien';

export interface UserReputation {
  sagesseScore: number;
  roleCulturel: RoleCulturel;
  strikeCount: number;
  contentApproved: number;
  reportsReceived: number;
  reportsMade: number;
}

/**
 * Calcule le rôle culturel basé sur le score de sagesse
 */
export function calculateRoleCulturel(sagesseScore: number, strikeCount: number): RoleCulturel {
  // Sanctions : strikes réduisent le rôle
  if (strikeCount >= 3) return 'nouveau'; // Compte restreint
  if (strikeCount >= 2 && sagesseScore < 100) return 'nouveau';
  
  // Progression basée sur le score
  if (sagesseScore >= 500) return 'ancien';
  if (sagesseScore >= 200) return 'veilleur';
  if (sagesseScore >= 100) return 'confirme';
  if (sagesseScore >= 25) return 'membre';
  return 'nouveau';
}

/**
 * Vérifie si le contenu doit être auto-approuvé
 */
export function shouldAutoApprove(reputation: UserReputation): boolean {
  // Les Veilleurs et Anciens ont l'auto-approbation
  if (reputation.roleCulturel === 'veilleur' || reputation.roleCulturel === 'ancien') {
    return reputation.strikeCount < 2;
  }
  // Les Confirmés avec bon historique aussi
  if (reputation.roleCulturel === 'confirme' && reputation.sagesseScore >= 150) {
    return reputation.strikeCount === 0 && reputation.reportsReceived < 3;
  }
  return false;
}

/**
 * Calcule le poids d'un signalement basé sur le rôle
 */
export function calculateReportWeight(roleCulturel: RoleCulturel): number {
  switch (roleCulturel) {
    case 'ancien': return 4;
    case 'veilleur': return 3;
    case 'confirme': return 2;
    case 'membre': return 1;
    case 'nouveau':
    default: return 0.5;
  }
}
