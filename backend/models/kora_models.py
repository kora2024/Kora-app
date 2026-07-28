"""
KORA Data Models — Master Prompt Section 4
==========================================

Schéma pivot central, indépendant du type de contenu.
Permet à tous les modules (lecteur, bibliothèque, recherche, recommandation)
de fonctionner sans dupliquer de logique.

Entités:
- Work: Œuvre créative (musique, audiovisuel_catalog, audiovisuel_creator)
- Asset: Fichier numérique (audio, video, artwork, subtitle, lyrics)
- Release: Collection d'œuvres (album, EP, single, film, series, season, episode)
- Avail: Disponibilité territoriale (audiovisuel uniquement)
- RightsHolder: Détenteur de droits (artist, label, studio, sales_agent, creator, ai_artist)
- RoyaltySplit: Configuration de distribution des royalties
- LabelAccount: Compte label multi-DSP (pour LabelOS)

Standards supportés:
- ISRC (musique)
- ISWC (composition)
- EIDR (audiovisuel)
- IPI (auteurs/compositeurs)
- ERN (Electronic Release Notification)
- MEC (Media Entertainment Core)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal, Union
from datetime import datetime, timezone
from enum import Enum
import uuid
import re


# ══════════════════════════════════════════════════════════════════════════════
# ENUMS — Classifications selon Master Prompt Section 4
# ══════════════════════════════════════════════════════════════════════════════

class WorkType(str, Enum):
    """Type de contenu - détermine le pipeline d'ingestion"""
    MUSIC = "music"                           # ERN/DDEX pipeline
    AUDIOVISUAL_CATALOG = "audiovisual_catalog"  # EIDR/MEC/Avails (films, séries)
    AUDIOVISUAL_CREATOR = "audiovisual_creator"  # Upload créateur léger (clips, lives)


class AssetKind(str, Enum):
    """Type d'asset numérique"""
    AUDIO_MASTER = "audio_master"
    VIDEO_MASTER = "video_master"
    ARTWORK = "artwork"
    SUBTITLE = "subtitle"
    LYRICS = "lyrics"
    WAVEFORM = "waveform"
    TRAILER = "trailer"


class AssetQuality(str, Enum):
    """Niveau de qualité audio/video"""
    STANDARD = "standard"        # 128-256 kbps / 720p
    HIGH = "high"               # 320 kbps / 1080p
    LOSSLESS = "lossless"       # FLAC / 4K
    HI_RES = "hi-res"           # 24-bit 96kHz+ / 4K HDR
    DOLBY_ATMOS = "dolby-atmos" # Spatial Audio
    IMF = "imf"                 # SMPTE IMF master


class ReleaseType(str, Enum):
    """Type de release"""
    # Musique
    SINGLE = "single"
    EP = "ep"
    ALBUM = "album"
    COMPILATION = "compilation"
    MIXTAPE = "mixtape"
    LIVE_ALBUM = "live_album"
    # Audiovisuel
    FILM = "film"
    SERIES = "series"
    SEASON = "season"
    EPISODE = "episode"
    DOCUMENTARY = "documentary"
    CONCERT = "concert"


class RightsHolderType(str, Enum):
    """Type de détenteur de droits (Master Prompt Section 4)"""
    ARTIST = "artist"
    LABEL = "label"
    STUDIO = "studio"
    SALES_AGENT = "sales_agent"
    CREATOR = "creator"
    AI_ARTIST = "ai_artist"      # Extension pour artiste IA
    PUBLISHER = "publisher"
    DISTRIBUTOR = "distributor"
    COLLECTIVE = "collective"


class BusinessModel(str, Enum):
    """Modèle économique pour Avails (Section 7)"""
    SVOD = "svod"        # Subscription VOD
    TVOD = "tvod"        # Transactional VOD
    AVOD = "avod"        # Ad-supported VOD
    FAST = "fast"        # Free Ad-Supported TV
    THEATRICAL = "theatrical"
    EST = "est"          # Electronic Sell-Through


