"""KORA Podcast Studio — Création et Distribution

Plateforme de création podcast:
- Enregistrement/Upload épisodes
- Gestion des shows
- Distribution automatique
- Analytics
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import os
import logging
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/podcasts", tags=["podcasts"])

JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

db = None


class ShowCreate(BaseModel):
    title: str
    description: str = ''
    category: str = 'culture'  # culture, music, talk, education, news
    language: str = 'fr'
    cover_url: str = ''
    territory: str = 'world'
    is_explicit: bool = False


class EpisodeCreate(BaseModel):
    show_id: str
    title: str
    description: str = ''
    season: int = 1
    episode_number: int = 1
    audio_url: str
    duration_seconds: int = 0
    is_trailer: bool = False
    publish_at: Optional[datetime] = None


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


# ══════════════════════════════════════════════════════════════════════════════
# SHOWS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/shows")
async def create_show(
    show: ShowCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer un nouveau podcast show"""
    if not current_user.get('is_creator', False):
        raise HTTPException(status_code=403, detail="Activez votre compte créateur")
    
    show_doc = {
        'title': show.title,
        'description': show.description,
        'category': show.category,
        'language': show.language,
        'cover_url': show.cover_url or 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
        'territory': show.territory,
        'is_explicit': show.is_explicit,
        'creator_id': str(current_user['_id']),
        'creator_frek_id': current_user.get('frek_id', ''),
        'creator_name': current_user.get('display_name', 'Podcasteur'),
        'episodes_count': 0,
        'subscribers_count': 0,
        'total_plays': 0,
        'status': 'active',
        'rss_feed_url': None,  # Will be generated
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    
    result = await db.podcast_shows.insert_one(show_doc)
    show_doc['_id'] = str(result.inserted_id)
    
    # Generate RSS feed URL
    rss_url = f"https://feed.kora.app/podcast/{result.inserted_id}/rss.xml"
    await db.podcast_shows.update_one(
        {'_id': result.inserted_id},
        {'$set': {'rss_feed_url': rss_url}}
    )
    show_doc['rss_feed_url'] = rss_url
    
    logger.info(f"Podcast show created: {show.title}")
    return show_doc


@router.get("/shows")
async def list_shows(
    category: Optional[str] = None,
    territory: Optional[str] = None,
    featured: bool = False,
    limit: int = Query(20, ge=1, le=50)
):
    """Liste des podcasts"""
    query = {'status': 'active'}
    if category:
        query['category'] = category
    if territory:
        query['territory'] = territory
    
    sort_field = 'subscribers_count' if featured else 'created_at'
    cursor = db.podcast_shows.find(query).sort(sort_field, -1).limit(limit)
    shows = await cursor.to_list(length=limit)
    
    for s in shows:
        s['_id'] = str(s['_id'])
    
    return {'shows': shows, 'total': len(shows)}


@router.get("/shows/my")
async def my_shows(
    current_user: dict = Depends(get_user_from_token)
):
    """Mes podcasts"""
    cursor = db.podcast_shows.find({'creator_id': str(current_user['_id'])}).sort('updated_at', -1)
    shows = await cursor.to_list(length=50)
    
    for s in shows:
        s['_id'] = str(s['_id'])
    
    return {'shows': shows}


@router.get("/shows/{show_id}")
async def get_show(show_id: str):
    """Détails d'un podcast show avec épisodes"""
    try:
        show = await db.podcast_shows.find_one({'_id': ObjectId(show_id)})
    except Exception:
        show = None
    
    if not show:
        raise HTTPException(status_code=404, detail="Podcast non trouvé")
    
    show['_id'] = str(show['_id'])
    
    # Get episodes
    cursor = db.podcast_episodes.find({'show_id': show_id, 'status': 'published'}).sort('episode_number', -1)
    episodes = await cursor.to_list(length=100)
    
    for ep in episodes:
        ep['_id'] = str(ep['_id'])
    
    show['episodes'] = episodes
    return show


# ══════════════════════════════════════════════════════════════════════════════
# EPISODES
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/episodes")
async def create_episode(
    episode: EpisodeCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Publier un nouvel épisode"""
    # Verify show ownership
    show = await db.podcast_shows.find_one({'_id': ObjectId(episode.show_id)})
    if not show:
        raise HTTPException(status_code=404, detail="Show non trouvé")
    
    if show['creator_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    episode_doc = {
        'show_id': episode.show_id,
        'title': episode.title,
        'description': episode.description,
        'season': episode.season,
        'episode_number': episode.episode_number,
        'audio_url': episode.audio_url,
        'duration_seconds': episode.duration_seconds,
        'is_trailer': episode.is_trailer,
        'play_count': 0,
        'status': 'published',
        'published_at': episode.publish_at or datetime.now(timezone.utc),
        'created_at': datetime.now(timezone.utc),
    }
    
    result = await db.podcast_episodes.insert_one(episode_doc)
    episode_doc['_id'] = str(result.inserted_id)
    
    # Update show episode count
    await db.podcast_shows.update_one(
        {'_id': ObjectId(episode.show_id)},
        {
            '$inc': {'episodes_count': 1},
            '$set': {'updated_at': datetime.now(timezone.utc)}
        }
    )
    
    logger.info(f"Episode published: {episode.title}")
    return episode_doc


@router.get("/episodes/{episode_id}")
async def get_episode(episode_id: str):
    """Détails d'un épisode"""
    try:
        episode = await db.podcast_episodes.find_one({'_id': ObjectId(episode_id)})
    except Exception:
        episode = None
    
    if not episode:
        raise HTTPException(status_code=404, detail="Épisode non trouvé")
    
    episode['_id'] = str(episode['_id'])
    
    # Get show info
    show = await db.podcast_shows.find_one({'_id': ObjectId(episode['show_id'])})
    if show:
        episode['show'] = {
            'title': show['title'],
            'cover_url': show['cover_url'],
            'creator_name': show['creator_name']
        }
    
    return episode


@router.post("/episodes/{episode_id}/play")
async def record_episode_play(episode_id: str):
    """Enregistrer une écoute"""
    await db.podcast_episodes.update_one(
        {'_id': ObjectId(episode_id)},
        {'$inc': {'play_count': 1}}
    )
    
    # Also update show total
    episode = await db.podcast_episodes.find_one({'_id': ObjectId(episode_id)})
    if episode:
        await db.podcast_shows.update_one(
            {'_id': ObjectId(episode['show_id'])},
            {'$inc': {'total_plays': 1}}
        )
    
    return {'recorded': True}


@router.post("/shows/{show_id}/subscribe")
async def subscribe_show(
    show_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """S'abonner à un podcast"""
    await db.podcast_shows.update_one(
        {'_id': ObjectId(show_id)},
        {'$inc': {'subscribers_count': 1}}
    )
    
    await db.users.update_one(
        {'_id': current_user['_id']},
        {'$addToSet': {'subscribed_podcasts': show_id}}
    )
    
    return {'subscribed': True}


@router.get("/categories")
async def get_categories():
    """Liste des catégories podcast"""
    return {
        'categories': [
            {'id': 'culture', 'name': 'Culture & Société', 'icon': '🌍'},
            {'id': 'music', 'name': 'Musique', 'icon': '🎵'},
            {'id': 'talk', 'name': 'Talk Show', 'icon': '🎙️'},
            {'id': 'education', 'name': 'Éducation', 'icon': '📚'},
            {'id': 'news', 'name': 'Actualités', 'icon': '📰'},
            {'id': 'history', 'name': 'Histoire', 'icon': '📜'},
            {'id': 'comedy', 'name': 'Humour', 'icon': '😂'},
            {'id': 'storytelling', 'name': 'Récits', 'icon': '📖'},
        ]
    }


def init_routes(database):
    global db
    db = database
