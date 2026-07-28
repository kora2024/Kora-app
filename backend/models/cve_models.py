"""
KORA Cultural Value Engine (CVE) — Data Models
==============================================

Specification: KORA_CVE_Specification_Mathematique_v1.0.md
CVLN Group / Tech & Data Pole

This module defines the canonical data entities for the Cultural Value Engine:
- Work: A creative work (song, video, podcast, etc.)
- Asset: A specific digital asset/file associated with a Work
- Release: A collection of Works (album, EP, compilation)
- RightsHolder: Entity holding rights to a Work
- RoyaltySplit: Distribution configuration for a Work
- ListeningEvent: Raw listening data with TrustScore validation
- CulturalValueRecord: Calculated CVE metrics per cycle
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum
import uuid


# ══════════════════════════════════════════════════════════════════════════════
# ENUMS — Type Classifications
# ══════════════════════════════════════════════════════════════════════════════

class WorkType(str, Enum):
    AUDIO = "audio"
    VIDEO = "video"
    LIVE = "live"
    PODCAST = "podcast"
    DOCUMENTARY = "documentary"
    FILM = "film"
    PERFORMANCE = "performance"


class AssetQuality(str, Enum):
    STANDARD = "standard"        # 128-256 kbps
    HIGH = "high"               # 320 kbps / AAC
    LOSSLESS = "lossless"       # FLAC / ALAC
    HI_RES = "hi-res"           # 24-bit / 96kHz+
    DOLBY_ATMOS = "dolby-atmos" # Spatial Audio


class RightsHolderType(str, Enum):
    CREATOR = "creator"         # Artist/Creator
    LABEL = "label"             # Record Label
    PUBLISHER = "publisher"     # Music Publisher
    DISTRIBUTOR = "distributor" # Distribution Partner
    COLLECTIVE = "collective"   # Collecting Society


class CycleType(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class CulturalClassification(str, Enum):
    EPHEMERAL = "ephemeral"     # Short-lived popularity
    SLOW_BURN = "slow-burn"     # Gradual growth
    CLASSIC = "classic"         # Sustained value
    HERITAGE = "heritage"       # Long-term cultural significance


# ══════════════════════════════════════════════════════════════════════════════
# WORK — Core Creative Entity
# ══════════════════════════════════════════════════════════════════════════════

class Work(BaseModel):
    """
    A creative work in the KORA ecosystem.
    Identified by a unique FREK-O (FREK Object) reference.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    frek_o_ref: str = Field(description="Unique FREK Object reference")
    
    # Metadata
    title: str
    title_normalized: Optional[str] = None  # For search
    type: WorkType
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    
    # Cultural Signature (for Nebula Score)
    territories: List[str] = Field(default_factory=list)  # ISO country codes
    genres: List[str] = Field(default_factory=list)
    cultural_tags: List[str] = Field(default_factory=list)  # diaspora, generation, style
    
    # Creator Reference
    creator_frek_id: str
    creator_display_name: str
    collaborators: List[str] = Field(default_factory=list)  # List of FREK-IDs
    
    # Release Info
    release_id: Optional[str] = None
    release_date: Optional[datetime] = None
    
    # Assets
    assets: List[str] = Field(default_factory=list)  # List of Asset IDs
    
    # Status
    status: Literal["draft", "pending", "active", "archived"] = "draft"
    visibility: Literal["public", "private", "unlisted"] = "public"
    
    # CVE Metrics (calculated)
    cvi_current: Optional[float] = None  # Latest Cultural Value Index
    trust_score: Optional[float] = None  # Latest TrustScore
    nebula_score: Optional[float] = None  # Cultural circulation
    chl_classification: Optional[CulturalClassification] = None
    
    # FrekCore Integration
    frekcore_registered: bool = False
    frekcore_registration_date: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# ASSET — Digital File/Stream
# ══════════════════════════════════════════════════════════════════════════════

