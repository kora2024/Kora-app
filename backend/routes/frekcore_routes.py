"""
FrekCore Ingestion Routes — Pipeline Catalogue Vivant
======================================================

Master Prompt Architecture: Source → FrekCore → KORA Catalog → Frontend

KORA ne possède pas la logique d'ingestion.
Il consomme des objets culturels validés par FrekCore.
"""

from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/frekcore", tags=["frekcore"])

# Database reference
_db = None
_ingestion_service = None


def init_routes(db):
    """Initialize routes with database"""
    global _db, _ingestion_service
    _db = db
    
    # Import here to avoid circular dependency
    from services.frekcore_ingestion import get_ingestion_service
    _ingestion_service = get_ingestion_service(db)


# ══════════════════════════════════════════════════════════════════════════════
# INGESTION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class IngestRequest(BaseModel):
    """Request pour ingestion manuelle d'un work"""
    title: str
    artist: str
    type: str = "music"  # music, audiovisual_catalog, audiovisual_creator
    description: Optional[str] = None
    genres: List[str] = []
    languages: List[str] = ["fr"]
    territories_origin: List[str] = ["FR"]
    audio_url: Optional[str] = None
    artwork_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    explicit_content: bool = False
    cultural_tags: List[str] = []
    
    # FK Metadata ready
    isrc: Optional[str] = None
    eidr: Optional[str] = None
    frek_id: Optional[str] = None  # Creator FREK-ID


@router.post("/ingest")
async def ingest_work(request: IngestRequest):
    """
    Ingérer un work via le pipeline FrekCore.
    
    Flow: Source → Validation → FrekCore Signature → KORA Catalog
    """
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    from services.frekcore_ingestion import IngestionSource
    
    # Transform request to work_data
    work_data = {
        "title": request.title,
        "display_artist": request.artist,
        "type": request.type,
        "description": request.description,
        "genres": request.genres or ["World", "Afrobeat"],
        "languages": request.languages,
        "territories_origin": request.territories_origin,
        "audio_url": request.audio_url,
        "artwork_url": request.artwork_url,
        "duration_seconds": request.duration_seconds,
        "explicit_content": request.explicit_content,
        "cultural_tags": request.cultural_tags,
        "isrc": request.isrc,
        "eidr": request.eidr,
        "creator_frek_id": request.frek_id,
    }
    
    result = await _ingestion_service.ingest_work(work_data, IngestionSource.MANUAL)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    logger.info(f"Work ingested: {result.work_id} - {request.title}")
    
    return {
        "status": "ingested",
        "work_id": result.work_id,
        "frekcore_ref": result.frekcore_ref,
        "title": request.title,
        "artist": request.artist,
    }


@router.post("/populate")
async def populate_catalog(target_count: int = Query(default=50, ge=10, le=200)):
    """
    Peupler le catalogue KORA avec du contenu vivant.
    Utilise les sources de test (Jamendo, Archive.org) pour démonstration.
    """
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    result = await _ingestion_service.populate_catalog(target_count)
    
    logger.info(f"Catalog populated: {result}")
    
    return result


@router.get("/stats")
async def get_catalog_stats():
    """Statistiques du catalogue KORA"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    return await _ingestion_service.get_catalog_stats()


# ══════════════════════════════════════════════════════════════════════════════
# DYNAMIC FEED ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/feed")
async def get_home_feed(
    limit: int = Query(default=20, ge=1, le=100),
    territory: Optional[str] = None,
):
    """
    Feed principal pour la home KORA.
    Retourne trending, nouveautés, et découvertes.
    """
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    # Get various feeds
    trending = await _ingestion_service.get_trending_works(limit=limit, territory=territory)
    new_releases = await _ingestion_service.get_new_releases(limit=limit)
    discoveries = await _ingestion_service.get_discoveries(limit=limit)
    
    # Transform for frontend
    def transform_work(work):
        return {
            "id": work.get("work_id") or work.get("id"),
            "title": work.get("title"),
            "artist": work.get("display_artist"),
            "artwork": work.get("artwork_url") or f"https://picsum.photos/seed/{work.get('id', 'default')}/400",
            "type": work.get("type", "music"),
            "stream_url": work.get("audio_url"),
            "duration": work.get("duration_seconds"),
            "genres": work.get("genres", []),
            "play_count": work.get("play_count", 0),
            "frekcore_ref": work.get("frekcore_ref"),
            "source": work.get("ingestion_source", "kora"),
        }
    
    return {
        "trending": [transform_work(w) for w in trending],
        "new_releases": [transform_work(w) for w in new_releases],
        "discoveries": [transform_work(w) for w in discoveries],
        "total_works": await _db.works.count_documents({"status": "validated"}),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/feed/trending")
async def get_trending_feed(
    limit: int = Query(default=20, ge=1, le=100),
    territory: Optional[str] = None,
):
    """Œuvres en tendance"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    works = await _ingestion_service.get_trending_works(limit=limit, territory=territory)
    
    return {
        "works": [{
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "artwork": w.get("artwork_url"),
            "stream_url": w.get("audio_url"),
            "genres": w.get("genres", []),
            "play_count": w.get("play_count", 0),
            "type": w.get("type"),
            "frekcore_ref": w.get("frekcore_ref"),
        } for w in works],
        "total": len(works),
    }


