"""
KORA Role-Based Access Control (RBAC)
═══════════════════════════════════════════════════════════════════════════════

Master Prompt Architecture — Section 3 & Section 32

Principe transversal — divulgation progressive par rôle :
Une seule application, plusieurs niveaux de surface exposée selon le rôle.

Rôles définis (Section 32 - RBAC LabelOS étendu à KORA):
- LISTENER (auditeur) : Écoute, bibliothèque, recherche
- CREATOR (créateur vérifié) : + Publication, Analytics, Royalties, Dashboard
- DEVELOPER (partenaire API) : + API Keys, Webhooks, Documentation
- ADMIN (administrateur) : Accès complet back-office

Chaque module déclare, pour chaque rôle :
- invisible
- visible en lecture seule
- pleinement actionnable
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class UserRole(str, Enum):
    """
    Rôles utilisateur KORA (Section 3 & 32)
    Hiérarchie : LISTENER < CREATOR < DEVELOPER < ADMIN
    """
    LISTENER = "listener"           # Auditeur grand public
    CREATOR = "creator"             # Artiste/Créateur vérifié
    DEVELOPER = "developer"         # Développeur avec accès API
    LABEL_ADMIN = "label_admin"     # Admin label (LabelOS)
    OPS_MANAGER = "ops_manager"     # Gestionnaire opérations
    FINANCE = "finance"             # Accès finances (restreint)
    ADMIN = "admin"                 # Administrateur système complet


class ModuleAccess(str, Enum):
    """Niveau d'accès par module (Section 3)"""
    INVISIBLE = "invisible"
    READ_ONLY = "read_only"
    FULL_ACCESS = "full_access"


class RolePermissions(BaseModel):
    """Permissions par rôle pour chaque module"""
    role: UserRole
    modules: dict  # module_name -> ModuleAccess


# ═══════════════════════════════════════════════════════════════════════════════
# MATRICE D'ACCÈS PAR RÔLE (Section 3)
# ═══════════════════════════════════════════════════════════════════════════════

ROLE_PERMISSIONS = {
    UserRole.LISTENER: {
        # Modules accessibles à l'auditeur
        "fondation": ModuleAccess.FULL_ACCESS,      # Auth, profil
        "catalogue": ModuleAccess.READ_ONLY,        # Browse catalogue
        "lecteur": ModuleAccess.FULL_ACCESS,        # Player
        "bibliotheque": ModuleAccess.FULL_ACCESS,   # Favoris, playlists
        "recherche": ModuleAccess.FULL_ACCESS,      # Search
        "social": ModuleAccess.FULL_ACCESS,         # Likes, follows
        "editorial": ModuleAccess.READ_ONLY,        # Home feed
        "notifications": ModuleAccess.FULL_ACCESS,  # Push notifs
        # Modules invisibles pour l'auditeur
        "publication": ModuleAccess.INVISIBLE,      # Upload
        "monetisation": ModuleAccess.INVISIBLE,     # Wallet (sauf paiement abo)
        "statistiques": ModuleAccess.INVISIBLE,     # Analytics
        "administration": ModuleAccess.INVISIBLE,   # Back-office
        "api_ecosystem": ModuleAccess.INVISIBLE,    # API Keys
        "kora_creators": ModuleAccess.INVISIBLE,    # Dashboard créateur
        "kora_developers": ModuleAccess.INVISIBLE,  # Portail développeur
    },
    
    UserRole.CREATOR: {
        # Hérite de LISTENER + modules créateur
        "fondation": ModuleAccess.FULL_ACCESS,
        "catalogue": ModuleAccess.READ_ONLY,
        "lecteur": ModuleAccess.FULL_ACCESS,
        "bibliotheque": ModuleAccess.FULL_ACCESS,
        "recherche": ModuleAccess.FULL_ACCESS,
        "social": ModuleAccess.FULL_ACCESS,
        "editorial": ModuleAccess.READ_ONLY,
        "notifications": ModuleAccess.FULL_ACCESS,
        # Modules créateur (Section 20 - KORA for Creators)
        "publication": ModuleAccess.FULL_ACCESS,    # Upload self-serve
        "monetisation": ModuleAccess.READ_ONLY,     # Wallet (voir revenus)
        "statistiques": ModuleAccess.READ_ONLY,     # Analytics
        "kora_creators": ModuleAccess.FULL_ACCESS,  # Dashboard créateur
        # Toujours invisibles
        "administration": ModuleAccess.INVISIBLE,
        "api_ecosystem": ModuleAccess.INVISIBLE,
        "kora_developers": ModuleAccess.INVISIBLE,
    },
    
    UserRole.DEVELOPER: {
        # Hérite de LISTENER + modules développeur
        "fondation": ModuleAccess.FULL_ACCESS,
        "catalogue": ModuleAccess.READ_ONLY,
        "lecteur": ModuleAccess.FULL_ACCESS,
        "bibliotheque": ModuleAccess.FULL_ACCESS,
        "recherche": ModuleAccess.FULL_ACCESS,
        "social": ModuleAccess.FULL_ACCESS,
        "editorial": ModuleAccess.READ_ONLY,
        "notifications": ModuleAccess.FULL_ACCESS,
        # Modules développeur (Section 21 - KORA for Developers)
        "api_ecosystem": ModuleAccess.FULL_ACCESS,  # API Keys, Webhooks
        "kora_developers": ModuleAccess.FULL_ACCESS,# Portail développeur
        # Invisibles (pas créateur)
        "publication": ModuleAccess.INVISIBLE,
        "monetisation": ModuleAccess.INVISIBLE,
        "statistiques": ModuleAccess.INVISIBLE,
        "kora_creators": ModuleAccess.INVISIBLE,
        "administration": ModuleAccess.INVISIBLE,
    },
    
    UserRole.ADMIN: {
        # Accès complet à tout
        "fondation": ModuleAccess.FULL_ACCESS,
        "catalogue": ModuleAccess.FULL_ACCESS,
        "lecteur": ModuleAccess.FULL_ACCESS,
        "bibliotheque": ModuleAccess.FULL_ACCESS,
        "recherche": ModuleAccess.FULL_ACCESS,
        "social": ModuleAccess.FULL_ACCESS,
        "editorial": ModuleAccess.FULL_ACCESS,
        "notifications": ModuleAccess.FULL_ACCESS,
        "publication": ModuleAccess.FULL_ACCESS,
        "monetisation": ModuleAccess.FULL_ACCESS,
        "statistiques": ModuleAccess.FULL_ACCESS,
        "administration": ModuleAccess.FULL_ACCESS,
        "api_ecosystem": ModuleAccess.FULL_ACCESS,
        "kora_creators": ModuleAccess.FULL_ACCESS,
        "kora_developers": ModuleAccess.FULL_ACCESS,
    },
}