class WorkStatus(str, Enum):
    """Cycle de vie d'un Work (Section 14.1)"""
    DRAFT = "draft"
    INGESTED = "ingested"
    VALIDATED = "validated"
    PUBLISHED = "published"
    UPDATED = "updated"
    RETIRED = "retired"


class RoyaltyRole(str, Enum):
    """Rôle dans le split de royalties"""
    PERFORMER = "performer"
    WRITER = "writer"
    COMPOSER = "composer"
    PRODUCER = "producer"
    LABEL = "label"
    SALES_AGENT = "sales_agent"
    PUBLISHER = "publisher"
    MASTER_OWNER = "master_owner"


class PayoutMethod(str, Enum):
    """Méthode de paiement (Section 10)"""
    FIAT = "fiat"
    JCC = "jcc"          # CVLN Wallet / JCC Token


# ══════════════════════════════════════════════════════════════════════════════
# WORK — Entité Centrale (Master Prompt Section 4)
# ══════════════════════════════════════════════════════════════════════════════

class LocalizedText(BaseModel):
    """Texte localisable (FR/EN/créole/wolof...)"""
    fr: Optional[str] = None
    en: Optional[str] = None
    wo: Optional[str] = None      # Wolof
    ht: Optional[str] = None      # Haitian Creole
    pt: Optional[str] = None      # Portuguese
    es: Optional[str] = None      # Spanish
    
    def get(self, lang: str = "fr") -> Optional[str]:
        return getattr(self, lang, None) or self.fr or self.en


class DeliveryMetadata(BaseModel):
    """Métadonnées de livraison selon le type"""
    # ERN (musique)
    ern_message_id: Optional[str] = None
    ern_version: Optional[str] = None
    
    # MEC (audiovisuel_catalog)
    mec_version: Optional[str] = None
    mec_basic_metadata: Optional[Dict[str, Any]] = None
    
    # Léger (audiovisuel_creator)
    upload_source: Optional[str] = None
    original_filename: Optional[str] = None


class AIDisclosure(BaseModel):
    """Divulgation IA obligatoire (Master Prompt Section 4)"""
    is_ai_generated: bool = False
    ai_model: Optional[str] = None           # Ex: "SUNO v4", "Udio"
    ai_tool: Optional[str] = None            # Outil utilisé
    human_operator_frek_id: Optional[str] = None  # Opérateur humain responsable
    disclosure_text: Optional[str] = None    # Texte de divulgation


