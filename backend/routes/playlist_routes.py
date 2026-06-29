"""KORA Playlists — Création et Partage

Gestion des playlists utilisateur:
- Création/modification/suppression
- Playlists publiques/privées
- Partage et collaboration
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import os
import logging
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/playlists", tags=["playlists"])

JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

db = None


class PlaylistCreate(BaseModel):
    name: str
    description: str = ''
    is_public: bool = True
    cover_url: str = ''
    territory: str = 'world'


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    cover_url: Optional[str] = None


class TrackAdd(BaseModel):
    track_id: str
    position: Optional[int] = None


async def get_user_from_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")


@router.post("")
async def create_playlist(
    playlist: PlaylistCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer une nouvelle playlist"""
    playlist_doc = {
        'name': playlist.name,
        'description': playlist.description,
        'owner_id': str(current_user['_id']),
        'owner_frek_id': current_user.get('frek_id', ''),
        'owner_name': current_user.get('display_name', 'Utilisateur'),
        'is_public': playlist.is_public,
        'cover_url': playlist.cover_url or 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        'territory': playlist.territory,
        'tracks': [],
        'followers_count': 0,
        'play_count': 0,
        'duration_total': 0,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    
    result = await db.playlists.insert_one(playlist_doc)
    playlist_doc['_id'] = str(result.inserted_id)
    
    logger.info(f"Playlist created: {playlist.name} by {current_user.get('frek_id')}")
    return playlist_doc


@router.get("")
async def list_playlists(
    limit: int = Query(20, ge=1, le=100),
    territory: Optional[str] = None,
    featured: bool = False
):
    """Liste des playlists publiques"""
    query = {'is_public': True}
    if territory:
        query['territory'] = territory
    
    sort_field = 'followers_count' if featured else 'created_at'
    cursor = db.playlists.find(query).sort(sort_field, -1).limit(limit)
    playlists = await cursor.to_list(length=limit)
    
    for p in playlists:
        p['_id'] = str(p['_id'])
    
    return {'playlists': playlists, 'total': len(playlists)}


@router.get("/my")
async def my_playlists(
    current_user: dict = Depends(get_user_from_token)
):
    """Mes playlists"""
    cursor = db.playlists.find({'owner_id': str(current_user['_id'])}).sort('updated_at', -1)
    playlists = await cursor.to_list(length=100)
    
    for p in playlists:
        p['_id'] = str(p['_id'])
    
    return {'playlists': playlists, 'total': len(playlists)}


@router.get("/{playlist_id}")
async def get_playlist(playlist_id: str):
    """Détails d'une playlist avec tracks"""
    try:
        playlist = await db.playlists.find_one({'_id': ObjectId(playlist_id)})
    except Exception:
        playlist = await db.playlists.find_one({'_id': playlist_id})
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvée")
    
    playlist['_id'] = str(playlist['_id'])
    
    # Fetch track details
    track_ids = [t.get('track_id') for t in playlist.get('tracks', [])]
    if track_ids:
        tracks_cursor = db.content.find({'_id': {'$in': [ObjectId(tid) for tid in track_ids if ObjectId.is_valid(tid)]}})
        tracks = await tracks_cursor.to_list(length=500)
        tracks_map = {str(t['_id']): t for t in tracks}
        
        for i, track_ref in enumerate(playlist['tracks']):
            track_data = tracks_map.get(track_ref['track_id'], {})
            playlist['tracks'][i]['details'] = {
                'title': track_data.get('title', 'Titre inconnu'),
                'artist': track_data.get('creator_id', 'Artiste'),
                'artwork': track_data.get('artwork_url', ''),
                'duration': track_data.get('duration', 0),
                'stream_url': track_data.get('media_url', ''),
            }
    
    return playlist


@router.put("/{playlist_id}")
async def update_playlist(
    playlist_id: str,
    update: PlaylistUpdate,
    current_user: dict = Depends(get_user_from_token)
):
    """Modifier une playlist"""
    playlist = await db.playlists.find_one({'_id': ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvée")
    
    if playlist['owner_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc)
    
    await db.playlists.update_one(
        {'_id': ObjectId(playlist_id)},
        {'$set': update_data}
    )
    
    return {'updated': True}


@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Supprimer une playlist"""
    playlist = await db.playlists.find_one({'_id': ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvée")
    
    if playlist['owner_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.playlists.delete_one({'_id': ObjectId(playlist_id)})
    return {'deleted': True}


@router.post("/{playlist_id}/tracks")
async def add_track(
    playlist_id: str,
    track: TrackAdd,
    current_user: dict = Depends(get_user_from_token)
):
    """Ajouter un track à une playlist"""
    playlist = await db.playlists.find_one({'_id': ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvée")
    
    if playlist['owner_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Get track duration
    content = await db.content.find_one({'_id': ObjectId(track.track_id)})
    duration = content.get('duration', 0) if content else 0
    
    track_entry = {
        'track_id': track.track_id,
        'added_at': datetime.now(timezone.utc).isoformat(),
        'added_by': current_user.get('frek_id', ''),
    }
    
    await db.playlists.update_one(
        {'_id': ObjectId(playlist_id)},
        {
            '$push': {'tracks': track_entry},
            '$inc': {'duration_total': duration},
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    return {'added': True, 'track_count': len(playlist.get('tracks', [])) + 1}


@router.delete("/{playlist_id}/tracks/{track_id}")
async def remove_track(
    playlist_id: str,
    track_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Retirer un track d'une playlist"""
    playlist = await db.playlists.find_one({'_id': ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist non trouvée")
    
    if playlist['owner_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.playlists.update_one(
        {'_id': ObjectId(playlist_id)},
        {
            '$pull': {'tracks': {'track_id': track_id}},
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    return {'removed': True}


@router.post("/{playlist_id}/follow")
async def follow_playlist(
    playlist_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Suivre une playlist"""
    await db.playlists.update_one(
        {'_id': ObjectId(playlist_id)},
        {'$inc': {'followers_count': 1}}
    )
    
    await db.users.update_one(
        {'_id': current_user['_id']},
        {'$addToSet': {'followed_playlists': playlist_id}}
    )
    
    return {'following': True}


def init_routes(database):
    global db
    db = database
