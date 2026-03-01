# KORA — Le premier réseau social culturel

> *"Le bois des anciens parlait encore."*

KORA est le premier réseau social où l'identité culturelle est l'infrastructure. Pas un clone de plus — un nouveau paradigme de connexion humaine.

## 🌍 Vision

KORA connecte la diaspora globale à travers un réseau social où la culture, la mémoire et l'identité sont les fondations, pas des accessoires. L'application remplace les likes par des **Fréquences**, les commentaires par des **Orbites**, et les followers par des **Habitants de territoire**.

## 🏗️ Architecture

```
frontend/                   # Application React Native (Expo SDK 54)
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout (fonts, stack navigator)
│   ├── index.tsx           # Entry → redirect /eveil
│   ├── eveil.tsx           # Onboarding (3 étapes sensorielles)
│   ├── orbite.tsx          # Commentaires orbitaux
│   ├── noyau.tsx           # Dashboard CVLN
│   └── (tabs)/             # Bottom tab navigation
│       ├── _layout.tsx     # Tab bar configuration
│       ├── globe.tsx       # Globe 3D Three.js
│       ├── feed.tsx        # Feed vertical plein écran
│       ├── create.tsx      # Création d'éclats
│       ├── nebuleuse.tsx   # Messagerie constellation
│       └── territoire.tsx  # Profil/espace personnel
├── src/
│   ├── theme.ts            # Design system KORA (couleurs, fonts, spacing)
│   ├── store/
│   │   └── useKoraStore.ts # Zustand global state
│   ├── globe/
│   │   └── globeHTML.ts    # Three.js globe HTML template
│   ├── utils/
│   │   └── haptics.ts      # Retour haptique
│   └── components/
│       └── common/
│           ├── GlowText.tsx
│           ├── BackButton.tsx
│           ├── FREKBadge.tsx
│           ├── CVLNAmount.tsx
│           └── Shimmer.tsx  # Skeleton loading
```

## 🎨 Design System

| Token | Couleur | Usage |
|-------|---------|-------|
| Terracotta | `#A65D47` | Actions, Griots, éléments actifs |
| Or | `#C9A84C` | CVLN, économie, récompenses |
| Dark | `#0D0D0D` | Fond principal |
| Dark2 | `#1A1A1A` | Cartes, éléments secondaires |
| Cream | `#F4F1EA` | Texte principal |
| Gray | `#888888` | Texte secondaire |

**Typographie :**
- Titres : Playfair Display (serif, italique pour citations)
- Corps & UI : Jost (sans-serif, weights 200-500)
- Code/données : JetBrains Mono

## 📱 Les 7 Écrans

### 1. L'Éveil (Onboarding)
Expérience sensorielle de 60 secondes. 3 étapes : Calibration → Mémoire → Matérialisation.

### 2. Le Globe (Interface principale)
Globe 3D Three.js avec 8 territoires géoréférencés, arcs de connexion animés.

### 3. Le Feed (Contenu vertical)
Scroll snap plein écran. Système de Fréquences (pas de likes) : Résonne, Propulse, Éveille, Ancre, Transmet.

### 4. Le Territoire (Profil)
Header immersif avec gradient dérivé de l'Éveil. Avatar et rôle dynamiques.

### 5. L'Orbite (Commentaires)
Les réactions gravitent autour du contenu central. Toggle profondeur pour dialogues.

### 6. La Nébuleuse (Messagerie)
Constellation : contacts = étoiles. Plus actif = plus chaud et proche.

### 7. Le Noyau (Dashboard CVLN)
Sphère économique avec L'Arbre de Vie : Racines, Tronc, Feuilles.

## 🚀 Installation

```bash
# Prérequis
node >= 18
yarn

# Installation
cd frontend
yarn install

# Lancement (développement)
npx expo start

# Lancement avec tunnel (pour test sur mobile)
npx expo start --tunnel
```

## 📲 Test sur mobile

1. Installer **Expo Go** sur votre téléphone (iOS/Android)
2. Lancer `npx expo start --tunnel`
3. Scanner le QR code avec Expo Go
4. L'application se charge automatiquement

## 🔧 Technologies

| Package | Version | Usage |
|---------|---------|-------|
| expo | ~52.0.37 | Framework React Native |
| expo-router | ~4.0.20 | Navigation file-based |
| zustand | 5.0.11 | State management |
| expo-linear-gradient | ~15.0.8 | Gradients natifs |
| expo-haptics | ~14.0.1 | Retour haptique |
| react-native-webview | 13.13.5 | Globe 3D (Three.js) |
| react-native-svg | 15.12.1 | SVG natif |
| @expo-google-fonts/* | 0.4.x | Playfair, Jost, JetBrains |

## 🗺️ Navigation

```
┌─────────────────────────────────────────────────┐
│  ÉVEIL (isolé, pas de tabs)                      │
│  ┌─── Calibration → Mémoire → Matérialisation   │
│  └──→ GLOBE                                     │
├─────────────────────────────────────────────────┤
│  TABS (navigation bottom)                        │
│  ┌─ Globe ─ Feed ─ Créer ─ Nébuleuse ─ Territ. │
│  │                                               │
│  │  Globe ──tap──→ Feed (territoire actif)       │
│  │  Feed ──Orbite──→ ORBITE (stack)              │
│  │  Feed ──Transmet─→ Nébuleuse (tab)            │
│  │  Territoire ──Noyau──→ NOYAU (stack)          │
│  │                                               │
│  │  ORBITE ──back──→ Feed                        │
│  │  NOYAU ──back──→ Territoire                   │
│  └───────────────────────────────────────────────│
└─────────────────────────────────────────────────┘
```

## ⚠️ Ce qui N'EST PAS dans ce MVP

- Authentification utilisateur
- Messages temps réel (WebSockets)
- Upload de voix réelles
- Algorithme de fréquence réel
- Blockchain FREK
- CVLN tokenomics réel
- Notifications push
- Backend API (toutes données mockées)

## 📄 Licence

Ce prototype est la propriété de son créateur. Usage interne uniquement.

---

*Ce prototype est le territoire zéro de KORA. Il n'est pas parfait. Il est réel.*
