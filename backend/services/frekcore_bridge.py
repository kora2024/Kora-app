"""KORA → FrekCore Bridge Service

Pont de communication entre KORA et le FREK Engine.
Émet des FREK-P (Présence) pour les écoutes streaming ≥30 secondes.

Scénario Marcus : Redistribution artiste basée sur profondeur d'écoute.

Ne jamais bloquer l'expérience utilisateur en cas d'erreur FrekCore.
"""

import os
import logging
import aiohttp
from datetime import datetime, timezone
from typing import Optional
import hashlib

logger = logging.getLogger(__name__)

# Configuration FrekCore (variables d'environnement)
FREKCORE_API_URL = os.environ.get('FREKCORE_API_URL', '')
FREKCORE_KORA_SECRET = os.environ.get('FREKCORE_KORA_SECRET', '')

# Timeout pour les appels FrekCore (ne pas bloquer le player)
FREKCORE_TIMEOUT_SECONDS = 5


def _mask_frek_id(frek_id: str) -> str:
    """Masque le FREK-ID pour les logs (sécurité)"""
    if not frek_id or len(frek_id) < 8:
        return '***'
    return f"{frek_id[:4]}...{frek_id[-4:]}"


async def emit_frek_presence(
    frek_id: str,
    track_id: str,
    source: str,
    duration_seconds: Optional[int] = None
) -> bool:
    """
    Émet un FREK-P (Présence) vers FrekCore pour une écoute streaming.
    
    Scénario Marcus : Déclenché uniquement si l'écoute dépasse 30 secondes.
    
    Args:
        frek_id: Identifiant FREK de l'utilisateur
        track_id: Identifiant du track écouté (référence FREK-O)
        source: Source du track (jamendo, archive, creator)
        duration_seconds: Durée d'écoute en secondes
    
    Returns:
        bool: True si l'émission a réussi, False sinon
    
    Note:
        Ne jamais lever d'exception - logger silencieusement les erreurs.
        L'expérience utilisateur ne doit jamais être bloquée.
    """
    
    # Vérification du seuil 30 secondes (Scénario Marcus)
    if duration_seconds is not None and duration_seconds < 30:
        logger.debug(f"FREK-P non émis: durée {duration_seconds}s < 30s (seuil Marcus)")
        return False
    
    # Vérification configuration FrekCore
    if not FREKCORE_API_URL:
        logger.warning("FREKCORE_API_URL non configuré - FREK-P non émis")
        return False
    
    if not FREKCORE_KORA_SECRET:
        logger.warning("FREKCORE_KORA_SECRET non configuré - FREK-P non émis")
        return False
    
    # Construction du payload FREK-P
    payload = {
        "frek_id": frek_id,
        "context": "streaming",
        "frek_o_ref": track_id,
        "source": source,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Headers d'authentification
    headers = {
        "Content-Type": "application/json",
        "X-KORA-Secret": FREKCORE_KORA_SECRET
    }
    
    try:
        # Endpoint FrekCore pour les FREK-P streaming
        endpoint = f"{FREKCORE_API_URL.rstrip('/')}/api/presence/emit"
        
        timeout = aiohttp.ClientTimeout(total=FREKCORE_TIMEOUT_SECONDS)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(endpoint, json=payload, headers=headers) as response:
                if response.status == 200 or response.status == 201:
                    logger.info(
                        f"FREK-P émis: user={_mask_frek_id(frek_id)} "
                        f"track={track_id} source={source}"
                    )
                    return True
                else:
                    # Log l'erreur mais ne pas bloquer
                    error_text = await response.text()
                    logger.error(
                        f"FrekCore réponse {response.status}: {error_text[:200]}"
                    )
                    return False
                    
    except aiohttp.ClientError as e:
        # Erreur réseau - logger silencieusement
        logger.error(f"FrekCore indisponible: {type(e).__name__}")
        return False
    except Exception as e:
        # Toute autre erreur - logger silencieusement
        logger.error(f"Erreur bridge FREK-P: {type(e).__name__}: {str(e)[:100]}")
        return False


async def check_frekcore_health() -> bool:
    """
    Vérifie si FrekCore est accessible (healthcheck).
    
    Returns:
        bool: True si FrekCore répond, False sinon
    """
    if not FREKCORE_API_URL:
        return False
    
    try:
        endpoint = f"{FREKCORE_API_URL.rstrip('/')}/api/health"
        timeout = aiohttp.ClientTimeout(total=3)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(endpoint) as response:
                return response.status == 200
                
    except Exception:
        return False
