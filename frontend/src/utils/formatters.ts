/**
 * KORA Formatters — Utility functions for data display
 */

/**
 * Format artist name by removing technical prefixes
 * Converts "FRK-KORADEMO01" -> "KORA Collective"
 */
export function formatArtistName(artist: string | undefined | null): string {
  if (!artist) return 'KORA Collective';
  
  // Remove common technical prefixes
  const cleaned = artist
    .replace(/^FRK-KORADEMO\d*/gi, '')
    .replace(/^FRK-/gi, '')
    .replace(/^KORA-/gi, '')
    .replace(/^DEMO-/gi, '')
    .replace(/^TEST-/gi, '')
    .trim();
  
  return cleaned || 'KORA Collective';
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format number with French locale (spaces as thousand separators)
 */
export function formatNumber(num: number | undefined): string {
  if (!num) return '0';
  return num.toLocaleString('fr-FR');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}