@router.get("/feed/new-releases")
async def get_new_releases_feed(
    limit: int = Query(default=20, ge=1, le=100),
    days: int = Query(default=30, ge=1, le=365),
):
    """Nouveautés des X derniers jours"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    works = await _ingestion_service.get_new_releases(limit=limit, days=days)
    
    return {
        "works": [{
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "artwork": w.get("artwork_url"),
            "stream_url": w.get("audio_url"),
            "published_at": w.get("published_at"),
            "type": w.get("type"),
            "frekcore_ref": w.get("frekcore_ref"),
        } for w in works],
        "total": len(works),
        "period_days": days,
    }


@router.get("/feed/territory/{territory}")
async def get_territory_feed(
    territory: str,
    limit: int = Query(default=20, ge=1, le=100),
):
    """Œuvres par territoire"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    works = await _ingestion_service.get_by_territory(territory, limit=limit)
    
    return {
        "works": [{
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "artwork": w.get("artwork_url"),
            "stream_url": w.get("audio_url"),
            "type": w.get("type"),
        } for w in works],
        "territory": territory,
        "total": len(works),
    }


@router.get("/feed/genre/{genre}")
async def get_genre_feed(
    genre: str,
    limit: int = Query(default=20, ge=1, le=100),
):
    """Œuvres par genre"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    works = await _ingestion_service.get_by_genre(genre, limit=limit)
    
    return {
        "works": [{
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "artwork": w.get("artwork_url"),
            "stream_url": w.get("audio_url"),
            "type": w.get("type"),
        } for w in works],
        "genre": genre,
        "total": len(works),
    }


@router.get("/feed/discoveries")
async def get_discoveries_feed(
    limit: int = Query(default=20, ge=1, le=100),
    genres: Optional[str] = None,  # Comma-separated
):
    """Découvertes personnalisées"""
    if _ingestion_service is None:
        raise HTTPException(status_code=500, detail="Ingestion service not initialized")
    
    user_genres = genres.split(",") if genres else None
    works = await _ingestion_service.get_discoveries(user_genres=user_genres, limit=limit)
    
    return {
        "works": [{
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "artwork": w.get("artwork_url"),
            "stream_url": w.get("audio_url"),
            "type": w.get("type"),
        } for w in works],
        "total": len(works),
    }


# ══════════════════════════════════════════════════════════════════════════════
# AUDIOVISUAL FEED (for films.tsx)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/feed/audiovisual")
async def get_audiovisual_feed(
    limit: int = Query(default=20, ge=1, le=100),
    content_type: Optional[str] = None,  # film, series, documentary, concert
):
    """Feed audiovisuel pour le catalogue films"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {
        "status": "validated",
        "visibility": "public",
        "type": {"$in": ["audiovisual_catalog", "audiovisual_creator"]}
    }
    
    if content_type:
        query["content_type"] = content_type
    
    cursor = _db.works.find(query).sort("published_at", -1).limit(limit)
    works = await cursor.to_list(limit)
    
    def transform_av(w):
        return {
            "id": w.get("work_id") or w.get("id"),
            "title": w.get("title"),
            "artist": w.get("display_artist"),
            "poster": w.get("artwork_url"),
            "backdrop": w.get("backdrop_url") or w.get("artwork_url"),
            "type": w.get("content_type", "film"),
            "year": w.get("release_year", 2024),
            "duration": w.get("duration_formatted") or f"{w.get('duration_seconds', 0) // 60}min",
            "rating": w.get("rating", "Tous publics"),
            "genres": w.get("genres", []),
            "description": w.get("description"),
            "stream_url": w.get("video_url") or w.get("audio_url"),
            "frekcore_ref": w.get("frekcore_ref"),
        }
    
    return {
        "works": [transform_av(w) for w in works],
        "total": len(works),
    }
