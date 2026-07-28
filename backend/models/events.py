"""
KORA Event System — Master Prompt Section 14
============================================

Taxonomie officielle des événements et cycle de vie des objets métier.

Convention: `domaine.entité.action` (infinitif passé, un seul verbe)

Domaines:
- work: Événements liés aux œuvres
- stream: Événements liés aux écoutes/visionnages
- royalty: Événements liés aux royalties
- payment: Événements liés aux paiements
- rights: Événements liés aux droits
- user: Événements liés aux utilisateurs
- release: Événements liés aux releases
- upload: Événements liés aux uploads créateurs

Règles non négociables (Master Prompt Section 14.2):
1. Un événement ne décrit jamais une intention future
2. Un événement porte toujours work_id/stream_id + occurred_at + source_service
3. Aucun service ne republie un événement reçu sous un autre nom
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, timezone
from enum import Enum
import uuid


# ══════════════════════════════════════════════════════════════════════════════
# EVENT TYPES — Taxonomie Officielle (Section 14.2)
# ══════════════════════════════════════════════════════════════════════════════

class EventDomain(str, Enum):
    """Domaines d'événements"""
    WORK = "work"
    STREAM = "stream"
    ROYALTY = "royalty"
    PAYMENT = "payment"
    RIGHTS = "rights"
    USER = "user"
    RELEASE = "release"
    UPLOAD = "upload"


class WorkEventType(str, Enum):
    """Événements Work (Section 14.2)"""
    INGESTED = "work.ingested"
    VALIDATED = "work.validated"
    PUBLISHED = "work.published"
    UPDATED = "work.updated"
    RETIRED = "work.retired"


class StreamEventType(str, Enum):
    """Événements Stream (Section 14.2)"""
    RECORDED = "stream.recorded"
    VALIDATED = "stream.validated"
    AGGREGATED = "stream.aggregated"
    REPORTED = "stream.reported"


class RoyaltyEventType(str, Enum):
    """Événements Royalty (Section 14.2)"""
    ACCRUED = "royalty.accrued"
    CALCULATED = "royalty.calculated"
    STATEMENTED = "royalty.statemented"
    PAID = "royalty.paid"
    RECONCILED = "royalty.reconciled"


class PaymentEventType(str, Enum):
    """Événements Payment (Section 14.2)"""
    INITIATED = "payment.initiated"
    PROCESSING = "payment.processing"
    COMPLETED = "payment.completed"
    FAILED = "payment.failed"
    RECONCILED = "payment.reconciled"


class RightsEventType(str, Enum):
    """Événements Rights (Section 14.2)"""
    UPDATED = "rights.updated"
    DISPUTED = "rights.disputed"
    RESOLVED = "rights.resolved"


class UserEventType(str, Enum):
    """Événements User (Section 14.2)"""
    REGISTERED = "user.registered"
    ROLE_CHANGED = "user.role_changed"
    VERIFIED = "user.verified"
    SUBSCRIPTION_CHANGED = "user.subscription_changed"


class ReleaseEventType(str, Enum):
    """Événements Release"""
    CREATED = "release.created"
    SCHEDULED = "release.scheduled"
    PUBLISHED = "release.published"
    UPDATED = "release.updated"
    ARCHIVED = "release.archived"


class UploadEventType(str, Enum):
    """Événements Upload (créateurs)"""
    STARTED = "upload.started"
    CHUNK_RECEIVED = "upload.chunk_received"
    COMPLETED = "upload.completed"
    PROCESSING = "upload.processing"
    READY = "upload.ready"
    FAILED = "upload.failed"


# ══════════════════════════════════════════════════════════════════════════════
# BASE EVENT MODEL
# ══════════════════════════════════════════════════════════════════════════════

