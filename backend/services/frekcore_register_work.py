"""KORA → FrekCore FREK-O Registration Service

Enregistre les œuvres créateur (FREK-O) dans le FREK Engine.
Chaque upload créateur génère un fingerprint SHA-256 unique.

Principe FREK-O : Jamais supprimé. L'IP se license, jamais vendue.

Ne jamais bloquer l'upload en cas d'erreur FrekCore.
"""

import os
import logging
import aiohttp
import hashlib
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Configuration FrekCore (variables d'environnement)
FREKCORE_API_URL = os.environ.get('FREKCORE_API_URL', '')
FREKCORE_KORA_SECRET = os.environ.get('FREKCORE_KORA_SECRET', '')

# Timeout pour les appels FrekCore
FREKCORE_TIMEOUT_SECONDS = 10


def _mask_frek_id(frek_id: str) -> str:
    """Masque le FREK-ID pour les logs (sécurité)"""
    if not frek_id or len(frek_id) < 8:
        return '***'
    return f"{frek_id[:4]}...{frek_id[-4:]}"


def _generate_fingerprint(media_url: str, content_id: str) -> str:
    """
    Génère un fingerprint SHA-256 unique pour l'œuvre.
    
    Combinaison de l'URL média et de l'ID contenu pour garantir l'unicité.
    
    Args:
        media_url: URL du fichier média
        content_id: ID MongoDB du contenu (string)
    
    Returns:
        str: Hash SHA-256 hexadécimal
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
    genres: Optional[list] = None
) -> bool:
    """
    Enregistre une œuvre (FREK-O) dans le FREK Engine.
    
    Appelé automatiquement après un upload créateur réussi.
    
    Args:
        frek_id: Identifiant FREK du créateur
        content_id: ID MongoDB du contenu (converti en string)
        title: Titre de l'œuvre
        media_url: URL du fichier média
        content_type: Type de contenu (audio, video)
        territory: Territoire principal
        genres: Liste des genres
    
    Returns:
        bool: True si l'enregistrement a réussi, False sinon
    
    Note:
        Ne jamais lever d'exception - logger silencieusement les erreurs.
        L'upload créateur ne doit jamais être bloqué.
    """
    
    # Vérification configuration FrekCore
    if not FREKCORE_API_URL:
        logger.warning("FREKCORE_API_URL non configuré - FREK-O non enregistré")
        return False
    
    if not FREKCORE_KORA_SECRET:
        logger.warning("FREKCORE_KORA_SECRET non configuré - FREK-O non enregistré")
        return False
    
    # Génération du fingerprint SHA-256
    fingerprint = _generate_fingerprint(media_url, content_id)
    
    # Construction du payload FREK-O
    payload = {
        "frek_id": frek_id,
        "content_id": content_id,
        "title": title,
        "fingerprint": fingerprint,
        "context": "creation",
        "source": "kora_upload",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "content_type": content_type,
            "territory": territory,
            "genres": genres or []
        }
    }
    
    # Headers d'authentification
    headers = {
        "Content-Type": "application/json",
        "X-KORA-Secret": FREKCORE_KORA_SECRET
    }
    
    try:
        # Endpoint FrekCore pour enregistrement FREK-O
        endpoint = f"{FREKCORE_API_URL.rstrip('/')}/api/content/register-work"
        
        timeout = aiohttp.ClientTimeout(total=FREKCORE_TIMEOUT_SECONDS)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(endpoint, json=payload, headers=headers) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(
                        f"FREK-O enregistré: user={_mask_frek_id(frek_id)} "
                        f"content={content_id} fingerprint={fingerprint[:16]}..."
                    )
                    return True
                else:
                    # Log l'erreur mais ne pas bloquer
                    error_text = await response.text()
                    logger.error(
                        f"FrekCore FREK-O réponse {response.status}: {error_text[:200]}"
                    )
                    return False
                    
    except aiohttp.ClientError as e:
        # Erreur réseau - logger silencieusement
        logger.error(f"FrekCore indisponible (FREK-O): {type(e).__name__}")
        return False
    except Exception as e:
        # Toute autre erreur - logger silencieusement
        logger.error(f"Erreur registration FREK-O: {type(e).__name__}: {str(e)[:100]}")
        return False
