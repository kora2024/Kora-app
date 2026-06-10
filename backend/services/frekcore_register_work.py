"""KORA → FrekCore FREK-O Registration Service — ACTIVÉ

Enregistre les œuvres créateur (FREK-O) dans le système souverain KORA.
Chaque upload créateur génère un fingerprint SHA-256 unique.

Principe FREK-O : Certification de propriété culturelle immuable.
La signature culturelle est stockée directement en MongoDB.

Version Production : Opère en local sans dépendance FrekCore externe.
"""

import os
import logging
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Configuration FrekCore (optionnel - pour synchronisation future)
FREKCORE_API_URL = os.environ.get('FREKCORE_API_URL', '')
FREKCORE_KORA_SECRET = os.environ.get('FREKCORE_KORA_SECRET', '')


def _mask_frek_id(frek_id: str) -> str:
    """Masque le FREK-ID pour les logs (sécurité)"""
    if not frek_id or len(frek_id) < 8:
        return '***'
    return f"{frek_id[:4]}...{frek_id[-4:]}"


def generate_cultural_signature(
    creator_id: str, 
    title: str, 
    media_url: str,
    content_id: str = ""
) -> str:
    """
    Génère une empreinte numérique unique pour l'œuvre (FREK-O).
    C'est le certificat de souveraineté culturelle KORA.
    
    Args:
        creator_id: FREK-ID du créateur
        title: Titre de l'œuvre
        media_url: URL du fichier média
        content_id: ID MongoDB du contenu (optionnel)
    
    Returns:
        str: Signature culturelle format "FRK-O-XXXXXXXX"
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    block_string = f"{creator_id}-{title}-{media_url}-{timestamp}-{content_id}"
    
    # Hash SHA-256 tronqué pour lisibilité
    full_hash = hashlib.sha256(block_string.encode('utf-8')).hexdigest()
    signature = f"FRK-O-{full_hash[:24].upper()}"
    
    logger.info(f"🎵 Signature culturelle générée: {signature} pour créateur {_mask_frek_id(creator_id)}")
    
    return signature


def generate_fingerprint(media_url: str, content_id: str) -> str:
    """
    Génère un fingerprint SHA-256 complet pour l'œuvre.
    
    Args:
        media_url: URL du fichier média
        content_id: ID MongoDB du contenu
    
    Returns:
        str: Hash SHA-256 hexadécimal complet
    """
    data = f"{media_url}:{content_id}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


async def register_frek_work(
    frek_id: str,
    content_id: str,
    title: str,
    media_url: str,
    content_type: str = "audio",
    territory: str = "world",
    genres: Optional[list] = None,
    db = None
) -> Dict:
    """
    Enregistre une œuvre (FREK-O) dans le système souverain KORA.
    
    Génère et stocke la signature culturelle directement en MongoDB.
    Synchronisation FrekCore externe optionnelle (quand configuré).
    
    Args:
        frek_id: Identifiant FREK du créateur
        content_id: ID MongoDB du contenu
        title: Titre de l'œuvre
        media_url: URL du fichier média
        content_type: Type de contenu (audio, video)
        territory: Territoire principal
        genres: Liste des genres
        db: Instance MongoDB (optionnel)
    
    Returns:
        Dict avec status et cultural_signature
    """
    
    # Génération du certificat souverain
    cultural_signature = generate_cultural_signature(
        creator_id=frek_id,
        title=title,
        media_url=media_url,
        content_id=content_id
    )
    
    fingerprint = generate_fingerprint(media_url, content_id)
    
    result = {
        "status": "registered",
        "cultural_signature": cultural_signature,
        "fingerprint": fingerprint,
        "frek_id": frek_id,
        "content_id": content_id,
        "registered_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Mise à jour MongoDB avec la signature (si DB disponible)
    if db:
        try:
            from bson import ObjectId
            await db.content.update_one(
                {"_id": ObjectId(content_id)},
                {"$set": {
                    "cultural_signature": cultural_signature,
                    "fingerprint": fingerprint,
                    "frek_o_registered_at": datetime.now(timezone.utc)
                }}
            )
            logger.info(f"✅ FREK-O enregistré en MongoDB: {content_id}")
        except Exception as e:
            logger.warning(f"Erreur mise à jour MongoDB FREK-O: {e}")
    
    # Synchronisation FrekCore externe (si configuré)
    if FREKCORE_API_URL and FREKCORE_KORA_SECRET:
        try:
            import aiohttp
            
            payload = {
                "frek_id": frek_id,
                "content_id": content_id,
                "title": title,
                "fingerprint": fingerprint,
                "cultural_signature": cultural_signature,
                "context": "creation",
                "source": "kora_upload",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "content_type": content_type,
                    "territory": territory,
                    "genres": genres or []
                }
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-KORA-Secret": FREKCORE_KORA_SECRET
            }
            
            endpoint = f"{FREKCORE_API_URL.rstrip('/')}/api/content/register-work"
            timeout = aiohttp.ClientTimeout(total=10)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(endpoint, json=payload, headers=headers) as response:
                    if response.status in [200, 201]:
                        logger.info(f"✅ FREK-O synchronisé avec FrekCore: {content_id}")
                        result["frekcore_synced"] = True
                    else:
                        logger.warning(f"FrekCore sync failed: {response.status}")
                        result["frekcore_synced"] = False
                        
        except Exception as e:
            logger.warning(f"FrekCore sync error (non-bloquant): {e}")
            result["frekcore_synced"] = False
    else:
        result["frekcore_synced"] = False
        logger.debug("FrekCore non configuré - signature locale uniquement")
    
    return result


async def check_frekcore_health() -> bool:
    """
    Vérifie si FrekCore est accessible (healthcheck).
    
    Returns:
        bool: True si FrekCore répond, False sinon
    """
    if not FREKCORE_API_URL:
        return False
    
    try:
        import aiohttp
        endpoint = f"{FREKCORE_API_URL.rstrip('/')}/api/health"
        timeout = aiohttp.ClientTimeout(total=3)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(endpoint) as response:
                return response.status == 200
                
    except Exception:
        return False
