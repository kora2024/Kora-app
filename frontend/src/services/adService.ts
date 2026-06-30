/**
 * KORA Ad Service — Monetization via Interstitial & Rewarded Ads
 * 
 * Business Logic:
 * - Premium users (stripe_status = 'active'): Skip all ads
 * - Free users: Show interstitial before playback
 * - Rewarded ads: Optional, grants 30-min ad-free session
 * 
 * Uses Google AdMob test IDs for development
 */

import { Platform } from 'react-native';

// ══════════════════════════════════════════════════════════════════════════════
// AD UNIT IDS — Test IDs for Development
// ══════════════════════════════════════════════════════════════════════════════

// Google's official test ad unit IDs (safe for development)
export const AD_UNIT_IDS = {
  interstitial: Platform.select({
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }),
  rewarded: Platform.select({
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }),
  banner: Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }),
};

// ══════════════════════════════════════════════════════════════════════════════
// AD GATING TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface AdGatingResult {
  mustShowAd: boolean;
  isPremium: boolean;
  hasAdFreeSession: boolean;
  adFreeUntil?: string;
  reason: string;
}

export interface AdRewardResult {
  success: boolean;
  reward: {
    type: string;
    amount: number;
  } | null;
  adFreeUntil?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// AD GATING SERVICE
// ══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

/**
 * Check if user should see ads before playback
 */
export async function checkAdGating(userId?: string): Promise<AdGatingResult> {
  try {
    // If no user ID, always show ads (anonymous user)
    if (!userId) {
      return {
        mustShowAd: true,
        isPremium: false,
        hasAdFreeSession: false,
        reason: 'anonymous_user',
      };
    }

    const response = await fetch(`${API_BASE}/api/ads/check-gating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      // Default to showing ads if API fails
      return {
        mustShowAd: true,
        isPremium: false,
        hasAdFreeSession: false,
        reason: 'api_error',
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Ad gating check failed:', error);
    return {
      mustShowAd: true,
      isPremium: false,
      hasAdFreeSession: false,
      reason: 'network_error',
    };
  }
}

/**
 * Record that user watched a rewarded ad and grant ad-free session
 */
export async function recordRewardedAdWatch(userId: string): Promise<AdRewardResult> {
  try {
    const response = await fetch(`${API_BASE}/api/ads/reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId,
        reward_type: 'ad_free_session',
        duration_minutes: 30,
      }),
    });

    if (!response.ok) {
      return { success: false, reward: null };
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to record rewarded ad:', error);
    return { success: false, reward: null };
  }
}

/**
 * Track ad impression for analytics
 */
export async function trackAdImpression(data: {
  userId?: string;
  adType: 'interstitial' | 'rewarded' | 'banner';
  contentId?: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/ads/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.userId,
        ad_type: data.adType,
        content_id: data.contentId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Silent fail for analytics
    console.warn('Ad impression tracking failed:', error);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LOCAL AD-FREE SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

let localAdFreeUntil: Date | null = null;

/**
 * Check if user has a local ad-free session (for offline support)
 */
export function hasLocalAdFreeSession(): boolean {
  if (!localAdFreeUntil) return false;
  return new Date() < localAdFreeUntil;
}

/**
 * Set local ad-free session after watching rewarded ad
 */
export function setLocalAdFreeSession(minutes: number = 30): void {
  localAdFreeUntil = new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Get remaining ad-free time in minutes
 */
export function getRemainingAdFreeMinutes(): number {
  if (!localAdFreeUntil) return 0;
  const remaining = localAdFreeUntil.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 60000));
}
