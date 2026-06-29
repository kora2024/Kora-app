"""Routes API pour le contenu créateur — Production Ready

Upload Cloudinary réel + Signature culturelle FREK-O
"""
from fastapi import APIRouter, HTTPException, Depends, Body, Query, UploadFile, File, Form
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timezone
import os
import asyncio
import logging

# Import FrekCore bridge services
from services.frekcore_bridge import emit_frek_presence
from services.frekcore_register_work import register_frek_work, generate_cultural_signature

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/content", tags=["content"])

# Ces variables seront injectées depuis server.py
db = None
content_service = None
get_current_user = None
get_admin_user = None

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')


class ContentSubmission(BaseModel):
    title: str
    description: str = ''
    type: str = 'audio'  # 'audio' ou 'video'
    category: str = 'music'
    territory: str = 'world'
    genres: List[str] = []
    media_url: str = ''
    artwork_url: str = ''
    duration: int = 0
    isrc: str = ''
    upc: str = ''
    explicit: bool = False
    copyright: str = ''
    producer: str = ''
    writers: List[str] = []


class ContentReview(BaseModel):
    notes: str = ''


class ContentRejection(BaseModel):
    reason: str


@router.post("/submit")
async def submit_content(
    submission: ContentSubmission,
    current_user: dict = Depends(lambda: get_current_user)
):
    """Soumet du contenu (créateur) et génère la signature culturelle FREK-O"""
    if not current_user.get('is_creator', False):
        raise HTTPException(
            status_code=403,
            detail="Seuls les créateurs peuvent soumettre du contenu. Activez votre compte créateur."
        )
    
    # Génération de la signature culturelle AVANT insertion
    cultural_signature = generate_cultural_signature(
        creator_id=current_user.get('frek_id', ''),
        title=submission.title,
        media_url=submission.media_url
    )
    
    # Ajouter la signature au contenu
    content_data = submission.dict()
    content_data['cultural_signature'] = cultural_signature
    
    result = await content_service.submit_content(
        creator_id=str(current_user['_id']),
        content_data=content_data
    )
    
    # Enregistrement FREK-O complet (mise à jour MongoDB + sync FrekCore si configuré)
    if result.get('_id'):
        asyncio.create_task(
            register_frek_work(
                frek_id=current_user.get('frek_id', ''),
                content_id=str(result['_id']),
                title=submission.title,
                media_url=submission.media_url,
                content_type=submission.type,
                territory=submission.territory,
                genres=submission.genres,
                db=db
            )
        )
    
    # Ajouter la signature à la réponse
    result['cultural_signature'] = cultural_signature
    
    return result


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    folder: str = Form(default='creator_content'),
):
    """
    Upload média vers Cloudinary — Production Ready
    
    Reçoit le fichier depuis le téléphone et l'envoie sur Cloudinary.
    Retourne l'URL sécurisée pour stockage en MongoDB.
    """
    # Vérification configuration Cloudinary
    if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
        logger.warning("Cloudinary non configuré - mode simulation")
        return {
            "status": "simulated",
            "message": "Cloudinary non configuré. Configurez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET dans .env",
            "media_url": f"https://placeholder.kora.app/{folder}/{file.filename}",
            "duration": 0,
            "simulated": True
        }
    
    try:
        import cloudinary
        import cloudinary.uploader
        
        # Configuration Cloudinary
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        
        # Déterminer le resource_type basé sur le content_type
        content_type = file.content_type or ''
        if content_type.startswith('video/'):
            resource_type = 'video'
        elif content_type.startswith('audio/'):
            resource_type = 'video'  # Cloudinary traite audio comme video
        else:
            resource_type = 'auto'
        
        # Upload vers Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type=resource_type,
        )
        
        logger.info(f"✅ Upload Cloudinary réussi: {result.get('public_id')}")
        
        return {
            "status": "success",
            "media_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "duration": result.get("duration", 0),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
            "resource_type": result.get("resource_type"),
            "simulated": False
        }
        
    except ImportError:
        logger.error("SDK Cloudinary non installé")
        raise HTTPException(
            status_code=500, 
            detail="SDK Cloudinary non disponible. Exécutez: pip install cloudinary"
        )
    except Exception as e:
        logger.error(f"Erreur upload Cloudinary: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Échec du téléversement Cloudinary: {str(e)}"
        )


