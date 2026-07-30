"""
KORA Cultural Context Models — Master Blueprint 2055
====================================================

Based on: kora_master_2055_emergent_blueprint.md

Cultural Context is a first-class entity, not a static enum.
Every Work must have rich cultural metadata for Nebula Score calculation.

Protobuf-style structure translated to Python/Pydantic.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum
import uuid


# ══════════════════════════════════════════════════════════════════════════════
# TERRITORY SYSTEM — ISO 3166-2 Extended
# ══════════════════════════════════════════════════════════════════════════════

class TerritoryRegion(str, Enum):
    """Macro-regions for cultural clustering"""
    CARIBBEAN = "caribbean"
    WEST_AFRICA = "west_africa"
    CENTRAL_AFRICA = "central_africa"
    EAST_AFRICA = "east_africa"
    NORTH_AFRICA = "north_africa"
    SOUTHERN_AFRICA = "southern_africa"
    WESTERN_EUROPE = "western_europe"
    EASTERN_EUROPE = "eastern_europe"
    NORTH_AMERICA = "north_america"
    SOUTH_AMERICA = "south_america"
    CENTRAL_AMERICA = "central_america"
    EAST_ASIA = "east_asia"
    SOUTH_ASIA = "south_asia"
    SOUTHEAST_ASIA = "southeast_asia"
    MIDDLE_EAST = "middle_east"
    OCEANIA = "oceania"
    DIASPORA_EUROPE = "diaspora_europe"
    DIASPORA_AMERICAS = "diaspora_americas"


class Territory(BaseModel):
    """Territory with cultural metadata"""
    iso_code: str  # ISO 3166-1 alpha-2 (FR, SN, MQ, etc.)
    name: str
    name_native: Optional[str] = None
    region: TerritoryRegion
    
    # Cultural attributes
    primary_languages: List[str] = Field(default_factory=list)  # ISO 639-3
    cultural_influences: List[str] = Field(default_factory=list)  # Other territory codes
    diaspora_communities: List[str] = Field(default_factory=list)  # Where diaspora lives
    
    # Music ecosystem
    primary_genres: List[str] = Field(default_factory=list)
    historical_genres: List[str] = Field(default_factory=list)
    
    # Payment & Localization
    currency: str = "EUR"
    payment_methods: List[str] = Field(default_factory=lambda: ["card"])
    timezone: str = "UTC"


# ══════════════════════════════════════════════════════════════════════════════
# GENRE ONTOLOGY — COE (Culture Ontology Engine)
# ══════════════════════════════════════════════════════════════════════════════

class GenreNode(BaseModel):
    """Genre in the Cultural Ontology Engine"""
    id: str = Field(default_factory=lambda: f"genre-{uuid.uuid4().hex[:8]}")
    name: str
    name_localized: Dict[str, str] = Field(default_factory=dict)
    
    # Lineage
    parent_genres: List[str] = Field(default_factory=list)  # Parent genre IDs
    child_genres: List[str] = Field(default_factory=list)  # Child genre IDs
    related_genres: List[str] = Field(default_factory=list)  # Sibling/cousin genres
    
    # Origin
    origin_territories: List[str] = Field(default_factory=list)
    origin_period: Optional[str] = None  # e.g., "1970s", "pre-colonial"
    
    # Characteristics
    tempo_range: Optional[tuple] = None  # (min_bpm, max_bpm)
    typical_instruments: List[str] = Field(default_factory=list)
    vocal_styles: List[str] = Field(default_factory=list)
    
    # Ritual/Context
    ritual_contexts: List[str] = Field(default_factory=list)  # carnaval, funeral, wedding, etc.
    typical_occasions: List[str] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# CULTURAL CONTEXT — Protobuf-style (Master Blueprint)
# ══════════════════════════════════════════════════════════════════════════════

class CulturalContext(BaseModel):
    """
    Cultural Context for a Work (Protobuf-equivalent)
    
    From Master Blueprint:
    message CulturalContext {
        string territory_iso = 1;
        repeated string diaspora_links = 2;
        repeated string genre_lineage = 3;
        string language_iso = 4;
        repeated string ritual_usage = 5;
        string creation_circumstances = 6;
    }
    """
    # Primary territory of origin
    territory_iso: str  # ISO 3166-2
    
    # Diaspora connections (where the music travels/resonates)
    diaspora_links: List[str] = Field(default_factory=list)  # ISO codes
    
    # Genre lineage (COE ontology references)
    genre_lineage: List[str] = Field(default_factory=list)  # Genre IDs or names
    
    # Primary language
    language_iso: str = "fr"  # ISO 639-3
    additional_languages: List[str] = Field(default_factory=list)
    
    # Ritual/ceremonial usage
    ritual_usage: List[str] = Field(default_factory=list)  # carnaval, toussaint, mariage, etc.
    
    # Creation circumstances
    creation_circumstances: Optional[str] = None  # Context of creation
    
    # Extended cultural metadata
    generation_target: Optional[str] = None  # youth, adult, elder, all
    temporal_context: Optional[str] = None  # modern, traditional, fusion
    spiritual_context: Optional[str] = None  # secular, sacred, syncretic
    dance_style: Optional[str] = None  # Associated dance
    
    # For Nebula Score axes
    style_tags: List[str] = Field(default_factory=list)
    collaboration_type: Literal["solo", "duo", "group", "collective", "international"] = "solo"


# ══════════════════════════════════════════════════════════════════════════════
# PROVENANCE — Origin & Rights Chain
# ══════════════════════════════════════════════════════════════════════════════

class Provenance(BaseModel):
    """Provenance tracking for a Work"""
    # Original creation
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str  # FREK-ID
    creation_location: Optional[str] = None  # Studio, city
    
    # Recording info
    recording_date: Optional[datetime] = None
    recording_location: Optional[str] = None
    recording_studio: Optional[str] = None
    
    # Chain of custody
    rights_chain: List[Dict[str, Any]] = Field(default_factory=list)
    # [{"holder": "frek-xxx", "type": "original", "date": "..."}, ...]
    
    # Samples/interpolations
    samples: List[Dict[str, str]] = Field(default_factory=list)
    # [{"work_id": "...", "cleared": True, "rights_holder": "..."}]
    
    # AI involvement
    ai_generated: bool = False
    ai_tools_used: List[str] = Field(default_factory=list)
    human_contribution_percentage: int = 100  # 0-100


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS — Simplified Rights Model
# ══════════════════════════════════════════════════════════════════════════════

class Rights(BaseModel):
    """Rights information for a Work"""
    # Primary rights holder
    master_owner: str  # FREK-ID
    publishing_owner: Optional[str] = None  # FREK-ID
    
    # License type
    license_type: Literal[
        "all_rights_reserved",
        "creative_commons",
        "kora_standard",
        "kora_creator",
        "sync_available",
        "public_domain"
    ] = "kora_standard"
    
    # Territory restrictions
    available_territories: List[str] = Field(default_factory=lambda: ["WORLD"])
    restricted_territories: List[str] = Field(default_factory=list)
    
    # Sync licensing
    sync_available: bool = False
    sync_contact: Optional[str] = None
    sync_min_fee_eur: Optional[float] = None
    
    # Split sheet reference
    split_sheet_id: Optional[str] = None
    blockchain_anchor: Optional[str] = None  # Hyperledger tx hash


# ══════════════════════════════════════════════════════════════════════════════
# WORK V2 — Enhanced Work Model (Protobuf-style)
# ══════════════════════════════════════════════════════════════════════════════

class WorkV2(BaseModel):
    """
    Enhanced Work model following Master Blueprint Protobuf spec.
    
    message Work {
        string work_id = 1;
        string title_original = 2;
        map<string, string> title_translations = 3;
        repeated Creator creators = 4;
        CulturalContext cultural_context = 5;
        Provenance provenance = 6;
        Rights rights = 7;
        string archive_status = 8;
        string blockchain_anchor = 9;
    }
    """
    # Core identifiers
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_id: str = Field(default_factory=lambda: f"kora:work:{uuid.uuid4().hex[:16]}")
    frekcore_ref: Optional[str] = None  # FREK-O-xxx
    
    # Titles
    title_original: str
    title_translations: Dict[str, str] = Field(default_factory=dict)  # {"en": "...", "wo": "..."}
    
    # Type
    type: Literal["music", "audiovisual_catalog", "audiovisual_creator", "podcast", "live"] = "music"
    content_type: Optional[str] = None  # film, series, documentary, concert
    
    # Creators
    creators: List[Dict[str, Any]] = Field(default_factory=list)
    # [{"frek_id": "...", "role": "performer", "display_name": "..."}]
    display_artist: str
    
    # CULTURAL CONTEXT (First-class entity)
    cultural_context: CulturalContext
    
    # Provenance
    provenance: Provenance
    
    # Rights
    rights: Rights
    
    # Archive status
    archive_status: Literal["active", "preserved", "legacy", "archived"] = "active"
    
    # Blockchain anchor
    blockchain_anchor: Optional[str] = None
    
    # Industry identifiers
    isrc: Optional[str] = None
    iswc: Optional[str] = None
    eidr: Optional[str] = None
    upc: Optional[str] = None
    
    # Technical metadata
    duration_seconds: Optional[int] = None
    bpm: Optional[float] = None
    key: Optional[str] = None
    
    # Assets
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    artwork_url: Optional[str] = None
    
    # CVE Metrics (calculated)
    cvi_current: Optional[float] = None
    nebula_score: Optional[float] = None
    chl_days: Optional[float] = None
    trust_score_avg: Optional[float] = None
    
    # Stats
    play_count: int = 0
    unique_listeners: int = 0
    
    # Status
    status: Literal["draft", "pending", "validated", "published", "archived"] = "draft"
    visibility: Literal["private", "unlisted", "public"] = "public"
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# CREATOR V2 — Enhanced Creator Identity
# ══════════════════════════════════════════════════════════════════════════════

class CreatorV2(BaseModel):
    """Enhanced Creator model with cultural identity"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    frek_id: str  # FREK-xxx
    
    # Display
    display_name: str
    stage_name: Optional[str] = None
    legal_name: Optional[str] = None
    
    # Cultural identity
    cultural_context: CulturalContext
    
    # Type
    entity_type: Literal["individual", "group", "label", "studio", "collective", "ai"] = "individual"
    
    # Bio
    bio: Dict[str, str] = Field(default_factory=dict)  # {"fr": "...", "en": "..."}
    
    # Media
    profile_image_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    
    # Social
    social_links: Dict[str, str] = Field(default_factory=dict)
    
    # Verification
    verified: bool = False
    verified_at: Optional[datetime] = None
    verification_level: Literal["none", "email", "identity", "professional", "legacy"] = "none"
    
    # Industry
    ipi_number: Optional[str] = None
    isni: Optional[str] = None
    
    # AI disclosure
    is_ai_entity: bool = False
    ai_operator_frek_id: Optional[str] = None
    
    # Stats
    total_works: int = 0
    total_plays: int = 0
    follower_count: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# PREDEFINED TERRITORIES (Caribbean + Africa + Diaspora focus)
