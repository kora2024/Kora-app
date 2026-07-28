"""
KORA API v1 — Works, Releases & Events
======================================

Master Prompt Section 26: API versionnée /v1/

Catalogue unifié selon le Master Prompt Section 4.
Supporte musique et audiovisuel.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["api-v1"])

# Database reference
_db = None


def init_routes(db):
    """Initialize routes with database"""
    global _db
    _db = db


# ══════════════════════════════════════════════════════════════════════════════
# WORKS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class CreateWorkRequest(BaseModel):
    type: str  # music, audiovisual_catalog, audiovisual_creator
    title: str
    description: Optional[str] = None
    isrc: Optional[str] = None
    eidr: Optional[str] = None
    rights_holder_ref: str
    duration_seconds: Optional[int] = None
    explicit_content: bool = False
    genres: List[str] = []
    languages: List[str] = []
    territories_origin: List[str] = []
    primary_artists: List[str] = []
    display_artist: Optional[str] = None
    is_ai_generated: bool = False
    ai_model: Optional[str] = None


@router.get("/works")
async def list_works(
    type: Optional[str] = None,
    status: Optional[str] = None,
    rights_holder: Optional[str] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
):
    """Liste des œuvres avec filtres"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if rights_holder:
        query["rights_holder_ref"] = rights_holder
    if genre:
        query["genres"] = {"$in": [genre]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"display_artist": {"$regex": search, "$options": "i"}},
        ]
    
    total = await _db.works.count_documents(query)
    skip = (page - 1) * per_page
    cursor = _db.works.find(query).skip(skip).limit(per_page).sort("created_at", -1)
    works = await cursor.to_list(per_page)
    
    for work in works:
        work["_id"] = str(work["_id"])
    
    return {
        "works": works,
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_more": skip + len(works) < total
    }


@router.post("/works")
async def create_work(request: CreateWorkRequest):
    """Créer une nouvelle œuvre"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    import uuid
    work_id = f"KORA-W-{uuid.uuid4().hex[:12].upper()}"
    
    work = {
        "id": str(uuid.uuid4()),
        "work_id": work_id,
        "type": request.type,
        "title": request.title,
        "description": request.description,
        "universal_id": request.isrc or request.eidr,
        "isrc": request.isrc,
        "eidr": request.eidr,
        "rights_holder_ref": request.rights_holder_ref,
        "duration_seconds": request.duration_seconds,
        "explicit_content": request.explicit_content,
        "genres": request.genres,
        "languages": request.languages,
        "territories_origin": request.territories_origin,
        "primary_artists": request.primary_artists,
        "display_artist": request.display_artist,
        "status": "ingested",
        "visibility": "private",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "ai_disclosure": {
            "is_ai_generated": request.is_ai_generated,
            "ai_model": request.ai_model,
        } if request.is_ai_generated else None,
    }
    
    await _db.works.insert_one(work)
    
    # Publish event
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "work.ingested",
        "work_id": work_id,
        "title": request.title,
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "kora",
    }
    await _db.events.insert_one(event)
    
    logger.info(f"Work created: {work_id}")
    
    return {
        "status": "created",
        "work_id": work_id,
        "type": request.type,
        "title": request.title,
    }


@router.get("/works/{work_id}")
async def get_work(work_id: str):
    """Récupérer les détails d'une œuvre"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    work = await _db.works.find_one({"work_id": work_id})
    if not work:
        work = await _db.works.find_one({"id": work_id})
    
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    work["_id"] = str(work["_id"])
    return work