class KoraEvent(BaseModel):
    """
    Événement métier KORA.
    
    Règles (Master Prompt Section 14.2):
    - occurred_at: horodatage d'origine (distinct du traitement)
    - source_service: service émetteur
    - correlation_id: pour traçage distribué
    """
    # Event identity
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    
    # Timing
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Source
    source_service: str  # kora, frekcore, wallet, labelOS, etc.
    
    # Correlation (for distributed tracing)
    correlation_id: Optional[str] = None
    causation_id: Optional[str] = None  # Event that caused this event
    
    # Version
    schema_version: str = "1.0"
    
    # Payload
    payload: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        use_enum_values = True


# ══════════════════════════════════════════════════════════════════════════════
# WORK EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class WorkIngestedEvent(KoraEvent):
    """Work reçu par FrekCore (ERN ou EIDR/MEC), pas encore validé"""
    event_type: str = WorkEventType.INGESTED.value
    
    # Required payload fields
    work_id: str
    work_type: str  # music, audiovisual_catalog, audiovisual_creator
    title: str
    ingestion_source: str  # labelOS, distributor, self-serve
    
    # Optional
    universal_id: Optional[str] = None  # ISRC or EIDR
    rights_holder_id: Optional[str] = None


class WorkValidatedEvent(KoraEvent):
    """Work signé par FrekCore, preuve d'existence générée"""
    event_type: str = WorkEventType.VALIDATED.value
    
    work_id: str
    frekcore_ref: str  # Signature / proof reference
    validated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkPublishedEvent(KoraEvent):
    """Work disponible sur au moins un DSP (KORA ou autre)"""
    event_type: str = WorkEventType.PUBLISHED.value
    
    work_id: str
    published_on: List[str] = Field(default_factory=list)  # ["kora", "spotify", ...]
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkUpdatedEvent(KoraEvent):
    """Changement de métadonnées ou de droits post-publication"""
    event_type: str = WorkEventType.UPDATED.value
    
    work_id: str
    updated_fields: List[str] = Field(default_factory=list)
    previous_values: Dict[str, Any] = Field(default_factory=dict)
    new_values: Dict[str, Any] = Field(default_factory=dict)


class WorkRetiredEvent(KoraEvent):
    """Work retiré (fin de licence, demande ayant-droit, litige)"""
    event_type: str = WorkEventType.RETIRED.value
    
    work_id: str
    reason: str
    retired_by: str  # frek_id or system


# ══════════════════════════════════════════════════════════════════════════════
# STREAM EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class StreamRecordedEvent(KoraEvent):
    """Événement d'écoute/visionnage brut, horodaté"""
    event_type: str = StreamEventType.RECORDED.value
    
    stream_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_id: str
    user_frek_id: str
    
    # Stream details
    duration_seconds: int
    total_duration_seconds: int
    completion_ratio: float
    
    # Context
    platform: str  # ios, android, web, tv
    territory: str  # ISO country code
    session_id: str
    is_premium: bool = False
    
    # Quality
    quality_tier: Optional[str] = None


class StreamValidatedEvent(KoraEvent):
    """Stream passé par la détection de fraude"""
    event_type: str = StreamEventType.VALIDATED.value
    
    stream_id: str
    work_id: str
    trust_score: float
    is_valid: bool  # TS >= tau_fraude
    validation_details: Dict[str, float] = Field(default_factory=dict)


class StreamAggregatedEvent(KoraEvent):
    """Streams compilés par période pour un work_id"""
    event_type: str = StreamEventType.AGGREGATED.value
    
    work_id: str
    period_start: datetime
    period_end: datetime
    
    total_streams: int
    validated_streams: int
    total_duration_seconds: int
    unique_listeners: int
    
    # By territory
    streams_by_territory: Dict[str, int] = Field(default_factory=dict)


class StreamReportedEvent(KoraEvent):
    """Streams intégrés à un DSR ou rapport de consommation"""
    event_type: str = StreamEventType.REPORTED.value
    
    report_id: str
    report_type: str  # dsr, avails_report
    period: str  # "2026-01"
    work_ids: List[str] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# ROYALTY EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class RoyaltyAccruedEvent(KoraEvent):
    """Droit généré par un Stream agrégé"""
    event_type: str = RoyaltyEventType.ACCRUED.value
    
    work_id: str
    period: str
    stream_count: int
    gross_amount: float
    currency: str = "EUR"