def get_module_access(role: UserRole, module: str) -> ModuleAccess:
    """
    Retourne le niveau d'accès pour un rôle et un module donné.
    Par défaut, retourne INVISIBLE si non défini.
    """
    role_perms = ROLE_PERMISSIONS.get(role, {})
    return role_perms.get(module, ModuleAccess.INVISIBLE)


def can_access_module(role: UserRole, module: str, required_access: ModuleAccess = ModuleAccess.READ_ONLY) -> bool:
    """
    Vérifie si un rôle peut accéder à un module avec le niveau requis.
    
    Hiérarchie: INVISIBLE < READ_ONLY < FULL_ACCESS
    """
    access = get_module_access(role, module)
    
    access_hierarchy = {
        ModuleAccess.INVISIBLE: 0,
        ModuleAccess.READ_ONLY: 1,
        ModuleAccess.FULL_ACCESS: 2,
    }
    
    return access_hierarchy.get(access, 0) >= access_hierarchy.get(required_access, 1)


def get_accessible_routes(role: UserRole) -> List[str]:
    """
    Retourne la liste des routes accessibles pour un rôle.
    Utilisé côté frontend pour la navigation conditionnelle.
    """
    route_mapping = {
        "fondation": ["/auth", "/settings", "/profile"],
        "catalogue": ["/home", "/films", "/podcasts"],
        "lecteur": ["/player"],
        "bibliotheque": ["/playlists", "/favorites"],
        "recherche": ["/search"],
        "social": ["/creator/*"],  # Profils publics
        "editorial": ["/home", "/trending"],
        "notifications": ["/notifications"],
        "publication": ["/upload"],
        "monetisation": ["/paywall", "/wallet"],
        "statistiques": ["/analytics"],
        "kora_creators": ["/creator-dashboard"],
        "kora_developers": ["/developers"],
        "administration": ["/admin/*"],
    }
    
    accessible = []
    for module, routes in route_mapping.items():
        if can_access_module(role, module):
            accessible.extend(routes)
    
    return accessible


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE PROTECTION MIDDLEWARE
# ═══════════════════════════════════════════════════════════════════════════════

PROTECTED_ROUTES = {
    # Route -> (module_requis, access_requis)
    "/creator-dashboard": ("kora_creators", ModuleAccess.FULL_ACCESS),
    "/developers": ("kora_developers", ModuleAccess.FULL_ACCESS),
    "/upload": ("publication", ModuleAccess.FULL_ACCESS),
    "/admin": ("administration", ModuleAccess.FULL_ACCESS),
    "/analytics": ("statistiques", ModuleAccess.READ_ONLY),
    "/wallet": ("monetisation", ModuleAccess.READ_ONLY),
}


def check_route_access(role: UserRole, route: str) -> tuple[bool, Optional[str]]:
    """
    Vérifie si un rôle peut accéder à une route.
    Retourne (autorisé, message_erreur)
    """
    # Routes publiques
    if route not in PROTECTED_ROUTES:
        return True, None
    
    module, required_access = PROTECTED_ROUTES[route]
    
    if can_access_module(role, module, required_access):
        return True, None
    
    # Messages d'erreur personnalisés selon la route
    error_messages = {
        "/creator-dashboard": "Accès réservé aux créateurs vérifiés. Devenez créateur pour accéder à cette section.",
        "/developers": "Accès réservé aux développeurs. Demandez un accès API pour utiliser cette section.",
        "/admin": "Accès réservé aux administrateurs.",
        "/upload": "Vous devez être créateur vérifié pour publier du contenu.",
    }
    
    return False, error_messages.get(route, "Accès non autorisé.")
