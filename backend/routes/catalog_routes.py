"""Routes API pour le catalogue musical — 100% Souverain KORA

Catalogue alimenté exclusivement par les créateurs KORA.
Toutes les requêtes tapent dans MongoDB collection "content".
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.catalog_service import catalog_service

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/search")
async def search_catalog(
    q: str = Query(..., min_length=1, description="Terme de recherche"),
    limit: int = Query(20, ge=1, le=100),
    media_type: str = Query('all', pattern='^(all|audio|video)$')
):
    """Recherche dans le catalogue souverain KORA"""
    results = await catalog_service.search_all(q, limit, media_type)
    return results


@router.get("/featured")
async def get_featured(
    limit: int = Query(20, ge=1, le=50)
):
    """Récupère les tracks populaires du catalogue souverain"""
    tracks = await catalog_service.get_featured_tracks(limit)
    return {
        'tracks': tracks, 
        'total': len(tracks),
        'source': 'kora_organic',
        'message': 'Catalogue 100% créateurs KORA' if tracks else 'Catalogue en attente de créateurs'
    }


@router.get("/territory/{territory}")
async def get_by_territory(
    territory: str,
    limit: int = Query(20, ge=1, le=50)
):
    """Récupère les tracks par territoire — Catalogue souverain"""
    tracks = await catalog_service.get_territory_catalog(territory, limit)
    return {
        'tracks': tracks, 
        'territory': territory, 
        'total': len(tracks),
        'source': 'kora_organic'
    }


@router.get("/track/{source}/{track_id}")
async def get_track_details(
    source: str,
    track_id: str
):
    """Récupère les détails d'un track avec URL de streaming"""
    # Source est toujours 'kora' maintenant (souveraineté)
    track = await catalog_service.get_track_details(track_id, source)
    
    if not track:
        raise HTTPException(status_code=404, detail="Track non trouvé dans le catalogue souverain")
    
    return track


@router.get("/genres")
async def get_genres():
    """Liste des genres/territoires disponibles"""
    return {
        'territories': [
            {'id': 'caribbean', 'name': 'Caraïbes', 'tags': ['reggae', 'dancehall', 'soca', 'calypso', 'zouk']},
            {'id': 'africa', 'name': 'Afrique', 'tags': ['afrobeat', 'afropop', 'highlife', 'soukous', 'mbalax']},
            {'id': 'diaspora', 'name': 'Diaspora', 'tags': ['soul', 'r&b', 'hip-hop', 'jazz', 'blues', 'gospel']},
            {'id': 'latin', 'name': 'Latin', 'tags': ['salsa', 'bachata', 'merengue', 'cumbia', 'reggaeton']},
            {'id': 'world', 'name': 'Monde', 'tags': ['world', 'ethnic', 'traditional', 'fusion']},
        ],
        'categories': [
            {'id': 'music', 'name': 'Musique'},
            {'id': 'podcast', 'name': 'Podcasts'},
            {'id': 'film', 'name': 'Films & Séries'},
            {'id': 'documentary', 'name': 'Documentaires'},
            {'id': 'live', 'name': 'Live & Concerts'},
        ],
        'source': 'kora_organic',
        'sovereignty': 'Catalogue alimenté par les créateurs KORA uniquement'
    }