class Work(BaseModel):
    """
    Œuvre créative dans l'écosystème KORA.
    
    Le champ `type` détermine le pipeline d'ingestion:
    - music: ERN/DDEX
    - audiovisual_catalog: EIDR/MEC/Avails
    - audiovisual_creator: Upload créateur léger
    """
    # Identifiants
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_id: str = Field(default_factory=lambda: f"KORA-W-{uuid.uuid4().hex[:12].upper()}")
    
    # Type - détermine le pipeline
    type: WorkType
    
    # Identifiants universels
    universal_id: Optional[str] = None  # ISRC (music) | EIDR (audiovisual_catalog)
    isrc: Optional[str] = None          # International Standard Recording Code
    iswc: Optional[str] = None          # International Standard Musical Work Code
    eidr: Optional[str] = None          # Entertainment Identifier Registry
    
    # Métadonnées de base (localisables)
    title: str
    title_localized: Optional[LocalizedText] = None
    description: Optional[str] = None
    description_localized: Optional[LocalizedText] = None
    
    # Durée et format
    duration_seconds: Optional[int] = None
    explicit_content: bool = False
    
    # Release
    release_ref: Optional[str] = None    # release_id
    track_number: Optional[int] = None
    disc_number: Optional[int] = None
    
    # Rights Holder
    rights_holder_ref: str               # rights_holder_id principal
    
    # Territorial (audiovisual_catalog)
    territory_availability: List[str] = Field(default_factory=list)  # avail_ids
    
    # Métadonnées de livraison
    delivery_metadata: Optional[DeliveryMetadata] = None
    
    # FrekCore Integration
    frekcore_ref: Optional[str] = None   # Signature / preuve d'existence
    frekcore_validated: bool = False
    frekcore_validated_at: Optional[datetime] = None
    
    # Assets
    assets: List[str] = Field(default_factory=list)  # asset_ids
    
    # IA Disclosure (Master Prompt Section 4 - Extension)
    ai_disclosure: Optional[AIDisclosure] = None
    
    @property
    def is_ai_generated(self) -> bool:
        return self.ai_disclosure.is_ai_generated if self.ai_disclosure else False
    
    # Cultural metadata (pour Nebula Score)
    genres: List[str] = Field(default_factory=list)
    subgenres: List[str] = Field(default_factory=list)
    moods: List[str] = Field(default_factory=list)
    cultural_tags: List[str] = Field(default_factory=list)  # diaspora, generation, style
    languages: List[str] = Field(default_factory=list)
    territories_origin: List[str] = Field(default_factory=list)  # ISO country codes
    
    # Collaborators
    primary_artists: List[str] = Field(default_factory=list)   # frek_ids
    featured_artists: List[str] = Field(default_factory=list)  # frek_ids
    composers: List[str] = Field(default_factory=list)         # frek_ids
    producers: List[str] = Field(default_factory=list)         # frek_ids
    
    # Display
    display_artist: Optional[str] = None
    display_title: Optional[str] = None
    
    # Status (Section 14.1 cycle de vie)
    status: WorkStatus = WorkStatus.DRAFT
    status_dirty: bool = False  # True si mise à jour en attente de propagation
    
    # Visibility
    visibility: Literal["public", "private", "unlisted"] = "public"
    
    # CVE Metrics (calculés par le Cultural Value Engine)
    cvi_current: Optional[float] = None
    trust_score_current: Optional[float] = None
    nebula_score_current: Optional[float] = None
    chl_classification: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    retired_at: Optional[datetime] = None
    
    # Source tracking
    ingestion_source: Optional[str] = None  # labelOS, distributor, self-serve
    ingestion_partner: Optional[str] = None  # JTV Digital, Jaiye, Wiseband, etc.
    
    class Config:
        use_enum_values = True

    @validator('isrc')
    def validate_isrc(cls, v):
        if v and not re.match(r'^[A-Z]{2}[A-Z0-9]{3}\d{7}$', v):
            raise ValueError('Invalid ISRC format')
        return v


# ══════════════════════════════════════════════════════════════════════════════
# ASSET — Fichier Numérique
# ══════════════════════════════════════════════════════════════════════════════

class TranscodedVariant(BaseModel):
    """Variante transcodée d'un asset"""
    format: str              # mp3, aac, flac, mp4, webm
    quality: AssetQuality
    bitrate_kbps: Optional[int] = None
    resolution: Optional[str] = None  # 1080p, 4K, etc.
    storage_url: str
    file_size_bytes: Optional[int] = None


