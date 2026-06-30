"""KORA Catalog Service — 100% Souverain MongoDB

Catalogue alimenté EXCLUSIVEMENT par les créateurs KORA.
Jamendo et APIs externes purgés — Souveraineté culturelle absolue.

Le contenu provient uniquement de la collection MongoDB "content".
"""
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)


class CatalogService:
    """Service de catalogue souverain — MongoDB only"""
    
    def __init__(self, db=None):
        self.db = db
        self.cache = {}
    
    def set_database(self, db):
        """Injecte la connexion database"""
        self.db = db
    
    async def search_all(self, query: str, limit: int = 20, media_type: str = 'all') -> Dict[str, Any]:
        """Recherche dans le catalogue souverain KORA"""
        if self.db is None:
            logger.error("Database non initialisée")
            return {'tracks': [], 'total': 0, 'sources': ['kora_organic']}
        
        # Construction de la requête MongoDB
        search_filter = {
            'status': 'published',
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'description': {'$regex': query, '$options': 'i'}},
                {'creator_id': {'$regex': query, '$options': 'i'}},
                {'genres': {'$regex': query, '$options': 'i'}},
            ]
        }
        
        if media_type != 'all':
            search_filter['type'] = media_type
        
        cursor = self.db.content.find(search_filter).sort('created_at', -1).limit(limit)
        tracks = await cursor.to_list(length=limit)
        
        return {
            'tracks': await self._transform_kora_tracks_async(tracks),
            'total': len(tracks),
            'sources': ['kora_organic']
        }
    
    async def get_featured_tracks(self, limit: int = 20) -> List[Dict]:
        """Récupère les tracks populaires du catalogue souverain"""
        if self.db is None:
            return []
        
        # Tri par play_count décroissant (popularité)
        cursor = self.db.content.find(
            {'status': 'published'}
        ).sort([
            ('play_count', -1),
            ('created_at', -1)
        ]).limit(limit)
        
        tracks = await cursor.to_list(length=limit)
        return await self._transform_kora_tracks_async(tracks)
    
    async def get_tracks_by_genre(self, genre: str, limit: int = 20) -> List[Dict]:
        """Récupère les tracks par genre/tags"""
        if self.db is None:
            return []
        
        # Recherche dans les genres (peut être séparé par virgules)
        genre_tags = [g.strip().lower() for g in genre.split(',')]
        
        cursor = self.db.content.find({
            'status': 'published',
            '$or': [
                {'genres': {'$in': genre_tags}},
                {'territory': {'$in': genre_tags}},
                {'category': {'$in': genre_tags}},
            ]
        }).sort('created_at', -1).limit(limit)
        
        tracks = await cursor.to_list(length=limit)
        return await self._transform_kora_tracks_async(tracks)
    
    async def get_territory_catalog(self, territory: str, limit: int = 20) -> List[Dict]:
        """Récupère le catalogue par territoire — 100% MongoDB souverain"""
        if self.db is None:
            return []
        
        cursor = self.db.content.find({
            'territory': territory.lower(),
            'status': 'published'
        }).sort('created_at', -1).limit(limit)
        
        tracks = await cursor.to_list(length=limit)
        return await self._transform_kora_tracks_async(tracks)
    
    async def get_track_details(self, track_id: str, source: str = 'kora') -> Optional[Dict]:
        """Obtient les détails d'un track avec URL de streaming"""
        if self.db is None:
            return None
        
        try:
            # Recherche dans MongoDB
            track = await self.db.content.find_one({
                '_id': ObjectId(track_id),
                'status': 'published'
            })
            
            if not track:
                # Essayer avec l'ID comme string
                track = await self.db.content.find_one({
                    '_id': track_id,
                    'status': 'published'
                })
            
            if track:
                return {
                    'id': str(track['_id']),
                    'title': track.get('title', 'Sans titre'),
                    'artist': track.get('creator_id', 'Artiste KORA'),
                    'album': track.get('category', ''),
                    'duration': track.get('duration', 0),
                    'stream_url': track.get('media_url', ''),
                    'artwork': track.get('artwork_url', ''),
                    'source': 'kora_organic',
                    'license': 'KORA Souverain',
                    'genres': track.get('genres', []),
                    'territory': track.get('territory', 'world'),
                    'cultural_signature': track.get('cultural_signature', ''),
                    'play_count': track.get('play_count', 0),
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur récupération track: {e}")
            return None
    
    async def _resolve_artist_name(self, creator_id: str) -> str:
        """Résout le nom d'artiste depuis creator_id ou frek_id"""
        if not creator_id or self.db is None:
            return 'Artiste KORA'
        
        # Si c'est déjà un FREK-ID style (FRK-xxx), le garder tel quel pour les demo
        if creator_id.startswith('FRK-'):
            return creator_id
        
        try:
            # Chercher par _id (UUID)
            user = await self.db.users.find_one({'_id': creator_id})
            if user:
                return user.get('display_name', user.get('frek_id', 'Artiste KORA'))
            
            # Chercher par frek_id
            user = await self.db.users.find_one({'frek_id': creator_id})
            if user:
                return user.get('display_name', creator_id)
            
            return creator_id
        except Exception as e:
            logger.warning(f"Erreur résolution artiste: {e}")
            return creator_id
    
    async def _transform_kora_tracks_async(self, tracks: List[Dict]) -> List[Dict]:
        """Transforme les tracks MongoDB au format API KORA avec résolution des noms"""
        result = []
        for track in tracks:
            creator_id = track.get('creator_id', '')
            artist_name = await self._resolve_artist_name(creator_id)
            
            result.append({
                'id': str(track['_id']),
                'title': track.get('title', 'Sans titre'),
                'artist': artist_name,
                'album': track.get('category', ''),
                'duration': track.get('duration', 0),
                'stream_url': track.get('media_url', ''),
                'artwork': track.get('artwork_url', ''),
                'source': 'kora_organic',
                'type': track.get('type', 'audio'),
                'playable': bool(track.get('media_url')),
                'territory': track.get('territory', 'world'),
                'cultural_signature': track.get('cultural_signature', ''),
                'play_count': track.get('play_count', 0),
            })
        return result
    
    def _transform_kora_tracks(self, tracks: List[Dict]) -> List[Dict]:
        """Transforme les tracks MongoDB au format API KORA (sync fallback)"""
        result = []
        for track in tracks:
            creator_id = track.get('creator_id', '')
            # Fallback sync: garder le creator_id si pas FREK-ID
            artist_name = creator_id if creator_id.startswith('FRK-') else creator_id
            
            result.append({
                'id': str(track['_id']),
                'title': track.get('title', 'Sans titre'),
                'artist': artist_name,
                'album': track.get('category', ''),
                'duration': track.get('duration', 0),
                'stream_url': track.get('media_url', ''),
                'artwork': track.get('artwork_url', ''),
                'source': 'kora_organic',
                'type': track.get('type', 'audio'),
                'playable': bool(track.get('media_url')),
                'territory': track.get('territory', 'world'),
                'cultural_signature': track.get('cultural_signature', ''),
                'play_count': track.get('play_count', 0),
            })
        return result


# Instance globale — sera initialisée avec la DB dans server.py
catalog_service = CatalogService()
