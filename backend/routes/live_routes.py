"""KORA Live — Billetterie et Événements

Gestion des événements en direct:
- Création d'événements par créateurs
- Vente de billets
- Streaming live
- Replays
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import logging
import secrets
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/live", tags=["live"])

JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

db = None


class EventCreate(BaseModel):
    title: str
    description: str = ''
    event_type: str = 'concert'  # concert, podcast, talk, workshop
    scheduled_at: datetime
    duration_minutes: int = 90
    cover_url: str = ''
    territory: str = 'world'
    is_free: bool = False
    ticket_price_cents: int = 0  # in cents EUR
    max_attendees: int = 0  # 0 = unlimited
    is_replay_available: bool = True


class TicketPurchase(BaseModel):
    quantity: int = 1


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


@router.post("/events")
async def create_event(
    event: EventCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer un événement live (créateurs uniquement)"""
    if not current_user.get('is_creator', False):
        raise HTTPException(status_code=403, detail="Réservé aux créateurs")
    
    event_doc = {
        'title': event.title,
        'description': event.description,
        'event_type': event.event_type,
        'creator_id': str(current_user['_id']),
        'creator_frek_id': current_user.get('frek_id', ''),
        'creator_name': current_user.get('display_name', 'Artiste'),
        'scheduled_at': event.scheduled_at,
        'duration_minutes': event.duration_minutes,
        'cover_url': event.cover_url or 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        'territory': event.territory,
        'is_free': event.is_free,
        'ticket_price_cents': 0 if event.is_free else event.ticket_price_cents,
        'max_attendees': event.max_attendees,
        'current_attendees': 0,
        'is_replay_available': event.is_replay_available,
        'status': 'scheduled',  # scheduled, live, ended, cancelled
        'stream_key': secrets.token_urlsafe(16),
        'stream_url': None,
        'replay_url': None,
        'created_at': datetime.now(timezone.utc),
    }
    
    result = await db.events.insert_one(event_doc)
    event_doc['_id'] = str(result.inserted_id)
    
    logger.info(f"Event created: {event.title} by {current_user.get('frek_id')}")
    return event_doc


@router.get("/events")
async def list_events(
    status: str = Query('scheduled', pattern='^(scheduled|live|ended|all)$'),
    territory: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50)
):
    """Liste des événements"""
    query = {}
    if status != 'all':
        query['status'] = status
    if territory:
        query['territory'] = territory
    if event_type:
        query['event_type'] = event_type
    
    sort_field = 'scheduled_at' if status == 'scheduled' else '-scheduled_at'
    cursor = db.events.find(query).sort('scheduled_at', 1 if status == 'scheduled' else -1).limit(limit)
    events = await cursor.to_list(length=limit)
    
    for e in events:
        e['_id'] = str(e['_id'])
        del e['stream_key']  # Don't expose stream key
    
    return {'events': events, 'total': len(events)}


@router.get("/events/live")
async def get_live_now():
    """Événements en direct maintenant"""
    cursor = db.events.find({'status': 'live'}).sort('current_attendees', -1)
    events = await cursor.to_list(length=20)
    
    for e in events:
        e['_id'] = str(e['_id'])
        if 'stream_key' in e:
            del e['stream_key']
    
    return {'live_events': events, 'count': len(events)}


@router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Détails d'un événement"""
    try:
        event = await db.events.find_one({'_id': ObjectId(event_id)})
    except Exception:
        event = await db.events.find_one({'_id': event_id})
    
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    event['_id'] = str(event['_id'])
    if 'stream_key' in event:
        del event['stream_key']
    
    return event


@router.post("/events/{event_id}/tickets")
async def purchase_ticket(
    event_id: str,
    purchase: TicketPurchase,
    current_user: dict = Depends(get_user_from_token)
):
    """Acheter un billet pour un événement"""
    try:
        event = await db.events.find_one({'_id': ObjectId(event_id)})
    except Exception:
        event = None
    
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event['status'] != 'scheduled':
        raise HTTPException(status_code=400, detail="Événement non disponible")
    
    # Check capacity
    if event['max_attendees'] > 0:
        if event['current_attendees'] + purchase.quantity > event['max_attendees']:
            raise HTTPException(status_code=400, detail="Plus de places disponibles")
    
    # Create ticket
    ticket_doc = {
        'event_id': event_id,
        'user_id': str(current_user['_id']),
        'user_frek_id': current_user.get('frek_id', ''),
        'quantity': purchase.quantity,
        'ticket_code': secrets.token_urlsafe(8).upper(),
        'total_price_cents': event['ticket_price_cents'] * purchase.quantity,
        'status': 'valid',
        'purchased_at': datetime.now(timezone.utc),
    }
    
    result = await db.tickets.insert_one(ticket_doc)
    
    # Update attendee count
    await db.events.update_one(
        {'_id': ObjectId(event_id)},
        {'$inc': {'current_attendees': purchase.quantity}}
    )
    
    ticket_doc['_id'] = str(result.inserted_id)
    
    return {
        'ticket': ticket_doc,
        'event_title': event['title'],
        'message': 'Billet acheté avec succès' if event['ticket_price_cents'] > 0 else 'Inscription confirmée'
    }


@router.get("/my-tickets")
async def my_tickets(
    current_user: dict = Depends(get_user_from_token)
):
    """Mes billets"""
    cursor = db.tickets.find({'user_id': str(current_user['_id'])}).sort('purchased_at', -1)
    tickets = await cursor.to_list(length=100)
    
    # Enrich with event details
    for ticket in tickets:
        ticket['_id'] = str(ticket['_id'])
        try:
            event = await db.events.find_one({'_id': ObjectId(ticket['event_id'])})
            if event:
                ticket['event'] = {
                    'title': event['title'],
                    'scheduled_at': event['scheduled_at'].isoformat(),
                    'status': event['status'],
                    'cover_url': event['cover_url']
                }
        except Exception:
            pass
    
    return {'tickets': tickets}


@router.post("/events/{event_id}/start")
async def start_event(
    event_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Démarrer un événement live (créateur uniquement)"""
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event['creator_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if event['status'] != 'scheduled':
        raise HTTPException(status_code=400, detail="L'événement ne peut pas être démarré")
    
    await db.events.update_one(
        {'_id': ObjectId(event_id)},
        {
            '$set': {
                'status': 'live',
                'started_at': datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        'status': 'live',
        'stream_key': event['stream_key'],
        'message': 'Événement démarré!'
    }


@router.post("/events/{event_id}/end")
async def end_event(
    event_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Terminer un événement live"""
    event = await db.events.find_one({'_id': ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event['creator_id'] != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.events.update_one(
        {'_id': ObjectId(event_id)},
        {
            '$set': {
                'status': 'ended',
                'ended_at': datetime.now(timezone.utc)
            }
        }
    )
    
    return {'status': 'ended', 'message': 'Événement terminé'}


def init_routes(database):
    global db
    db = database