class Asset(BaseModel):
    """
    Asset numérique associé à un Work.
    Plusieurs assets peuvent exister pour le même Work (différentes qualités).
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str = Field(default_factory=lambda: f"KORA-A-{uuid.uuid4().hex[:12].upper()}")
    work_id: str
    
    # Type et qualité
    kind: AssetKind
    format: str              # mp3, flac, m4a, mp4, mkv, srt, lrc, png, jpg
    quality_tier: AssetQuality
    
    # Caractéristiques techniques (audio)
    bitrate_kbps: Optional[int] = None
    sample_rate_hz: Optional[int] = None
    bit_depth: Optional[int] = None
    channels: Optional[int] = None  # 2 = stereo, 6 = 5.1, etc.
    
    # Caractéristiques techniques (video)
    resolution: Optional[str] = None      # 1920x1080, 3840x2160
    frame_rate: Optional[float] = None    # 24, 25, 30, 60
    codec: Optional[str] = None           # h264, h265, av1
    hdr_format: Optional[str] = None      # HDR10, Dolby Vision
    
    # Stockage
    storage_url: str
    storage_provider: str = "cloudinary"  # cloudinary, r2, s3, archive
    storage_bucket: Optional[str] = None
    file_size_bytes: Optional[int] = None
    checksum_sha256: Optional[str] = None
    
    # Streaming URLs
    stream_url: Optional[str] = None
    stream_hls_url: Optional[str] = None
    stream_dash_url: Optional[str] = None
    
    # Artwork specific
    width: Optional[int] = None
    height: Optional[int] = None
    
    # Subtitle specific
    language: Optional[str] = None        # ISO 639-1
    subtitle_type: Optional[str] = None   # srt, vtt, ttml
    
    # Lyrics specific
    lyrics_synced: bool = False
    
    # Waveform data (for player visualization)
    waveform_data: Optional[List[float]] = None
    waveform_peaks: Optional[int] = None
    
    # Transcoded variants
    transcoded_variants: List[TranscodedVariant] = Field(default_factory=list)
    
    # DRM (Section 15)
    drm_required: bool = False
    drm_systems: List[str] = Field(default_factory=list)  # widevine, fairplay
    
    # Status
    status: Literal["processing", "ready", "error", "archived"] = "processing"
    processing_error: Optional[str] = None
    
    # FK Package (Section 5)
    fk_package_url: Optional[str] = None  # .fk file URL if generated
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# RELEASE — Collection d'Œuvres
# ══════════════════════════════════════════════════════════════════════════════

class Release(BaseModel):
    """
    Release (album, EP, single, film, série, saison, épisode).
    Contient une liste ordonnée de Works.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    release_id: str = Field(default_factory=lambda: f"KORA-R-{uuid.uuid4().hex[:12].upper()}")
    
    # Type
    type: ReleaseType
    
    # Identifiants
    upc: Optional[str] = None             # Universal Product Code (musique)
    eidr: Optional[str] = None            # EIDR (audiovisuel)
    catalog_number: Optional[str] = None  # Numéro de catalogue label
    
    # Métadonnées
    title: str
    title_localized: Optional[LocalizedText] = None
    description: Optional[str] = None
    
    # Creator/Label
    creator_frek_id: str
    creator_display_name: str
    label: Optional[str] = None
    label_ref: Optional[str] = None  # rights_holder_id du label
    
    # Works
    works: List[str] = Field(default_factory=list)  # work_ids ordonnés
    track_count: int = 0
    total_duration_seconds: int = 0
    
    # Series specific (audiovisuel)
    parent_release_id: Optional[str] = None  # Pour season → series, episode → season
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    
    # Artwork
    artwork_url: Optional[str] = None
    artwork_thumbnail_url: Optional[str] = None
    banner_url: Optional[str] = None      # Pour les séries
    
    # Release info
    release_date: Optional[datetime] = None
    original_release_date: Optional[datetime] = None  # Pour les rééditions
    
    # Genres and tags
    genres: List[str] = Field(default_factory=list)
    
    # Copyright
    copyright_text: Optional[str] = None
    copyright_year: Optional[int] = None
    p_line: Optional[str] = None  # ℗ line (phonographic)
    c_line: Optional[str] = None  # © line (copyright)
    
    # Status
    status: Literal["draft", "scheduled", "published", "archived"] = "draft"
    scheduled_release: Optional[datetime] = None
    
    # FrekCore
    frekcore_ref: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# AVAIL — Disponibilité Territoriale (Audiovisuel - Section 7)
# ══════════════════════════════════════════════════════════════════════════════

