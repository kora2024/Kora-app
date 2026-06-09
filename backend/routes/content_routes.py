"""Routes API pour le contenu créateur"""
from fastapi import APIRouter, HTTPException, Depends, Body, Query, UploadFile, File, Form
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import os
import aiohttp
import base64

router = APIRouter(prefix="/content", tags=["content"])

# Ces variables seront injectées depuis server.py
db = None
content_service = None
get_current_user = None
get_admin_user = None


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
    """Soumet du contenu (créateur)"""
    if not current_user.get('is_creator', False):
        raise HTTPException(
            status_code=403,
            detail="Seuls les créateurs peuvent soumettre du contenu. Activez votre compte créateur."
        )
    
    result = await content_service.submit_content(
        creator_id=str(current_user['_id']),
        content_data=submission.dict()
    )
    
    return result


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


@router.post("/{content_id}/play")
async def record_play(
    content_id: str
):
    """Enregistre une lecture"""
    success = await content_service.increment_play_count(content_id)
    return {'success': success}


@router.post("/upload-signature")
async def get_upload_signature(
    folder: str = Body('creator_content'),
    current_user: dict = Depends(lambda: get_current_user)
):
    """Génère une signature pour upload Cloudinary"""
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
