"""KORA Content Service - Gestion du contenu créateur et modération"""
import os
import logging
import aiohttp
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import hashlib

logger = logging.getLogger(__name__)

# Cloudinary Configuration (free tier)
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')
CLOUDINARY_UPLOAD_PRESET = os.environ.get('CLOUDINARY_UPLOAD_PRESET', 'kora_unsigned')


class ContentService:
    """Service de gestion du contenu créateur"""
    
    def __init__(self, db):
        self.db = db
        self.content_collection = db.content
        self.pending_collection = db.pending_content
    
    async def submit_content(self, creator_id: str, content_data: Dict) -> Dict:
        """Soumet du contenu pour approbation (vidéo) ou publication directe (audio)"""
        content_type = content_data.get('type', 'audio')
        
        content_doc = {
            'creator_id': creator_id,
            'title': content_data['title'],
            'description': content_data.get('description', ''),
            'type': content_type,  # 'audio' ou 'video'
            'category': content_data.get('category', 'music'),
            'territory': content_data.get('territory', 'world'),
            'genres': content_data.get('genres', []),
            'media_url': content_data.get('media_url', ''),
            'artwork_url': content_data.get('artwork_url', ''),
            'duration': content_data.get('duration', 0),
            'metadata': {
                'isrc': content_data.get('isrc', ''),
                'upc': content_data.get('upc', ''),
                'explicit': content_data.get('explicit', False),
                'release_date': content_data.get('release_date', datetime.now(timezone.utc).isoformat()),
                'copyright': content_data.get('copyright', ''),
                'producer': content_data.get('producer', ''),
                'writers': content_data.get('writers', []),
            },
            'source': 'creator',
            'playable': True,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }
        
        if content_type == 'video':
            # Les vidéos nécessitent une approbation
            content_doc['status'] = 'pending'
            content_doc['review_notes'] = ''
            result = await self.pending_collection.insert_one(content_doc)
            content_doc['_id'] = str(result.inserted_id)
            content_doc['message'] = 'Vidéo soumise pour approbation'
        else:
            # Les audios sont publiés directement
            content_doc['status'] = 'published'
            result = await self.content_collection.insert_one(content_doc)
            content_doc['_id'] = str(result.inserted_id)
            content_doc['message'] = 'Audio publié avec succès'
        
        return content_doc
    
    async def get_pending_content(self, limit: int = 50) -> List[Dict]:
        """Récupère le contenu en attente d'approbation (admin)"""
        cursor = self.pending_collection.find(
            {'status': 'pending'}
        ).sort('created_at', -1).limit(limit)
        
        results = []
        async for doc in cursor:
            doc['_id'] = str(doc['_id'])
            results.append(doc)
        return results
    
    async def approve_content(self, content_id: str, admin_id: str, notes: str = '') -> Dict:
        """Approuve du contenu vidéo (admin)"""
        pending = await self.pending_collection.find_one({'_id': ObjectId(content_id)})
        
        if not pending:
            raise ValueError('Contenu non trouvé')
        
        # Déplacer vers la collection publiée
        pending['status'] = 'published'
        pending['approved_by'] = admin_id
        pending['approved_at'] = datetime.now(timezone.utc)
        pending['review_notes'] = notes
        del pending['_id']
        
        result = await self.content_collection.insert_one(pending)
        
        # Supprimer de pending
        await self.pending_collection.delete_one({'_id': ObjectId(content_id)})
        
        return {
            'success': True,
            'content_id': str(result.inserted_id),
            'message': 'Contenu approuvé et publié'
        }
    
    async def reject_content(self, content_id: str, admin_id: str, reason: str) -> Dict:
        """Rejette du contenu vidéo (admin)"""
        result = await self.pending_collection.update_one(
            {'_id': ObjectId(content_id)},
            {
                '$set': {
                    'status': 'rejected',
                    'rejected_by': admin_id,
                    'rejected_at': datetime.now(timezone.utc),
                    'rejection_reason': reason
                }
            }
        )
        
        if result.modified_count == 0:
            raise ValueError('Contenu non trouvé')
        
        return {
            'success': True,
            'message': 'Contenu rejeté',
            'reason': reason
        }
    
    async def get_published_content(
        self,
        content_type: Optional[str] = None,
        territory: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Récupère le contenu publié avec filtres"""
        query = {'status': 'published'}
        
        if content_type:
            query['type'] = content_type
        if territory:
            query['territory'] = territory
        if category:
            query['category'] = category
        
        cursor = self.content_collection.find(query).sort('created_at', -1).limit(limit)
        
        results = []
        async for doc in cursor:
            doc['_id'] = str(doc['_id'])
            results.append(doc)
        return results
    
    async def get_creator_content(self, creator_id: str) -> List[Dict]:
        """Récupère tout le contenu d'un créateur"""
        # Contenu publié
        published_cursor = self.content_collection.find(
            {'creator_id': creator_id}
        ).sort('created_at', -1)
        
        # Contenu en attente
        pending_cursor = self.pending_collection.find(
            {'creator_id': creator_id}
        ).sort('created_at', -1)
        
        results = []
        
        async for doc in published_cursor:
            doc['_id'] = str(doc['_id'])
            results.append(doc)
        
        async for doc in pending_cursor:
            doc['_id'] = str(doc['_id'])
            results.append(doc)
        
        return results
    
    async def get_content_by_id(self, content_id: str) -> Optional[Dict]:
        """Récupère un contenu par ID"""
        try:
            doc = await self.content_collection.find_one({'_id': ObjectId(content_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
                return doc
            
            # Chercher dans pending aussi
            doc = await self.pending_collection.find_one({'_id': ObjectId(content_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
                return doc
            
            return None
        except:
            return None
    
    async def increment_play_count(self, content_id: str) -> bool:
        """Incrémente le compteur de lectures"""
        try:
            result = await self.content_collection.update_one(
                {'_id': ObjectId(content_id)},
                {
                    '$inc': {'play_count': 1},
                    '$set': {'last_played': datetime.now(timezone.utc)}
                }
            )
            return result.modified_count > 0
        except:
            return False
    
    def generate_upload_signature(self, params: Dict) -> Dict:
        """Génère une signature Cloudinary pour upload sécurisé"""
        import time
        
        timestamp = int(time.time())
        params_to_sign = {**params, 'timestamp': timestamp}
        
        # Trier et construire la chaîne à signer
        sorted_params = sorted(params_to_sign.items())
        params_str = '&'.join([f"{k}={v}" for k, v in sorted_params])
        params_str += CLOUDINARY_API_SECRET
        
        signature = hashlib.sha1(params_str.encode()).hexdigest()
        
        return {
            'signature': signature,
            'timestamp': timestamp,
            'api_key': CLOUDINARY_API_KEY,
            'cloud_name': CLOUDINARY_CLOUD_NAME
        }


def create_content_service(db):
    return ContentService(db)