class Avail(BaseModel):
    """
    Disponibilité d'un contenu audiovisuel par territoire et modèle économique.
    
    Suit le standard EMA Avails pour le windowing:
    - ~45 jours salle → VOD payant
    - ~90-120 jours jusqu'à SVOD
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    avail_id: str = Field(default_factory=lambda: f"KORA-AV-{uuid.uuid4().hex[:8].upper()}")
    
    # Work reference
    work_id: str
    
    # Territory (ISO 3166-1 alpha-2)
    territory: str
    
    # Business model
    business_model: BusinessModel
    
    # Window
    start_date: datetime
    end_date: Optional[datetime] = None  # None = perpetual
    
    # Pricing (TVOD/EST)
    price_tier: Optional[str] = None     # SD, HD, 4K
    price_amount: Optional[float] = None
    price_currency: str = "EUR"
    
    # Rental specific (TVOD)
    rental_duration_hours: Optional[int] = None
    
    # Rights info
    exclusive: bool = False
    holdback_days: Optional[int] = None  # Jours avant disponibilité
    
    # Status
    status: Literal["active", "expired", "blocked", "pending"] = "pending"
    
    # Geo-blocking enforcement
    geo_blocked: bool = False
    geo_block_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS HOLDER — Détenteur de Droits
# ══════════════════════════════════════════════════════════════════════════════

class RightsHolder(BaseModel):
    """
    Entité détentrice de droits sur un Work.
    
    Types supportés (Master Prompt Section 4):
    - artist, label, studio, sales_agent, creator, ai_artist
    
    Note: Un ai_artist ne peut jamais être le porteur final des royalties.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rights_holder_id: str = Field(default_factory=lambda: f"KORA-RH-{uuid.uuid4().hex[:12].upper()}")
    
    # Identity
    frek_id: Optional[str] = None  # Si utilisateur KORA enregistré
    name: str
    type: RightsHolderType
    
    # Contact
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Industry identifiers
    ipi_number: Optional[str] = None      # Interested Parties Information
    isni: Optional[str] = None            # International Standard Name Identifier
    ipn: Optional[str] = None             # International Performer Number
    
    # Payment (Section 10)
    jcc_wallet_address: Optional[str] = None
    payout_method: PayoutMethod = PayoutMethod.FIAT
    bank_account_ref: Optional[str] = None  # Référence compte bancaire (chiffré)
    
    # Territories
    territories: List[str] = Field(default_factory=list)  # Where rights apply
    
    # For AI Artist (Section 4 extension)
    ai_artist_operator_ref: Optional[str] = None  # rights_holder_id de l'opérateur humain
    
    # Status
    verified: bool = False
    verified_at: Optional[datetime] = None
    verification_method: Optional[str] = None  # frek_id, document, etc.
    
    # Profile
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# ROYALTY SPLIT — Distribution des Royalties
# ══════════════════════════════════════════════════════════════════════════════

class RoyaltySplitEntry(BaseModel):
    """Entrée dans un split de royalties"""
    rights_holder_ref: str  # rights_holder_id
    percentage: float = Field(ge=0, le=100)
    role: RoyaltyRole
    payout_method: PayoutMethod = PayoutMethod.FIAT
    
    class Config:
        use_enum_values = True


