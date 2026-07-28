"""
KORA Format .fk — Cultural Object Container Specification
=========================================================

Master Prompt Update: Format .fk Architecture

Le format .fk est un conteneur culturel universel qui encapsule
(sans remplacer) les standards existants: ISRC, ISWC, EIDR, DDEX, IMF.

Structure:
├── Media (fichiers audio/video/artwork)
├── Metadata (localisée, multi-langue)
├── Rights (ayants droit, splits, territoires)
├── Creator Identity (FREK-ID, profil)
├── FrekCore Proof (signature, timestamp, hash)
├── Timeline (historique modifications)
├── AI Disclosure (divulgation IA obligatoire)
└── Royalty References (liens vers calculs CVE)

Usage:
- Export album/film complet
- Migration catalogue
- Archivage œuvre
- Synchronisation applications
- Échange inter-plateformes
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum
import uuid
import hashlib
import json


# ══════════════════════════════════════════════════════════════════════════════
# FK CONTAINER VERSION
# ══════════════════════════════════════════════════════════════════════════════

FK_VERSION = "1.0.0"
FK_MAGIC_BYTES = b"FKCO"  # FK Cultural Object


class FKObjectType(str, Enum):
    """Type d'objet culturel .fk"""
    TRACK = "track"
    ALBUM = "album"
    SINGLE = "single"
    EP = "ep"
    FILM = "film"
    SERIES = "series"
    EPISODE = "episode"
    DOCUMENTARY = "documentary"
    CONCERT = "concert"
    PODCAST = "podcast"
    COLLECTION = "collection"
    PLAYLIST = "playlist"


# ══════════════════════════════════════════════════════════════════════════════
# MEDIA LAYER — Fichiers encapsulés
# ══════════════════════════════════════════════════════════════════════════════

class FKMediaAsset(BaseModel):
    """Asset média dans le conteneur .fk"""
    asset_id: str
    role: Literal["master", "preview", "artwork", "subtitle", "lyrics", "waveform", "trailer"]
    
    # File info
    filename: str
    mime_type: str
    size_bytes: int
    checksum_sha256: str
    
    # Technical
    duration_ms: Optional[int] = None
    codec: Optional[str] = None
    bitrate_kbps: Optional[int] = None
    sample_rate_hz: Optional[int] = None
    resolution: Optional[str] = None
    
    # Offset dans le conteneur (pour lecture directe)
    container_offset: Optional[int] = None
    
    # URL externe (si non embarqué)
    external_url: Optional[str] = None
    is_embedded: bool = True


class FKMediaLayer(BaseModel):
    """Couche média du conteneur .fk"""
    assets: List[FKMediaAsset] = Field(default_factory=list)
    total_size_bytes: int = 0
    master_asset_id: Optional[str] = None  # Asset principal


# ══════════════════════════════════════════════════════════════════════════════
# METADATA LAYER — Métadonnées localisées
# ══════════════════════════════════════════════════════════════════════════════

class FKLocalizedString(BaseModel):
    """Chaîne localisée multi-langue"""
    default: str
    translations: Dict[str, str] = Field(default_factory=dict)  # {lang_code: text}
    
    def get(self, lang: str = "fr") -> str:
        return self.translations.get(lang, self.default)


class FKMetadata(BaseModel):
    """Métadonnées complètes de l'œuvre"""
    # Core
    title: FKLocalizedString
    description: Optional[FKLocalizedString] = None
    
    # Industry identifiers (encapsulés, pas remplacés)
    isrc: Optional[str] = None          # International Standard Recording Code
    iswc: Optional[str] = None          # International Standard Musical Work Code
    eidr: Optional[str] = None          # Entertainment Identifier Registry
    upc: Optional[str] = None           # Universal Product Code
    
    # Classification
    genres: List[str] = Field(default_factory=list)
    subgenres: List[str] = Field(default_factory=list)
    moods: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    
    # Cultural tags (pour Nebula Score)
    cultural_tags: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    territories_origin: List[str] = Field(default_factory=list)
    
    # Temporal
    release_date: Optional[datetime] = None
    recording_date: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    
    # Content descriptors
    explicit_content: bool = False
    age_rating: Optional[str] = None
    content_warnings: List[str] = Field(default_factory=list)
    
    # Credits (lisible, pas les splits)
    primary_artists: List[str] = Field(default_factory=list)
    featured_artists: List[str] = Field(default_factory=list)
    composers: List[str] = Field(default_factory=list)
    producers: List[str] = Field(default_factory=list)
    directors: List[str] = Field(default_factory=list)  # Audiovisuel
    writers: List[str] = Field(default_factory=list)
    
    # Display
    display_artist: Optional[str] = None
    display_title: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS LAYER — Droits et territoires