class Asset(BaseModel):
    """
    A specific digital asset (file/stream) for a Work.
    Multiple assets can exist for the same Work (different qualities, formats).
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_id: str
    
    # File Info
    format: str  # mp3, flac, m4a, mp4, etc.
    quality: AssetQuality
    bitrate_kbps: Optional[int] = None
    sample_rate_hz: Optional[int] = None
    bit_depth: Optional[int] = None
    
    # Storage
    storage_url: str  # Cloudinary, S3, etc.
    storage_provider: str  # cloudinary, s3, archive
    file_size_bytes: Optional[int] = None
    
    # Stream URLs
    stream_url: Optional[str] = None
    stream_hls_url: Optional[str] = None  # For adaptive streaming
    
    # Artwork
    artwork_url: Optional[str] = None
    artwork_thumbnail_url: Optional[str] = None
    
    # Waveform (for player visualization)
    waveform_data: Optional[List[float]] = None
    
    # Status
    status: Literal["processing", "ready", "error", "archived"] = "processing"
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# RELEASE — Collection of Works
# ══════════════════════════════════════════════════════════════════════════════

class Release(BaseModel):
    """
    A release (album, EP, single, compilation) containing multiple Works.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    frek_release_ref: str = Field(description="Unique FREK Release reference")
    
    # Metadata
    title: str
    type: Literal["single", "ep", "album", "compilation", "mixtape", "live"]
    
    # Creator
    creator_frek_id: str
    creator_display_name: str
    label: Optional[str] = None
    
    # Works
    work_ids: List[str] = Field(default_factory=list)
    track_count: int = 0
    total_duration_seconds: int = 0
    
    # Artwork
    artwork_url: Optional[str] = None
    
    # Release Info
    release_date: Optional[datetime] = None
    upc: Optional[str] = None  # Universal Product Code
    
    # Status
    status: Literal["draft", "pending", "released", "archived"] = "draft"
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS HOLDER — Entity with Rights to a Work
# ══════════════════════════════════════════════════════════════════════════════

class RightsHolder(BaseModel):
    """
    An entity (person or organization) holding rights to a Work.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Identity
    frek_id: Optional[str] = None  # If registered KORA user
    name: str
    type: RightsHolderType
    
    # Contact
    email: Optional[str] = None
    
    # Payment (JCC Wallet integration)
    jcc_wallet_address: Optional[str] = None
    
    # IPI/ISNI (industry identifiers)
    ipi_number: Optional[str] = None  # Interested Parties Information
    isni: Optional[str] = None  # International Standard Name Identifier
    
    # Territories
    territories: List[str] = Field(default_factory=list)  # Where rights apply
    
    # Status
    verified: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ══════════════════════════════════════════════════════════════════════════════
# ROYALTY SPLIT — Distribution Configuration
# ══════════════════════════════════════════════════════════════════════════════

class RoyaltySplitEntry(BaseModel):
    """A single entry in a royalty split configuration."""
    rights_holder_id: str
    percentage: float = Field(ge=0, le=100)  # 0-100%
    role: str  # composer, performer, producer, etc.


class RoyaltySplit(BaseModel):
    """
    Royalty distribution configuration for a Work.
    All percentages must sum to 100%.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_id: str
    
    # Split Configuration
    splits: List[RoyaltySplitEntry] = Field(default_factory=list)
    
    # Validation
    total_percentage: float = 100.0  # Must always equal 100
    
    # Status
    status: Literal["draft", "active", "disputed", "archived"] = "draft"
    approved_by_all: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ══════════════════════════════════════════════════════════════════════════════
# LISTENING EVENT — Raw Streaming Data (Layer 1)
# ══════════════════════════════════════════════════════════════════════════════

