"""
KORA Reputation System — Pacte Souverain Backend

Système de modération par les pairs basé sur le score de sagesse.
- Karma Sagesse : Score de réputation évolutif
- Rôles Culturels : nouveau → membre → confirmé → veilleur → ancien
- Signalement décentralisé : Les Veilleurs peuvent geler du contenu

Routes:
- POST /api/community/accept-pacte — Accepter le Pacte Souverain
- GET /api/community/reputation — Obtenir sa réputation
- POST /api/community/report/{content_id} — Signaler un contenu
- POST /api/community/validate/{content_id} — Valider un contenu (veilleurs)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

# Import from parent module - these will be injected
db = None
get_current_user = None

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

MAX_STRIKES = 3
AUTO_APPROVE_SCORE = 100
REPORT_THRESHOLD = 5  # Content suspended after this weight

# Score awards/penalties
SCORE_CONTENT_APPROVED = 10
SCORE_CONTENT_FEATURED = 25
SCORE_HELPFUL_REPORT = 5
SCORE_FALSE_REPORT = -10
SCORE_STRIKE_PENALTY = -20

# Banned keywords for content validation (Python version)
BANNED_KEYWORDS = [
    'crypto pump', 'telegram group', 'follow me back', 'gagnez de l\'argent',
    'bénéfices garantis', 'whatsapp contact', 'cliquez ici', 'argent facile',
    'revenus passifs', 'mlm', 'investissement garanti', 'trading signal',
    'rejoignez mon groupe', 'lien dans ma bio', 'dm me', 'message privé',
    'opportunité en or', 'devenir riche', 'bitcoin gratuit', 'airdrop',
    'traître', 'bounty', 'vendu', 'esclave', 'colonisé', 'blédard',
    'retourne chez toi', 'singe', 'nègre', 'sale',
    'nudes', 'onlyfans', 'xxx', 'porn', 'escort',
    'tuer', 'assassiner', 'bombe', 'attentat', 'terroriste'
]

# ══════════════════════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════════════════════

class ReputationResponse(BaseModel):
    frek_id: str
    sagesse_score: int
    role_culturel: str
    strike_count: int
    content_approved: int
    reports_made: int
    can_auto_approve: bool
    pacte_accepted: bool
    pacte_accepted_at: Optional[datetime] = None

class ReportRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=500)

class ReportResponse(BaseModel):
    status: str
    message: str
    content_status: Optional[str] = None

class ContentValidationRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    feedback: Optional[str] = None

# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def calculate_role_culturel(sagesse_score: int, strike_count: int) -> str:
    """Calculate cultural role based on sagesse score"""
    if strike_count >= 3:
        return 'nouveau'  # Account restricted
    if strike_count >= 2 and sagesse_score < 100:
        return 'nouveau'
    
    if sagesse_score >= 500:
        return 'ancien'
    if sagesse_score >= 200:
        return 'veilleur'
    if sagesse_score >= 100:
        return 'confirme'
    if sagesse_score >= 25:
        return 'membre'
    return 'nouveau'

def calculate_report_weight(role_culturel: str) -> float:
    """Calculate the weight of a report based on role"""
    weights = {
        'ancien': 4.0,
        'veilleur': 3.0,
        'confirme': 2.0,
        'membre': 1.0,
        'nouveau': 0.5
    }
    return weights.get(role_culturel, 0.5)

def should_auto_approve(sagesse_score: int, role_culturel: str, strike_count: int) -> bool:
    """Check if user's content should be auto-approved"""
    if role_culturel in ['veilleur', 'ancien']:
        return strike_count < 2
    if role_culturel == 'confirme' and sagesse_score >= 150:
        return strike_count == 0
    return False

def validate_content_text(text: str) -> tuple[bool, Optional[str]]:
    """Validate content against banned keywords"""
    if not text:
        return True, None
    
    lower_text = text.lower()
    for keyword in BANNED_KEYWORDS:
        if keyword.lower() in lower_text:
            return False, keyword
    return True, None

# ══════════════════════════════════════════════════════════════════════════════
# ROUTER FACTORY
# ══════════════════════════════════════════════════════════════════════════════