# ══════════════════════════════════════════════════════════════════════════════

class FKRightsHolder(BaseModel):
    """Ayant droit dans le conteneur .fk"""
    holder_id: str
    name: str
    role: str  # performer, writer, producer, label, publisher, studio, sales_agent
    frek_id: Optional[str] = None
    ipi: Optional[str] = None
    isni: Optional[str] = None


class FKRoyaltySplit(BaseModel):
    """Split de royalties"""
    holder_id: str
    percentage: float
    role: str
    territories: List[str] = Field(default_factory=lambda: ["WORLD"])


class FKTerritoryAvail(BaseModel):
    """Disponibilité territoriale"""
    territory: str  # ISO 3166-1 alpha-2 ou "WORLD"
    available: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    business_model: Optional[str] = None  # svod, tvod, avod


class FKRightsLayer(BaseModel):
    """Couche droits du conteneur .fk"""
    holders: List[FKRightsHolder] = Field(default_factory=list)
    splits: List[FKRoyaltySplit] = Field(default_factory=list)
    territories: List[FKTerritoryAvail] = Field(default_factory=list)
    
    # Copyright
    copyright_text: Optional[str] = None
    copyright_year: Optional[int] = None
    p_line: Optional[str] = None
    c_line: Optional[str] = None
    
    # License
    license_type: Optional[str] = None
    license_url: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# CREATOR IDENTITY LAYER — FREK-ID et profil
# ══════════════════════════════════════════════════════════════════════════════

class FKCreatorIdentity(BaseModel):
    """Identité créateur FREK-ID"""
    frek_id: str
    display_name: str
    
    # Profile
    bio: Optional[FKLocalizedString] = None
    profile_image_url: Optional[str] = None
    
    # Social
    social_links: Dict[str, str] = Field(default_factory=dict)
    
    # Verification
    verified: bool = False
    verified_at: Optional[datetime] = None
    
    # Type
    entity_type: Literal["individual", "group", "label", "studio", "ai"] = "individual"
    
    # AI disclosure (si entity_type == "ai")
    ai_operator_frek_id: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# FREKCORE PROOF LAYER — Preuve et signature
# ══════════════════════════════════════════════════════════════════════════════

class FKCoreProof(BaseModel):
    """Preuve FrekCore d'existence et d'intégrité"""
    # Object reference
    frek_o_ref: str  # FREK-O-xxx
    
    # Proof
    proof_hash: str
    proof_timestamp: datetime
    proof_signature: Optional[str] = None
    
    # Chain (si blockchain)
    chain_id: Optional[str] = None
    block_number: Optional[int] = None
    transaction_hash: Optional[str] = None
    
    # Verification URL
    verification_url: Optional[str] = None
    
    # Status
    status: Literal["pending", "validated", "revoked"] = "pending"


# ══════════════════════════════════════════════════════════════════════════════
# TIMELINE LAYER — Historique des modifications
# ══════════════════════════════════════════════════════════════════════════════

class FKTimelineEvent(BaseModel):
    """Événement dans la timeline de l'œuvre"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # created, updated, published, retired, rights_changed, etc.
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actor_frek_id: Optional[str] = None
    description: Optional[str] = None
    changes: Dict[str, Any] = Field(default_factory=dict)


class FKTimeline(BaseModel):
    """Timeline complète de l'œuvre"""
    created_at: datetime
    created_by: Optional[str] = None
    events: List[FKTimelineEvent] = Field(default_factory=list)
    
    def add_event(self, event_type: str, actor: str = None, description: str = None, changes: dict = None):
        event = FKTimelineEvent(
            event_type=event_type,
            actor_frek_id=actor,
            description=description,
            changes=changes or {}
        )
        self.events.append(event)
        return event


# ══════════════════════════════════════════════════════════════════════════════
# AI DISCLOSURE LAYER — Divulgation IA obligatoire
# ══════════════════════════════════════════════════════════════════════════════

