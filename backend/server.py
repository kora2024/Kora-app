from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from fastapi.responses import JSONResponse
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import string
import bcrypt
import jwt
from contextlib import asynccontextmanager
import stripe


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'kora_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'kora_secret_key_change_in_production_2024')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
stripe.api_key = STRIPE_API_KEY

# KORA Premium Price (3,98€/month)
KORA_PREMIUM_PRICE_CENTS = 398  # 3.98 EUR in cents
KORA_PREMIUM_CURRENCY = 'eur'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════════════════
# FREK-ID GENERATION
# ══════════════════════════════════════════════════════════════════════════════

def generate_frek_id(length: int = 10) -> str:
    """Generate a unique FREK-ID (KORA sovereign identity)"""
    alphabet = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f"FRK-{random_part}"

# ══════════════════════════════════════════════════════════════════════════════
# PASSWORD HASHING
# ══════════════════════════════════════════════════════════════════════════════

def hash_password(plain_password: str) -> str:
    """Hash password with bcrypt"""
    password_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# ══════════════════════════════════════════════════════════════════════════════
# JWT TOKENS
# ══════════════════════════════════════════════════════════════════════════════

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expir\u00e9",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ══════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ══════════════════════════════════════════════════════════════════════════════

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    display_name: str = Field(min_length=1, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: str
    email: str
    display_name: str
    frek_id: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    token: str
    token_type: str = "bearer"
    frek_id: str
    user: UserRead

class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    frek_id: str
    user: UserRead

# ══════════════════════════════════════════════════════════════════════════════
# APP SETUP
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create indexes
    try:
        users_coll = db["users"]
        await users_coll.create_index("email", unique=True)
        await users_coll.create_index("frek_id", unique=True)
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
    yield
    # Shutdown
    client.close()

app = FastAPI(
    title="KORA API",
    version="1.0.0",
    description="KORA — Plateforme de Streaming Culturel Souverain",
    lifespan=lifespan,
)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ══════════════════════════════════════════════════════════════════════════════
# DEPENDENCIES
# ══════════════════════════════════════════════════════════════════════════════

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get current user from JWT token"""
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_doc = await db["users"].find_one({"_id": user_id})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouv\u00e9",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_doc

# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@auth_router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    """Register a new user with FREK-ID"""
    users_coll = db["users"]
    
    # Check if email already exists
    existing = await users_coll.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est d\u00e9j\u00e0 utilis\u00e9",
        )
    
    # Generate FREK-ID and hash password
    frek_id = generate_frek_id()
    password_hash = hash_password(user_in.password)
    now = datetime.now(timezone.utc)
    user_id = str(uuid.uuid4())
    
    user_doc = {
        "_id": user_id,
        "email": user_in.email.lower(),
        "display_name": user_in.display_name,
        "frek_id": frek_id,
        "password_hash": password_hash,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    
    try:
        await users_coll.insert_one(user_doc)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la cr\u00e9ation du compte",
        )
    
    # Create access token
    token_data = {"sub": user_id, "frek_id": frek_id}
    access_token = create_access_token(token_data)
    
    user_read = UserRead(
        id=user_id,
        email=user_doc["email"],
        display_name=user_doc["display_name"],
        frek_id=frek_id,
        is_active=True,
        created_at=now,
    )
    
    logger.info(f"New user registered: {frek_id}")
    
    return AuthResponse(
        token=access_token,
        frek_id=frek_id,
        user=user_read,
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(user_in: UserLogin):
    """Login with email and password"""
    users_coll = db["users"]
    
    user_doc = await users_coll.find_one({"email": user_in.email.lower()})
    
    # Generic error to prevent user enumeration
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    
    if not verify_password(user_in.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    
    # Create access token
    token_data = {"sub": user_doc["_id"], "frek_id": user_doc["frek_id"]}
    access_token = create_access_token(token_data)
    
    user_read = UserRead(
        id=user_doc["_id"],
        email=user_doc["email"],
        display_name=user_doc["display_name"],
        frek_id=user_doc["frek_id"],
        is_active=user_doc["is_active"],
        created_at=user_doc["created_at"],
    )
    
    logger.info(f"User logged in: {user_doc['frek_id']}")
    
    return AuthResponse(
        token=access_token,
        frek_id=user_doc["frek_id"],
        user=user_read,
    )


@auth_router.get("/me", response_model=UserRead)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserRead(
        id=current_user["_id"],
        email=current_user["email"],
        display_name=current_user["display_name"],
        frek_id=current_user["frek_id"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"],
    )

# ══════════════════════════════════════════════════════════════════════════════
# STRIPE SUBSCRIPTION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

subscriptions_router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

class CheckoutSessionResponse(BaseModel):
    checkoutUrl: str
    sessionId: str

class SubscriptionStatus(BaseModel):
    active: bool
    plan: Optional[str] = None
    current_period_end: Optional[datetime] = None


@subscriptions_router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: Request,
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe Checkout Session for KORA Premium (3,98€/mois)"""
    try:
        # Get base URL for redirects
        origin = request.headers.get('origin', request.headers.get('referer', 'https://localhost:3000'))
        base_url = origin.rstrip('/')
        
        # Check if user already has a Stripe customer ID
        stripe_customer_id = current_user.get('stripe_customer_id')
        
        if not stripe_customer_id:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=current_user.get('email'),
                metadata={
                    'frek_id': current_user.get('frek_id'),
                    'user_id': str(current_user.get('_id'))
                }
            )
            stripe_customer_id = customer.id
            
            # Update user with Stripe customer ID
            await db.users.update_one(
                {'_id': current_user['_id']},
                {'$set': {'stripe_customer_id': stripe_customer_id}}
            )
        
        # Create checkout session with recurring subscription
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': KORA_PREMIUM_CURRENCY,
                    'product_data': {
                        'name': 'KORA Premium',
                        'description': 'Streaming illimité audio & vidéo, qualité Hi-Res, téléchargement hors-ligne',
                    },
                    'unit_amount': KORA_PREMIUM_PRICE_CENTS,
                    'recurring': {
                        'interval': 'month',
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{base_url}/home?subscription=success',
            cancel_url=f'{base_url}/paywall?subscription=cancelled',
            metadata={
                'frek_id': current_user.get('frek_id'),
                'user_id': str(current_user.get('_id'))
            }
        )
        
        logger.info(f"Checkout session created for user {current_user.get('frek_id')}")
        
        return CheckoutSessionResponse(
            checkoutUrl=checkout_session.url,
            sessionId=checkout_session.id
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création de la session de paiement")


@subscriptions_router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get user's subscription status"""
    try:
        stripe_customer_id = current_user.get('stripe_customer_id')
        
        if not stripe_customer_id:
            return SubscriptionStatus(active=False)
        
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id,
            status='active',
            limit=1
        )
        
        if subscriptions.data:
            sub = subscriptions.data[0]
            return SubscriptionStatus(
                active=True,
                plan='KORA Premium',
                current_period_end=datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
            )
        
        return SubscriptionStatus(active=False)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # For testing without webhook secret
            import json
            event = json.loads(payload)
            
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    event_type = event.get('type') if isinstance(event, dict) else event.type
    
    if event_type == 'checkout.session.completed':
        session = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event.data.object
        user_id = session.get('metadata', {}).get('user_id')
        
        if user_id:
            await db.users.update_one(
                {'_id': user_id},
                {'$set': {
                    'subscription_status': 'active',
                    'subscription_updated_at': datetime.now(timezone.utc)
                }}
            )
            logger.info(f"Subscription activated for user {user_id}")
            
    elif event_type == 'customer.subscription.deleted':
        customer_id = event.get('data', {}).get('object', {}).get('customer') if isinstance(event, dict) else event.data.object.customer
        
        await db.users.update_one(
            {'stripe_customer_id': customer_id},
            {'$set': {
                'subscription_status': 'cancelled',
                'subscription_updated_at': datetime.now(timezone.utc)
            }}
        )
        logger.info(f"Subscription cancelled for customer {customer_id}")
    
    return JSONResponse(content={"received": True})


# ══════════════════════════════════════════════════════════════════════════════
# EXISTING ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@api_router.get("/")
async def root():
    return {"message": "KORA API — Streaming Culturel Souverain"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ══════════════════════════════════════════════════════════════════════════════
# INCLUDE ROUTERS & MIDDLEWARE
# ══════════════════════════════════════════════════════════════════════════════

# Include auth router in api router
api_router.include_router(auth_router)

# Include subscriptions router in api router
api_router.include_router(subscriptions_router)

# Include api router in app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