def create_reputation_router(database, get_user_dependency):
    """Create reputation router with injected dependencies"""
    global db, get_current_user
    db = database
    get_current_user = get_user_dependency
    
    router = APIRouter(prefix="/community", tags=["Communauté"])

    # ─────────────────────────────────────────────────────────────────────────────
    # ACCEPT PACTE
    # ─────────────────────────────────────────────────────────────────────────────
    
    @router.post("/accept-pacte", response_model=ReputationResponse)
    async def accept_pacte(current_user: dict = Depends(get_user_dependency)):
        """
        Accept the Pacte Souverain and initialize reputation
        """
        now = datetime.now(timezone.utc)
        
        # Update user with pacte acceptance and initial reputation
        update_fields = {
            "pacte_accepted": True,
            "pacte_accepted_at": now,
        }
        
        # Initialize reputation if not exists
        if current_user.get("sagesse_score") is None:
            update_fields.update({
                "sagesse_score": 10,  # Initial score for accepting pacte
                "strike_count": 0,
                "content_approved": 0,
                "reports_made": 0,
                "reports_received": 0,
            })
        
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$set": update_fields}
        )
        
        # Fetch updated user
        updated_user = await db["users"].find_one({"_id": current_user["_id"]})
        
        sagesse = updated_user.get("sagesse_score", 10)
        strikes = updated_user.get("strike_count", 0)
        role = calculate_role_culturel(sagesse, strikes)
        
        return ReputationResponse(
            frek_id=updated_user["frek_id"],
            sagesse_score=sagesse,
            role_culturel=role,
            strike_count=strikes,
            content_approved=updated_user.get("content_approved", 0),
            reports_made=updated_user.get("reports_made", 0),
            can_auto_approve=should_auto_approve(sagesse, role, strikes),
            pacte_accepted=True,
            pacte_accepted_at=now
        )

    # ─────────────────────────────────────────────────────────────────────────────
    # GET REPUTATION
    # ─────────────────────────────────────────────────────────────────────────────
    
    @router.get("/reputation", response_model=ReputationResponse)
    async def get_reputation(current_user: dict = Depends(get_user_dependency)):
        """
        Get current user's reputation and cultural role
        """
        sagesse = current_user.get("sagesse_score", 0)
        strikes = current_user.get("strike_count", 0)
        role = calculate_role_culturel(sagesse, strikes)
        
        return ReputationResponse(
            frek_id=current_user["frek_id"],
            sagesse_score=sagesse,
            role_culturel=role,
            strike_count=strikes,
            content_approved=current_user.get("content_approved", 0),
            reports_made=current_user.get("reports_made", 0),
            can_auto_approve=should_auto_approve(sagesse, role, strikes),
            pacte_accepted=current_user.get("pacte_accepted", False),
            pacte_accepted_at=current_user.get("pacte_accepted_at")
        )

    # ─────────────────────────────────────────────────────────────────────────────
    # REPORT CONTENT
    # ─────────────────────────────────────────────────────────────────────────────
    
    @router.post("/report/{content_id}", response_model=ReportResponse)
    async def report_content(
        content_id: str,
        request: ReportRequest,
        current_user: dict = Depends(get_user_dependency)
    ):
        """
        Report content for violating the Pacte Souverain
        Weight of report depends on reporter's cultural role
        """
        # Check if user has accepted pacte
        if not current_user.get("pacte_accepted"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous devez accepter le Pacte Souverain pour signaler du contenu."
            )
        
        # Find content
        try:
            content = await db["content"].find_one({"_id": ObjectId(content_id)})
        except Exception:
            content = await db["content"].find_one({"_id": content_id})
        
        if not content:
            raise HTTPException(status_code=404, detail="Contenu introuvable.")
        
        # Can't report own content
        if content.get("creator_id") == current_user["frek_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas signaler votre propre contenu."
            )
        
        # Calculate report weight based on role
        sagesse = current_user.get("sagesse_score", 0)
        strikes = current_user.get("strike_count", 0)
        role = calculate_role_culturel(sagesse, strikes)
        weight = calculate_report_weight(role)
        
        # Check if already reported by this user
        existing_report = await db["reports"].find_one({
            "content_id": str(content_id),
            "reporter_frek_id": current_user["frek_id"]
        })
        
        if existing_report:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà signalé ce contenu."
            )
        
        # Create report
        report_doc = {
            "content_id": str(content_id),
            "reporter_frek_id": current_user["frek_id"],
            "reporter_role": role,
            "weight": weight,
            "reason": request.reason,
            "created_at": datetime.now(timezone.utc),
            "status": "pending"
        }
        await db["reports"].insert_one(report_doc)
        
        # Update user's reports_made count
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$inc": {"reports_made": 1}}
        )
        
        # Calculate total report weight for this content
        pipeline = [
            {"$match": {"content_id": str(content_id)}},
            {"$group": {"_id": None, "total_weight": {"$sum": "$weight"}}}
        ]
        result = await db["reports"].aggregate(pipeline).to_list(1)
        total_weight = result[0]["total_weight"] if result else weight
        
        # Check if threshold reached
        content_status = "reported"
        if total_weight >= REPORT_THRESHOLD:
            # Suspend content
            try:
                await db["content"].update_one(
                    {"_id": ObjectId(content_id)},
                    {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc)}}
                )
            except Exception:
                await db["content"].update_one(
                    {"_id": content_id},
                    {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc)}}
                )
            
            # Apply strike to content creator
            await db["users"].update_one(
                {"frek_id": content.get("creator_id")},
                {
                    "$inc": {
                        "strike_count": 1,
                        "sagesse_score": SCORE_STRIKE_PENALTY,
                        "reports_received": 1
                    }
                }
            )
            
            content_status = "suspended"
            
            return ReportResponse(
                status="hidden",
                message="Contenu mis en quarantaine pour examen par les Anciens.",
                content_status=content_status
            )
        
        return ReportResponse(
            status="reported",
            message="Signalement enregistré. Merci de veiller sur notre espace.",
            content_status=content_status
        )

    # ─────────────────────────────────────────────────────────────────────────────
    # VALIDATE CONTENT (Veilleurs/Anciens only)
    # ─────────────────────────────────────────────────────────────────────────────
    
    @router.post("/validate/{content_id}")
    async def validate_content(
        content_id: str,
        request: ContentValidationRequest,
        current_user: dict = Depends(get_user_dependency)
    ):
        """
        Validate or reject pending content (Veilleurs and Anciens only)
        """
        sagesse = current_user.get("sagesse_score", 0)
        strikes = current_user.get("strike_count", 0)
        role = calculate_role_culturel(sagesse, strikes)
        
        # Only Veilleurs and Anciens can validate
        if role not in ['veilleur', 'ancien'] and not current_user.get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seuls les Veilleurs et Anciens peuvent valider le contenu."
            )
        
        # Find content in pending
        try:
            content = await db["pending_content"].find_one({"_id": ObjectId(content_id)})
        except Exception:
            content = await db["pending_content"].find_one({"_id": content_id})
        
        if not content:
            raise HTTPException(status_code=404, detail="Contenu en attente introuvable.")
        
        if request.action == "approve":
            # Move to main content collection
            content["status"] = "published"
            content["validated_by"] = current_user["frek_id"]
            content["validated_at"] = datetime.now(timezone.utc)
            
            await db["content"].insert_one(content)
            
            try:
                await db["pending_content"].delete_one({"_id": ObjectId(content_id)})
            except Exception:
                await db["pending_content"].delete_one({"_id": content_id})
            
            # Award creator
            await db["users"].update_one(
                {"frek_id": content.get("creator_id")},
                {"$inc": {"sagesse_score": SCORE_CONTENT_APPROVED, "content_approved": 1}}
            )
            
            return {"status": "approved", "message": "Contenu approuvé et publié."}
        
        else:  # reject
            # Mark as rejected
            try:
                await db["pending_content"].update_one(
                    {"_id": ObjectId(content_id)},
                    {
                        "$set": {
                            "status": "rejected",
                            "rejected_by": current_user["frek_id"],
                            "rejected_at": datetime.now(timezone.utc),
                            "rejection_reason": request.feedback
                        }
                    }
                )
            except Exception:
                await db["pending_content"].update_one(
                    {"_id": content_id},
                    {
                        "$set": {
                            "status": "rejected",
                            "rejected_by": current_user["frek_id"],
                            "rejected_at": datetime.now(timezone.utc),
                            "rejection_reason": request.feedback
                        }
                    }
                )
            
            return {"status": "rejected", "message": "Contenu rejeté.", "feedback": request.feedback}

    # ─────────────────────────────────────────────────────────────────────────────
    # GET PENDING CONTENT (Veilleurs/Anciens/Admins)
    # ─────────────────────────────────────────────────────────────────────────────
    
    @router.get("/pending")
    async def get_pending_content(
        limit: int = 20,
        current_user: dict = Depends(get_user_dependency)
    ):
        """
        Get pending content for review (Veilleurs and above)
        """
        sagesse = current_user.get("sagesse_score", 0)
        strikes = current_user.get("strike_count", 0)
        role = calculate_role_culturel(sagesse, strikes)
        
        if role not in ['veilleur', 'ancien'] and not current_user.get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès réservé aux Veilleurs et Anciens."
            )
        
        cursor = db["pending_content"].find(
            {"status": "pending"}
        ).sort("created_at", -1).limit(limit)
        
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        
        return {"items": items, "count": len(items)}

    return router