class FKAIDisclosure(BaseModel):
    """Divulgation IA obligatoire selon le Master Prompt"""
    is_ai_generated: bool = False
    ai_involvement_level: Optional[Literal["none", "assisted", "partial", "full"]] = None
    
    # Tools used
    ai_tools: List[str] = Field(default_factory=list)  # SUNO, Udio, MidJourney, etc.
    ai_models: List[str] = Field(default_factory=list)
    
    # Human oversight
    human_operator_frek_id: Optional[str] = None
    human_contribution_description: Optional[str] = None
    
    # Legal
    disclosure_text: Optional[FKLocalizedString] = None
    disclosure_timestamp: Optional[datetime] = None


# ══════════════════════════════════════════════════════════════════════════════
# ROYALTY REFERENCES LAYER — Liens vers calculs CVE
# ══════════════════════════════════════════════════════════════════════════════

class FKRoyaltyReference(BaseModel):
    """Référence vers les calculs de royalties"""
    cycle_id: str  # Ex: "2026-07"
    cve_record_id: Optional[str] = None
    
    # Metrics snapshot
    cvi: Optional[float] = None
    uvc_allocated: Optional[float] = None
    uvc_value_eur: Optional[float] = None
    
    # Link
    statement_url: Optional[str] = None


class FKRoyaltyLayer(BaseModel):
    """Couche royalties du conteneur .fk"""
    references: List[FKRoyaltyReference] = Field(default_factory=list)
    total_earned_eur: float = 0.0
    total_streams: int = 0


# ══════════════════════════════════════════════════════════════════════════════
# FK CONTAINER — Conteneur principal
# ══════════════════════════════════════════════════════════════════════════════

class FKContainer(BaseModel):
    """
    Conteneur .fk complet — Cultural Object Container
    
    Encapsule tous les aspects d'une œuvre culturelle:
    - Media, Metadata, Rights, Identity, Proof, Timeline, AI, Royalties
    """
    # Header
    fk_version: str = FK_VERSION
    object_id: str = Field(default_factory=lambda: f"FK-{uuid.uuid4().hex[:16].upper()}")
    object_type: FKObjectType
    
    # Layers
    media: FKMediaLayer = Field(default_factory=FKMediaLayer)
    metadata: FKMetadata
    rights: FKRightsLayer = Field(default_factory=FKRightsLayer)
    creator: FKCreatorIdentity
    frekcore_proof: Optional[FKCoreProof] = None
    timeline: FKTimeline
    ai_disclosure: FKAIDisclosure = Field(default_factory=FKAIDisclosure)
    royalties: FKRoyaltyLayer = Field(default_factory=FKRoyaltyLayer)
    
    # Container integrity
    container_checksum: Optional[str] = None
    
    # Export metadata
    exported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    exported_by: Optional[str] = None
    export_source: str = "kora"
    
    def compute_checksum(self) -> str:
        """Calculer le checksum du conteneur"""
        data = self.json(exclude={"container_checksum"})
        return hashlib.sha256(data.encode()).hexdigest()
    
    def validate_integrity(self) -> bool:
        """Valider l'intégrité du conteneur"""
        if not self.container_checksum:
            return False
        return self.compute_checksum() == self.container_checksum
    
    def finalize(self):
        """Finaliser le conteneur avec checksum"""
        self.container_checksum = self.compute_checksum()
        return self
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# FK SERVICE — Création et manipulation
# ══════════════════════════════════════════════════════════════════════════════