class RoyaltyCalculatedEvent(KoraEvent):
    """Passé par le Rights Engine — allocation UVC via CVE"""
    event_type: str = RoyaltyEventType.CALCULATED.value
    
    work_id: str
    period: str
    
    # CVE metrics
    cvi: float
    uvc_allocated: float
    uvc_value_eur: float
    
    # Splits calculated
    splits: List[Dict[str, Any]] = Field(default_factory=list)


class RoyaltyStatementedEvent(KoraEvent):
    """Intégré à un RoyaltyStatement, visible côté dashboard"""
    event_type: str = RoyaltyEventType.STATEMENTED.value
    
    statement_id: str
    rights_holder_id: str
    period: str
    total_amount: float
    currency: str = "EUR"


class RoyaltyPaidEvent(KoraEvent):
    """Règlement initié (fiat ou JCC)"""
    event_type: str = RoyaltyEventType.PAID.value
    
    statement_id: str
    rights_holder_id: str
    amount: float
    currency: str
    payout_method: str  # fiat, jcc
    transaction_ref: Optional[str] = None


class RoyaltyReconciledEvent(KoraEvent):
    """Rapprochement confirmé — état final"""
    event_type: str = RoyaltyEventType.RECONCILED.value
    
    statement_id: str
    reconciled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ══════════════════════════════════════════════════════════════════════════════
# PAYMENT EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class PaymentInitiatedEvent(KoraEvent):
    """Paiement initié"""
    event_type: str = PaymentEventType.INITIATED.value
    
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # subscription, royalty_payout, tvod_purchase
    amount: float
    currency: str
    user_frek_id: Optional[str] = None
    rights_holder_id: Optional[str] = None


class PaymentCompletedEvent(KoraEvent):
    """Paiement complété avec succès"""
    event_type: str = PaymentEventType.COMPLETED.value
    
    payment_id: str
    transaction_ref: str
    provider: str  # stripe, jcc_wallet


class PaymentFailedEvent(KoraEvent):
    """Paiement échoué"""
    event_type: str = PaymentEventType.FAILED.value
    
    payment_id: str
    error_code: str
    error_message: str
    can_retry: bool = True


# ══════════════════════════════════════════════════════════════════════════════
# RIGHTS EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class RightsUpdatedEvent(KoraEvent):
    """Mise à jour des droits/splits"""
    event_type: str = RightsEventType.UPDATED.value
    
    work_id: str
    split_id: str
    updated_by: str
    changes: Dict[str, Any] = Field(default_factory=dict)


class RightsDisputedEvent(KoraEvent):
    """Litige sur les droits"""
    event_type: str = RightsEventType.DISPUTED.value
    
    work_id: str
    disputed_by: str
    reason: str
    affected_rights_holders: List[str] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# USER EVENTS
# ══════════════════════════════════════════════════════════════════════════════

class UserRegisteredEvent(KoraEvent):
    """Nouvel utilisateur enregistré"""
    event_type: str = UserEventType.REGISTERED.value
    
    user_frek_id: str
    email: Optional[str] = None
    role: str = "auditeur"
    registration_source: str = "kora"


class UserRoleChangedEvent(KoraEvent):
    """Changement de rôle utilisateur"""
    event_type: str = UserEventType.ROLE_CHANGED.value
    
    user_frek_id: str
    previous_role: str
    new_role: str
    changed_by: str


class UserSubscriptionChangedEvent(KoraEvent):
    """Changement d'abonnement"""
    event_type: str = UserEventType.SUBSCRIPTION_CHANGED.value
    
    user_frek_id: str
    previous_tier: Optional[str] = None
    new_tier: str
    subscription_id: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
# UPLOAD EVENTS (Créateurs)
# ══════════════════════════════════════════════════════════════════════════════

