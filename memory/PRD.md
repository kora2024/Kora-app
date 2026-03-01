# KORA — Product Requirements Document

## Vision
KORA est le premier réseau social où l'identité culturelle est l'infrastructure. L'application mobile React Native offre une expérience sensorielle unique centrée sur la diaspora et les connexions culturelles.

## Architecture
- **Frontend**: React Native / Expo (SDK 54) avec expo-router (file-based routing)
- **State Management**: Zustand
- **3D Globe**: Three.js via WebView (native) / iframe (web)
- **Fonts**: Playfair Display, Jost, JetBrains Mono (Google Fonts)
- **Design System**: Fichier theme.ts séparé avec tokens KORA

## Écrans Implémentés (7/7)

### 1. EveilScreen (`/eveil`) — Onboarding
- Expérience sensorielle en 3 étapes (60s)
- Étape 1: Calibration (fréquence) — 4 options sélection multiple
- Étape 2: Mémoire (origine) — 4 options sélection multiple
- Étape 3: Matérialisation — mini globe animé + bouton d'entrée
- Particules dorées flottantes (20 points animés)
- Progression 3 tirets (terracotta actif)
- Données stockées dans Zustand (alimentent le profil)

### 2. GlobeScreen (`/(tabs)/globe`) — Interface Principale
- Globe 3D Three.js avec sphère océan profond
- 8 territoires géoréférencés (points lumineux pulsants)
- Arcs de connexion animés (quadratic bezier, dash-offset)
- Grille latitude/longitude, lueur atmosphérique
- Rotation automatique + pan gesture
- Card territoire actif en bas (tap → Territoire)
- Hint "Appui long + glisse pour plonger" (4s)

### 3. FeedScreen (`/(tabs)/feed`) — Contenu Vertical
- FlatList plein écran avec pagingEnabled (snap scroll)
- 3 items mockés (Kévin/Marcel/Pulse Records)
- Header flottant: tag territoire actif + globe icon
- Actions verticales droite: Résonne/Orbite/Transmet/Lien
- 5 Fréquences (réactions): Résonne/Propulse/Éveille/Ancre/Transmet
- Animation spring au tap, toggle actif/inactif avec compteur
- Indicateur scroll vertical (dots terracotta)

### 4. TerritoireScreen (`/(tabs)/territoire`) — Profil
- Header immersif 380px avec gradient dérivé de l'Éveil
- Avatar emoji basé sur les fréquences choisies
- Rôle dynamique (GRIOT/CRÉATEUR/PENSEUR/BÂTISSEUR)
- Stats: 847 Habitants | 23 Éclats | 12 FREK
- Noyau CVLN CTA avec sphère pulsante (2,847 CVLN)
- Grille éclats 2 colonnes (6 cards)
- Collaborations FREK avec badges vérifiés
- Parallax scroll 0.5x

### 5. OrbiteScreen (`/orbite`) — Commentaires Orbitaux
- Carte centrale 280px (emoji + texte + auteur)
- 6 bulles orbitales en rotation (vitesses 8.5s-17s)
- Rayons variables 110-155px, oscillation organique
- Toggle profondeur (◎/◉): révèle dialogues + Griot
- Réponse Griot: avatar + ondes sonores animées + FREK badge
- Pinch gesture + bouton fallback
- Hint 4s

### 6. NebuleuseScreen (`/(tabs)/nebuleuse`) — Messagerie
- Constellation avec "MOI" au centre
- 6 contacts en étoiles (chaud→froid, proche→éloigné)
- Lignes de connexion SVG entre proches
- Oscillation sine in-out (3s-7s)
- Pulse de présence (terracotta/or)
- Bottom sheet conversation au tap étoile
- Message vocal avec barres d'onde + durée
- Label thématique "Musique" en or

### 7. NoyauScreen (`/noyau`) — Dashboard CVLN
- Sphère centrale animée (1,247 CVLN)
- Racines: barres de progression animées
- Tronc: grille 4 stats
- Feuilles: nouvelles connexions avec +CVLN

### 8. CreateScreen (`/(tabs)/create`) — Création
- 4 types d'éclat (Texte/Sonore/Visuel/Vidéo)
- Grille 2x2

## Navigation
- **Root**: Stack Navigator (fade transitions)
- **Tabs**: 5 onglets (Globe/Feed/Créer/Nébuleuse/Territoire)
- **Stack**: Orbite + Noyau (slide from right)
- **Eveil**: isolé sans tabs

## Design System
- **Terracotta**: #A65D47 (actions, Griots)
- **Or**: #C9A84C (CVLN, récompenses)
- **Dark**: #0D0D0D (fond principal)
- **Dark2**: #1A1A1A (cartes)
- **Cream**: #F4F1EA (texte principal)
- **Gray**: #888888 (texte secondaire)

## État des Données
- Toutes les données sont **MOCKÉES** côté frontend
- Zustand stocke: fréquences, mémoires, territoire actif, onboarding status
- Pas de backend API pour l'instant

## Prochaines Étapes
- Backend FastAPI + MongoDB pour persistence
- Authentification utilisateur
- Messagerie temps réel (WebSockets)
- Algorithme de fréquence basé sur les réactions
- Système CVLN (économie token)
