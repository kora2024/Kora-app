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
- Header avec back button, "Le Noyau", badge "Mars 2026"
- Sphère centrale 160px avec gradient terracotta (#e8a882→#A65D47→#6b2d1a)
- Triple couche de glow (260px, 210px, 180px ring)
- Animation pulse scale 1↔1.03 + glow oscillation + inner ring
- Tap sphère: bounce + tooltip "Toucher pour déployer les statistiques"
- **L'Arbre de Vie** (3 sections):
  - 🌿 Racines — Résonance passive: 3 barres gradient terracotta→or animées avec CVLN
  - 🪵 Tronc — Solde & transactions: grille 2x2 (2847 total, +313 mois, 12 FREK, 3 artefacts)
  - 🍃 Feuilles — Nouvelles connexions: 3 événements avec emoji, description, temps, CVLN
- Ambiance: radial gradient terracotta 12% + or 6% sur fond sombre

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

## Micro-interactions & Polish (Prompt 9)
- **Haptics** : expo-haptics intégré sur toutes les interactions clés
  - Sélection fréquence/mémoire : `selectionAsync()`
  - Entrée territoire (Globe→Feed) : `impactAsync(Heavy)`
  - Réactions Feed : `impactAsync(Medium)`
  - Orbite bubble tap : `impactAsync(Light)`
  - Étoile Nébuleuse tap : `impactAsync(Light)`
  - FREK badge tap : `notificationAsync(Success)`
  - Noyau sphère tap : `impactAsync(Light)`
  - Noyau CTA : `impactAsync(Medium)`
- **Typographie** : Playfair Display Italic pour les citations/moments poétiques du Feed
- **Dark Mode** : Forcé dans app.json (`userInterfaceStyle: "dark"`)
- **Performance** : FlatList optimisé (windowSize:5, maxToRenderPerBatch:3, removeClippedSubviews)
- **Shimmer** : Composant skeleton réutilisable prêt (SkeletonFeedItem, SkeletonCard)
- **Utilitaire** : `src/utils/haptics.ts` avec wrapper safe (no-op sur web)
- Toutes les données sont **MOCKÉES** côté frontend
- Zustand stocke: fréquences, mémoires, territoire actif, onboarding status
- Pas de backend API pour l'instant

## Prochaines Étapes
- Backend FastAPI + MongoDB pour persistence
- Authentification utilisateur
- Messagerie temps réel (WebSockets)
- Algorithme de fréquence basé sur les réactions
- Système CVLN (économie token)