class RoyaltySplit(BaseModel):
    """
    Configuration de distribution des royalties pour un Work.
    
    Règle: Les pourcentages doivent totaliser 100%.
    Règle AI: Un ai_artist ne peut jamais recevoir de royalties directement.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    split_id: str = Field(default_factory=lambda: f"KORA-SP-{uuid.uuid4().hex[:12].upper()}")
    
    # Work reference
    work_id: str
    
    # Split configuration
    splits: List[RoyaltySplitEntry] = Field(default_factory=list)
    
    # Validation
    total_percentage: float = 100.0
    
    # Status
    status: Literal["draft", "pending_approval", "active", "disputed", "archived"] = "draft"
    approved_by_all: bool = False
    
    # Approval tracking
    approvals: Dict[str, datetime] = Field(default_factory=dict)  # rights_holder_id -> approved_at
    
    # Dispute
    dispute_reason: Optional[str] = None
    disputed_at: Optional[datetime] = None
    disputed_by: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    effective_from: Optional[datetime] = None
    
    @validator('splits')
    def validate_total_percentage(cls, v):
        total = sum(entry.percentage for entry in v)
        if abs(total - 100.0) > 0.01:
            raise ValueError(f'Split percentages must total 100%, got {total}%')
        return v
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# LABEL ACCOUNT — Compte Label Multi-DSP (Section 22)
# ══════════════════════════════════════════════════════════════════════════════

class DSPConnection(BaseModel):
    """Connexion à un DSP externe"""
    dsp: str  # kora, spotify, apple_music, deezer, boomplay, tidal, etc.
    connected: bool = False
    connected_at: Optional[datetime] = None
    credentials_ref: Optional[str] = None  # Référence sécurisée aux credentials
    last_sync: Optional[datetime] = None
    sync_status: Literal["ok", "error", "pending"] = "pending"


class LabelAccount(BaseModel):
    """
    Compte label pour LabelOS (Master Prompt Section 22).
    
    Permet la gestion multi-DSP et la vue consolidée des royalties
    tous DSP confondus, pas seulement KORA.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label_id: str = Field(default_factory=lambda: f"KORA-LB-{uuid.uuid4().hex[:12].upper()}")
    
    # Rights holder reference
    rights_holder_ref: str  # Le RightsHolder de type "label"
    
    # Label info
    name: str
    display_name: Optional[str] = None
    
    # Connected DSPs
    connected_dsps: List[DSPConnection] = Field(default_factory=list)
    
    # Delivery status per DSP
    delivery_status: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    
    # Artists under label
    artist_refs: List[str] = Field(default_factory=list)  # rights_holder_ids
    
    # Team access (multi-utilisateurs)
    team_members: List[Dict[str, Any]] = Field(default_factory=list)  # [{frek_id, role, permissions}]
    
    # Royalty aggregation
    consolidated_royalty_enabled: bool = True
    
    # Settings
    default_payout_method: PayoutMethod = PayoutMethod.FIAT
    auto_distribute: bool = False  # Auto-distribute royalties to artists
    
    # Status
    status: Literal["active", "suspended", "archived"] = "active"
    verified: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def generate_work_id() -> str:
    """Générer un work_id unique KORA"""
    return f"KORA-W-{uuid.uuid4().hex[:12].upper()}"


def generate_asset_id() -> str:
    """Générer un asset_id unique KORA"""
    return f"KORA-A-{uuid.uuid4().hex[:12].upper()}"


def generate_release_id() -> str:
    """Générer un release_id unique KORA"""
    return f"KORA-R-{uuid.uuid4().hex[:12].upper()}"


def validate_isrc(isrc: str) -> bool:
    """Valider un ISRC (International Standard Recording Code)"""
    # Format: CC-XXX-YY-NNNNN (12 caractères sans tirets)
    pattern = r'^[A-Z]{2}[A-Z0-9]{3}\d{7}$'
    return bool(re.match(pattern, isrc.replace('-', '')))


def validate_eidr(eidr: str) -> bool:
    """Valider un EIDR (Entertainment Identifier Registry)"""
    # Format: 10.5240/XXXX-XXXX-XXXX-XXXX-XXXX-C
    pattern = r'^10\.5240/[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-Z]$'
    return bool(re.match(pattern, eidr))


def validate_upc(upc: str) -> bool:
    """Valider un UPC (Universal Product Code)"""
    # Format: 12 ou 13 chiffres
    return upc.isdigit() and len(upc) in [12, 13]


# ══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Enums
    "WorkType",
    "AssetKind", 
    "AssetQuality",
    "ReleaseType",
    "RightsHolderType",
    "BusinessModel",
    "WorkStatus",
    "RoyaltyRole",
    "PayoutMethod",
    # Models
    "LocalizedText",
    "DeliveryMetadata",
    "AIDisclosure",
    "Work",
    "TranscodedVariant",
    "Asset",
    "Release",
    "Avail",
    "RightsHolder",
    "RoyaltySplitEntry",
    "RoyaltySplit",
    "DSPConnection",
    "LabelAccount",
    # Helpers
    "generate_work_id",
    "generate_asset_id",
    "generate_release_id",
    "validate_isrc",
    "validate_eidr",
    "validate_upc",
]
