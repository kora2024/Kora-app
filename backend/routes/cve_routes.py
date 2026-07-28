"""
KORA Cultural Value Engine (CVE) — API Routes
=============================================

Endpoints for CVE metrics and calculations.

Public Endpoints:
- GET /api/cve/work/{work_id} - Get CVE metrics for a work
- GET /api/cve/leaderboard - Get top works by CVI

Admin Endpoints:
- POST /api/cve/cycle/{cycle_id}/process - Process a cycle
- GET /api/cve/cycle/{cycle_id}/report - Get cycle report
- PUT /api/cve/config - Update CVE configuration
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
import logging

from models.cve_models import (
    CulturalValueRecord, CVEConfiguration, CVEComponentScores,
    CycleType, CulturalClassification, generate_cycle_id
)
from services.cve_service import get_cve_engine, set_cve_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cve", tags=["cve"])

# Database reference (injected at init)
_db = None
_get_current_user = None
_get_admin_user = None


def init_routes(db, get_current_user, get_admin_user):
    """Initialize routes with database and auth dependencies."""
    global _db, _get_current_user, _get_admin_user
    _db = db
    _get_current_user = get_current_user
    _get_admin_user = get_admin_user


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/work/{work_id}")
async def get_work_cve(
    work_id: str,
    cycle_id: Optional[str] = None
):
    """
    Get CVE metrics for a specific work.
    
    If cycle_id is not provided, returns the latest cycle data.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {"work_id": work_id}
    if cycle_id:
        query["cycle_id"] = cycle_id
    
    # Get latest record
    record = await _db.cve_records.find_one(
        query,
        sort=[("cycle_start", -1)]
    )
    
    if not record:
        # No CVE data yet - return empty structure
        return {
            "work_id": work_id,
            "cvi": 0.0,
            "components": {
                "S": 0.0, "E": 0.0, "F": 0.0,
                "C": 0.0, "L": 0.0, "N": 0.0
            },
            "classification": None,
            "has_data": False
        }
    
    return {
        "work_id": work_id,
        "cycle_id": record.get("cycle_id"),
        "cvi": record.get("cvi", 0.0),
        "cvi_rank": record.get("cvi_rank"),
        "cvi_percentile": record.get("cvi_percentile"),
        "components": record.get("components", {}),
        "nebula_score": record.get("components", {}).get("N", 0.0),
        "chl_days": record.get("chl_days"),
        "chl_classification": record.get("chl_classification"),
        "total_streams": record.get("total_streams", 0),
        "validated_streams": record.get("validated_streams", 0),
        "uvc_allocated": record.get("uvc_allocated", 0.0),
        "uvc_value_eur": record.get("uvc_value_eur", 0.0),
        "calculated_at": record.get("calculated_at"),
        "has_data": True
    }


