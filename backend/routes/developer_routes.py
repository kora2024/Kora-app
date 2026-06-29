"""KORA for Developers — API Documentation & SDK Portal

Portail développeur pour intégration KORA:
- Documentation API
- Clés API Sandbox
- Webhooks
- SDK Downloads
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os
import secrets
import hashlib
import logging
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/developers", tags=["developers"])

# Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

# Database reference
db = None


class ApiKeyCreate(BaseModel):
    name: str
    environment: str = 'sandbox'  # 'sandbox' or 'production'
    permissions: List[str] = ['catalog:read']


class WebhookCreate(BaseModel):
    url: str
    events: List[str] = ['content.created', 'play.recorded']


async def get_user_from_token(authorization: str = Header(None)):
    """Extract user from JWT token"""
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
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


@router.get("/docs")
async def get_api_documentation():
    """Documentation API KORA complète"""
    return {
        'version': 'v1',
        'base_url': 'https://api.kora.app/api',
        'authentication': {
            'type': 'Bearer Token',
            'header': 'Authorization: Bearer YOUR_API_KEY',
            'description': 'Utilisez votre clé API dans le header Authorization'
        },
        'rate_limits': {
            'sandbox': '100 requests/minute',
            'production': '1000 requests/minute'
        },
        'endpoints': {
            'catalog': {
                'GET /catalog/search': {
                    'description': 'Rechercher dans le catalogue',
                    'params': {'q': 'string (required)', 'limit': 'int (default: 20)'},
                    'response': {'tracks': 'array', 'total': 'int'}
                },
                'GET /catalog/featured': {
                    'description': 'Tracks populaires',
                    'params': {'limit': 'int (default: 20)'},
                    'response': {'tracks': 'array'}
                },
                'GET /catalog/territory/{territory}': {
                    'description': 'Catalogue par territoire',
                    'params': {'territory': 'caribbean|africa|diaspora|latin|world'},
                    'response': {'tracks': 'array', 'territory': 'string'}
                },
                'GET /catalog/track/{source}/{id}': {
                    'description': 'Détails d\'un track avec URL streaming',
                    'response': {'id': 'string', 'title': 'string', 'stream_url': 'string'}
                }
            },
            'content': {
                'POST /content/submit': {
                    'description': 'Soumettre du contenu (créateurs)',
                    'auth': 'required (creator)',
                    'body': {'title': 'string', 'type': 'audio|video', 'media_url': 'string'},
                    'response': {'_id': 'string', 'cultural_signature': 'string'}
                },
                'POST /content/upload': {
                    'description': 'Upload média vers Cloudinary',
                    'auth': 'required (creator)',
                    'body': 'multipart/form-data with file',
                    'response': {'media_url': 'string', 'duration': 'int'}
                },
                'POST /content/{id}/play': {
                    'description': 'Enregistrer une lecture (pour analytics)',
                    'body': {'duration_seconds': 'int (optional)'},
                    'response': {'success': 'boolean'}
                }
            },
            'auth': {
                'POST /auth/register': {
                    'description': 'Créer un compte FREK-ID',
                    'body': {'email': 'string', 'password': 'string', 'display_name': 'string'},
                    'response': {'token': 'string', 'user': 'object'}
                },
                'POST /auth/login': {
                    'description': 'Connexion',
                    'body': {'email': 'string', 'password': 'string'},
                    'response': {'token': 'string', 'user': 'object'}
                }
            },
            'webhooks': {
                'events': [
                    'content.created',
                    'content.approved', 
                    'content.rejected',
                    'play.recorded',
                    'subscription.created',
                    'subscription.cancelled'
                ]
            }
        },
        'sdks': {
            'javascript': 'npm install @kora/sdk',
            'python': 'pip install kora-sdk',
            'swift': 'pod "KoraSDK"',
            'kotlin': 'implementation("app.kora:sdk:1.0.0")'
        },
        'sandbox': {
            'description': 'Environnement de test isolé',
            'base_url': 'https://sandbox.kora.app/api',
            'test_credentials': {
                'email': 'dev@sandbox.kora.app',
                'password': 'sandbox_test_2024'
            }
        }
    }


@router.post("/api-keys")
async def create_api_key(
    request: ApiKeyCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer une clé API développeur"""
    if not current_user.get('is_developer', False) and not current_user.get('is_admin', False):
        # Auto-enable developer mode
        await db.users.update_one(
            {'_id': current_user['_id']},
            {'$set': {'is_developer': True}}
        )
    
    # Generate API key
    raw_key = secrets.token_urlsafe(32)
    prefix = 'kora_sandbox_' if request.environment == 'sandbox' else 'kora_live_'
    api_key = prefix + raw_key[:24]
    
    # Hash for storage
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    key_doc = {
        'user_id': str(current_user['_id']),
        'name': request.name,
        'key_hash': key_hash,
        'key_prefix': api_key[:16] + '...',
        'environment': request.environment,
        'permissions': request.permissions,
        'created_at': datetime.now(timezone.utc),
        'last_used': None,
        'is_active': True
    }
    
    await db.api_keys.insert_one(key_doc)
    
    logger.info(f"API key created for {current_user.get('frek_id')} - {request.environment}")
    
    return {
        'api_key': api_key,  # Only shown once!
        'name': request.name,
        'environment': request.environment,
        'permissions': request.permissions,
        'warning': 'Sauvegardez cette clé - elle ne sera plus affichée!'
    }