class UploadStartedEvent(KoraEvent):
    """Upload créateur démarré"""
    event_type: str = UploadEventType.STARTED.value
    
    upload_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creator_frek_id: str
    filename: str
    file_size_bytes: int
    content_type: str  # audio, video
    total_chunks: int


class UploadChunkReceivedEvent(KoraEvent):
    """Chunk reçu"""
    event_type: str = UploadEventType.CHUNK_RECEIVED.value
    
    upload_id: str
    chunk_number: int
    total_chunks: int
    bytes_received: int


class UploadCompletedEvent(KoraEvent):
    """Upload terminé, prêt pour traitement"""
    event_type: str = UploadEventType.COMPLETED.value
    
    upload_id: str
    creator_frek_id: str
    storage_url: str
    file_size_bytes: int


class UploadReadyEvent(KoraEvent):
    """Upload traité et prêt pour publication"""
    event_type: str = UploadEventType.READY.value
    
    upload_id: str
    work_id: str  # Work créé à partir de l'upload
    asset_id: str  # Asset principal


class UploadFailedEvent(KoraEvent):
    """Upload échoué"""
    event_type: str = UploadEventType.FAILED.value
    
    upload_id: str
    error_code: str
    error_message: str


# ══════════════════════════════════════════════════════════════════════════════
# EVENT BUS SERVICE
# ══════════════════════════════════════════════════════════════════════════════

class EventBusService:
    """
    Service de publication d'événements.
    
    En production, ce service publierait sur Kafka (Section 24).
    Pour le MVP, nous stockons en MongoDB et exposons via API.
    """
    
    def __init__(self, db):
        self.db = db
        self.collection = db.events
    
    async def publish(self, event: KoraEvent) -> str:
        """Publier un événement sur le bus"""
        event_dict = event.dict()
        await self.collection.insert_one(event_dict)
        return event.event_id
    
    async def get_events(
        self,
        event_type: Optional[str] = None,
        work_id: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Récupérer des événements"""
        query = {}
        
        if event_type:
            query["event_type"] = event_type
        if work_id:
            query["$or"] = [
                {"work_id": work_id},
                {"payload.work_id": work_id}
            ]
        if since:
            query["occurred_at"] = {"$gte": since}
        
        cursor = self.collection.find(query).sort("occurred_at", -1).limit(limit)
        return await cursor.to_list(limit)
    
    async def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Récupérer un événement par ID"""
        return await self.collection.find_one({"event_id": event_id})


# ══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ══════════════════════════════════════════════════════════════════════════════

__all__ = [
    # Enums
    "EventDomain",
    "WorkEventType",
    "StreamEventType",
    "RoyaltyEventType",
    "PaymentEventType",
    "RightsEventType",
    "UserEventType",
    "ReleaseEventType",
    "UploadEventType",
    # Base
    "KoraEvent",
    # Work Events
    "WorkIngestedEvent",
    "WorkValidatedEvent",
    "WorkPublishedEvent",
    "WorkUpdatedEvent",
    "WorkRetiredEvent",
    # Stream Events
    "StreamRecordedEvent",
    "StreamValidatedEvent",
    "StreamAggregatedEvent",
    "StreamReportedEvent",
    # Royalty Events
    "RoyaltyAccruedEvent",
    "RoyaltyCalculatedEvent",
    "RoyaltyStatementedEvent",
    "RoyaltyPaidEvent",
    "RoyaltyReconciledEvent",
    # Payment Events
    "PaymentInitiatedEvent",
    "PaymentCompletedEvent",
    "PaymentFailedEvent",
    # Rights Events
    "RightsUpdatedEvent",
    "RightsDisputedEvent",
    # User Events
    "UserRegisteredEvent",
    "UserRoleChangedEvent",
    "UserSubscriptionChangedEvent",
    # Upload Events
    "UploadStartedEvent",
    "UploadChunkReceivedEvent",
    "UploadCompletedEvent",
    "UploadReadyEvent",
    "UploadFailedEvent",
    # Service
    "EventBusService",
]
