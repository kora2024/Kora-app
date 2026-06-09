/**
 * KORA Catalog Service - API client pour le catalogue musical mondial
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  stream_url: string;
  artwork: string;
  source: 'jamendo' | 'archive' | 'creator';
  type: 'audio' | 'video';
  playable: boolean;
  territory: string;
}

export interface Territory {
  id: string;
  name: string;
  tags: string[];
}

export interface CatalogSearchResult {
  tracks: Track[];
  total: number;
  sources: string[];
}

class CatalogService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE}/api/catalog`;
  }

  /**
   * Recherche dans tous les catalogues
   */
  async search(query: string, limit: number = 20, mediaType: 'all' | 'audio' | 'video' = 'all'): Promise<CatalogSearchResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}&media_type=${mediaType}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Catalog search error:', error);
      return { tracks: [], total: 0, sources: [] };
    }
  }

  /**
   * Récupère les tracks populaires
   */
  async getFeatured(limit: number = 20): Promise<Track[]> {
    try {
      const response = await fetch(`${this.baseUrl}/featured?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Featured tracks error:', error);
      return [];
    }
  }

  /**
   * Récupère les tracks par territoire
   */
  async getByTerritory(territory: string, limit: number = 20): Promise<Track[]> {
    try {
      const response = await fetch(`${this.baseUrl}/territory/${territory}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Territory tracks error:', error);
      return [];
    }
  }

  /**
   * Récupère les détails d'un track avec URL de streaming
   */
  async getTrackDetails(trackId: string, source: string): Promise<Track | null> {
    try {
      const response = await fetch(`${this.baseUrl}/track/${source}/${trackId}`);
      
      if (!response.ok) {
        throw new Error('Track non trouvé');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Track details error:', error);
      return null;
    }
  }

  /**
   * Récupère la liste des territoires/genres
   */
  async getGenres(): Promise<{ territories: Territory[]; categories: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/genres`);
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Genres error:', error);
      return { territories: [], categories: [] };
    }
  }
}

export const catalogService = new CatalogService();
export default catalogService;