@router.put("/works/{work_id}")
async def update_work(work_id: str, updates: Dict[str, Any] = Body(...)):
    """Mettre à jour une œuvre"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    work = await _db.works.find_one({"work_id": work_id})
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    updates["updated_at"] = datetime.now(timezone.utc)
    await _db.works.update_one({"work_id": work_id}, {"$set": updates})
    
    # Publish event
    import uuid
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "work.updated",
        "work_id": work_id,
        "updated_fields": list(updates.keys()),
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "kora",
    }
    await _db.events.insert_one(event)
    
    return {"status": "updated", "work_id": work_id}


@router.post("/works/{work_id}/validate")
async def validate_work(work_id: str):
    """Valider une œuvre (simulation FrekCore)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    work = await _db.works.find_one({"work_id": work_id})
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    import uuid
    frekcore_ref = f"FREK-{uuid.uuid4().hex[:16].upper()}"
    
    await _db.works.update_one(
        {"work_id": work_id},
        {"$set": {
            "status": "validated",
            "frekcore_ref": frekcore_ref,
            "frekcore_validated": True,
            "frekcore_validated_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    
    # Publish event
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "work.validated",
        "work_id": work_id,
        "frekcore_ref": frekcore_ref,
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "frekcore",
    }
    await _db.events.insert_one(event)
    
    return {"status": "validated", "work_id": work_id, "frekcore_ref": frekcore_ref}


@router.post("/works/{work_id}/publish")
async def publish_work(work_id: str):
    """Publier une œuvre validée"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    work = await _db.works.find_one({"work_id": work_id})
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if work.get("status") != "validated":
        raise HTTPException(status_code=400, detail="Work must be validated first")
    
    now = datetime.now(timezone.utc)
    await _db.works.update_one(
        {"work_id": work_id},
        {"$set": {
            "status": "published",
            "visibility": "public",
            "published_at": now,
            "updated_at": now,
        }}
    )
    
    # Publish event
    import uuid
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "work.published",
        "work_id": work_id,
        "published_on": ["kora"],
        "occurred_at": now,
        "source_service": "kora",
    }
    await _db.events.insert_one(event)
    
    return {"status": "published", "work_id": work_id}


# ══════════════════════════════════════════════════════════════════════════════
# RELEASES ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class CreateReleaseRequest(BaseModel):
    type: str  # single, ep, album, film, series, etc.
    title: str
    creator_frek_id: str
    creator_display_name: str
    work_ids: List[str] = []
    genres: List[str] = []
    artwork_url: Optional[str] = None
    release_date: Optional[datetime] = None


@router.get("/releases")
async def list_releases(
    type: Optional[str] = None,
    creator: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
):
    """Liste des releases"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if type:
        query["type"] = type
    if creator:
        query["creator_frek_id"] = creator
    
    total = await _db.releases.count_documents(query)
    skip = (page - 1) * per_page
    cursor = _db.releases.find(query).skip(skip).limit(per_page).sort("created_at", -1)
    releases = await cursor.to_list(per_page)
    
    for release in releases:
        release["_id"] = str(release["_id"])
    
    return {"releases": releases, "total": total, "page": page}


@router.post("/releases")
async def create_release(request: CreateReleaseRequest):
    """Créer une nouvelle release"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    import uuid
    release_id = f"KORA-R-{uuid.uuid4().hex[:12].upper()}"
    
    # Calculate duration from works
    total_duration = 0
    if request.work_ids:
        cursor = _db.works.find({"work_id": {"$in": request.work_ids}})
        works = await cursor.to_list(100)
        total_duration = sum(w.get("duration_seconds", 0) for w in works)
    
    release = {
        "id": str(uuid.uuid4()),
        "release_id": release_id,
        "type": request.type,
        "title": request.title,
        "creator_frek_id": request.creator_frek_id,
        "creator_display_name": request.creator_display_name,
        "works": request.work_ids,
        "track_count": len(request.work_ids),
        "total_duration_seconds": total_duration,
        "genres": request.genres,
        "artwork_url": request.artwork_url,
        "release_date": request.release_date,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await _db.releases.insert_one(release)
    
    return {"status": "created", "release_id": release_id, "title": request.title}


@router.get("/releases/{release_id}")
async def get_release(release_id: str):
    """Récupérer une release avec ses works"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    release = await _db.releases.find_one({"release_id": release_id})
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")
    
    release["_id"] = str(release["_id"])
    
    # Get works
    work_ids = release.get("works", [])
    if work_ids:
        cursor = _db.works.find({"work_id": {"$in": work_ids}})
        works = await cursor.to_list(100)
        for w in works:
            w["_id"] = str(w["_id"])
        release["works_data"] = works
    
    return release


# ══════════════════════════════════════════════════════════════════════════════
# AVAILS ENDPOINTS (Audiovisuel)
# ══════════════════════════════════════════════════════════════════════════════

class CreateAvailRequest(BaseModel):
    work_id: str
    territory: str  # ISO country code
    business_model: str  # svod, tvod, avod, fast, theatrical
    start_date: datetime
    end_date: Optional[datetime] = None
    price_amount: Optional[float] = None
    price_currency: str = "EUR"


@router.post("/avails")
async def create_avail(request: CreateAvailRequest):
    """Créer une disponibilité territoriale (audiovisuel)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    import uuid
    avail_id = f"KORA-AV-{uuid.uuid4().hex[:8].upper()}"
    
    avail = {
        "id": str(uuid.uuid4()),
        "avail_id": avail_id,
        "work_id": request.work_id,
        "territory": request.territory,
        "business_model": request.business_model,
        "start_date": request.start_date,
        "end_date": request.end_date,
        "price_amount": request.price_amount,
        "price_currency": request.price_currency,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    
    await _db.avails.insert_one(avail)
    
    # Update work with avail reference
    await _db.works.update_one(
        {"work_id": request.work_id},
        {"$push": {"territory_availability": avail_id}}
    )
    
    return {"status": "created", "avail_id": avail_id}


@router.get("/avails")
async def list_avails(
    work_id: Optional[str] = None,
    territory: Optional[str] = None,
    business_model: Optional[str] = None,
):
    """Liste des disponibilités"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if work_id:
        query["work_id"] = work_id
    if territory:
        query["territory"] = territory
    if business_model:
        query["business_model"] = business_model
    
    cursor = _db.avails.find(query).sort("start_date", -1)
    avails = await cursor.to_list(100)
    
    for avail in avails:
        avail["_id"] = str(avail["_id"])
    
    return {"avails": avails, "total": len(avails)}


# ══════════════════════════════════════════════════════════════════════════════
# EVENTS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/events")
async def list_events(
    event_type: Optional[str] = None,
    work_id: Optional[str] = None,
    since: Optional[datetime] = None,
    limit: int = Query(default=50, le=200),
):
    """Liste des événements (audit trail)"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if event_type:
        query["event_type"] = event_type
    if work_id:
        query["work_id"] = work_id
    if since:
        query["occurred_at"] = {"$gte": since}
    
    cursor = _db.events.find(query).sort("occurred_at", -1).limit(limit)
    events = await cursor.to_list(limit)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {"events": events, "count": len(events)}


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS HOLDERS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class CreateRightsHolderRequest(BaseModel):
    name: str
    type: str  # artist, label, studio, sales_agent, creator, ai_artist
    frek_id: Optional[str] = None
    email: Optional[str] = None
    ipi_number: Optional[str] = None
    payout_method: str = "fiat"  # fiat, jcc


@router.post("/rights-holders")
async def create_rights_holder(request: CreateRightsHolderRequest):
    """Créer un détenteur de droits"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    import uuid
    rh_id = f"KORA-RH-{uuid.uuid4().hex[:12].upper()}"
    
    rights_holder = {
        "id": str(uuid.uuid4()),
        "rights_holder_id": rh_id,
        "name": request.name,
        "type": request.type,
        "frek_id": request.frek_id,
        "email": request.email,
        "ipi_number": request.ipi_number,
        "payout_method": request.payout_method,
        "verified": False,
        "created_at": datetime.now(timezone.utc),
    }
    
    await _db.rights_holders.insert_one(rights_holder)
    
    return {"status": "created", "rights_holder_id": rh_id, "name": request.name}


@router.get("/rights-holders")
async def list_rights_holders(
    type: Optional[str] = None,
    verified: Optional[bool] = None,
):
    """Liste des détenteurs de droits"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if type:
        query["type"] = type
    if verified is not None:
        query["verified"] = verified
    
    cursor = _db.rights_holders.find(query).sort("name", 1)
    rhs = await cursor.to_list(100)
    
    for rh in rhs:
        rh["_id"] = str(rh["_id"])
    
    return {"rights_holders": rhs, "total": len(rhs)}


@router.get("/rights-holders/{rh_id}")
async def get_rights_holder(rh_id: str):
    """Récupérer un détenteur de droits"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    rh = await _db.rights_holders.find_one({"rights_holder_id": rh_id})
    if not rh:
        raise HTTPException(status_code=404, detail="Rights holder not found")
    
    rh["_id"] = str(rh["_id"])
    return rh
