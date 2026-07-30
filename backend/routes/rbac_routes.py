"""
KORA RBAC API Routes
═══════════════════════════════════════════════════════════════════════════════

Endpoints pour la gestion des rôles et permissions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from models.rbac import (
    UserRole, 
    ModuleAccess, 
    get_module_access, 
    can_access_module,
    get_accessible_routes,
    check_route_access,
    ROLE_PERMISSIONS,
    PROTECTED_ROUTES
)

router = APIRouter(prefix="/rbac", tags=["RBAC"])


class AccessCheckRequest(BaseModel):
    user_role: str
    route: str


class AccessCheckResponse(BaseModel):
    allowed: bool
    message: Optional[str] = None
    redirect_to: Optional[str] = None


class UserPermissionsResponse(BaseModel):
    role: str
    accessible_modules: List[str]
    accessible_routes: List[str]


@router.get("/permissions/{role}")
async def get_role_permissions(role: str) -> UserPermissionsResponse:
    """
    Retourne les permissions complètes pour un rôle donné.
    Utilisé par le frontend pour la navigation conditionnelle.
    """
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide: {role}. Rôles valides: {[r.value for r in UserRole]}"
        )
    
    # Modules accessibles (READ_ONLY ou FULL_ACCESS)
    accessible_modules = []
    role_perms = ROLE_PERMISSIONS.get(user_role, {})
    for module, access in role_perms.items():
        if access != ModuleAccess.INVISIBLE:
            accessible_modules.append(module)
    
    # Routes accessibles
    accessible_routes = get_accessible_routes(user_role)
    
    return UserPermissionsResponse(
        role=role,
        accessible_modules=accessible_modules,
        accessible_routes=accessible_routes
    )


@router.post("/check-access")
async def check_access(request: AccessCheckRequest) -> AccessCheckResponse:
    """
    Vérifie si un utilisateur avec un rôle donné peut accéder à une route.
    Appelé par le frontend avant navigation vers une route protégée.
    """
    try:
        user_role = UserRole(request.user_role)
    except ValueError:
        return AccessCheckResponse(
            allowed=False,
            message=f"Rôle invalide: {request.user_role}",
            redirect_to="/home"
        )
    
    allowed, error_message = check_route_access(user_role, request.route)
    
    if allowed:
        return AccessCheckResponse(allowed=True)
    
    # Déterminer la redirection selon le contexte
    redirect_map = {
        "/creator-dashboard": "/become-creator",  # Page pour devenir créateur
        "/developers": "/request-api-access",     # Page pour demander accès API
        "/admin": "/home",                        # Retour home
    }
    
    redirect_to = redirect_map.get(request.route, "/home")
    
    return AccessCheckResponse(
        allowed=False,
        message=error_message,
        redirect_to=redirect_to
    )


@router.get("/protected-routes")
async def get_protected_routes():
    """
    Retourne la liste des routes protégées et leurs exigences.
    Utilisé pour construire le middleware frontend.
    """
    routes = []
    for route, (module, access) in PROTECTED_ROUTES.items():
        routes.append({
            "route": route,
            "required_module": module,
            "required_access": access.value,
            "allowed_roles": [
                role.value for role in UserRole 
                if can_access_module(role, module, access)
            ]
        })
    
    return {"protected_routes": routes}


@router.get("/roles")
async def get_available_roles():
    """
    Retourne la liste des rôles disponibles avec leurs descriptions.
    """
    role_descriptions = {
        UserRole.LISTENER: {
            "name": "Auditeur",
            "description": "Utilisateur grand public. Accès à l'écoute, bibliothèque et recherche.",
            "icon": "headphones"
        },
        UserRole.CREATOR: {
            "name": "Créateur",
            "description": "Artiste ou créateur vérifié. Accès à la publication, analytics et royalties.",
            "icon": "mic"
        },
        UserRole.DEVELOPER: {
            "name": "Développeur",
            "description": "Développeur avec accès API. Accès aux clés API, webhooks et documentation.",
            "icon": "code"
        },
        UserRole.LABEL_ADMIN: {
            "name": "Admin Label",
            "description": "Administrateur de label. Accès à la gestion multi-artistes.",
            "icon": "library"
        },
        UserRole.ADMIN: {
            "name": "Administrateur",
            "description": "Administrateur système. Accès complet.",
            "icon": "shield"
        },
    }
    
    return {
        "roles": [
            {
                "value": role.value,
                **role_descriptions.get(role, {"name": role.value, "description": "", "icon": "person"})
            }
            for role in UserRole
        ]
    }
