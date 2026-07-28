"""
KORA for Creators — API Routes (Master Prompt Section 20)
========================================================

Dashboard artiste complet:
- Analytics (statistiques temps réel)
- Royalties (relevés RoyaltyStatement)
- Upload self-serve
- Releases management
- Gestion des droits (RoyaltySplit)
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, Header
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import logging
import uuid
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/creators", tags=["creators"])

# Database reference
_db = None

# Upload directory
UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def init_routes(db, get_current_user=None):
    """Initialize routes with database"""
    global _db
    _db = db


async def get_current_creator(authorization: Optional[str] = Header(default=None)):
    """Get current creator from auth header (simplified for demo)"""
    # In production, validate JWT and get user from DB
    # For now, return a demo user
    return {
        "frek_id": "demo-creator",
        "email": "creator@kora.com",
        "display_name": "Demo Creator",
        "is_creator": True,
    }


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def get_creator_dashboard(current_user: dict = Depends(get_current_creator)):
    """
    Dashboard principal du créateur.
    
    Retourne:
    - Statistiques globales
    - Works récents
    - Revenus du mois
    - Activité récente
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Get creator's works
    works = await _db.works.find({
        "$or": [
            {"rights_holder_ref": frek_id},
            {"primary_artists": frek_id},
            {"creator_frek_id": frek_id}
        ]
    }).to_list(100)
    
    work_ids = [w.get("work_id") for w in works]
    
    # Get stats for last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Count streams
    stream_count = await _db.listening_events.count_documents({
        "work_id": {"$in": work_ids},
        "timestamp": {"$gte": thirty_days_ago}
    }) if work_ids else 0
    
    # Get releases
    releases = await _db.releases.find({
        "creator_frek_id": frek_id
    }).to_list(50)
    
    # Calculate total revenue (from CVE records)
    revenue_pipeline = [
        {"$match": {"work_id": {"$in": work_ids}}},
        {"$group": {"_id": None, "total": {"$sum": "$uvc_value_eur"}}}
    ]
    revenue_result = await _db.cve_records.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
    
    # Recent activity (events)
    recent_events = await _db.events.find({
        "work_id": {"$in": work_ids}
    }).sort("occurred_at", -1).limit(10).to_list(10)
    
    for event in recent_events:
        event["_id"] = str(event["_id"])
    
    return {
        "creator_id": frek_id,
        "stats": {
            "total_works": len(works),
            "published_works": len([w for w in works if w.get("status") == "published"]),
            "total_releases": len(releases),
            "streams_30d": stream_count,
            "total_revenue_eur": round(total_revenue, 2),
        },
        "recent_works": [
            {
                "work_id": w.get("work_id"),
                "title": w.get("title"),
                "type": w.get("type"),
                "status": w.get("status"),
                "created_at": w.get("created_at"),
            }
            for w in works[:5]
        ],
        "recent_activity": recent_events,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics")
async def get_creator_analytics(
    period: str = Query(default="30d", pattern="^(7d|30d|90d|1y|all)$"),
    work_id: Optional[str] = None,
    current_user: dict = Depends(get_current_creator)
):
    """
    Analytics temps réel pour le créateur.
    
    Métriques:
    - Streams par jour/semaine
    - Listeners uniques
    - Territoires
    - Sources (playlists, search, direct)
    - CVE metrics (CVI, Nebula Score)
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    else:
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    # Get creator's works
    work_query = {
        "$or": [
            {"rights_holder_ref": frek_id},
            {"primary_artists": frek_id},
            {"creator_frek_id": frek_id}
        ]
    }
    if work_id:
        work_query["work_id"] = work_id
    
    works = await _db.works.find(work_query).to_list(100)
    work_ids = [w.get("work_id") for w in works]
    
    if not work_ids:
        return {
            "period": period,
            "total_streams": 0,
            "unique_listeners": 0,
            "streams_by_day": [],
            "streams_by_territory": {},
            "top_works": [],
            "cve_metrics": {},
        }
    
    # Streams by day
    streams_pipeline = [
        {"$match": {
            "work_id": {"$in": work_ids},
            "timestamp": {"$gte": start_date}
        }},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1},
            "duration": {"$sum": "$duration_seconds"}
        }},
        {"$sort": {"_id": 1}}
    ]
    streams_by_day = await _db.listening_events.aggregate(streams_pipeline).to_list(100)
    
    # Total streams and unique listeners
    total_streams = sum(d["count"] for d in streams_by_day)
    
    unique_pipeline = [
        {"$match": {
            "work_id": {"$in": work_ids},
            "timestamp": {"$gte": start_date}
        }},
        {"$group": {"_id": "$user_frek_id"}},
        {"$count": "unique"}
    ]
    unique_result = await _db.listening_events.aggregate(unique_pipeline).to_list(1)
    unique_listeners = unique_result[0]["unique"] if unique_result else 0
    
    # Streams by territory
    territory_pipeline = [
        {"$match": {
            "work_id": {"$in": work_ids},
            "timestamp": {"$gte": start_date}
        }},
        {"$group": {
            "_id": "$territory",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    territory_result = await _db.listening_events.aggregate(territory_pipeline).to_list(10)
    streams_by_territory = {t["_id"]: t["count"] for t in territory_result if t["_id"]}
    
    # Top works
    top_works_pipeline = [
        {"$match": {
            "work_id": {"$in": work_ids},
            "timestamp": {"$gte": start_date}
        }},
        {"$group": {
            "_id": "$work_id",
            "streams": {"$sum": 1}
        }},
        {"$sort": {"streams": -1}},
        {"$limit": 10}
    ]
    top_works_result = await _db.listening_events.aggregate(top_works_pipeline).to_list(10)
    
    # Enrich top works with titles
    top_works = []
    for tw in top_works_result:
        work = next((w for w in works if w.get("work_id") == tw["_id"]), None)
        top_works.append({
            "work_id": tw["_id"],
            "title": work.get("title") if work else "Unknown",
            "streams": tw["streams"]
        })
    
    # CVE metrics
    cve_records = await _db.cve_records.find({
        "work_id": {"$in": work_ids}
    }).sort("cycle_start", -1).limit(len(work_ids)).to_list(len(work_ids))
    
    cve_metrics = {
        "avg_cvi": 0.0,
        "total_uvc_eur": 0.0,
        "avg_nebula_score": 0.0,
    }
    if cve_records:
        cve_metrics["avg_cvi"] = round(sum(r.get("cvi", 0) for r in cve_records) / len(cve_records), 4)
        cve_metrics["total_uvc_eur"] = round(sum(r.get("uvc_value_eur", 0) for r in cve_records), 2)
        nebula_scores = [r.get("components", {}).get("N", 0) for r in cve_records]
        cve_metrics["avg_nebula_score"] = round(sum(nebula_scores) / len(nebula_scores), 4) if nebula_scores else 0
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "total_streams": total_streams,
        "unique_listeners": unique_listeners,
        "streams_by_day": [
            {"date": d["_id"], "streams": d["count"], "duration": d["duration"]}
            for d in streams_by_day
        ],
        "streams_by_territory": streams_by_territory,
        "top_works": top_works,
        "cve_metrics": cve_metrics,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ROYALTIES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/royalties")
async def get_creator_royalties(
    period: Optional[str] = None,
    current_user: dict = Depends(get_current_creator)
):
    """
    Relevés de royalties (RoyaltyStatement).
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Get rights holder
    rights_holder = await _db.rights_holders.find_one({
        "$or": [
            {"frek_id": frek_id},
            {"email": current_user.get("email")}
        ]
    })
    
    rh_id = rights_holder.get("rights_holder_id") if rights_holder else frek_id
    
    # Get royalty statements
    query = {"rights_holder_id": rh_id}
    if period:
        query["period"] = period
    
    statements = await _db.royalty_statements.find(query).sort("period", -1).to_list(50)
    
    for stmt in statements:
        stmt["_id"] = str(stmt["_id"])
    
    # Get CVE records for works
    works = await _db.works.find({
        "$or": [
            {"rights_holder_ref": frek_id},
            {"primary_artists": frek_id}
        ]
    }).to_list(100)
    work_ids = [w.get("work_id") for w in works]
    
    cve_records = await _db.cve_records.find({
        "work_id": {"$in": work_ids}
    }).sort("cycle_start", -1).to_list(100)
    
    for record in cve_records:
        record["_id"] = str(record["_id"])
    
    # Calculate totals
    total_earned = sum(r.get("uvc_value_eur", 0) for r in cve_records)
    total_paid = sum(s.get("amount_paid", 0) for s in statements if s.get("status") == "paid")
    pending = total_earned - total_paid
    
    return {
        "rights_holder_id": rh_id,
        "summary": {
            "total_earned_eur": round(total_earned, 2),
            "total_paid_eur": round(total_paid, 2),
            "pending_eur": round(max(0, pending), 2),
        },
        "statements": statements,
        "cve_records": cve_records[:20],  # Latest 20
    }


@router.get("/royalties/{work_id}")
async def get_work_royalties(
    work_id: str,
    current_user: dict = Depends(get_current_creator)
):
    """
    Royalties détaillées pour un work spécifique.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Verify ownership
    work = await _db.works.find_one({"work_id": work_id})
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    if work.get("rights_holder_ref") != frek_id and frek_id not in work.get("primary_artists", []):
        raise HTTPException(status_code=403, detail="Not authorized to view this work's royalties")
    
    # Get CVE records
    cve_records = await _db.cve_records.find({
        "work_id": work_id
    }).sort("cycle_start", -1).to_list(24)  # Last 24 months
    
    for record in cve_records:
        record["_id"] = str(record["_id"])
    
    # Get royalty splits
    splits = await _db.royalty_splits.find({"work_id": work_id}).to_list(10)
    for split in splits:
        split["_id"] = str(split["_id"])
    
    total_revenue = sum(r.get("uvc_value_eur", 0) for r in cve_records)
    
    return {
        "work_id": work_id,
        "title": work.get("title"),
        "total_revenue_eur": round(total_revenue, 2),
        "cve_records": cve_records,
        "royalty_splits": splits,
    }


# ══════════════════════════════════════════════════════════════════════════════
# UPLOAD SELF-SERVE
# ══════════════════════════════════════════════════════════════════════════════

class UploadInitRequest(BaseModel):
    """Request to initialize an upload"""
    filename: str
    file_size: int
    content_type: str  # audio/*, video/*
    title: str
    type: str = "music"  # music, audiovisual_creator
    description: Optional[str] = None
    genres: List[str] = []
    languages: List[str] = []


@router.post("/upload/init")
async def init_upload(
    request: UploadInitRequest,
    current_user: dict = Depends(get_current_creator)
):
    """
    Initialiser un upload chunké.
    
    Retourne un upload_id pour les chunks suivants.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    upload_id = f"KORA-UP-{uuid.uuid4().hex[:12].upper()}"
    
    # Calculate chunks (5MB each)
    chunk_size = 5 * 1024 * 1024  # 5MB
    total_chunks = (request.file_size + chunk_size - 1) // chunk_size
    
    upload_record = {
        "upload_id": upload_id,
        "creator_frek_id": frek_id,
        "filename": request.filename,
        "file_size": request.file_size,
        "content_type": request.content_type,
        "title": request.title,
        "type": request.type,
        "description": request.description,
        "genres": request.genres,
        "languages": request.languages,
        "total_chunks": total_chunks,
        "received_chunks": [],
        "status": "initialized",
        "created_at": datetime.now(timezone.utc),
    }
    
    await _db.uploads.insert_one(upload_record)
    
    # Publish event
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "upload.started",
        "upload_id": upload_id,
        "creator_frek_id": frek_id,
        "filename": request.filename,
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "kora",
    }
    await _db.events.insert_one(event)
    
    logger.info(f"Upload initialized: {upload_id} by {frek_id}")
    
    return {
        "upload_id": upload_id,
        "total_chunks": total_chunks,
        "chunk_size": chunk_size,
        "status": "initialized",
    }