@router.get("/my-content")
async def get_my_content(
    current_user: dict = Depends(lambda: get_current_user)
):
    """Récupère le contenu du créateur connecté"""
    content = await content_service.get_creator_content(str(current_user['_id']))
    return {'content': content, 'total': len(content)}


@router.get("/published")
async def get_published_content(
    type: Optional[str] = Query(None),
    territory: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Récupère le contenu publié (public)"""
    content = await content_service.get_published_content(
        content_type=type,
        territory=territory,
        category=category,
        limit=limit
    )
    return {'content': content, 'total': len(content)}


@router.get("/{content_id}")
async def get_content(
    content_id: str
):
    """Récupère un contenu par ID"""
    content = await content_service.get_content_by_id(content_id)
    
    if not content:
        raise HTTPException(status_code=404, detail="Contenu non trouvé")
    
    return content


class PlayRequest(BaseModel):
    duration_seconds: Optional[int] = None


@router.post("/{content_id}/play")
async def record_play(
    content_id: str,
    play_data: PlayRequest = Body(default=PlayRequest()),
    current_user: Optional[dict] = None
):
    """Enregistre une lecture et émet FREK-P si >= 30s (Scénario Marcus)"""
    success = await content_service.increment_play_count(content_id)
    
    # Bridge FrekCore: émettre FREK-P si écoute >= 30 secondes
    if play_data.duration_seconds and play_data.duration_seconds >= 30:
        content = await content_service.get_content_by_id(content_id)
        if content and current_user:
            # Appel asynchrone non-bloquant vers FrekCore
            asyncio.create_task(
                emit_frek_presence(
                    frek_id=current_user.get('frek_id', ''),
                    track_id=content_id,
                    source=content.get('source', 'kora'),
                    duration_seconds=play_data.duration_seconds
                )
            )
    
    return {'success': success}


@router.post("/upload-signature")
async def get_upload_signature(
    folder: str = Body('creator_content'),
    current_user: dict = Depends(lambda: get_current_user)
):
    """Génère une signature pour upload Cloudinary (méthode legacy)"""
    if not current_user.get('is_creator', False):
        raise HTTPException(status_code=403, detail="Réservé aux créateurs")
    
    params = {
        'folder': folder,
        'upload_preset': os.environ.get('CLOUDINARY_UPLOAD_PRESET', 'kora_unsigned')
    }
    
    signature_data = content_service.generate_upload_signature(params)
    return signature_data


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES (Modération)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/pending")
async def get_pending_content(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(lambda: get_admin_user)
):
    """Récupère le contenu en attente d'approbation (admin)"""
    content = await content_service.get_pending_content(limit)
    return {'pending': content, 'total': len(content)}


@router.post("/admin/{content_id}/approve")
async def approve_content(
    content_id: str,
    review: ContentReview = Body(default=ContentReview()),
    current_user: dict = Depends(lambda: get_admin_user)
):
    """Approuve du contenu vidéo (admin)"""
    try:
        result = await content_service.approve_content(
            content_id=content_id,
            admin_id=str(current_user['_id']),
            notes=review.notes
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/admin/{content_id}/reject")
async def reject_content(
    content_id: str,
    rejection: ContentRejection,
    current_user: dict = Depends(lambda: get_admin_user)
):
    """Rejette du contenu vidéo (admin)"""
    try:
        result = await content_service.reject_content(
            content_id=content_id,
            admin_id=str(current_user['_id']),
            reason=rejection.reason
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


def init_routes(database, service, auth_dependency, admin_dependency):
    """Initialise les routes avec les dépendances"""
    global db, content_service, get_current_user, get_admin_user
    db = database
    content_service = service
    get_current_user = auth_dependency
    get_admin_user = admin_dependency
