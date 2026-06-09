"""KORA Catalog Service - Agrège Jamendo, Internet Archive, et contenu local"""
import aiohttp
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

# API Keys
JAMENDO_CLIENT_ID = os.environ.get('JAMENDO_CLIENT_ID', 'demo')

class CatalogService:
    """Service unifié pour accéder aux catalogues musicaux mondiaux"""
    
    def __init__(self):
        self.jamendo_base = "https://api.jamendo.com/v3.0"
        self.archive_base = "https://archive.org"
        self.cache = {}  # Simple cache en mémoire
    
    async def search_all(self, query: str, limit: int = 20, media_type: str = 'all') -> Dict[str, Any]:
        """Recherche dans tous les catalogues"""
        tasks = []
        
        if media_type in ['all', 'audio']:
            tasks.append(self.search_jamendo(query, limit))
            tasks.append(self.search_archive_audio(query, limit))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        combined = []
        for result in results:
            if isinstance(result, list):
                combined.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Catalog search error: {result}")
        
        return {
            'tracks': combined[:limit],
            'total': len(combined),
            'sources': ['jamendo', 'internet_archive']
        }
    
    async def search_jamendo(self, query: str, limit: int = 20) -> List[Dict]:
        """Recherche dans le catalogue Jamendo (musique libre)"""
        try:
            url = f"{self.jamendo_base}/tracks/"
            params = {
                'client_id': JAMENDO_CLIENT_ID,
                'format': 'json',
                'limit': limit,
                'search': query,
                'include': 'musicinfo+licenses',
                'audioformat': 'mp32',
                'imagesize': 400
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return self._transform_jamendo_tracks(data.get('results', []))
                    else:
                        logger.warning(f"Jamendo API error: {resp.status}")
                        return []
        except Exception as e:
            logger.error(f"Jamendo search error: {e}")
            return []
    
    async def search_archive_audio(self, query: str, limit: int = 20) -> List[Dict]:
        """Recherche dans Internet Archive (audio libre)"""
        try:
            url = f"{self.archive_base}/advancedsearch.php"
            params = {
                'q': f'{query} AND mediatype:audio',
                'fl[]': ['identifier', 'title', 'creator', 'description', 'date', 'downloads'],
                'sort[]': 'downloads desc',
                'rows': limit,
                'page': 1,
                'output': 'json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        docs = data.get('response', {}).get('docs', [])
                        return self._transform_archive_tracks(docs)
                    else:
                        logger.warning(f"Archive API error: {resp.status}")
                        return []
        except Exception as e:
            logger.error(f"Archive search error: {e}")
            return []
    
    async def get_track_details(self, track_id: str, source: str) -> Optional[Dict]:
        """Obtient les détails d'un track avec URL de streaming"""
        if source == 'jamendo':
            return await self._get_jamendo_track(track_id)
        elif source == 'archive':
            return await self._get_archive_track(track_id)
        return None
    
    async def _get_jamendo_track(self, track_id: str) -> Optional[Dict]:
        """Détails d'un track Jamendo avec URL de streaming"""
        try:
            url = f"{self.jamendo_base}/tracks/"
            params = {
                'client_id': JAMENDO_CLIENT_ID,
                'format': 'json',
                'id': track_id,
                'include': 'musicinfo+licenses',
                'audioformat': 'mp32'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        results = data.get('results', [])
                        if results:
                            track = results[0]
                            return {
                                'id': track['id'],
                                'title': track['name'],
                                'artist': track['artist_name'],
                                'album': track.get('album_name', ''),
                                'duration': int(track.get('duration', 0)),
                                'stream_url': track.get('audio', ''),
                                'artwork': track.get('album_image', track.get('image', '')),
                                'source': 'jamendo',
                                'license': track.get('license_ccurl', 'CC'),
                                'genres': track.get('musicinfo', {}).get('tags', {}).get('genres', [])
                            }
            return None
        except Exception as e:
            logger.error(f"Jamendo track fetch error: {e}")
            return None
    
    async def _get_archive_track(self, identifier: str) -> Optional[Dict]:
        """Détails d'un item Internet Archive avec URL de streaming"""
        try:
            url = f"{self.archive_base}/metadata/{identifier}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        metadata = data.get('metadata', {})
                        files = data.get('files', [])
                        
                        # Trouver le fichier audio principal
                        audio_file = None
                        for f in files:
                            if f.get('format', '').lower() in ['mp3', 'vbr mp3', '128kbps mp3', 'ogg vorbis']:
                                audio_file = f
                                break
                        
                        if audio_file:
                            return {
                                'id': identifier,
                                'title': metadata.get('title', identifier),
                                'artist': metadata.get('creator', metadata.get('artist', 'Unknown')),
                                'album': metadata.get('album', ''),
                                'duration': 0,  # Non disponible directement
                                'stream_url': f"https://archive.org/download/{identifier}/{audio_file.get('name', '')}",
                                'artwork': f"https://archive.org/services/img/{identifier}",
                                'source': 'archive',
                                'license': 'Public Domain / CC',
                                'genres': [metadata.get('subject', 'Music')] if metadata.get('subject') else []
                            }
            return None
        except Exception as e:
            logger.error(f"Archive track fetch error: {e}")
            return None
    
    async def get_featured_tracks(self, limit: int = 20) -> List[Dict]:
        """Obtient les tracks populaires/recommandés"""
        try:
            url = f"{self.jamendo_base}/tracks/"
            params = {
                'client_id': JAMENDO_CLIENT_ID,
                'format': 'json',
                'limit': limit,
                'order': 'popularity_week',
                'include': 'musicinfo',
                'audioformat': 'mp32',
                'imagesize': 400
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return self._transform_jamendo_tracks(data.get('results', []))
                    return []
        except Exception as e:
            logger.error(f"Featured tracks error: {e}")
            return []
    
    async def get_tracks_by_genre(self, genre: str, limit: int = 20) -> List[Dict]:
        """Obtient les tracks par genre/territoire"""
        try:
            url = f"{self.jamendo_base}/tracks/"
            params = {
                'client_id': JAMENDO_CLIENT_ID,
                'format': 'json',
                'limit': limit,
                'tags': genre.lower(),
                'include': 'musicinfo',
                'audioformat': 'mp32',
                'imagesize': 400
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return self._transform_jamendo_tracks(data.get('results', []))
                    return []
        except Exception as e:
            logger.error(f"Genre tracks error: {e}")
            return []
    
    def _transform_jamendo_tracks(self, tracks: List[Dict]) -> List[Dict]:
        """Transforme les tracks Jamendo au format KORA"""
        result = []
        for track in tracks:
            result.append({
                'id': str(track['id']),
                'title': track['name'],
                'artist': track['artist_name'],
                'album': track.get('album_name', ''),
                'duration': int(track.get('duration', 0)),
                'stream_url': track.get('audio', ''),
                'artwork': track.get('album_image', track.get('image', '')),
                'source': 'jamendo',
                'type': 'audio',
                'playable': True,
                'territory': self._detect_territory(track)
            })
        return result
    
    def _transform_archive_tracks(self, docs: List[Dict]) -> List[Dict]:
        """Transforme les items Archive au format KORA"""
        result = []
        for doc in docs:
            result.append({
                'id': doc['identifier'],
                'title': doc.get('title', doc['identifier']),
                'artist': doc.get('creator', 'Unknown'),
                'album': '',
                'duration': 0,
                'stream_url': '',  # À récupérer via get_track_details
                'artwork': f"https://archive.org/services/img/{doc['identifier']}",
                'source': 'archive',
                'type': 'audio',
                'playable': True,
                'territory': 'world'
            })
        return result
    
    def _detect_territory(self, track: Dict) -> str:
        """Détecte le territoire/genre principal d'un track"""
        tags = track.get('musicinfo', {}).get('tags', {}).get('genres', [])
        
        # Mapping genres vers territoires KORA
        territory_map = {
            'reggae': 'caribbean',
            'dancehall': 'caribbean',
            'soca': 'caribbean',
            'calypso': 'caribbean',
            'afrobeat': 'africa',
            'afropop': 'africa',
            'highlife': 'africa',
            'soukous': 'africa',
            'hip hop': 'diaspora',
            'r&b': 'diaspora',
            'soul': 'diaspora',
            'jazz': 'diaspora',
            'blues': 'diaspora',
            'gospel': 'diaspora',
            'latin': 'latin',
            'salsa': 'latin',
            'bachata': 'latin',
            'merengue': 'latin'
        }
        
        for tag in tags:
            tag_lower = tag.lower()
            for genre, territory in territory_map.items():
                if genre in tag_lower:
                    return territory
        
        return 'world'


# Instance globale
catalog_service = CatalogService()
