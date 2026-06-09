"""Routes API pour le catalogue musical"""
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
    media_type: str = Query('all', regex='^(all|audio|video)$')
):
    """Recherche dans tous les catalogues musicaux"""
    results = await catalog_service.search_all(q, limit, media_type)
    return results


@router.get("/featured")
async def get_featured(
    limit: int = Query(20, ge=1, le=50)
):
    """Récupère les tracks populaires"""
    tracks = await catalog_service.get_featured_tracks(limit)
    return {'tracks': tracks, 'total': len(tracks)}


@router.get("/territory/{territory}")
async def get_by_territory(
    territory: str,
    limit: int = Query(20, ge=1, le=50)
):
    """Récupère les tracks par territoire/genre"""
    # Mapping territoires vers tags Jamendo
    territory_tags = {
        'caribbean': 'reggae,dancehall,soca,calypso',
        'africa': 'afrobeat,african,highlife,soukous',
        'diaspora': 'soul,rnb,hiphop,jazz,blues,gospel',
        'latin': 'latin,salsa,bachata,merengue,cumbia',
        'world': 'world,ethnic,traditional'
    }
    
    tags = territory_tags.get(territory.lower(), territory)
    tracks = await catalog_service.get_tracks_by_genre(tags, limit)
    return {'tracks': tracks, 'territory': territory, 'total': len(tracks)}


@router.get("/track/{source}/{track_id}")
async def get_track_details(
    source: str,
    track_id: str
):
    """Récupère les détails d'un track avec URL de streaming"""
    if source not in ['jamendo', 'archive']:
        raise HTTPException(status_code=400, detail="Source invalide")
    
    track = await catalog_service.get_track_details(track_id, source)
    
    if not track:
        raise HTTPException(status_code=404, detail="Track non trouvé")
    
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
        ]
    }