# ══════════════════════════════════════════════════════════════════════════════

KORA_TERRITORIES = {
    # Caribbean
    "MQ": Territory(
        iso_code="MQ", name="Martinique", name_native="Matinik",
        region=TerritoryRegion.CARIBBEAN,
        primary_languages=["fr", "gcf"],
        primary_genres=["zouk", "biguine", "mazurka", "chouval_bwa"],
        diaspora_communities=["FR", "CA", "US"],
        currency="EUR", payment_methods=["card", "paypal"],
    ),
    "GP": Territory(
        iso_code="GP", name="Guadeloupe", name_native="Gwadloup",
        region=TerritoryRegion.CARIBBEAN,
        primary_languages=["fr", "gcf"],
        primary_genres=["zouk", "gwo_ka", "dancehall", "kompa"],
        diaspora_communities=["FR", "CA"],
        currency="EUR", payment_methods=["card", "paypal"],
    ),
    "HT": Territory(
        iso_code="HT", name="Haïti", name_native="Ayiti",
        region=TerritoryRegion.CARIBBEAN,
        primary_languages=["ht", "fr"],
        primary_genres=["kompa", "racine", "twoubadou", "rara"],
        diaspora_communities=["US", "CA", "FR", "DO"],
        currency="HTG", payment_methods=["mobile_money", "moncash"],
    ),
    "JM": Territory(
        iso_code="JM", name="Jamaica",
        region=TerritoryRegion.CARIBBEAN,
        primary_languages=["en", "jam"],
        primary_genres=["reggae", "dancehall", "ska", "dub"],
        diaspora_communities=["GB", "US", "CA"],
        currency="JMD", payment_methods=["card"],
    ),
    "TT": Territory(
        iso_code="TT", name="Trinidad and Tobago",
        region=TerritoryRegion.CARIBBEAN,
        primary_languages=["en"],
        primary_genres=["soca", "calypso", "chutney", "steelpan"],
        diaspora_communities=["US", "CA", "GB"],
        currency="TTD", payment_methods=["card"],
    ),
    
    # West Africa
    "SN": Territory(
        iso_code="SN", name="Sénégal",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["fr", "wo", "ff"],
        primary_genres=["mbalax", "sabar", "afrobeat", "hip_hop_galsen"],
        diaspora_communities=["FR", "US", "IT", "ES"],
        currency="XOF", payment_methods=["orange_money", "wave", "free_money"],
    ),
    "CI": Territory(
        iso_code="CI", name="Côte d'Ivoire",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["fr"],
        primary_genres=["coupe_decale", "zouglou", "afrobeat", "reggae"],
        diaspora_communities=["FR", "US"],
        currency="XOF", payment_methods=["orange_money", "mtn_money", "wave"],
    ),
    "NG": Territory(
        iso_code="NG", name="Nigeria",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["en", "yo", "ig", "ha"],
        primary_genres=["afrobeats", "highlife", "juju", "fuji", "afrofusion"],
        diaspora_communities=["GB", "US", "CA"],
        currency="NGN", payment_methods=["card", "bank_transfer", "opay"],
    ),
    "GH": Territory(
        iso_code="GH", name="Ghana",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["en", "ak", "ee"],
        primary_genres=["highlife", "hiplife", "afrobeats", "azonto"],
        diaspora_communities=["GB", "US"],
        currency="GHS", payment_methods=["mobile_money", "mtn_money"],
    ),
    "ML": Territory(
        iso_code="ML", name="Mali",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["fr", "bm"],
        primary_genres=["mandingue", "wassoulou", "desert_blues"],
        diaspora_communities=["FR"],
        currency="XOF", payment_methods=["orange_money"],
    ),
    "BJ": Territory(
        iso_code="BJ", name="Bénin",
        region=TerritoryRegion.WEST_AFRICA,
        primary_languages=["fr", "fon", "yo"],
        primary_genres=["afropop", "vodoun", "tchink_system"],
        diaspora_communities=["FR"],
        currency="XOF", payment_methods=["mobile_money"],
    ),
    
    # Central Africa
    "CD": Territory(
        iso_code="CD", name="République Démocratique du Congo",
        region=TerritoryRegion.CENTRAL_AFRICA,
        primary_languages=["fr", "ln", "sw"],
        primary_genres=["rumba_congolaise", "ndombolo", "soukous", "sebene"],
        diaspora_communities=["FR", "BE", "ZA"],
        currency="CDF", payment_methods=["mobile_money", "mpesa"],
    ),
    "CG": Territory(
        iso_code="CG", name="Congo-Brazzaville",
        region=TerritoryRegion.CENTRAL_AFRICA,
        primary_languages=["fr", "ln"],
        primary_genres=["rumba", "soukous"],
        diaspora_communities=["FR"],
        currency="XAF", payment_methods=["mobile_money"],
    ),
    "CM": Territory(
        iso_code="CM", name="Cameroun",
        region=TerritoryRegion.CENTRAL_AFRICA,
        primary_languages=["fr", "en"],
        primary_genres=["makossa", "bikutsi", "afrobeats"],
        diaspora_communities=["FR", "US"],
        currency="XAF", payment_methods=["orange_money", "mtn_money"],
    ),
    
    # Diaspora Europe
    "FR": Territory(
        iso_code="FR", name="France",
        region=TerritoryRegion.DIASPORA_EUROPE,
        primary_languages=["fr"],
        primary_genres=["rap_fr", "afropop", "zouk", "rumba", "dancehall"],
        cultural_influences=["MQ", "GP", "SN", "CI", "CD", "HT"],
        currency="EUR", payment_methods=["card", "paypal", "apple_pay"],
    ),
    "GB": Territory(
        iso_code="GB", name="United Kingdom",
        region=TerritoryRegion.DIASPORA_EUROPE,
        primary_languages=["en"],
        primary_genres=["grime", "afrobeats", "uk_drill", "reggae", "dancehall"],
        cultural_influences=["JM", "NG", "GH"],
        currency="GBP", payment_methods=["card", "paypal"],
    ),
    "BE": Territory(
        iso_code="BE", name="Belgique",
        region=TerritoryRegion.DIASPORA_EUROPE,
        primary_languages=["fr", "nl"],
        primary_genres=["rumba", "afropop", "hip_hop"],
        cultural_influences=["CD", "RW", "MA"],
        currency="EUR", payment_methods=["card", "bancontact"],
    ),
    
    # Diaspora Americas
    "US": Territory(
        iso_code="US", name="United States",
        region=TerritoryRegion.DIASPORA_AMERICAS,
        primary_languages=["en", "es"],
        primary_genres=["hip_hop", "r_and_b", "afrobeats", "reggaeton", "kompa"],
        cultural_influences=["JM", "HT", "NG", "PR"],
        currency="USD", payment_methods=["card", "apple_pay", "venmo"],
    ),
    "CA": Territory(
        iso_code="CA", name="Canada",
        region=TerritoryRegion.DIASPORA_AMERICAS,
        primary_languages=["en", "fr"],
        primary_genres=["hip_hop", "r_and_b", "afrobeats", "kompa", "zouk"],
        cultural_influences=["HT", "JM", "NG"],
        currency="CAD", payment_methods=["card", "interac"],
    ),
    "BR": Territory(
        iso_code="BR", name="Brasil",
        region=TerritoryRegion.SOUTH_AMERICA,
        primary_languages=["pt"],
        primary_genres=["samba", "mpb", "funk_carioca", "forro", "bossa_nova"],
        diaspora_communities=["US", "PT", "JP"],
        currency="BRL", payment_methods=["pix", "boleto", "card"],
    ),
    
    # Asia
    "KR": Territory(
        iso_code="KR", name="South Korea",
        region=TerritoryRegion.EAST_ASIA,
        primary_languages=["ko"],
        primary_genres=["kpop", "k_hip_hop", "k_rnb", "trot"],
        diaspora_communities=["US", "JP"],
        currency="KRW", payment_methods=["card", "kakao_pay"],
    ),
    "JP": Territory(
        iso_code="JP", name="Japan",
        region=TerritoryRegion.EAST_ASIA,
        primary_languages=["ja"],
        primary_genres=["jpop", "city_pop", "j_hip_hop", "visual_kei"],
        diaspora_communities=["US", "BR"],
        currency="JPY", payment_methods=["card", "konbini"],
    ),
    "IN": Territory(
        iso_code="IN", name="India",
        region=TerritoryRegion.SOUTH_ASIA,
        primary_languages=["hi", "en", "ta", "te"],
        primary_genres=["bollywood", "indie_indian", "carnatic", "hindustani", "desi_hip_hop"],
        diaspora_communities=["US", "GB", "AE"],
        currency="INR", payment_methods=["upi", "paytm", "card"],
    ),
}


# ══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ══════════════════════════════════════════════════════════════════════════════

__all__ = [
    "TerritoryRegion",
    "Territory",
    "GenreNode",
    "CulturalContext",
    "Provenance",
    "Rights",
    "WorkV2",
    "CreatorV2",
    "KORA_TERRITORIES",
]