@router.post("/upload/{upload_id}/chunk/{chunk_number}")
async def upload_chunk(
    upload_id: str,
    chunk_number: int,
    chunk: UploadFile = File(...),
    current_user: dict = Depends(get_current_creator)
):
    """
    Upload un chunk de fichier.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Get upload record
    upload = await _db.uploads.find_one({"upload_id": upload_id})
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload.get("creator_frek_id") != frek_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if chunk_number in upload.get("received_chunks", []):
        return {"status": "already_received", "chunk_number": chunk_number}
    
    # Save chunk
    chunk_dir = os.path.join(UPLOAD_DIR, upload_id)
    os.makedirs(chunk_dir, exist_ok=True)
    
    chunk_path = os.path.join(chunk_dir, f"chunk_{chunk_number:05d}")
    content = await chunk.read()
    
    with open(chunk_path, "wb") as f:
        f.write(content)
    
    # Update record
    await _db.uploads.update_one(
        {"upload_id": upload_id},
        {
            "$push": {"received_chunks": chunk_number},
            "$set": {"status": "uploading"}
        }
    )
    
    # Check if complete
    upload = await _db.uploads.find_one({"upload_id": upload_id})
    received = len(upload.get("received_chunks", []))
    total = upload.get("total_chunks", 1)
    
    is_complete = received >= total
    
    if is_complete:
        await _db.uploads.update_one(
            {"upload_id": upload_id},
            {"$set": {"status": "complete"}}
        )
        
        # Publish event
        event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "upload.completed",
            "upload_id": upload_id,
            "creator_frek_id": frek_id,
            "occurred_at": datetime.now(timezone.utc),
            "source_service": "kora",
        }
        await _db.events.insert_one(event)
    
    return {
        "status": "complete" if is_complete else "received",
        "chunk_number": chunk_number,
        "received_chunks": received,
        "total_chunks": total,
        "progress": round(received / total * 100, 1),
    }


@router.post("/upload/{upload_id}/finalize")
async def finalize_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_creator)
):
    """
    Finaliser un upload et créer le Work.
    
    Assemble les chunks et crée l'entrée dans le catalogue.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    # Get upload record
    upload = await _db.uploads.find_one({"upload_id": upload_id})
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload.get("creator_frek_id") != frek_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if upload.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Upload not complete")
    
    # Assemble chunks
    chunk_dir = os.path.join(UPLOAD_DIR, upload_id)
    final_path = os.path.join(UPLOAD_DIR, f"{upload_id}_{upload.get('filename')}")
    
    with open(final_path, "wb") as outfile:
        for i in range(upload.get("total_chunks", 0)):
            chunk_path = os.path.join(chunk_dir, f"chunk_{i:05d}")
            if os.path.exists(chunk_path):
                with open(chunk_path, "rb") as chunk_file:
                    outfile.write(chunk_file.read())
    
    # Create Work
    work_id = f"KORA-W-{uuid.uuid4().hex[:12].upper()}"
    
    work = {
        "id": str(uuid.uuid4()),
        "work_id": work_id,
        "type": upload.get("type", "music"),
        "title": upload.get("title"),
        "description": upload.get("description"),
        "rights_holder_ref": frek_id,
        "creator_frek_id": frek_id,
        "genres": upload.get("genres", []),
        "languages": upload.get("languages", []),
        "display_artist": current_user.get("display_name") or current_user.get("email"),
        "status": "ingested",
        "visibility": "private",
        "ingestion_source": "self-serve",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await _db.works.insert_one(work)
    
    # Create Asset
    asset_id = f"KORA-A-{uuid.uuid4().hex[:12].upper()}"
    content_type = upload.get("content_type", "audio/mpeg")
    
    asset = {
        "id": str(uuid.uuid4()),
        "asset_id": asset_id,
        "work_id": work_id,
        "kind": "audio_master" if "audio" in content_type else "video_master",
        "format": upload.get("filename", "").split(".")[-1] or "mp3",
        "quality_tier": "standard",
        "storage_url": final_path,
        "storage_provider": "local",
        "file_size_bytes": upload.get("file_size"),
        "status": "ready",
        "created_at": datetime.now(timezone.utc),
    }
    
    await _db.assets.insert_one(asset)
    
    # Update work with asset
    await _db.works.update_one(
        {"work_id": work_id},
        {"$push": {"assets": asset_id}}
    )
    
    # Update upload status
    await _db.uploads.update_one(
        {"upload_id": upload_id},
        {"$set": {
            "status": "finalized",
            "work_id": work_id,
            "asset_id": asset_id,
            "finalized_at": datetime.now(timezone.utc),
        }}
    )
    
    # Publish event
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "upload.ready",
        "upload_id": upload_id,
        "work_id": work_id,
        "asset_id": asset_id,
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "kora",
    }
    await _db.events.insert_one(event)
    
    # Also emit work.ingested
    work_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "work.ingested",
        "work_id": work_id,
        "title": upload.get("title"),
        "ingestion_source": "self-serve",
        "occurred_at": datetime.now(timezone.utc),
        "source_service": "kora",
    }
    await _db.events.insert_one(work_event)
    
    logger.info(f"Upload finalized: {upload_id} -> Work {work_id}")
    
    return {
        "status": "finalized",
        "upload_id": upload_id,
        "work_id": work_id,
        "asset_id": asset_id,
        "title": upload.get("title"),
        "next_steps": [
            "Add metadata (artwork, credits)",
            "Validate work",
            "Publish to KORA"
        ]
    }


