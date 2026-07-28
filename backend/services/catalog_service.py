"""KORA Catalog Service — 100% Souverain MongoDB

Catalogue alimenté par:
1. Collection "works" — FrekCore Ingestion Pipeline (priorité)
2. Collection "content" — Créateurs self-serve (fallback)

Architecture: Source → FrekCore → Works → KORA Catalog → Frontend
"""
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)


class CatalogService:
    """Service de catalogue souverain — MongoDB (works + content)"""
    
    def __init__(self, db=None):
        self.db = db
        self.cache = {}
    
    def set_database(self, db):
        """Injecte la connexion database"""
        self.db = db
    
    async def search_all(self, query: str, limit: int = 20, media_type: str = 'all') -> Dict[str, Any]:
        """Recherche dans le catalogue souverain KORA (works + content)"""
        if self.db is None:
            logger.error("Database non initialisée")
            return {'tracks': [], 'total': 0, 'sources': ['kora_organic']}
        
        results = []
        
        # 1. Recherche dans works (FrekCore ingestion)
        works_filter = {
            'status': 'validated',
            'visibility': 'public',
            '$or': [
                {'title': {'$regex': query, '$options': 'i'}},
                {'description': {'$regex': query, '$options': 'i'}},
                {'display_artist': {'$regex': query, '$options': 'i'}},
                {'genres': {'$regex': query, '$options': 'i'}},
            ]
        }
        
        if media_type != 'all':
            if media_type == 'audio':
                works_filter['type'] = 'music'
            elif media_type == 'video':
                works_filter['type'] = {'$in': ['audiovisual_catalog', 'audiovisual_creator']}
        
        works_cursor = self.db.works.find(works_filter).sort('play_count', -1).limit(limit)
        works = await works_cursor.to_list(length=limit)
        results.extend(await self._transform_works_async(works))
        
        # 2. Si pas assez de résultats, chercher dans content (legacy)
        if len(results) < limit:
            content_filter = {
                'status': 'published',
                '$or': [
                    {'title': {'$regex': query, '$options': 'i'}},
                    {'description': {'$regex': query, '$options': 'i'}},
                    {'creator_id': {'$regex': query, '$options': 'i'}},
                    {'genres': {'$regex': query, '$options': 'i'}},
                ]
            }
            
            if media_type != 'all':
                content_filter['type'] = media_type
            
            content_cursor = self.db.content.find(content_filter).sort('created_at', -1).limit(limit - len(results))
            content = await content_cursor.to_list(length=limit - len(results))
            results.extend(await self._transform_kora_tracks_async(content))
        
        return {
            'tracks': results[:limit],
            'total': len(results),
            'sources': ['kora_works', 'kora_content']
        }
    
    async def get_featured_tracks(self, limit: int = 20) -> List[Dict]:
        """Récupère les tracks populaires (works prioritaire, fallback content)"""
        if self.db is None:
            return []
        
        results = []
        
        # 1. D'abord les works validés (catalogue vivant FrekCore)
        works_cursor = self.db.works.find({
            'status': 'validated',
            'visibility': 'public',
        }).sort([
            ('play_count', -1),
            ('published_at', -1)
        ]).limit(limit)
        
        works = await works_cursor.to_list(length=limit)
        results.extend(await self._transform_works_async(works))
        
        # 2. Si pas assez, fallback sur content
        if len(results) < limit:
            content_cursor = self.db.content.find(
                {'status': 'published'}
            ).sort([
                ('play_count', -1),
                ('created_at', -1)
            ]).limit(limit - len(results))
            
            content = await content_cursor.to_list(length=limit - len(results))
            results.extend(await self._transform_kora_tracks_async(content))
        
        return results[:limit]
    
    async def _transform_works_async(self, works: List[Dict]) -> List[Dict]:
        """Transforme les works FrekCore au format API KORA"""
        result = []
        for work in works:
            result.append({
                'id': work.get('work_id') or str(work.get('_id')),
                'title': work.get('title', 'Sans titre'),
                'artist': work.get('display_artist', 'Artiste KORA'),
                'album': work.get('release_ref', ''),
                'duration': work.get('duration_seconds', 0),
                'stream_url': work.get('audio_url', ''),
                'artwork': work.get('artwork_url', ''),
                'source': work.get('ingestion_source', 'kora'),
                'type': 'video' if work.get('type') in ['audiovisual_catalog', 'audiovisual_creator'] else 'audio',
                'playable': bool(work.get('audio_url') or work.get('video_url')),
                'territory': work.get('territories_origin', ['world'])[0] if work.get('territories_origin') else 'world',
                'cultural_signature': work.get('frekcore_ref', ''),
                'play_count': work.get('play_count', 0),
                'genres': work.get('genres', []),
                'frekcore_ref': work.get('frekcore_ref'),
            })
        return result
    
    async def get_tracks_by_genre(self, genre: str, limit: int = 20) -> List[Dict]:
        """Récupère les tracks par genre/tags (works + content)"""
        if self.db is None:
            return []
        
        genre_tags = [g.strip().lower() for g in genre.split(',')]
        results = []
        
        # 1. Works collection (FrekCore)
        works_cursor = self.db.works.find({
            'status': 'validated',
            'visibility': 'public',
            'genres': {'$regex': '|'.join(genre_tags), '$options': 'i'}
        }).sort('play_count', -1).limit(limit)
        
        works = await works_cursor.to_list(length=limit)
        results.extend(await self._transform_works_async(works))
        
        # 2. Content collection (legacy)
        if len(results) < limit:
            content_cursor = self.db.content.find({
                'status': 'published',
                '$or': [
                    {'genres': {'$in': genre_tags}},
                    {'territory': {'$in': genre_tags}},
                    {'category': {'$in': genre_tags}},
                ]
            }).sort('created_at', -1).limit(limit - len(results))
            
            content = await content_cursor.to_list(length=limit - len(results))
            results.extend(await self._transform_kora_tracks_async(content))
        
        return results[:limit]
    
    async def get_territory_catalog(self, territory: str, limit: int = 20) -> List[Dict]:
        """Récupère le catalogue par territoire (works + content)"""
        if self.db is None:
            return []
        
        results = []
        
        # 1. Works collection (FrekCore)
        works_cursor = self.db.works.find({
            'status': 'validated',
            'visibility': 'public',
            'territories_origin': territory.upper()
        }).sort('play_count', -1).limit(limit)
        
        works = await works_cursor.to_list(length=limit)
        results.extend(await self._transform_works_async(works))
        
        # 2. Content collection (legacy)
        if len(results) < limit:
            content_cursor = self.db.content.find({
                'territory': territory.lower(),
                'status': 'published'
            }).sort('created_at', -1).limit(limit - len(results))
            
            content = await content_cursor.to_list(length=limit - len(results))
            results.extend(await self._transform_kora_tracks_async(content))
        
        return results[:limit]
    
    async def get_track_details(self, track_id: str, source: str = 'kora') -> Optional[Dict]:
        """Obtient les détails d'un track avec URL de streaming (works + content)"""
        if self.db is None:
            return None
        
        try:
            # 1. Chercher dans works (FrekCore)
            work = await self.db.works.find_one({
                '$or': [
                    {'work_id': track_id},
                    {'id': track_id},
                ]
            })
            
            if work:
                return {
                    'id': work.get('work_id') or str(work.get('_id')),
                    'title': work.get('title', 'Sans titre'),
                    'artist': work.get('display_artist', 'Artiste KORA'),
                    'album': work.get('release_ref', ''),
                    'duration': work.get('duration_seconds', 0),
                    'stream_url': work.get('audio_url') or work.get('video_url', ''),
                    'artwork': work.get('artwork_url', ''),
                    'source': work.get('ingestion_source', 'kora'),
                    'license': 'KORA Souverain',
                    'genres': work.get('genres', []),
                    'territory': work.get('territories_origin', ['world'])[0] if work.get('territories_origin') else 'world',
                    'cultural_signature': work.get('frekcore_ref', ''),
                    'play_count': work.get('play_count', 0),
                    'frekcore_ref': work.get('frekcore_ref'),
                    'type': work.get('type'),
                }
            
            # 2. Chercher dans content (legacy)
            track = await self.db.content.find_one({
                '_id': ObjectId(track_id) if ObjectId.is_valid(track_id) else track_id,
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
