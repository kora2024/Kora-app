/**
 * KORA Streaming Types — Video + Live
 * 
 * Offre à 1,99€/mois
 */

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type ContentType = 'audio' | 'video' | 'live';
export type ContentFormat = 'flash' | 'regard' | 'recit' | 'oeuvre';

export interface KoraContent {
  id: string;
  type: ContentType;
  format: ContentFormat;
  
  // Creator
  creatorId: string;
  creatorName: string;
  territoryId: string;
  territoryName: string;
  
  // Media
  mediaUrl: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  
  // Metadata
  title: string;
  description?: string;
  tags: string[];
  
  // Stats
  views: number;
  likes: number;
  shares: number;
  
  // Timestamps
  createdAt: string;
  publishedAt?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE STREAM
// ══════════════════════════════════════════════════════════════════════════════

export type LiveStatus = 'offline' | 'starting' | 'live' | 'ending';

export interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  territoryId: string;
  territoryName: string;
  
  status: LiveStatus;
  title: string;
  thumbnailUrl?: string;
  
  // Stats (real-time)
  viewerCount: number;
  territoriesConnected: number;
  frekReceived: number;
  
  startedAt?: string;
  endedAt?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION
// ══════════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'kora_plus';

export interface Subscription {
  tier: SubscriptionTier;
  price: number; // 0 for free, 1.99 for plus
  features: string[];
  startDate?: string;
  endDate?: string;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, Subscription> = {
  free: {
    tier: 'free',
    price: 0,
    features: [
      'Éclats audio (2 min max)',
      'Globe et territoires',
      '5 ancrages max',
      'Publicités',
    ],
  },
  kora_plus: {
    tier: 'kora_plus',
    price: 1.99,
    features: [
      'Éclats audio illimités',
      'Éclats vidéo (Flash, Regard)',
      'Accès cinéma (Récit, Œuvre)',
      'Lives illimités',
      'Ancrages illimités',
      'Sans publicités',
      'Téléchargement hors-ligne',
      'Qualité HD',
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════

export const CONTENT_CATEGORIES = [
  { id: 'music', name: 'Musique', icon: '🎵' },
  { id: 'cinema', name: 'Cinéma', icon: '🎬' },
  { id: 'talk', name: 'Talk', icon: '🎙️' },
  { id: 'culture', name: 'Culture', icon: '🌍' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'cook', name: 'Cuisine', icon: '🍳' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'sport', name: 'Sport', icon: '⚽' },
];

// ══════════════════════════════════════════════════════════════════════════════
// FORMAT LIMITS
// ══════════════════════════════════════════════════════════════════════════════

export const FORMAT_LIMITS: Record<ContentFormat, { minSec: number; maxSec: number; premium: boolean }> = {
  flash: { minSec: 5, maxSec: 60, premium: false },      // 5s - 1min (gratuit)
  regard: { minSec: 60, maxSec: 300, premium: true },    // 1-5 min (premium)
  recit: { minSec: 300, maxSec: 1200, premium: true },   // 5-20 min (premium)
  oeuvre: { minSec: 1200, maxSec: 5400, premium: true }, // 20-90 min (premium)
};
