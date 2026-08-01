"""
KORA CVE API Routes — Section 8 Master Prompt
═══════════════════════════════════════════════════════════════════════════════

Endpoints pour le Cultural Value Engine.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from models.cve_engine import (
    CulturalValueEngine,
    TrustScoreCalculator,
    NebulaCalculator,
    CVICalculator,
    WorkCVEMetrics,
    NebulaDistribution,
    CVEConfig,
)

router = APIRouter(prefix="/cve", tags=["CVE Engine"])


# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class TrustScoreRequest(BaseModel):
    completion_rate: float
    duration_seconds: int
    source: str
    is_premium: bool = False


class TrustScoreResponse(BaseModel):
    trust_score: float
    is_valid: bool
    threshold: float


class NebulaScoreRequest(BaseModel):
    langue: Dict[str, float] = {}
    territoire: Dict[str, float] = {}
    diaspora: Dict[str, float] = {}
    generation: Dict[str, float] = {}
    style: Dict[str, float] = {}
    collaboration: Dict[str, float] = {}


class NebulaScoreResponse(BaseModel):
    nebula_score: float
    axis_entropies: Dict[str, float]
    interpretation: str


class CVIRequest(BaseModel):
    streams: int
    engagement: float
    fidelity: float
    conversion: float


class CVIResponse(BaseModel):
    cvi: float
    components_normalized: Dict[str, float]
    weights: Dict[str, float]


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/config")
async def get_cve_config():
    """Retourne la configuration actuelle du CVE."""
    return {
        "trust_score_threshold": CVEConfig.TRUST_SCORE_THRESHOLD,
        "weights": {
            "streams": CVEConfig.WEIGHT_STREAMS,
            "engagement": CVEConfig.WEIGHT_ENGAGEMENT,
            "fidelity": CVEConfig.WEIGHT_FIDELITY,
            "conversion": CVEConfig.WEIGHT_CONVERSION,
        },
        "rho_ces": CVEConfig.RHO_CES,
        "nebula_axes": CVEConfig.NEBULA_AXES,
        "distributable_mass_per_cycle": CVEConfig.DISTRIBUTABLE_MASS_PER_CYCLE,
    }


@router.post("/trust-score", response_model=TrustScoreResponse)
async def calculate_trust_score(request: TrustScoreRequest):
    """Couche 1 — Calcule le Trust Score pour un événement d'écoute."""
    event_data = {
        "completion_rate": request.completion_rate,
        "duration_seconds": request.duration_seconds,
        "source": request.source,
        "is_premium": request.is_premium,
    }
    
    ts = TrustScoreCalculator.calculate(event_data)
    is_valid = TrustScoreCalculator.is_valid(ts)
    
    return TrustScoreResponse(
        trust_score=round(ts, 4),
        is_valid=is_valid,
        threshold=CVEConfig.TRUST_SCORE_THRESHOLD,
    )


@router.post("/nebula-score", response_model=NebulaScoreResponse)
async def calculate_nebula_score(request: NebulaScoreRequest):
    """Couche 4 — Calcule le Nebula Score (circulation culturelle)."""
    distribution = NebulaDistribution(
        langue=request.langue,
        territoire=request.territoire,
        diaspora=request.diaspora,
        generation=request.generation,
        style=request.style,
        collaboration=request.collaboration,
    )
    
    axis_entropies = {
        "langue": NebulaCalculator.calculate_entropy(distribution.langue),
        "territoire": NebulaCalculator.calculate_entropy(distribution.territoire),
        "diaspora": NebulaCalculator.calculate_entropy(distribution.diaspora),
        "generation": NebulaCalculator.calculate_entropy(distribution.generation),
        "style": NebulaCalculator.calculate_entropy(distribution.style),
        "collaboration": NebulaCalculator.calculate_entropy(distribution.collaboration),
    }
    
    nebula = NebulaCalculator.calculate_nebula_score(distribution)
    
    if nebula >= 0.8:
        interpretation = "Circulation culturelle exceptionnelle"
    elif nebula >= 0.6:
        interpretation = "Bonne circulation culturelle"
    elif nebula >= 0.4:
        interpretation = "Circulation modérée"
    else:
        interpretation = "Circulation limitée"
    
    return NebulaScoreResponse(
        nebula_score=round(nebula, 4),
        axis_entropies={k: round(v, 4) for k, v in axis_entropies.items()},
        interpretation=interpretation,
    )


@router.post("/cvi", response_model=CVIResponse)
async def calculate_cvi(request: CVIRequest):
    """Couche 3 — Calcule le Cultural Value Index."""
    cvi = CVICalculator.calculate_cvi(
        streams=request.streams,
        engagement=request.engagement,
        fidelity=request.fidelity,
        conversion=request.conversion,
    )
    
    return CVIResponse(
        cvi=round(cvi, 4),
        components_normalized={
            "streams": round(min(request.streams / 1000000, 1.0), 4),
            "engagement": round(request.engagement, 4),
            "fidelity": round(request.fidelity, 4),
            "conversion": round(min(request.conversion / 10000, 1.0), 4),
        },
        weights={
            "streams": CVEConfig.WEIGHT_STREAMS,
            "engagement": CVEConfig.WEIGHT_ENGAGEMENT,
            "fidelity": CVEConfig.WEIGHT_FIDELITY,
            "conversion": CVEConfig.WEIGHT_CONVERSION,
        },
    )


@router.post("/simulate")
async def simulate_allocation(works: List[Dict]):
    """Simule l'allocation CVE pour une liste d'œuvres."""
    if not works:
        raise HTTPException(status_code=400, detail="Liste d'œuvres vide")
    
    metrics_list = []
    for w in works:
        cvi = CVICalculator.calculate_cvi(
            streams=w.get('streams', 0),
            engagement=w.get('engagement', 0),
            fidelity=w.get('fidelity', 0),
            conversion=w.get('conversion', 0),
        )
        
        metrics = WorkCVEMetrics(
            work_id=w.get('work_id', 'unknown'),
            cycle_id='simulation',
            streams_validated=w.get('streams', 0),
            engagement_score=w.get('engagement', 0),
            fidelity_score=w.get('fidelity', 0),
            conversion_value=w.get('conversion', 0),
            cvi=cvi,
            nebula_score=w.get('nebula_score', 0.5),
        )
        metrics_list.append(metrics)
    
    allocated = CulturalValueEngine.calculate_allocation(metrics_list)
    
    return {
        "cycle_id": "simulation",
        "distributable_mass": CVEConfig.DISTRIBUTABLE_MASS_PER_CYCLE,
        "allocations": [
            {
                "work_id": m.work_id,
                "cvi": round(m.cvi, 4),
                "nebula_score": round(m.nebula_score, 4),
                "uvc_allocation": round(m.uvc, 2),
            }
            for m in sorted(allocated, key=lambda x: x.uvc, reverse=True)
        ],
    }


@router.get("/explainer")
async def get_cve_explainer():
    """Retourne une explication du CVE pour l'UI."""
    return {
        "title": "Cultural Value Engine (CVE)",
        "layers": [
            {"number": 1, "name": "Trust Score", "description": "Filtre anti-fraude"},
            {"number": 2, "name": "Composantes", "description": "Streams, Engagement, Fidélité, Conversion"},
            {"number": 3, "name": "CVI", "description": "Agrégation mathématique (CES)"},
            {"number": 4, "name": "Nebula Score", "description": "Circulation culturelle transversale"},
        ],
    }
