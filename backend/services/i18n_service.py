"""KORA i18n — Service Multi-Langue

Support des langues de la diaspora:
- Français (fr)
- English (en)
- Créole Haïtien (ht)
- Créole Guadeloupéen (gcf)
- Wolof (wo)
- Swahili (sw)
- Portugais (pt)
- Espagnol (es)
"""
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    'fr': 'Français',
    'en': 'English',
    'ht': 'Kreyòl Ayisyen',
    'gcf': 'Kréyòl Gwadloup',
    'wo': 'Wolof',
    'sw': 'Kiswahili',
    'pt': 'Português',
    'es': 'Español',
}

DEFAULT_LANGUAGE = 'fr'

# Translation dictionaries
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    'fr': {
        # Navigation
        'home': 'Accueil',
        'music': 'Musique',
        'video': 'Vidéo',
        'live': 'Live',
        'creators': 'Créateurs',
        'playlists': 'Playlists',
        'podcasts': 'Podcasts',
        'settings': 'Paramètres',
        
        # Auth
        'login': 'Se connecter',
        'signup': 'S\'inscrire',
        'logout': 'Déconnexion',
        'email': 'Email',
        'password': 'Mot de passe',
        'forgot_password': 'Mot de passe oublié?',
        
        # Player
        'now_playing': 'Lecture en cours',
        'play': 'Lecture',
        'pause': 'Pause',
        'next': 'Suivant',
        'previous': 'Précédent',
        'shuffle': 'Aléatoire',
        'repeat': 'Répéter',
        
        # Subscription
        'subscribe': 'S\'abonner',
        'premium': 'Premium',
        'family': 'Famille',
        'per_month': '/mois',
        'unlimited_streaming': 'Streaming illimité',
        
        # Content
        'featured': 'À la une',
        'trending': 'Tendances',
        'new_releases': 'Nouveautés',
        'for_you': 'Pour toi',
        'discover': 'Découvrir',
        
        # Territories
        'caribbean': 'Caraïbes',
        'africa': 'Afrique',
        'diaspora': 'Diaspora',
        'world': 'Monde',
        
        # Actions
        'add_to_playlist': 'Ajouter à une playlist',
        'share': 'Partager',
        'download': 'Télécharger',
        'like': 'J\'aime',
        'follow': 'Suivre',
        'report': 'Signaler',
        
        # Messages
        'loading': 'Chargement...',
        'error': 'Erreur',
        'success': 'Succès',
        'no_results': 'Aucun résultat',
        'try_again': 'Réessayer',
    },
    'en': {
        # Navigation
        'home': 'Home',
        'music': 'Music',
        'video': 'Video',
        'live': 'Live',
        'creators': 'Creators',
        'playlists': 'Playlists',
        'podcasts': 'Podcasts',
        'settings': 'Settings',
        
        # Auth
        'login': 'Log in',
        'signup': 'Sign up',
        'logout': 'Log out',
        'email': 'Email',
        'password': 'Password',
        'forgot_password': 'Forgot password?',
        
        # Player
        'now_playing': 'Now Playing',
        'play': 'Play',
        'pause': 'Pause',
        'next': 'Next',
        'previous': 'Previous',
        'shuffle': 'Shuffle',
        'repeat': 'Repeat',
        
        # Subscription
        'subscribe': 'Subscribe',
        'premium': 'Premium',
        'family': 'Family',
        'per_month': '/month',
        'unlimited_streaming': 'Unlimited streaming',
        
        # Content
        'featured': 'Featured',
        'trending': 'Trending',
        'new_releases': 'New Releases',
        'for_you': 'For You',
        'discover': 'Discover',
        
        # Territories
        'caribbean': 'Caribbean',
        'africa': 'Africa',
        'diaspora': 'Diaspora',
        'world': 'World',
        
        # Actions
        'add_to_playlist': 'Add to playlist',
        'share': 'Share',
        'download': 'Download',
        'like': 'Like',
        'follow': 'Follow',
        'report': 'Report',
        
        # Messages
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'no_results': 'No results',
        'try_again': 'Try again',
    },
    'ht': {
        # Kreyòl Ayisyen (Haitian Creole)
        'home': 'Akèy',
        'music': 'Mizik',
        'video': 'Videyo',
        'live': 'Anfas',
        'creators': 'Kreyatè',
        'playlists': 'Lis Mizik',
        'podcasts': 'Podkas',
        'settings': 'Paramèt',
        'login': 'Konekte',
        'signup': 'Enskri',
        'logout': 'Dekonekte',
        'play': 'Jwe',
        'pause': 'Kanpe',
        'subscribe': 'Abòne',
        'premium': 'Pwemyòm',
        'for_you': 'Pou ou',
        'discover': 'Dekouvri',
        'caribbean': 'Karayib',
        'africa': 'Lafrik',
        'loading': 'Ap chaje...',
        'error': 'Erè',
        'success': 'Siksè',
    },
    'wo': {
        # Wolof
        'home': 'Kër',
        'music': 'Xalam',
        'video': 'Widéyo',
        'live': 'Yéég',
        'creators': 'Sosër',
        'playlists': 'Limu Xalam',
        'login': 'Dugg',
        'logout': 'Génn',
        'play': 'Tambali',
        'pause': 'Tax',
        'subscribe': 'Bindu',
        'for_you': 'Ngir yow',
        'discover': 'Gis',
        'africa': 'Afrig',
        'loading': 'Yéég nañu...',
        'error': 'Njuumte',
        'success': 'Baax na',
    },
    'sw': {
        # Kiswahili
        'home': 'Nyumbani',
        'music': 'Muziki',
        'video': 'Video',
        'live': 'Moja kwa Moja',
        'creators': 'Wabunifu',
        'playlists': 'Orodha za Nyimbo',
        'login': 'Ingia',
        'signup': 'Jisajili',
        'logout': 'Ondoka',
        'play': 'Cheza',
        'pause': 'Simamisha',
        'subscribe': 'Jiandikishe',
        'for_you': 'Kwako',
        'discover': 'Gundua',
        'africa': 'Afrika',
        'loading': 'Inapakia...',
        'error': 'Hitilafu',
        'success': 'Imefanikiwa',
    },
}


