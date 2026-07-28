"""
FrekCore Ingestion Service — Pipeline Catalogue Vivant
======================================================

Architecture cible:
Artistes / Labels / Distributeurs / Partenaires
                    ↓
              FrekCore
    (Ingestion + validation + preuve + standards)
                    ↓
            KORA Catalog
                    ↓
        Application utilisateur

Ce service gère:
1. Ingestion depuis sources multiples (Jamendo, Archive, Upload, Partenaires)
2. Validation et enrichissement métadonnées
3. Signature FrekCore (preuve d'existence)
4. Population du catalogue KORA
5. Génération des flux dynamiques (Trending, Nouveautés, Découvertes)
"""

import asyncio
import logging
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
# INGESTION SOURCES
# ══════════════════════════════════════════════════════════════════════════════

class IngestionSource(str, Enum):
    """Sources d'ingestion catalogue"""
    JAMENDO = "jamendo"              # Test/dev - musique libre
    INTERNET_ARCHIVE = "archive"     # Test/dev - archive culturelle
    FREESOUND = "freesound"          # Test/dev - sons
    CREATOR_UPLOAD = "upload"        # Créateurs self-serve
    LABEL_DELIVERY = "label"         # Labels via DDEX/ERN
    DISTRIBUTOR = "distributor"      # Distributeurs (JTV, Believe, etc.)
    PARTNER_API = "partner"          # Partenaires API
    MANUAL = "manual"                # Import manuel


class ContentType(str, Enum):
    """Types de contenu"""
    MUSIC = "music"
    AUDIOVISUAL = "audiovisual"
    PODCAST = "podcast"
    LIVE = "live"


# ══════════════════════════════════════════════════════════════════════════════
# INGESTION RESULT
# ══════════════════════════════════════════════════════════════════════════════

class IngestionResult(BaseModel):
    """Résultat d'une ingestion"""
    success: bool
    work_id: Optional[str] = None
    frekcore_ref: Optional[str] = None
    source: str
    message: str
    metadata: Dict[str, Any] = {}
    errors: List[str] = []


# ══════════════════════════════════════════════════════════════════════════════
# FREKCORE INGESTION SERVICE
# ══════════════════════════════════════════════════════════════════════════════