class ListeningEvent(BaseModel):
    """
    Raw listening event data.
    Subject to TrustScore validation (TS >= tau_fraude threshold).
    
    Hypothesis H0: All raw signals are timestamped and reproducible.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # References
    work_id: str
    frek_o_ref: str
    user_frek_id: str
    
    # Event Data
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    duration_seconds: int  # Actual listened duration
    total_duration_seconds: int  # Track total duration
    completion_ratio: float  # duration / total (0-1)
    
    # Context
    source: str  # jamendo, archive, creator
    platform: str  # ios, android, web
    territory: str  # ISO country code
    
    # User Context (for TrustScore)
    session_id: str
    is_premium: bool = False
    
    # TrustScore Components
    trust_score: Optional[float] = None  # Calculated TS
    sig_id: Optional[float] = None  # Identity signal
    sig_comp: Optional[float] = None  # Completion signal
    sig_net: Optional[float] = None  # Network signal
    sig_hist: Optional[float] = None  # Historical signal
    
    # Validation
    is_validated: bool = False  # TS >= tau_fraude
    validation_cycle: Optional[str] = None  # Cycle in which validated


# ══════════════════════════════════════════════════════════════════════════════
# CULTURAL VALUE RECORD — CVE Metrics per Cycle (Layer 2-4)
# ══════════════════════════════════════════════════════════════════════════════

class CVEComponentScores(BaseModel):
    """
    Normalized component scores for CVI calculation (x̂ values).
    Components: S, E, F, C, CHL_integrated, N
    """
    S: float = 0.0  # Validated streams (normalized percentile)
    E: float = 0.0  # Engagement (duration ratio + re-listen + playlist adds)
    F: float = 0.0  # Fidelity (12-week active + premium bonus)
    C: float = 0.0  # Conversion attribution (value € / total €)
    L: float = 0.0  # Legacy (CHL integral)
    N: float = 0.0  # Nebula Score (cultural circulation entropy)


class CulturalValueRecord(BaseModel):
    """
    Calculated CVE metrics for a Work in a specific cycle.
    
    CVI = (Σ w_a * x̂_a^ρ)^(1/ρ)   (CES Aggregation)
    UVC = (CVI / Σ CVI) * MD       (Allocation)
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # References
    work_id: str
    frek_o_ref: str
    
    # Cycle Info
    cycle_id: str  # e.g., "2024-01" for January 2024
    cycle_type: CycleType
    cycle_start: datetime
    cycle_end: datetime
    
    # Raw Counts
    total_streams: int = 0
    validated_streams: int = 0  # TS >= tau_fraude
    unique_listeners: int = 0
    total_listen_duration_seconds: int = 0
    
    # Component Scores (normalized, 0-1)
    components: CVEComponentScores = Field(default_factory=CVEComponentScores)
    
    # CVI Calculation
    cvi: float = 0.0  # Cultural Value Index
    cvi_rank: Optional[int] = None  # Rank within cycle
    cvi_percentile: Optional[float] = None  # 0-100
    
    # Nebula Score Details
    nebula_entropy_language: Optional[float] = None
    nebula_entropy_territory: Optional[float] = None
    nebula_entropy_diaspora: Optional[float] = None
    nebula_entropy_generation: Optional[float] = None
    nebula_entropy_style: Optional[float] = None
    nebula_novelty_factor: Optional[float] = None
    nebula_velocity_factor: Optional[float] = None
    
    # CHL (Cultural Half-Life)
    chl_days: Optional[float] = None
    chl_classification: Optional[CulturalClassification] = None
    
    # UVC Allocation (Layer 4)
    uvc_allocated: float = 0.0  # Units allocated
    uvc_value_eur: float = 0.0  # Value in EUR
    
    # Weights Used (Shapley-derived)
    weights: Dict[str, float] = Field(default_factory=dict)  # {S: 0.2, E: 0.15, ...}
    rho: float = 0.5  # Substitution elasticity
    
    # Status
    status: Literal["calculating", "calculated", "distributed", "archived"] = "calculating"
    
    # Timestamps
    calculated_at: Optional[datetime] = None
    distributed_at: Optional[datetime] = None


# ══════════════════════════════════════════════════════════════════════════════
# CVE CONFIGURATION — System Parameters (θ)
# ══════════════════════════════════════════════════════════════════════════════

class CVEConfiguration(BaseModel):
    """
    System parameters (θ) for a cycle.
    Published in Governance Protocol for transparency.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    
    # TrustScore Weights
    w_id: float = 0.4   # Identity signal weight
    w_comp: float = 0.3  # Completion signal weight
    w_net: float = 0.2   # Network signal weight
    w_hist: float = 0.1  # Historical signal weight
    
    # TrustScore Threshold
    tau_fraude: float = 0.6  # Minimum TS for validation
    
    # CVI Weights (Shapley-derived or fixed)
    w_S: float = 0.25  # Streams weight
    w_E: float = 0.20  # Engagement weight
    w_F: float = 0.15  # Fidelity weight
    w_C: float = 0.15  # Conversion weight
    w_L: float = 0.10  # Legacy weight
    w_N: float = 0.15  # Nebula weight
    
    # CES Parameter
    rho: float = 0.5  # Substitution elasticity (-∞ to 1)
    
    # Stability Constraints (C3)
    max_weight_change: float = 0.10  # |w_a,c - w_a,c-1| <= 0.10
    
    # Diversity Floor (C4)
    diversity_floor: float = 0.3
    
    # Distributable Mass
    md_eur: float = 0.0  # Total EUR to distribute
    
    # Saturation Function
    saturation_type: Literal["log", "sqrt"] = "log"  # log(1+x) or x^0.5
    
    # Status
    status: Literal["draft", "active", "archived"] = "draft"
    published_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def generate_frek_o_ref(work_type: WorkType, creator_frek_id: str) -> str:
    """Generate a unique FREK-O reference for a Work."""
    import secrets
    type_prefix = work_type.value[:3].upper()
    random_part = secrets.token_hex(6).upper()
    return f"FREK-O-{type_prefix}-{random_part}"


def generate_cycle_id(dt: datetime, cycle_type: CycleType) -> str:
    """Generate a cycle ID from a datetime."""
    if cycle_type == CycleType.MONTHLY:
        return dt.strftime("%Y-%m")
    else:  # QUARTERLY
        quarter = (dt.month - 1) // 3 + 1
        return f"{dt.year}-Q{quarter}"