def get_translation(key: str, language: str = DEFAULT_LANGUAGE) -> str:
    """
    Get translation for a key in the specified language.
    Falls back to default language if not found.
    """
    lang_dict = TRANSLATIONS.get(language, TRANSLATIONS[DEFAULT_LANGUAGE])
    translation = lang_dict.get(key)
    
    if translation is None:
        # Fallback to default language
        translation = TRANSLATIONS[DEFAULT_LANGUAGE].get(key, key)
    
    return translation


def get_all_translations(language: str = DEFAULT_LANGUAGE) -> Dict[str, str]:
    """Get all translations for a language."""
    base = TRANSLATIONS[DEFAULT_LANGUAGE].copy()
    lang_translations = TRANSLATIONS.get(language, {})
    base.update(lang_translations)
    return base


def get_supported_languages() -> Dict[str, str]:
    """Get list of supported languages."""
    return SUPPORTED_LANGUAGES.copy()


def detect_language_from_territory(territory: str) -> str:
    """Suggest language based on territory."""
    territory_language_map = {
        'caribbean': 'fr',  # Default to French for Caribbean
        'haiti': 'ht',
        'guadeloupe': 'fr',
        'martinique': 'fr',
        'senegal': 'wo',
        'kenya': 'sw',
        'tanzania': 'sw',
        'brazil': 'pt',
        'angola': 'pt',
        'usa': 'en',
        'uk': 'en',
        'africa': 'fr',
        'diaspora': 'fr',
    }
    return territory_language_map.get(territory.lower(), DEFAULT_LANGUAGE)