class FKService:
    """Service de création et manipulation de conteneurs .fk"""
    
    @staticmethod
    def create_from_work(work: dict, assets: List[dict] = None) -> FKContainer:
        """Créer un conteneur .fk depuis un Work KORA"""
        
        # Determine object type
        work_type = work.get("type", "music")
        if work_type == "music":
            obj_type = FKObjectType.TRACK
        elif work_type == "audiovisual_catalog":
            obj_type = FKObjectType.FILM
        elif work_type == "audiovisual_creator":
            obj_type = FKObjectType.DOCUMENTARY
        else:
            obj_type = FKObjectType.TRACK
        
        # Build metadata
        metadata = FKMetadata(
            title=FKLocalizedString(default=work.get("title", "Untitled")),
            description=FKLocalizedString(default=work.get("description", "")) if work.get("description") else None,
            isrc=work.get("isrc"),
            eidr=work.get("eidr"),
            genres=work.get("genres", []),
            languages=work.get("languages", []),
            territories_origin=work.get("territories_origin", []),
            release_date=work.get("published_at"),
            duration_seconds=work.get("duration_seconds"),
            explicit_content=work.get("explicit_content", False),
            primary_artists=work.get("primary_artists", []),
            display_artist=work.get("display_artist"),
        )
        
        # Build creator identity
        creator = FKCreatorIdentity(
            frek_id=work.get("creator_frek_id") or work.get("rights_holder_ref", "unknown"),
            display_name=work.get("display_artist") or "Unknown Artist",
        )
        
        # Build timeline
        timeline = FKTimeline(
            created_at=work.get("created_at", datetime.now(timezone.utc)),
            created_by=work.get("creator_frek_id"),
        )
        timeline.add_event("created", description="Work created in KORA")
        
        if work.get("status") == "published":
            timeline.add_event("published", description="Work published on KORA")
        
        # Build AI disclosure
        ai_disclosure = FKAIDisclosure()
        if work.get("ai_disclosure"):
            ai_data = work["ai_disclosure"]
            ai_disclosure = FKAIDisclosure(
                is_ai_generated=ai_data.get("is_ai_generated", False),
                ai_tools=[ai_data.get("ai_tool")] if ai_data.get("ai_tool") else [],
                ai_models=[ai_data.get("ai_model")] if ai_data.get("ai_model") else [],
                human_operator_frek_id=ai_data.get("human_operator_frek_id"),
            )
        
        # Build media layer
        media = FKMediaLayer()
        if assets:
            for asset in assets:
                media_asset = FKMediaAsset(
                    asset_id=asset.get("asset_id", str(uuid.uuid4())),
                    role="master" if asset.get("kind") in ["audio_master", "video_master"] else "preview",
                    filename=asset.get("filename", "unknown"),
                    mime_type=asset.get("format", "audio/mpeg"),
                    size_bytes=asset.get("file_size_bytes", 0),
                    checksum_sha256=asset.get("checksum_sha256", ""),
                    duration_ms=work.get("duration_seconds", 0) * 1000 if work.get("duration_seconds") else None,
                    external_url=asset.get("storage_url"),
                    is_embedded=False,
                )
                media.assets.append(media_asset)
                if media_asset.role == "master":
                    media.master_asset_id = media_asset.asset_id
        
        # Build FrekCore proof if available
        frekcore_proof = None
        if work.get("frekcore_ref"):
            frekcore_proof = FKCoreProof(
                frek_o_ref=work.get("frekcore_ref"),
                proof_hash=hashlib.sha256(work.get("frekcore_ref", "").encode()).hexdigest(),
                proof_timestamp=work.get("frekcore_validated_at", datetime.now(timezone.utc)),
                status="validated" if work.get("frekcore_validated") else "pending",
            )
        
        # Create container
        container = FKContainer(
            object_type=obj_type,
            media=media,
            metadata=metadata,
            creator=creator,
            frekcore_proof=frekcore_proof,
            timeline=timeline,
            ai_disclosure=ai_disclosure,
        )
        
        return container.finalize()
    
    @staticmethod
    def export_to_json(container: FKContainer) -> str:
        """Exporter en JSON"""
        return container.json(indent=2)
    
    @staticmethod
    def export_to_bytes(container: FKContainer) -> bytes:
        """Exporter en bytes (format binaire .fk)"""
        # Header: magic bytes + version + type
        header = FK_MAGIC_BYTES + FK_VERSION.encode()
        
        # Payload: JSON compressed
        payload = container.json().encode()
        
        # Full container
        return header + payload
    
    @staticmethod
    def import_from_bytes(data: bytes) -> FKContainer:
        """Importer depuis bytes"""
        if not data.startswith(FK_MAGIC_BYTES):
            raise ValueError("Invalid .fk file: missing magic bytes")
        
        # Skip header
        payload = data[len(FK_MAGIC_BYTES) + len(FK_VERSION):]
        
        # Parse JSON
        return FKContainer.parse_raw(payload)


# ══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "FK_VERSION",
    "FKObjectType",
    "FKMediaAsset",
    "FKMediaLayer",
    "FKLocalizedString",
    "FKMetadata",
    "FKRightsHolder",
    "FKRoyaltySplit",
    "FKTerritoryAvail",
    "FKRightsLayer",
    "FKCreatorIdentity",
    "FKCoreProof",
    "FKTimelineEvent",
    "FKTimeline",
    "FKAIDisclosure",
    "FKRoyaltyReference",
    "FKRoyaltyLayer",
    "FKContainer",
    "FKService",
]
