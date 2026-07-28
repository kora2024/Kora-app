#!/usr/bin/env python3
"""
KORA Demo Catalog Seed Script
=============================

Crée un catalogue de démonstration culturellement réaliste.

Territoires couverts:
- Caraïbes (Martinique, Guadeloupe, Jamaïque, Haïti, Trinidad)
- Afrique (Sénégal, Nigeria, Côte d'Ivoire, Congo, Mali)
- Diaspora (France, UK, USA)
- Amérique Latine (Brésil, Cuba, Colombie)
- Asie de l'Est (Corée, Japon)
- Inde

Inclut aussi le premier contenu CVLN interne: DJ Sayd / Factory Maker Studio
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
import uuid
import random

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# ══════════════════════════════════════════════════════════════════════════════
# REALISTIC DEMO CONTENT — Caribbean & Afro-Diaspora Focus
# ══════════════════════════════════════════════════════════════════════════════

# High-quality artwork placeholders (Unsplash)
ARTWORK_URLS = [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
    "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400",
]

AUDIO_STREAM_URLS = [
    "https://mp3d.jamendo.com/download/track/1889925/mp32",
    "https://mp3d.jamendo.com/download/track/1881123/mp32",
    "https://mp3d.jamendo.com/download/track/1890041/mp32",
]

# ─── CARIBBEAN ARTISTS ────────────────────────────────────────────────────────

CARIBBEAN_ARTISTS = [
    {
        "name": "Kassav'",
        "origin": "MQ",  # Martinique
        "genres": ["Zouk", "Antillais"],
        "tracks": [
            {"title": "Zouk La Sé Sèl Médikaman Nou Ni", "duration": 285},
            {"title": "Syé Bwa", "duration": 312},
            {"title": "Kréyol", "duration": 248},
        ]
    },
    {
        "name": "Admiral T",
        "origin": "GP",  # Guadeloupe
        "genres": ["Dancehall", "Reggae"],
        "tracks": [
            {"title": "Mi Amor", "duration": 234},
            {"title": "Gwada Bounce", "duration": 198},
        ]
    },
    {
        "name": "Tanya St-Val",
        "origin": "MQ",
        "genres": ["Zouk", "R&B"],
        "tracks": [
            {"title": "Kolé Séré", "duration": 276},
            {"title": "An Mwen", "duration": 302},
        ]
    },
    {
        "name": "Bob Marley Legacy",
        "origin": "JM",  # Jamaica
        "genres": ["Reggae", "Roots"],
        "tracks": [
            {"title": "Caribbean Sunset (Cover)", "duration": 324},
            {"title": "Island Vibes", "duration": 268},
        ]
    },
    {
        "name": "Wyclef Jean",
        "origin": "HT",  # Haiti
        "genres": ["Hip-Hop", "Kompa"],
        "tracks": [
            {"title": "Haiti Connection", "duration": 289},
            {"title": "Diaspora Soul", "duration": 256},
        ]
    },
    {
        "name": "Machel Montano",
        "origin": "TT",  # Trinidad
        "genres": ["Soca", "Calypso"],
        "tracks": [
            {"title": "Carnival Fire", "duration": 218},
            {"title": "Trini Vibes", "duration": 242},
        ]
    },
]

# ─── AFRICAN ARTISTS ──────────────────────────────────────────────────────────

AFRICAN_ARTISTS = [
    {
        "name": "Youssou N'Dour",
        "origin": "SN",  # Senegal
        "genres": ["Mbalax", "World"],
        "tracks": [
            {"title": "7 Seconds (Live)", "duration": 298},
            {"title": "Birima", "duration": 342},
            {"title": "Set", "duration": 276},
        ]
    },
    {
        "name": "Burna Boy",
        "origin": "NG",  # Nigeria
        "genres": ["Afrobeats", "Afrofusion"],
        "tracks": [
            {"title": "African Giant (Remix)", "duration": 265},
            {"title": "Lagos Love", "duration": 234},
        ]
    },
    {
        "name": "Angélique Kidjo",
        "origin": "BJ",  # Benin
        "genres": ["World", "Afropop"],
        "tracks": [
            {"title": "Agolo", "duration": 312},
            {"title": "Afrika", "duration": 287},
        ]
    },
    {
        "name": "Fally Ipupa",
        "origin": "CD",  # Congo
        "genres": ["Rumba Congolaise", "Ndombolo"],
        "tracks": [
            {"title": "Eloko Oyo", "duration": 356},
            {"title": "Sweet Life", "duration": 298},
        ]
    },
    {
        "name": "Salif Keita",
        "origin": "ML",  # Mali
        "genres": ["Mandingue", "Afropop"],
        "tracks": [
            {"title": "Africa", "duration": 324},
            {"title": "Mandjou", "duration": 412},
        ]
    },
    {
        "name": "Wizkid",
        "origin": "NG",
        "genres": ["Afrobeats", "Dancehall"],
        "tracks": [
            {"title": "Made in Lagos", "duration": 245},
            {"title": "Starboy Flow", "duration": 218},
        ]
    },
    {
        "name": "Alpha Blondy",
        "origin": "CI",  # Côte d'Ivoire
        "genres": ["Reggae", "World"],
        "tracks": [
            {"title": "Jerusalem", "duration": 298},
            {"title": "Brigadier Sabari", "duration": 276},
        ]
    },
]

# ─── DIASPORA ARTISTS ─────────────────────────────────────────────────────────

DIASPORA_ARTISTS = [
    {
        "name": "MC Solaar",
        "origin": "FR",
        "genres": ["Hip-Hop Français", "Rap"],
        "tracks": [
            {"title": "Bouge de là", "duration": 245},
            {"title": "Prose Combat", "duration": 278},
        ]
    },
    {
        "name": "Aya Nakamura",
        "origin": "FR",
        "genres": ["Afropop", "R&B Français"],
        "tracks": [
            {"title": "Djadja (Live)", "duration": 198},
            {"title": "Pookie", "duration": 212},
        ]
    },
    {
        "name": "Jorja Smith",
        "origin": "GB",
        "genres": ["Neo-Soul", "R&B"],
        "tracks": [
            {"title": "Blue Lights", "duration": 267},
            {"title": "On My Mind", "duration": 234},
        ]
    },
    {
        "name": "H.E.R.",
        "origin": "US",
        "genres": ["R&B", "Soul"],
        "tracks": [
            {"title": "Focus", "duration": 289},
            {"title": "Best Part", "duration": 245},
        ]
    },
    {
        "name": "Burna Boy x Stormzy",
        "origin": "GB",
        "genres": ["Afrobeats", "Grime"],
        "tracks": [
            {"title": "Real Life (Collaboration)", "duration": 256},
        ]
    },
]

# ─── LATIN & GLOBAL ARTISTS ───────────────────────────────────────────────────

GLOBAL_ARTISTS = [
    {
        "name": "Gilberto Gil",
        "origin": "BR",  # Brazil
        "genres": ["MPB", "Tropicália"],
        "tracks": [
            {"title": "Aquele Abraço", "duration": 287},
            {"title": "Toda Menina Baiana", "duration": 312},
        ]
    },
    {
        "name": "Celia Cruz Legacy",
        "origin": "CU",  # Cuba
        "genres": ["Salsa", "Latin"],
        "tracks": [
            {"title": "La Vida Es Un Carnaval (Tribute)", "duration": 298},
        ]
    },
    {
        "name": "BTS (방탄소년단)",
        "origin": "KR",  # Korea
        "genres": ["K-Pop", "Hip-Hop"],
        "tracks": [
            {"title": "Dynamite (Festival Mix)", "duration": 219},
        ]
    },
    {
        "name": "YOASOBI",
        "origin": "JP",  # Japan
        "genres": ["J-Pop", "Electronic"],
        "tracks": [
            {"title": "夜に駆ける (Racing into the Night)", "duration": 264},
        ]
    },
    {
        "name": "A.R. Rahman",
        "origin": "IN",  # India
        "genres": ["Bollywood", "World Fusion"],
        "tracks": [
            {"title": "Jai Ho (Live Version)", "duration": 324},
            {"title": "Rang De Basanti", "duration": 356},
        ]
    },
]

# ─── CVLN INTERNAL CONTENT: DJ SAYD / FACTORY MAKER STUDIO ────────────────────

CVLN_INTERNAL = [
    {
        "name": "DJ Sayd",
        "origin": "FR",
        "label": "Factory Maker Studio",
        "genres": ["Electronic", "Afro House", "Diaspora"],
        "frek_id": "FRK-DJSAYD001",
        "tracks": [
            {
                "title": "C'est Nous L'Avenir",
                "duration": 342,
                "type": "audiovisual_creator",
                "description": "Le manifeste audiovisuel CVLN. Une déclaration d'identité culturelle.",
                "is_flagship": True,
            },
            {
                "title": "Diaspora Nights",
                "duration": 298,
                "type": "music",
            },
            {
                "title": "Kinshasa to Paris",
                "duration": 276,
                "type": "music",
            },
            {
                "title": "FMS Session 001",
                "duration": 3600,  # 1 hour
                "type": "audiovisual_creator",
                "description": "Session live enregistrée au Factory Maker Studio.",
            },
        ]
    },
]

# ─── AUDIOVISUAL CONTENT ──────────────────────────────────────────────────────

AUDIOVISUAL_CONTENT = [
    {
        "title": "SAYD — C'est Nous L'Avenir",
        "type": "documentary",
        "artist": "DJ Sayd / Factory Maker Studio",
        "origin": "FR",
        "genres": ["Documentaire", "Culture", "Diaspora"],
        "duration": 5400,  # 90 min
        "description": "Un documentaire puissant sur la diaspora africaine et son impact culturel mondial. Produit par Factory Maker Studio.",
        "rating": "16+",
        "year": 2024,
    },
    {
        "title": "Diaspora Rising",
        "type": "series",
        "artist": "KORA Originals",
        "origin": "FR",
        "genres": ["Drame", "Histoire", "Diaspora"],
        "duration": 2880,  # 8 x 6min per episode placeholder
        "description": "Une série dramatique suivant trois générations d'une famille entre l'Afrique et l'Europe.",
        "rating": "12+",
        "year": 2024,
    },
    {
        "title": "Afrobeat Origins",
        "type": "documentary",
        "artist": "Various Directors",
        "origin": "NG",
        "genres": ["Musique", "Histoire", "Afrique"],
        "duration": 8100,  # 2h15
        "description": "L'histoire de l'Afrobeat, de Fela Kuti aux charts mondiaux.",
        "rating": "Tous publics",
        "year": 2023,
    },
    {
        "title": "Lagos to Paris",
        "type": "film",
        "artist": "Akinola Films",
        "origin": "NG",
        "genres": ["Drame", "Romance", "Migration"],
        "duration": 6300,
        "description": "Une histoire d'amour entre deux mondes, deux cultures.",
        "rating": "12+",
        "year": 2024,
    },
    {
        "title": "Youssou N'Dour: Live at Bercy",
        "type": "concert",
        "artist": "Youssou N'Dour",
        "origin": "SN",
        "genres": ["Concert", "Mbalax", "World"],
        "duration": 7200,
        "description": "Concert historique enregistré à Paris Bercy.",
        "rating": "Tous publics",
        "year": 2024,
    },
    {
        "title": "Roots of Zouk",
        "type": "documentary",
        "artist": "Antilles Productions",
        "origin": "MQ",
        "genres": ["Musique", "Antilles", "Histoire"],
        "duration": 4800,
        "description": "Les origines du Zouk, de Kassav' à aujourd'hui.",
        "rating": "Tous publics",
        "year": 2023,
    },
    {
        "title": "Kinshasa Symphony",
        "type": "documentary",
        "artist": "Congo Films",
        "origin": "CD",
        "genres": ["Musique", "Classique", "Afrique"],
        "duration": 5700,
        "description": "Un orchestre symphonique au cœur du Congo.",
        "rating": "Tous publics",
        "year": 2024,
    },
    {
        "title": "Caribbean Dreams",
        "type": "series",
        "artist": "Island Pictures",
        "origin": "JM",
        "genres": ["Drame", "Caraïbes", "Famille"],
        "duration": 2160,
        "description": "Une famille jamaïcaine entre traditions et modernité.",
        "rating": "Tous publics",
        "year": 2024,
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# SEED FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def generate_frekcore_ref():
    """Generate a FrekCore reference"""
    return f"FREK-O-{uuid.uuid4().hex[:16].upper()}"


def generate_work_id():
    """Generate a KORA work ID"""
    return f"KORA-W-{uuid.uuid4().hex[:12].upper()}"


def create_work(artist_name: str, track: dict, origin: str, genres: list, frek_id: str = None):
    """Create a work document"""
    now = datetime.now(timezone.utc)
    work_id = generate_work_id()
    
    work = {
        "id": str(uuid.uuid4()),
        "work_id": work_id,
        "type": track.get("type", "music"),
        "title": track["title"],
        "description": track.get("description", f"Track by {artist_name}"),
        "duration_seconds": track["duration"],
        "display_artist": artist_name,
        "creator_frek_id": frek_id or f"frek-{artist_name.lower().replace(' ', '-')}",
        "genres": genres,
        "languages": ["fr", "en"],
        "territories_origin": [origin],
        "cultural_tags": genres[:3],
        "explicit_content": False,
        
        # Assets
        "audio_url": random.choice(AUDIO_STREAM_URLS),
        "artwork_url": random.choice(ARTWORK_URLS),
        
        # Play stats (for trending)
        "play_count": random.randint(1000, 500000),
        
        # Source tracking
        "ingestion_source": "seed",
        "external_id": f"seed-{uuid.uuid4().hex[:8]}",
        
        # FrekCore
        "frekcore_ref": generate_frekcore_ref(),
        "frekcore_validated": True,
        "frekcore_validated_at": now,
        
        # Status
        "status": "validated",
        "visibility": "public",
        
        # Timestamps
        "created_at": now - timedelta(days=random.randint(1, 90)),
        "updated_at": now,
        "published_at": now - timedelta(days=random.randint(0, 30)),
    }
    
    # Mark flagship content
    if track.get("is_flagship"):
        work["is_flagship"] = True
        work["play_count"] = 1000000  # Boost visibility
    
    return work


def create_audiovisual_work(content: dict):
    """Create an audiovisual work document"""
    now = datetime.now(timezone.utc)
    work_id = generate_work_id()
    
    content_type_map = {
        "documentary": "audiovisual_catalog",
        "film": "audiovisual_catalog",
        "series": "audiovisual_catalog",
        "concert": "audiovisual_creator",
    }
    
    return {
        "id": str(uuid.uuid4()),
        "work_id": work_id,
        "type": content_type_map.get(content["type"], "audiovisual_catalog"),
        "content_type": content["type"],
        "title": content["title"],
        "description": content.get("description", ""),
        "duration_seconds": content["duration"],
        "duration_formatted": f"{content['duration'] // 3600}h {(content['duration'] % 3600) // 60}min" if content['duration'] >= 3600 else f"{content['duration'] // 60}min",
        "display_artist": content["artist"],
        "genres": content["genres"],
        "languages": ["fr"],
        "territories_origin": [content["origin"]],
        "rating": content.get("rating", "Tous publics"),
        "release_year": content.get("year", 2024),
        
        # Assets
        "artwork_url": random.choice(ARTWORK_URLS),
        "backdrop_url": random.choice(ARTWORK_URLS),
        "video_url": None,  # Would be set by real upload
        
        # Stats
        "play_count": random.randint(5000, 200000),
        
        # Source
        "ingestion_source": "seed",
        
        # FrekCore
        "frekcore_ref": generate_frekcore_ref(),
        "frekcore_validated": True,
        "frekcore_validated_at": now,
        
        # Status
        "status": "validated",
        "visibility": "public",
        
        # Timestamps
        "created_at": now - timedelta(days=random.randint(1, 180)),
        "updated_at": now,
        "published_at": now - timedelta(days=random.randint(0, 60)),
    }


async def seed_catalog():
    """Main seed function"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'kora_db')]
    
    print("🌱 KORA Demo Catalog Seed")
    print("=" * 50)
    
    # Clear existing seed data (optional)
    deleted = await db.works.delete_many({"ingestion_source": "seed"})
    print(f"🗑️  Cleared {deleted.deleted_count} existing seed works")
    
    works_to_insert = []
    
    # ─── MUSIC WORKS ──────────────────────────────────────────────────────────
    print("\n🎵 Seeding Music Catalog...")
    
    all_artists = CARIBBEAN_ARTISTS + AFRICAN_ARTISTS + DIASPORA_ARTISTS + GLOBAL_ARTISTS
    
    for artist in all_artists:
        for track in artist["tracks"]:
            work = create_work(
                artist_name=artist["name"],
                track=track,
                origin=artist["origin"],
                genres=artist["genres"],
            )
            works_to_insert.append(work)
            print(f"  ✓ {artist['name']} - {track['title']}")
    
    # ─── CVLN INTERNAL CONTENT ────────────────────────────────────────────────
    print("\n🏭 Seeding CVLN/FMS Content...")
    
    for cvln_artist in CVLN_INTERNAL:
        for track in cvln_artist["tracks"]:
            work = create_work(
                artist_name=cvln_artist["name"],
                track=track,
                origin=cvln_artist["origin"],
                genres=cvln_artist["genres"],
                frek_id=cvln_artist.get("frek_id"),
            )
            work["label"] = cvln_artist.get("label")
            work["is_cvln_content"] = True
            works_to_insert.append(work)
            print(f"  ✓ {cvln_artist['name']} - {track['title']} (CVLN)")
    
    # ─── AUDIOVISUAL WORKS ────────────────────────────────────────────────────
    print("\n🎬 Seeding Audiovisual Catalog...")
    
    for av_content in AUDIOVISUAL_CONTENT:
        work = create_audiovisual_work(av_content)
        works_to_insert.append(work)
        print(f"  ✓ [{av_content['type'].upper()}] {av_content['title']}")
    
    # ─── INSERT ALL ───────────────────────────────────────────────────────────
    if works_to_insert:
        result = await db.works.insert_many(works_to_insert)
        print(f"\n✅ Inserted {len(result.inserted_ids)} works")
    
    # ─── SUMMARY ──────────────────────────────────────────────────────────────
    total_works = await db.works.count_documents({})
    music_works = await db.works.count_documents({"type": "music"})
    av_works = await db.works.count_documents({"type": {"$in": ["audiovisual_catalog", "audiovisual_creator"]}})
    
    print("\n" + "=" * 50)
    print("📊 Catalog Summary:")
    print(f"   Total Works: {total_works}")
    print(f"   Music: {music_works}")
    print(f"   Audiovisual: {av_works}")
    print("=" * 50)
    
    client.close()
    return len(works_to_insert)


if __name__ == "__main__":
    asyncio.run(seed_catalog())