@router.get("/api-keys")
async def list_api_keys(
    current_user: dict = Depends(get_user_from_token)
):
    """Liste des clés API de l'utilisateur"""
    cursor = db.api_keys.find({'user_id': str(current_user['_id']), 'is_active': True})
    keys = await cursor.to_list(length=50)
    
    return {
        'keys': [{
            'name': k['name'],
            'key_prefix': k['key_prefix'],
            'environment': k['environment'],
            'permissions': k['permissions'],
            'created_at': k['created_at'].isoformat(),
            'last_used': k['last_used'].isoformat() if k['last_used'] else None
        } for k in keys]
    }


@router.delete("/api-keys/{key_prefix}")
async def revoke_api_key(
    key_prefix: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Révoquer une clé API"""
    result = await db.api_keys.update_one(
        {
            'user_id': str(current_user['_id']),
            'key_prefix': {'$regex': f'^{key_prefix}'}
        },
        {'$set': {'is_active': False, 'revoked_at': datetime.now(timezone.utc)}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Clé non trouvée")
    
    return {'revoked': True}


@router.post("/webhooks")
async def create_webhook(
    webhook: WebhookCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer un webhook"""
    secret = secrets.token_urlsafe(32)
    
    webhook_doc = {
        'user_id': str(current_user['_id']),
        'url': webhook.url,
        'events': webhook.events,
        'secret': secret,
        'is_active': True,
        'created_at': datetime.now(timezone.utc),
        'last_triggered': None,
        'failure_count': 0
    }
    
    result = await db.webhooks.insert_one(webhook_doc)
    
    return {
        'id': str(result.inserted_id),
        'url': webhook.url,
        'events': webhook.events,
        'secret': secret,
        'warning': 'Sauvegardez ce secret pour vérifier les signatures!'
    }


@router.get("/webhooks")
async def list_webhooks(
    current_user: dict = Depends(get_user_from_token)
):
    """Liste des webhooks"""
    cursor = db.webhooks.find({'user_id': str(current_user['_id']), 'is_active': True})
    webhooks = await cursor.to_list(length=20)
    
    return {
        'webhooks': [{
            'id': str(w['_id']),
            'url': w['url'],
            'events': w['events'],
            'last_triggered': w['last_triggered'].isoformat() if w['last_triggered'] else None,
            'failure_count': w['failure_count']
        } for w in webhooks]
    }


@router.get("/usage")
async def get_api_usage(
    current_user: dict = Depends(get_user_from_token)
):
    """Statistiques d'utilisation API"""
    # Get usage stats from logs (simplified)
    return {
        'period': 'current_month',
        'requests': {
            'total': 0,
            'catalog': 0,
            'content': 0,
            'auth': 0
        },
        'rate_limit': {
            'limit': 1000,
            'remaining': 1000,
            'reset': datetime.now(timezone.utc).isoformat()
        },
        'quota': {
            'sandbox': {'used': 0, 'limit': 10000},
            'production': {'used': 0, 'limit': 100000}
        }
    }


def init_routes(database):
    """Initialize routes with database"""
    global db
    db = database
