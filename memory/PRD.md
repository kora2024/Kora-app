# KORA — Product Requirements Document

## Vision
KORA est le premier DSP (Digital Service Provider) culturel souverain pour la diaspora caribéenne et afro-diasporique. L'application mobile React Native offre une expérience premium Netflix/Apple TV avec un catalogue musical et audiovisuel alimenté par le pipeline FrekCore.

## Architecture Vivante (Sprint 1 Complete)

### Flux de Données
```
Source (Artiste/Label/Distributeur)
         ↓
   FrekCore Ingestion Layer
         ↓
    Work Object Signé (.fk ready)
         ↓
     KORA MongoDB (works)
         ↓
     API /frekcore/feed
         ↓
   Frontend (home.tsx, films.tsx)
```

### Stack Technique
- **Frontend**: React Native / Expo (SDK 54) avec expo-router
- **Backend**: FastAPI + Motor (Async MongoDB)
- **State Management**: Zustand (global player store)
- **Video**: expo-video (migration expo-av complete)
- **Design System**: Tokens KORA (CINEMA, FONTS)

### Collections MongoDB
- `users`: Utilisateurs avec rôle culturel et FREK-ID
- `works`: Catalogue principal (FrekCore validated) — **56 works**
- `content`: Contenu créateurs self-serve (legacy)
- `events`: Bus d'événements API

## Catalogue Vivant (Sprint 1)

### Statistiques Actuelles
- **Total Works**: 58
- **Musique**: 47 tracks
- **Audiovisuel**: 11 (films, séries, documentaires, concerts)

### Territoires Culturels Représentés
- Caraïbes: Martinique, Guadeloupe, Jamaïque, Haïti, Trinidad
- Afrique: Sénégal, Nigeria, Côte d'Ivoire, Congo, Mali, Bénin
- Diaspora: France, UK, USA
- Global: Brésil, Cuba, Corée, Japon, Inde

### Contenu CVLN Interne
- **DJ Sayd** — "C'est Nous L'Avenir" (flagship)
- Factory Maker Studio catalog
- Sessions FMS

### API Endpoints
- `GET /api/frekcore/feed` — Home feed (trending, new_releases, discoveries)
- `GET /api/frekcore/feed/audiovisual` — Films/Séries
- `GET /api/frekcore/feed/trending` — Top plays
- `GET /api/frekcore/feed/territory/{code}` — Par territoire
- `POST /api/frekcore/ingest` — Ingestion manuelle
- `GET /api/frekcore/stats` — Statistiques catalogue

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

## Audit Final (Prompt 10) — 28/28 ✅

### Navigation (9/9 ✅)
- [x] Éveil → Globe (onboarding 3 étapes → enter KORA)
- [x] Globe → Feed (tab + double-tap territoire)
- [x] Feed → Orbite (bouton action-orbite)
- [x] Feed → Nébuleuse (bouton Transmet + tab)
- [x] Territoire → Noyau (carte Noyau CTA)
- [x] Back buttons (Orbite → Feed, Noyau → Territoire)
- [x] Bottom nav visible sur tous les onglets
- [x] Bottom nav cachée sur Éveil, Orbite, Noyau
- [x] Navigation rapide sans crash

### Visuels (5/5 ✅)
- [x] Fond dark (#0D0D0D) sur tous les écrans
- [x] Playfair Display sur tous les titres
- [x] Terracotta (#A65D47) sur éléments actifs
- [x] Or (#C9A84C) sur valeurs CVLN
- [x] Aucun overflow/coupure à 390px

### Interactions (12/12 ✅)
- [x] Fréquences Feed s'activent/désactivent
- [x] Orbite bubbles en rotation fluide
- [x] Orbite depth toggle fonctionne
- [x] Étoiles Nébuleuse oscillent et répondent au tap
- [x] Bottom sheet conversation ouvre/ferme
- [x] Sphère Noyau pulse + tooltip
- [x] Globe 3D rendu et interactif
- [x] Créer affiche 4 options

### Performance (2/2 ✅)
- [x] Pas de crash sur navigation rapide
- [x] Feed scroll snap correct

## Architecture Backend — Cultural Value Engine (CVE)

### Implémenté (v1.0)
KORA implémente le **Cultural Value Engine (CVE)** selon la spécification mathématique v1.0.

#### Data Models (`/app/backend/models/cve_models.py`)
- **Work**: Œuvre créative avec FREK-O reference
- **Asset**: Fichier digital (audio/video) avec qualité (FLAC, Hi-Res, Dolby Atmos)
- **Release**: Album/EP/Single
- **RightsHolder**: Détenteur de droits avec JCC Wallet
- **RoyaltySplit**: Configuration de distribution des royalties
- **ListeningEvent**: Événement d'écoute avec TrustScore
- **CulturalValueRecord**: Métriques CVE par cycle

#### CVE Calculation Service (`/app/backend/services/cve_service.py`)
- **Layer 1 — Measurement**: TrustScore (sig_id, sig_comp, sig_net, sig_hist)
- **Layer 2 — Comprehension**: CVI via CES aggregation, Nebula Score, CHL
- **Layer 3 — Forecasting**: Classification culturelle (non utilisé pour allocation)
- **Layer 4 — Allocation**: UVC = (CVI / Σ CVI) × MD

#### API Endpoints (`/app/backend/routes/cve_routes.py`)
- `GET /api/cve/work/{id}` — Métriques CVE d'une œuvre
- `GET /api/cve/leaderboard` — Top œuvres par CVI
- `GET /api/cve/stats` — Statistiques du cycle
- `GET /api/cve/config/{cycle}` — Configuration transparente
- `POST /api/cve/cycle/{id}/process` — [ADMIN] Traitement du cycle

#### Contraintes Fondamentales
- C1: Budget (Σ UVC = MD)
- C2: Fraude (TS ≥ τ_fraude)
- C3: Stabilité (|Δw| ≤ 0.10)
- C4: Diversité culturelle
- C5: Neutralité culturelle
- C6: Auditabilité (H0)
- C7: Gouvernance
- C8: Séparation forecast/allocation

### Stripe Monetization
- **Premium**: 3,98€/mois
- **Pack Famille**: 7,98€/mois (jusqu'à 6 comptes)
- Webhook `/api/webhook/stripe` pour activation automatique

## Prochaines Étapes
- [ ] Dashboard Artiste (KORA for Creators - stats, revenus)
- [ ] Social Logins (Google/Apple via Emergent)
- [ ] Push Notifications (Emergent-managed)
- [ ] Mode Offline (téléchargement)
- [ ] CultureConnect P2P (géolocalisation diaspora)
- [ ] NFT Sovereign (FrekCore integration)
