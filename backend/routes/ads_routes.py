"""
KORA Ads API — Monetization & Ad Gating

Endpoints:
- POST /api/ads/check-gating - Check if user should see ads
- POST /api/ads/reward - Record rewarded ad completion
- POST /api/ads/impression - Track ad impressions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ads", tags=["ads"])

# ══════════════════════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════════════════════

class AdGatingRequest(BaseModel):
    user_id: Optional[str] = None

class AdGatingResponse(BaseModel):
    mustShowAd: bool
    isPremium: bool
    hasAdFreeSession: bool
    adFreeUntil: Optional[str] = None
    reason: str

class AdRewardRequest(BaseModel):
    user_id: str
    reward_type: str = "ad_free_session"
    duration_minutes: int = 30

class AdRewardResponse(BaseModel):
    success: bool
    reward: Optional[dict] = None
    adFreeUntil: Optional[str] = None

class AdImpressionRequest(BaseModel):
    user_id: Optional[str] = None
    ad_type: str
    content_id: Optional[str] = None
    timestamp: Optional[str] = None

# ══════════════════════════════════════════════════════════════════════════════
# DATABASE HELPER
# ══════════════════════════════════════════════════════════════════════════════

def get_db():
    from server import db
    return db

# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/check-gating", response_model=AdGatingResponse)
async def check_ad_gating(request: AdGatingRequest):
    """
    Check if user should see ads before playback.
    
    Premium Logic:
    - stripe_status = 'active' → No ads
    - Has valid ad_free_session → No ads
    - Otherwise → Show ads
    """
    try:
        db = get_db()
        
        # Anonymous user - always show ads
        if not request.user_id:
            return AdGatingResponse(
                mustShowAd=True,
                isPremium=False,
                hasAdFreeSession=False,
                reason="anonymous_user"
            )
        
        # Find user
        from bson import ObjectId
        try:
            user = await db.users.find_one({"_id": ObjectId(request.user_id)})
        except:
            user = await db.users.find_one({"frek_id": request.user_id})
        
        if not user:
            return AdGatingResponse(
                mustShowAd=True,
                isPremium=False,
                hasAdFreeSession=False,
                reason="user_not_found"
            )
        
        # Check premium status
        stripe_status = user.get("stripe_status", "inactive")
        if stripe_status == "active":
            return AdGatingResponse(
                mustShowAd=False,
                isPremium=True,
                hasAdFreeSession=False,
                reason="premium_subscriber"
            )
        
        # Check ad-free session
        ad_free_until = user.get("ad_free_until")
        if ad_free_until:
            if isinstance(ad_free_until, str):
                ad_free_until = datetime.fromisoformat(ad_free_until.replace('Z', '+00:00'))
            
            if datetime.utcnow() < ad_free_until:
                return AdGatingResponse(
                    mustShowAd=False,
                    isPremium=False,
                    hasAdFreeSession=True,
                    adFreeUntil=ad_free_until.isoformat(),
                    reason="ad_free_session_active"
                )
        
        # No premium, no ad-free session - show ads
        return AdGatingResponse(
            mustShowAd=True,
            isPremium=False,
            hasAdFreeSession=False,
            reason="free_user"
        )
        
    except Exception as e:
        logger.error(f"Ad gating check error: {e}")
        # Default to showing ads on error
        return AdGatingResponse(
            mustShowAd=True,
            isPremium=False,
            hasAdFreeSession=False,
            reason="error"
        )


@router.post("/reward", response_model=AdRewardResponse)
async def record_ad_reward(request: AdRewardRequest):
    """
    Record that user watched a rewarded ad and grant ad-free session.
    """
    try:
        db = get_db()
        
        # Calculate ad-free end time
        ad_free_until = datetime.utcnow() + timedelta(minutes=request.duration_minutes)
        
        # Update user
        from bson import ObjectId
        try:
            result = await db.users.update_one(
                {"_id": ObjectId(request.user_id)},
                {
                    "$set": {
                        "ad_free_until": ad_free_until,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        except:
            result = await db.users.update_one(
                {"frek_id": request.user_id},
                {
                    "$set": {
                        "ad_free_until": ad_free_until,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Record reward event
        await db.ad_rewards.insert_one({
            "user_id": request.user_id,
            "reward_type": request.reward_type,
            "duration_minutes": request.duration_minutes,
            "granted_at": datetime.utcnow(),
            "expires_at": ad_free_until
        })
        
        return AdRewardResponse(
            success=True,
            reward={
                "type": request.reward_type,
                "amount": request.duration_minutes
            },
            adFreeUntil=ad_free_until.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Ad reward error: {e}")
        return AdRewardResponse(success=False, reward=None)


@router.post("/impression")
async def track_ad_impression(request: AdImpressionRequest):
    """
    Track ad impression for analytics and revenue reporting.
    """
    try:
        db = get_db()
        
        await db.ad_impressions.insert_one({
            "user_id": request.user_id,
            "ad_type": request.ad_type,
            "content_id": request.content_id,
            "timestamp": request.timestamp or datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow()
        })
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Ad impression tracking error: {e}")
        return {"success": False}
