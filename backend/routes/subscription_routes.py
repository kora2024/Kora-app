"""KORA Subscription Routes — Premium & Famille Tiers

Gère les abonnements Stripe:
- Premium: 3.98€/mois (1 écran)
- Premium+ Famille: 7.98€/mois (5 profils)
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os
import stripe
import logging
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = "HS256"

stripe.api_key = STRIPE_API_KEY

# Database reference
db = None

# Pricing tiers
TIERS = {
    'premium': {
        'name': 'KORA Premium',
        'price_eur': 398,  # cents
        'screens': 1,
        'features': ['streaming_illimite', 'hd_audio', 'offline_mode', 'no_ads']
    },
    'famille': {
        'name': 'KORA Premium+ Famille',
        'price_eur': 798,  # cents
        'screens': 5,
        'features': ['streaming_illimite', 'hd_audio', 'offline_mode', 'no_ads', 'multi_profils', 'controle_parental']
    }
}


class CheckoutRequest(BaseModel):
    tier: str = 'premium'
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class ProfileCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None
    is_kid: bool = False


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


@router.get("/tiers")
async def get_subscription_tiers():
    """Liste des offres d'abonnement KORA"""
    return {
        'tiers': [
            {
                'id': 'premium',
                'name': 'KORA Premium',
                'price': '3,98€',
                'price_cents': 398,
                'billing': 'mois',
                'screens': 1,
                'features': [
                    'Streaming audio illimité',
                    'Qualité HD',
                    'Mode hors-ligne',
                    'Sans publicité',
                    'Catalogue souverain complet'
                ]
            },
            {
                'id': 'famille',
                'name': 'KORA Premium+ Famille',
                'price': '7,98€',
                'price_cents': 798,
                'billing': 'mois',
                'screens': 5,
                'features': [
                    'Tout Premium inclus',
                    'Jusqu\'à 5 profils',
                    'Contrôle parental',
                    'Écoute simultanée',
                    'Partage familial'
                ],
                'badge': 'MEILLEURE OFFRE'
            }
        ]
    }


@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer une session Stripe Checkout"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe non configuré")
    
    tier = TIERS.get(request.tier)
    if not tier:
        raise HTTPException(status_code=400, detail="Tier invalide")
    
    try:
        # Get or create Stripe customer
        customer_id = current_user.get('stripe_customer_id')
        if not customer_id:
            customer = stripe.Customer.create(
                email=current_user.get('email'),
                metadata={
                    'frek_id': current_user.get('frek_id', ''),
                    'user_id': str(current_user['_id'])
                }
            )
            customer_id = customer.id
            await db.users.update_one(
                {'_id': current_user['_id']},
                {'$set': {'stripe_customer_id': customer_id}}
            )
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': tier['name'],
                        'description': f"Abonnement mensuel - {tier['screens']} écran(s)"
                    },
                    'unit_amount': tier['price_eur'],
                    'recurring': {'interval': 'month'}
                },
                'quantity': 1
            }],
            mode='subscription',
            success_url=request.success_url or 'https://kora.app/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.cancel_url or 'https://kora.app/paywall',
            metadata={
                'user_id': str(current_user['_id']),
                'frek_id': current_user.get('frek_id', ''),
                'tier': request.tier
            }
        )
        
        logger.info(f"Checkout session created for {current_user.get('frek_id')} - Tier: {request.tier}")
        
        return {
            'checkoutUrl': session.url,
            'sessionId': session.id,
            'tier': request.tier
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
async def get_subscription_status(
    current_user: dict = Depends(get_user_from_token)
):
    """Statut de l'abonnement utilisateur"""
    customer_id = current_user.get('stripe_customer_id')
    
    if not customer_id:
        return {
            'active': False,
            'tier': None,
            'screens': 0,
            'profiles': [],
            'can_upgrade': True
        }
    
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='active',
            limit=1
        )
        
        if subscriptions.data:
            sub = subscriptions.data[0]
            tier_id = sub.metadata.get('tier', 'premium')
            tier = TIERS.get(tier_id, TIERS['premium'])
            
            return {
                'active': True,
                'tier': tier_id,
                'tier_name': tier['name'],
                'screens': tier['screens'],
                'current_period_end': datetime.fromtimestamp(sub.current_period_end).isoformat(),
                'profiles': current_user.get('profiles', []),
                'can_upgrade': tier_id == 'premium'
            }
        
        return {
            'active': False,
            'tier': None,
            'screens': 0,
            'profiles': [],
            'can_upgrade': True
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/profiles")
async def create_profile(
    profile: ProfileCreate,
    current_user: dict = Depends(get_user_from_token)
):
    """Créer un profil famille (Premium+ uniquement)"""
    # Check subscription
    status = await get_subscription_status(current_user)
    
    if not status['active'] or status['tier'] != 'famille':
        raise HTTPException(
            status_code=403, 
            detail="Abonnement Premium+ Famille requis pour créer des profils"
        )
    
    profiles = current_user.get('profiles', [])
    if len(profiles) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 profils atteint")
    
    new_profile = {
        'id': f"profile_{len(profiles) + 1}",
        'name': profile.name,
        'avatar_url': profile.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={profile.name}",
        'is_kid': profile.is_kid,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {'_id': current_user['_id']},
        {'$push': {'profiles': new_profile}}
    )
    
    return {'profile': new_profile, 'total_profiles': len(profiles) + 1}


@router.get("/profiles")
async def list_profiles(
    current_user: dict = Depends(get_user_from_token)
):
    """Liste des profils utilisateur"""
    profiles = current_user.get('profiles', [])
    
    # Always include main profile
    main_profile = {
        'id': 'main',
        'name': current_user.get('display_name', 'Principal'),
        'avatar_url': current_user.get('avatar_url', f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user.get('email')}"),
        'is_kid': False,
        'is_main': True
    }
    
    return {'profiles': [main_profile] + profiles}


@router.delete("/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    current_user: dict = Depends(get_user_from_token)
):
    """Supprimer un profil famille"""
    if profile_id == 'main':
        raise HTTPException(status_code=400, detail="Impossible de supprimer le profil principal")
    
    result = await db.users.update_one(
        {'_id': current_user['_id']},
        {'$pull': {'profiles': {'id': profile_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    return {'deleted': True}


def init_routes(database):
    """Initialize routes with database"""
    global db
    db = database