@router.get("/leaderboard")
async def get_cve_leaderboard(
    cycle_id: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    territory: Optional[str] = None,
    genre: Optional[str] = None
):
    """
    Get leaderboard of top works by CVI.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Build query
    query = {}
    if cycle_id:
        query["cycle_id"] = cycle_id
    
    # Get top works
    cursor = _db.cve_records.find(query).sort("cvi", -1).limit(limit)
    records = await cursor.to_list(limit)
    
    # Enrich with work metadata
    leaderboard = []
    for i, record in enumerate(records):
        work = await _db.works.find_one({"_id": record.get("work_id")})
        
        entry = {
            "rank": i + 1,
            "work_id": record.get("work_id"),
            "frek_o_ref": record.get("frek_o_ref"),
            "cvi": record.get("cvi", 0.0),
            "validated_streams": record.get("validated_streams", 0),
            "nebula_score": record.get("components", {}).get("N", 0.0),
            "chl_classification": record.get("chl_classification"),
            "uvc_value_eur": record.get("uvc_value_eur", 0.0),
        }
        
        if work:
            entry.update({
                "title": work.get("title"),
                "creator_display_name": work.get("creator_display_name"),
                "artwork_url": work.get("artwork_url"),
                "territories": work.get("territories", []),
                "genres": work.get("genres", []),
            })
        
        leaderboard.append(entry)
    
    return {
        "cycle_id": cycle_id or "latest",
        "total_works": len(leaderboard),
        "leaderboard": leaderboard
    }


@router.get("/stats")
async def get_cve_stats(
    cycle_id: Optional[str] = None
):
    """
    Get aggregate CVE statistics for a cycle.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get current cycle if not specified
    if not cycle_id:
        now = datetime.now(timezone.utc)
        cycle_id = generate_cycle_id(now, CycleType.MONTHLY)
    
    # Aggregate stats
    pipeline = [
        {"$match": {"cycle_id": cycle_id}},
        {"$group": {
            "_id": None,
            "total_works": {"$sum": 1},
            "total_streams": {"$sum": "$total_streams"},
            "validated_streams": {"$sum": "$validated_streams"},
            "total_cvi": {"$sum": "$cvi"},
            "avg_cvi": {"$avg": "$cvi"},
            "max_cvi": {"$max": "$cvi"},
            "total_uvc_eur": {"$sum": "$uvc_value_eur"},
        }}
    ]
    
    result = await _db.cve_records.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "cycle_id": cycle_id,
            "total_works": 0,
            "total_streams": 0,
            "validated_streams": 0,
            "validation_rate": 0.0,
            "total_cvi": 0.0,
            "avg_cvi": 0.0,
            "max_cvi": 0.0,
            "total_uvc_eur": 0.0,
        }
    
    stats = result[0]
    validation_rate = (
        stats["validated_streams"] / stats["total_streams"]
        if stats["total_streams"] > 0 else 0.0
    )
    
    return {
        "cycle_id": cycle_id,
        "total_works": stats["total_works"],
        "total_streams": stats["total_streams"],
        "validated_streams": stats["validated_streams"],
        "validation_rate": round(validation_rate * 100, 2),
        "total_cvi": round(stats["total_cvi"], 4),
        "avg_cvi": round(stats["avg_cvi"], 4),
        "max_cvi": round(stats["max_cvi"], 4),
        "total_uvc_eur": round(stats["total_uvc_eur"], 2),
    }


# ══════════════════════════════════════════════════════════════════════════════
# CREATOR ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/my-works")
async def get_my_works_cve(
    cycle_id: Optional[str] = None,
    current_user: dict = Depends(lambda: _get_current_user)
):
    """
    Get CVE metrics for the authenticated creator's works.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = await current_user
    frek_id = user.get("frek_id")
    
    if not frek_id:
        raise HTTPException(status_code=400, detail="FREK-ID required")
    
    # Get creator's works
    works = await _db.works.find({"creator_frek_id": frek_id}).to_list(100)
    work_ids = [w["_id"] for w in works]
    
    if not work_ids:
        return {"works": [], "total_uvc_eur": 0.0}
    
    # Get CVE records
    query = {"work_id": {"$in": work_ids}}
    if cycle_id:
        query["cycle_id"] = cycle_id
    
    records = await _db.cve_records.find(query).sort("cvi", -1).to_list(100)
    
    # Build response
    works_cve = []
    total_uvc = 0.0
    
    for record in records:
        work = next((w for w in works if w["_id"] == record["work_id"]), None)
        
        entry = {
            "work_id": record["work_id"],
            "title": work.get("title") if work else "Unknown",
            "cvi": record.get("cvi", 0.0),
            "streams": record.get("validated_streams", 0),
            "uvc_eur": record.get("uvc_value_eur", 0.0),
            "components": record.get("components", {}),
        }
        works_cve.append(entry)
        total_uvc += entry["uvc_eur"]
    
    return {
        "frek_id": frek_id,
        "cycle_id": cycle_id or "all",
        "works": works_cve,
        "total_uvc_eur": round(total_uvc, 2),
    }


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/cycle/{cycle_id}/process")
async def process_cycle(
    cycle_id: str,
    distributable_mass_eur: float = Query(default=0.0, description="Total EUR to distribute"),
    admin_user: dict = Depends(lambda: _get_admin_user)
):
    """
    [ADMIN] Process CVE calculations for a cycle.
    
    This runs the full CVE pipeline:
    1. Validate all listening events (TrustScore)
    2. Calculate CVI for each work
    3. Allocate UVC based on CVI proportions
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await admin_user  # Verify admin
    
    cve = get_cve_engine(_db)
    
    try:
        result = await cve.process_cycle(cycle_id, distributable_mass_eur)
        
        logger.info(f"CVE cycle {cycle_id} processed: {result['works_processed']} works")
        
        return {
            "status": "success",
            "cycle_id": cycle_id,
            "works_processed": result["works_processed"],
            "total_cvi": round(result["total_cvi"], 4),
            "distributable_mass_eur": distributable_mass_eur,
            "top_works": [
                {"work_id": w[0], "cvi": round(w[1], 4), "uvc_eur": round(w[2], 2)}
                for w in result["top_works"]
            ]
        }
        
    except Exception as e:
        logger.error(f"CVE processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/cycle/{cycle_id}/report")