class FrekCoreIngestionService:
    """
    Service d'ingestion FrekCore → KORA
    
    Responsabilités:
    - Récupérer contenu depuis sources multiples
    - Valider et enrichir métadonnées
    - Générer preuve FrekCore
    - Créer Work dans le catalogue KORA
    - Alimenter les flux dynamiques
    """
    
    # Jamendo API
    JAMENDO_CLIENT_ID = "b6747d04"  # Public demo ID
    JAMENDO_API = "https://api.jamendo.com/v3.0"
    
    # Internet Archive
    ARCHIVE_API = "https://archive.org"
    
    def __init__(self, db):
        self.db = db
        self.http = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        await self.http.aclose()
    
    # ─── FREKCORE SIGNATURE ──────────────────────────────────────────────────
    
    def generate_frekcore_ref(self, work_data: dict) -> str:
        """Générer une référence FrekCore (signature)"""
        # Créer un hash unique basé sur les métadonnées
        signature_data = f"{work_data.get('title', '')}-{work_data.get('artist', '')}-{datetime.now().isoformat()}"
        hash_value = hashlib.sha256(signature_data.encode()).hexdigest()[:16].upper()
        return f"FREK-O-{hash_value}"
    
    def generate_work_id(self) -> str:
        """Générer un work_id KORA"""
        return f"KORA-W-{uuid.uuid4().hex[:12].upper()}"
    
    # ─── JAMENDO SOURCE ──────────────────────────────────────────────────────
    
    async def fetch_jamendo_tracks(
        self,
        limit: int = 50,
        tags: List[str] = None,
        featured: bool = False,
    ) -> List[Dict[str, Any]]:
        """Récupérer des tracks depuis Jamendo"""
        params = {
            "client_id": self.JAMENDO_CLIENT_ID,
            "format": "json",
            "limit": limit,
            "include": "musicinfo+licenses+stats",
            "audioformat": "mp32",
            "order": "popularity_total" if not featured else "releasedate_desc",
        }
        
        if tags:
            params["tags"] = "+".join(tags)
        if featured:
            params["featured"] = 1
        
        try:
            response = await self.http.get(f"{self.JAMENDO_API}/tracks", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"Jamendo fetch error: {e}")
            return []
    
    async def fetch_jamendo_albums(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Récupérer des albums depuis Jamendo"""
        params = {
            "client_id": self.JAMENDO_CLIENT_ID,
            "format": "json",
            "limit": limit,
            "include": "tracks+musicinfo",
            "order": "popularity_total",
        }
        
        try:
            response = await self.http.get(f"{self.JAMENDO_API}/albums", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"Jamendo albums fetch error: {e}")
            return []
    
    def transform_jamendo_track(self, track: dict) -> dict:
        """Transformer un track Jamendo en Work KORA"""
        # Extract musicinfo
        musicinfo = track.get("musicinfo", {})
        tags = musicinfo.get("tags", {})
        
        # Map genres
        genres = []
        if tags.get("genres"):
            genres = [g.replace("_", " ").title() for g in tags["genres"]]
        if not genres:
            genres = ["World", "Afrobeat"]  # Default KORA genres
        
        # Cultural tags from vartags
        cultural_tags = tags.get("vartags", [])[:5]
        
        return {
            "work_id": self.generate_work_id(),
            "type": "music",
            "title": track.get("name", "Unknown Track"),
            "description": track.get("description") or f"Track by {track.get('artist_name', 'Unknown')}",
            "duration_seconds": int(track.get("duration", 0)),
            "display_artist": track.get("artist_name", "Unknown Artist"),
            "creator_frek_id": f"jamendo-{track.get('artist_id', 'unknown')}",
            "genres": genres,
            "cultural_tags": cultural_tags,
            "languages": [musicinfo.get("lang", "en")] if musicinfo.get("lang") else ["en"],
            "territories_origin": ["FR"],  # Jamendo is French
            "explicit_content": False,
            
            # Assets
            "audio_url": track.get("audio"),
            "audiodownload_url": track.get("audiodownload"),
            "artwork_url": track.get("image"),
            "waveform_url": track.get("waveform"),
            
            # Stats (pour trending)
            "play_count": int(track.get("stats", {}).get("rate_listened_total", 0)),
            "download_count": int(track.get("stats", {}).get("rate_download_total", 0)),
            
            # Source tracking
            "ingestion_source": IngestionSource.JAMENDO.value,
            "external_id": str(track.get("id")),
            "external_url": track.get("shareurl"),
            
            # License
            "license": track.get("license_ccurl"),
        }
    
    # ─── INTERNET ARCHIVE SOURCE ─────────────────────────────────────────────
    
    async def fetch_archive_audio(
        self,
        collection: str = "audio",
        query: str = "african music OR caribbean music OR afrobeat OR zouk",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Récupérer de l'audio depuis Internet Archive"""
        params = {
            "q": f"collection:{collection} AND ({query}) AND mediatype:audio",
            "fl[]": ["identifier", "title", "creator", "description", "date", "downloads"],
            "rows": limit,
            "output": "json",
        }
        
        try:
            response = await self.http.get(f"{self.ARCHIVE_API}/advancedsearch.php", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("response", {}).get("docs", [])
        except Exception as e:
            logger.error(f"Archive.org fetch error: {e}")
            return []
    
    def transform_archive_item(self, item: dict) -> dict:
        """Transformer un item Archive.org en Work KORA"""
        identifier = item.get("identifier", "")
        
        return {
            "work_id": self.generate_work_id(),
            "type": "music",
            "title": item.get("title", "Unknown"),
            "description": item.get("description", "")[:500] if item.get("description") else None,
            "display_artist": item.get("creator", "Unknown Artist"),
            "creator_frek_id": f"archive-{identifier}",
            "genres": ["World", "Traditional", "Cultural Heritage"],
            "cultural_tags": ["archive", "heritage", "diaspora"],
            "languages": ["en"],
            "territories_origin": ["US"],
            
            # Assets - Archive.org streaming
            "audio_url": f"https://archive.org/download/{identifier}/{identifier}_64kb.mp3",
            "artwork_url": f"https://archive.org/services/img/{identifier}",
            
            # Stats
            "play_count": int(item.get("downloads", 0)),
            
            # Source tracking
            "ingestion_source": IngestionSource.INTERNET_ARCHIVE.value,
            "external_id": identifier,
            "external_url": f"https://archive.org/details/{identifier}",
        }
    
    # ─── MAIN INGESTION PIPELINE ─────────────────────────────────────────────
    
    async def ingest_work(self, work_data: dict, source: IngestionSource) -> IngestionResult:
        """
        Pipeline d'ingestion principal.
        
        1. Validation métadonnées
        2. Déduplication
        3. Enrichissement
        4. Signature FrekCore
        5. Création Work
        6. Création Asset
        7. Event emission
        """
        errors = []
        
        # 1. Validate required fields
        if not work_data.get("title"):
            errors.append("Title is required")
        if not work_data.get("display_artist"):
            errors.append("Artist is required")
        
        if errors:
            return IngestionResult(
                success=False,
                source=source.value,
                message="Validation failed",
                errors=errors
            )
        
        # 2. Check for duplicates
        existing = await self.db.works.find_one({
            "external_id": work_data.get("external_id"),
            "ingestion_source": source.value
        })
        
        if existing:
            return IngestionResult(
                success=True,
                work_id=existing.get("work_id"),
                frekcore_ref=existing.get("frekcore_ref"),
                source=source.value,
                message="Already exists",
                metadata={"duplicate": True}
            )
        
        # 3. Enrich metadata
        work_data["status"] = "validated"
        work_data["visibility"] = "public"
        work_data["created_at"] = datetime.now(timezone.utc)
        work_data["updated_at"] = datetime.now(timezone.utc)
        work_data["published_at"] = datetime.now(timezone.utc)
        
        # 4. Generate FrekCore signature
        frekcore_ref = self.generate_frekcore_ref(work_data)
        work_data["frekcore_ref"] = frekcore_ref
        work_data["frekcore_validated"] = True
        work_data["frekcore_validated_at"] = datetime.now(timezone.utc)
        
        # 5. Create Work
        work_id = work_data.get("work_id") or self.generate_work_id()
        work_data["work_id"] = work_id
        work_data["id"] = str(uuid.uuid4())
        
        await self.db.works.insert_one(work_data)
        
        # 6. Create Asset if audio_url exists
        if work_data.get("audio_url"):
            asset = {
                "id": str(uuid.uuid4()),
                "asset_id": f"KORA-A-{uuid.uuid4().hex[:12].upper()}",
                "work_id": work_id,
                "kind": "audio_master",
                "format": "mp3",
                "quality_tier": "high",
                "storage_url": work_data["audio_url"],
                "storage_provider": "external",
                "stream_url": work_data["audio_url"],
                "status": "ready",
                "created_at": datetime.now(timezone.utc),
            }
            
            # Add artwork
            if work_data.get("artwork_url"):
                asset["artwork_url"] = work_data["artwork_url"]
            
            await self.db.assets.insert_one(asset)
            
            # Update work with asset reference
            await self.db.works.update_one(
                {"work_id": work_id},
                {"$push": {"assets": asset["asset_id"]}}
            )
        
        # 7. Emit event
        event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "work.ingested",
            "work_id": work_id,
            "title": work_data.get("title"),
            "source": source.value,
            "frekcore_ref": frekcore_ref,
            "occurred_at": datetime.now(timezone.utc),
            "source_service": "frekcore",
        }
        await self.db.events.insert_one(event)
        
        logger.info(f"Ingested work: {work_id} - {work_data.get('title')} from {source.value}")
        
        return IngestionResult(
            success=True,
            work_id=work_id,
            frekcore_ref=frekcore_ref,
            source=source.value,
            message="Successfully ingested",
            metadata={
                "title": work_data.get("title"),
                "artist": work_data.get("display_artist"),
            }
        )
    
    # ─── BATCH INGESTION ─────────────────────────────────────────────────────
    
    async def ingest_from_jamendo(self, limit: int = 50, tags: List[str] = None) -> List[IngestionResult]:
        """Ingérer un batch depuis Jamendo"""
        results = []
        
        # Fetch tracks
        tracks = await self.fetch_jamendo_tracks(limit=limit, tags=tags)
        
        for track in tracks:
            work_data = self.transform_jamendo_track(track)
            result = await self.ingest_work(work_data, IngestionSource.JAMENDO)
            results.append(result)
        
        return results
    
    async def ingest_from_archive(self, limit: int = 30) -> List[IngestionResult]:
        """Ingérer un batch depuis Internet Archive"""
        results = []
        
        items = await self.fetch_archive_audio(limit=limit)
        
        for item in items:
            work_data = self.transform_archive_item(item)
            result = await self.ingest_work(work_data, IngestionSource.INTERNET_ARCHIVE)
            results.append(result)
        
        return results
    
    async def populate_catalog(self, target_count: int = 100) -> Dict[str, Any]:
        """
        Peupler le catalogue KORA avec du contenu vivant.
        
        Appelé au démarrage ou périodiquement pour maintenir un catalogue actif.
        """
        current_count = await self.db.works.count_documents({"status": "validated"})
        
        if current_count >= target_count:
            return {
                "status": "sufficient",
                "current_count": current_count,
                "target_count": target_count,
                "ingested": 0
            }
        
        needed = target_count - current_count
        ingested = 0
        
        # Ingest from Jamendo with cultural tags
        cultural_tags = [
            ["afrobeat", "africa"],
            ["reggae", "caribbean"],
            ["jazz", "soul"],
            ["hiphop", "urban"],
            ["world", "folk"],
        ]
        
        for tags in cultural_tags:
            if ingested >= needed:
                break
            results = await self.ingest_from_jamendo(limit=min(20, needed - ingested), tags=tags)
            ingested += len([r for r in results if r.success])
        
        # Supplement with Archive.org if needed
        if ingested < needed:
            results = await self.ingest_from_archive(limit=min(20, needed - ingested))
            ingested += len([r for r in results if r.success])
        
        return {
            "status": "populated",
            "current_count": current_count + ingested,
            "target_count": target_count,
            "ingested": ingested
        }
    
    # ─── DYNAMIC FEEDS ───────────────────────────────────────────────────────
    
    async def get_trending_works(self, limit: int = 20, territory: str = None) -> List[Dict[str, Any]]:
        """Obtenir les œuvres trending basées sur play_count et récence"""
        query = {"status": "validated", "visibility": "public"}
        
        if territory:
            query["territories_origin"] = territory
        
        # Sort by play_count and recency
        cursor = self.db.works.find(query).sort([
            ("play_count", -1),
            ("published_at", -1)
        ]).limit(limit)
        
        return await cursor.to_list(limit)
    
    async def get_new_releases(self, limit: int = 20, days: int = 30) -> List[Dict[str, Any]]:
        """Obtenir les nouveautés des X derniers jours"""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.db.works.find({
            "status": "validated",
            "visibility": "public",
            "published_at": {"$gte": since}
        }).sort("published_at", -1).limit(limit)
        
        return await cursor.to_list(limit)
    
    async def get_by_territory(self, territory: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtenir les œuvres par territoire"""
        cursor = self.db.works.find({
            "status": "validated",
            "visibility": "public",
            "territories_origin": territory
        }).sort("play_count", -1).limit(limit)
        
        return await cursor.to_list(limit)
    
    async def get_by_genre(self, genre: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtenir les œuvres par genre"""
        cursor = self.db.works.find({
            "status": "validated",
            "visibility": "public",
            "genres": {"$regex": genre, "$options": "i"}
        }).sort("play_count", -1).limit(limit)
        
        return await cursor.to_list(limit)
    
    async def get_discoveries(self, user_genres: List[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtenir des découvertes personnalisées"""
        query = {
            "status": "validated",
            "visibility": "public"
        }
        
        if user_genres:
            query["genres"] = {"$in": user_genres}
        
        # Mix of recent and popular with some randomness
        pipeline = [
            {"$match": query},
            {"$sample": {"size": limit * 2}},
            {"$sort": {"play_count": -1}},
            {"$limit": limit}
        ]
        
        cursor = self.db.works.aggregate(pipeline)
        return await cursor.to_list(limit)
    
    async def get_catalog_stats(self) -> Dict[str, Any]:
        """Statistiques du catalogue"""
        total = await self.db.works.count_documents({})
        validated = await self.db.works.count_documents({"status": "validated"})
        published = await self.db.works.count_documents({"status": "published"})
        
        # By type
        music = await self.db.works.count_documents({"type": "music"})
        audiovisual = await self.db.works.count_documents({"type": {"$in": ["audiovisual_catalog", "audiovisual_creator"]}})
        
        # By source
        pipeline = [
            {"$group": {"_id": "$ingestion_source", "count": {"$sum": 1}}}
        ]
        sources = await self.db.works.aggregate(pipeline).to_list(20)
        
        return {
            "total_works": total,
            "validated_works": validated,
            "published_works": published,
            "music_works": music,
            "audiovisual_works": audiovisual,
            "by_source": {s["_id"]: s["count"] for s in sources if s["_id"]},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# ══════════════════════════════════════════════════════════════════════════════
# SINGLETON
# ══════════════════════════════════════════════════════════════════════════════

_ingestion_service: Optional[FrekCoreIngestionService] = None


def get_ingestion_service(db) -> FrekCoreIngestionService:
    """Get or create ingestion service"""
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = FrekCoreIngestionService(db)
    return _ingestion_service
