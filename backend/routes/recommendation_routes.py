"""KORA Recommendation Engine — IA Musicale

Algorithme de recommandation basé sur:
- Historique d'écoute
- Préférences territoriales
- Artistes suivis
- Comportement similaire
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from collections import Counter
import os
import logging
import random
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

db = None


async def get_user_from_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None  # Allow anonymous recommendations
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return await db.users.find_one({"_id": user_id})
    except JWTError:
        pass
    return None


async def get_user_listening_history(user_id: str, days: int = 30) -> List[Dict]:
    """Récupère l'historique d'écoute récent"""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = db.listening_history.find({
        'user_id': user_id,
        'played_at': {'$gte': since}
    }).sort('played_at', -1).limit(500)
    return await cursor.to_list(length=500)


async def analyze_preferences(history: List[Dict]) -> Dict:
    """Analyse les préférences depuis l'historique"""
    territories = Counter()
    genres = Counter()
    artists = Counter()
    
    for entry in history:
        territories[entry.get('territory', 'world')] += 1
        for genre in entry.get('genres', []):
            genres[genre] += 1
        artists[entry.get('artist_id', '')] += 1
    
    return {
        'top_territories': territories.most_common(5),
        'top_genres': genres.most_common(10),
        'top_artists': artists.most_common(10),
    }


@router.get("/for-you")
async def get_for_you(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_user_from_token)
):
    """Recommandations personnalisées 'Pour Toi'"""
    recommendations = []
    
    if current_user:
        # Personalized recommendations
        history = await get_user_listening_history(str(current_user['_id']))
        prefs = await analyze_preferences(history)
        
        # Get tracks matching preferences
        top_territories = [t[0] for t in prefs['top_territories'][:3]] or ['caribbean', 'africa']
        top_genres = [g[0] for g in prefs['top_genres'][:5]] or ['afrobeat', 'reggae']
        
        # Query based on preferences
        query = {
            'status': 'published',
            '$or': [
                {'territory': {'$in': top_territories}},
                {'genres': {'$in': top_genres}}
            ]
        }
        
        # Exclude already listened
        listened_ids = [h.get('track_id') for h in history[:100]]
        if listened_ids:
            query['_id'] = {'$nin': [ObjectId(tid) for tid in listened_ids if ObjectId.is_valid(tid)]}
        
        cursor = db.content.find(query).sort('play_count', -1).limit(limit * 2)
        tracks = await cursor.to_list(length=limit * 2)
        
        # Shuffle for variety
        random.shuffle(tracks)
        recommendations = tracks[:limit]
    else:
        # Anonymous - return popular tracks
        cursor = db.content.find({'status': 'published'}).sort('play_count', -1).limit(limit)
        recommendations = await cursor.to_list(length=limit)
    
    # Format response
    return {
        'tracks': [{
            'id': str(t['_id']),
            'title': t.get('title', ''),
            'artist': t.get('creator_id', ''),
            'artwork': t.get('artwork_url', ''),
            'stream_url': t.get('media_url', ''),
            'territory': t.get('territory', 'world'),
            'genres': t.get('genres', []),
            'duration': t.get('duration', 0),
            'reason': 'Basé sur vos écoutes' if current_user else 'Populaire'
        } for t in recommendations],
        'personalized': current_user is not None
    }


@router.get("/similar/{track_id}")
async def get_similar_tracks(
    track_id: str,
    limit: int = Query(10, ge=1, le=30)
):
    """Tracks similaires à un track donné"""
    try:
        track = await db.content.find_one({'_id': ObjectId(track_id)})
    except Exception:
        track = await db.content.find_one({'_id': track_id})
    
    if not track:
        raise HTTPException(status_code=404, detail="Track non trouvé")
    
    # Find similar by territory and genres
    query = {
        'status': 'published',
        '_id': {'$ne': track['_id']},
        '$or': [
            {'territory': track.get('territory')},
            {'genres': {'$in': track.get('genres', [])}},
            {'creator_id': track.get('creator_id')}
        ]
    }
    
    cursor = db.content.find(query).sort('play_count', -1).limit(limit)
    similar = await cursor.to_list(length=limit)
    
    return {
        'tracks': [{
            'id': str(t['_id']),
            'title': t.get('title', ''),
            'artist': t.get('creator_id', ''),
            'artwork': t.get('artwork_url', ''),
            'stream_url': t.get('media_url', ''),
            'territory': t.get('territory', 'world'),
        } for t in similar],
        'based_on': track.get('title', '')
    }


@router.get("/discover")
async def discover_new(
    territory: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50)
):
    """Découvrir de nouveaux artistes/contenus"""
    query = {'status': 'published'}
    if territory:
        query['territory'] = territory
    
    # Recent content with low play count (hidden gems)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    query['created_at'] = {'$gte': week_ago}
    
    cursor = db.content.find(query).sort('created_at', -1).limit(limit)
    discoveries = await cursor.to_list(length=limit)
    
    return {
        'tracks': [{
            'id': str(t['_id']),
            'title': t.get('title', ''),
            'artist': t.get('creator_id', ''),
            'artwork': t.get('artwork_url', ''),
            'stream_url': t.get('media_url', ''),
            'territory': t.get('territory', 'world'),
            'is_new': True
        } for t in discoveries],
        'category': 'Nouvelles sorties'
    }


@router.get("/daily-mix")
async def daily_mix(
    current_user: dict = Depends(get_user_from_token)
):
    """Mix quotidien personnalisé"""
    if not current_user:
        # Return generic mix for anonymous
        cursor = db.content.find({'status': 'published'}).limit(30)
        tracks = await cursor.to_list(length=30)
        random.shuffle(tracks)
        tracks = tracks[:20]
    else:
        # Personalized mix
        history = await get_user_listening_history(str(current_user['_id']), days=14)
        prefs = await analyze_preferences(history)
        
        top_genres = [g[0] for g in prefs['top_genres'][:3]] or ['afrobeat']
        
        cursor = db.content.find({
            'status': 'published',
            'genres': {'$in': top_genres}
        }).limit(50)
        
        tracks = await cursor.to_list(length=50)
        random.shuffle(tracks)
        tracks = tracks[:20]
    
    return {
        'name': f"Mix du {datetime.now().strftime('%d/%m')}",
        'tracks': [{
            'id': str(t['_id']),
            'title': t.get('title', ''),
            'artist': t.get('creator_id', ''),
            'artwork': t.get('artwork_url', ''),
            'stream_url': t.get('media_url', ''),
        } for t in tracks],
        'generated_at': datetime.now(timezone.utc).isoformat()
    }


@router.post("/log-play")
async def log_play(
    track_id: str,
    duration_seconds: int = 0,
    current_user: dict = Depends(get_user_from_token)
):
    """Enregistrer une écoute pour améliorer les recommandations"""
    if not current_user:
        return {'logged': False}
    
    try:
        track = await db.content.find_one({'_id': ObjectId(track_id)})
    except Exception:
        track = None
    
    if track:
        entry = {
            'user_id': str(current_user['_id']),
            'track_id': track_id,
            'territory': track.get('territory', 'world'),
            'genres': track.get('genres', []),
            'artist_id': track.get('creator_id', ''),
            'duration_listened': duration_seconds,
            'played_at': datetime.now(timezone.utc)
        }
        await db.listening_history.insert_one(entry)
        
        # Update track play count
        await db.content.update_one(
            {'_id': track['_id']},
            {'$inc': {'play_count': 1}}
        )
    
    return {'logged': True}


def init_routes(database):
    global db
    db = database