@router.get("/upload/{upload_id}/status")
async def get_upload_status(
    upload_id: str,
    current_user: dict = Depends(get_current_creator)
):
    """
    Statut d'un upload en cours.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    upload = await _db.uploads.find_one({"upload_id": upload_id})
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload.get("creator_frek_id") != frek_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    upload["_id"] = str(upload["_id"])
    
    received = len(upload.get("received_chunks", []))
    total = upload.get("total_chunks", 1)
    
    return {
        "upload_id": upload_id,
        "status": upload.get("status"),
        "filename": upload.get("filename"),
        "title": upload.get("title"),
        "received_chunks": received,
        "total_chunks": total,
        "progress": round(received / total * 100, 1),
        "work_id": upload.get("work_id"),
        "created_at": upload.get("created_at"),
    }


# ══════════════════════════════════════════════════════════════════════════════
# MY WORKS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/works")
async def get_my_works(
    status: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_creator)
):
    """
    Liste des works du créateur.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    query = {
        "$or": [
            {"rights_holder_ref": frek_id},
            {"primary_artists": frek_id},
            {"creator_frek_id": frek_id}
        ]
    }
    
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    
    total = await _db.works.count_documents(query)
    skip = (page - 1) * per_page
    
    works = await _db.works.find(query).skip(skip).limit(per_page).sort("created_at", -1).to_list(per_page)
    
    for work in works:
        work["_id"] = str(work["_id"])
    
    return {
        "works": works,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ══════════════════════════════════════════════════════════════════════════════
# MY RELEASES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/releases")
async def get_my_releases(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_creator)
):
    """
    Liste des releases du créateur.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    query = {"creator_frek_id": frek_id}
    
    total = await _db.releases.count_documents(query)
    skip = (page - 1) * per_page
    
    releases = await _db.releases.find(query).skip(skip).limit(per_page).sort("created_at", -1).to_list(per_page)
    
    for release in releases:
        release["_id"] = str(release["_id"])
    
    return {
        "releases": releases,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/releases")
async def create_my_release(
    title: str = Form(...),
    type: str = Form(default="single"),
    work_ids: str = Form(default=""),  # Comma-separated
    genres: str = Form(default=""),
    release_date: Optional[str] = Form(default=None),
    current_user: dict = Depends(get_current_creator)
):
    """
    Créer une release pour le créateur.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = current_user
    frek_id = current_user.get("frek_id") or current_user.get("email")
    
    release_id = f"KORA-R-{uuid.uuid4().hex[:12].upper()}"
    work_id_list = [w.strip() for w in work_ids.split(",") if w.strip()]
    genre_list = [g.strip() for g in genres.split(",") if g.strip()]
    
    # Calculate duration
    total_duration = 0
    if work_id_list:
        cursor = _db.works.find({"work_id": {"$in": work_id_list}})
        works = await cursor.to_list(100)
        total_duration = sum(w.get("duration_seconds", 0) for w in works)
    
    release = {
        "id": str(uuid.uuid4()),
        "release_id": release_id,
        "type": type,
        "title": title,
        "creator_frek_id": frek_id,
        "creator_display_name": current_user.get("display_name") or current_user.get("email"),
        "works": work_id_list,
        "track_count": len(work_id_list),
        "total_duration_seconds": total_duration,
        "genres": genre_list,
        "release_date": datetime.fromisoformat(release_date) if release_date else None,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await _db.releases.insert_one(release)
    
    return {
        "status": "created",
        "release_id": release_id,
        "title": title,
        "track_count": len(work_id_list),
    }