async def get_cycle_report(
    cycle_id: str,
    admin_user: dict = Depends(lambda: _get_admin_user)
):
    """
    [ADMIN] Get detailed CVE report for a cycle.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await admin_user  # Verify admin
    
    # Get all records for cycle
    records = await _db.cve_records.find({"cycle_id": cycle_id}).to_list(None)
    
    if not records:
        raise HTTPException(status_code=404, detail="No data for this cycle")
    
    # Distribution analysis
    cvi_values = [r.get("cvi", 0) for r in records]
    
    # Classification breakdown
    classifications = {}
    for r in records:
        cls = r.get("chl_classification") or "unknown"
        classifications[cls] = classifications.get(cls, 0) + 1
    
    # Component averages
    component_sums = {"S": 0, "E": 0, "F": 0, "C": 0, "L": 0, "N": 0}
    for r in records:
        components = r.get("components", {})
        for key in component_sums:
            component_sums[key] += components.get(key, 0)
    
    n = len(records)
    component_avgs = {k: round(v / n, 4) for k, v in component_sums.items()}
    
    return {
        "cycle_id": cycle_id,
        "total_works": n,
        "cvi_distribution": {
            "min": round(min(cvi_values), 4),
            "max": round(max(cvi_values), 4),
            "mean": round(sum(cvi_values) / n, 4),
            "median": round(sorted(cvi_values)[n // 2], 4),
        },
        "classifications": classifications,
        "component_averages": component_avgs,
        "total_uvc_eur": round(sum(r.get("uvc_value_eur", 0) for r in records), 2),
    }


@router.put("/config")
async def update_cve_config(
    config: CVEConfiguration,
    admin_user: dict = Depends(lambda: _get_admin_user)
):
    """
    [ADMIN] Update CVE configuration parameters.
    
    Parameters (θ) include weights, thresholds, and constraints.
    Changes are recorded for governance compliance (C7).
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    await admin_user  # Verify admin
    
    # Validate weight sum
    weight_sum = config.w_S + config.w_E + config.w_F + config.w_C + config.w_L + config.w_N
    if abs(weight_sum - 1.0) > 0.001:
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0, got {weight_sum}"
        )
    
    # Store configuration
    config_dict = config.dict()
    config_dict["updated_at"] = datetime.now(timezone.utc)
    
    await _db.cve_configs.update_one(
        {"cycle_id": config.cycle_id},
        {"$set": config_dict},
        upsert=True
    )
    
    # Update active engine
    set_cve_config(config)
    
    logger.info(f"CVE config updated for cycle {config.cycle_id}")
    
    return {
        "status": "success",
        "cycle_id": config.cycle_id,
        "weights": {
            "S": config.w_S,
            "E": config.w_E,
            "F": config.w_F,
            "C": config.w_C,
            "L": config.w_L,
            "N": config.w_N,
        },
        "rho": config.rho,
        "tau_fraude": config.tau_fraude,
    }


@router.get("/config/{cycle_id}")
async def get_cve_config(
    cycle_id: str
):
    """
    Get CVE configuration for a cycle (public for transparency).
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    config = await _db.cve_configs.find_one({"cycle_id": cycle_id})
    
    if not config:
        # Return defaults
        return {
            "cycle_id": cycle_id,
            "weights": {
                "S": 0.25, "E": 0.20, "F": 0.15,
                "C": 0.15, "L": 0.10, "N": 0.15
            },
            "rho": 0.5,
            "tau_fraude": 0.6,
            "saturation": "log",
            "diversity_floor": 0.3,
            "is_default": True
        }
    
    return {
        "cycle_id": cycle_id,
        "weights": {
            "S": config.get("w_S", 0.25),
            "E": config.get("w_E", 0.20),
            "F": config.get("w_F", 0.15),
            "C": config.get("w_C", 0.15),
            "L": config.get("w_L", 0.10),
            "N": config.get("w_N", 0.15),
        },
        "rho": config.get("rho", 0.5),
        "tau_fraude": config.get("tau_fraude", 0.6),
        "saturation": config.get("saturation_type", "log"),
        "diversity_floor": config.get("diversity_floor", 0.3),
        "published_at": config.get("published_at"),
        "is_default": False
    }
