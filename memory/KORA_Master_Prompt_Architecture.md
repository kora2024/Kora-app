# KORA — MASTER PROMPT ARCHITECTURE

*Document de référence technique et stratégique — CVLN Groupe*

---

## 1. VISION & DOCTRINE DE CVLN PLATFORM

KORA n'est pas une application de streaming musical. C'est une **brique d'infrastructure culturelle mondiale** au sein de CVLN Groupe, à évaluer selon les standards des grands groupes technologiques (Spotify, Netflix, Bytedance) — pas selon ceux d'un label ou d'un acteur culturel régional.

**Principes directeurs :**
- Chaque brique (catalogue, identité, paiement, IA, gouvernance) est conçue comme une pièce potentiellement réutilisable par d'autres entités CVLN, pas comme un module isolé propre à KORA.
- Critères d'évaluation systématiques pour toute décision d'architecture : **scalabilité, propriété intellectuelle, autonomie, valeur à long terme**.
- Thèse fondatrice : la diaspora afro-descendante et caribéenne est un marché structurant sous-servi par l'infrastructure existante — KORA construit l'infrastructure, pas seulement le catalogue.
- KORA se positionne sur 4 couches empilées : **identité** (FrekCore/FREK-ID) → **économie** (Wallet CVLN/JCC) → **intelligence** (Laurentia + Agent Factory) → **contenu** (musique + audiovisuel).

---

## 2. ARCHITECTURE GLOBALE DU GROUPE

KORA s'inscrit dans l'écosystème CVLN Groupe (structure : 3 véhicules juridiques — CVLN Groupe Holding Ltd, Factory Maker Studio EURL, Kilti Konet — 22 entités, 6 pôles stratégiques, cible IPO 2028).

**Statut juridique et rattachement (confirmé)** : KORA est piloté juridiquement par **FMS** (Factory Maker Studio EURL), sous la **Fondation CVLN** et le **pôle Tech & Data**. Ce point n'est plus ouvert.

**Ce qui est établi et transversal** — KORA consomme, sans les dupliquer, des services partagés au niveau du groupe :
- **FrekCore** : couche identité + preuve d'existence, utilisée potentiellement par Good Mood, CVLN Academy, et toute entité future — pas un module propre à KORA (cf. section 9).
- **Wallet CVLN / JCC** : couche économique transversale, valable sur l'ensemble des entités CVLN (cf. section 10).
- **CVLN Agent Factory** : couche d'automatisation/IA (284 agents), mutualisée entre pôles (cf. section 12).

KORA doit donc être architecturé comme un **client** de ces services groupe, pas comme un système fermé — c'est la condition pour que les briques restent réutilisables ailleurs dans le groupe, conformément à la doctrine.

---

## 3. ARCHITECTURE COMPLÈTE DE KORA

18 modules fonctionnels, découplés :

| # | Module | Contenu |
|---|---|---|
| 1 | Fondation | Authentification (FREK-ID), comptes utilisateurs/artistes/labels, rôles, paramètres |
| 2 | Catalogue musical | Titres, albums, EP, singles, playlists, genres, tags, métadonnées |
| 3 | Lecteur audio | Mini/Full Player, file d'attente, aléatoire, répétition, paroles, crossfade, HQ, offline |
| 4 | Bibliothèque | Favoris, albums enregistrés, playlists perso, historique, reprise d'écoute |
| 5 | Recherche | Recherche instantanée, suggestions |
| 6 | Publication artistes | Upload audio/pochette, métadonnées, validation, programmation de sortie |
| 7 | Monétisation | Abonnements, paiement, offres, essais gratuits, facturation |
| 8 | Statistiques | Écoutes, auditeurs, temps d'écoute, revenus, dashboards artistes |
| 9 | Recommandation | IA, découverte, mix personnalisés, radio, tendances |
| 10 | Social | Abonnements, likes, commentaires, partages, profils publics |
| 11 | Éditorial | Accueil, sélections, nouveautés, playlists officielles, classements |
| 12 | Notifications | Nouvelles sorties, activité, messages, promotions |
| 13 | Administration | Modération, gestion catalogue, validation artistes, signalements |
| 14 | API & écosystème | API publique, API partenaires, webhooks, SDK |
| 15 | FrekCore | FREK-ID, preuves d'existence, métadonnées culturelles, signature, traçabilité |
| 16 | Laurentia | Assistant conversationnel, recherche naturelle, recommandations IA |
| 17 | Infrastructure | CDN, streaming, cache, transcodage, stockage, monitoring, sécurité |
| 18 | Média vidéo | Clips, live, concerts, documentaires, interviews, VOD/replay, sous-titres |

**Arbitrage nécessaire** : le module 18 mélange deux logiques distinctes — contenu créateur/promo (self-serve, proche musique) et contenu catalogue premium films/séries (curatorial, cf. section 7). À scinder en deux sous-catalogues avec schémas de données propres (`audiovisual_creator` vs `audiovisual_catalog`, cf. section 4).

**Principe transversal — divulgation progressive par rôle** : une seule application, plusieurs niveaux de surface exposée selon le rôle de l'utilisateur (`auditeur`, `créateur`, `administrateur`, `partenaire`). Ce n'est pas une règle propre au Wallet (section 10) — c'est une règle d'architecture générale pour les 18 modules : chaque module déclare, pour chaque rôle, s'il est invisible, visible en lecture seule, ou pleinement actionnable. Un auditeur ne voit jamais la couche Wallet ni les outils de publication ; un créateur voit progressivement les fonctions financières et de gestion pertinentes à mesure qu'il en a besoin, sans que l'interface d'écoute grand public ne se transforme en interface professionnelle. Ça permet à une seule codebase de servir le grand public et les professionnels sans double maintenance d'UI, et ça borne la complexité perçue par chaque profil — cohérent avec les standards des grandes plateformes qui séparent nettement l'usage consommateur de l'usage professionnel sans dupliquer l'app.

---

## 4. MODÈLE DE DONNÉES

Schéma pivot central, indépendant du type de contenu, pour permettre à tous les modules (lecteur, bibliothèque, recherche, recommandation) de fonctionner sans dupliquer de logique :

```
Entity: Work
 ├── work_id (UUID interne KORA)
 ├── type: "music" | "audiovisual_catalog" | "audiovisual_creator"
 ├── universal_id: ISRC (music) | EIDR (audiovisual_catalog) | null (creator)
 ├── title, description (localisable FR/EN/créole/wolof...)
 ├── release_ref → Entity: Release
 ├── rights_holder_ref → Entity: RightsHolder
 ├── territory_availability[] → Entity: Avail (audiovisual_catalog uniquement)
 ├── delivery_metadata → ERN (music) | MEC (audiovisual_catalog) | métadonnées légères (creator)
 ├── frekcore_ref → signature / preuve d'existence (service transversal)
 └── assets[] → Entity: Asset

Entity: Asset
 ├── asset_id, work_id
 ├── kind: audio_master | video_master | artwork | subtitle | lyrics
 ├── format, quality_tier, storage_ref (cf. section 16)
 └── transcoded_variants[]

Entity: Release
 ├── release_id, type: album | EP | single | film | series | season | episode
 ├── works[] (liste ordonnée de Work)
 ├── release_date, label_ref
 └── programmation_status: draft | scheduled | published

Entity: Avail (audiovisual_catalog uniquement)
 ├── work_id, territory
 ├── business_model: SVOD | TVOD | AVOD | FAST | theatrical
 └── start_date, end_date, price (si TVOD)

Entity: RightsHolder
 ├── rights_holder_id, name
 ├── type: artist | label | studio | sales_agent | creator | ai_artist
 ├── ipi_id (music) | contact_ref (audiovisual)
 └── royalty_split[] → Entity: RoyaltySplit (cf. section 8)
```

**Règle de routage** : le champ `type` sur `Work` détermine le pipeline d'ingestion (ERN / EIDR-MEC-Avails / upload créateur léger) sans jamais dupliquer les couches communes (lecteur, bibliothèque, recherche, social, notifications).

**Artiste IA — extension du modèle** : `RightsHolder.type = "ai_artist"` couvre un profil créé et publié par un système génératif plutôt qu'une personne physique. Trois conséquences pratiques à traiter dès le schéma :
- **Divulgation obligatoire** : `Work` porte un champ `is_ai_generated` (bool) + `ai_disclosure` (texte court, ex. modèle/outil utilisé) — plusieurs DSP internationaux imposent déjà ce label, KORA doit être prêt à l'exposer nativement plutôt qu'à le rajouter sous pression réglementaire.
- **Attribution des droits** : un `ai_artist` n'est jamais le porteur final des royalties — le `royalty_split[]` doit obligatoirement pointer vers une ou plusieurs personnes physiques/morales responsables (opérateur, label, studio), jamais vers l'entité IA elle-même.
- **Impact sur le Rights Engine** : si le `CulturalValueRecord` (section 8) est activé, un `ai_artist` ne doit pas être éligible au même titre qu'un artiste humain sur les pondérations liées au Trust Score/Nebula Score sans une règle explicite — **[action humaine requise]** avant activation ; à défaut de règle validée, la capability Agent Factory concernée (section 12) ne doit pas trancher seule ce point.

---

## 5. FK CULTURAL OBJECT FORMAT (.fk)

**Précision d'ownership (correction)** : le format `.fk` est le **conteneur culturel natif développé et maintenu par FrekCore**. Il constitue le format d'échange privilégié de l'écosystème CVLN. **KORA produit, consomme, importe et exporte des objets `.fk`, mais n'en est ni le propriétaire ni la source de vérité** — cette responsabilité reste entièrement du côté de FrekCore (cf. point dédié, section 9). Ce qui suit décrit le format et son usage côté KORA ; sa définition, son versionnement, sa validation et sa signature relèvent de FrekCore, pas de ce document.

**Définition** : le `.fk` est le **conteneur culturel natif de l'écosystème CVLN**. Il encapsule une œuvre, ses métadonnées, ses références aux standards internationaux (ISRC, ISWC, EIDR, IPI...), les signatures FrekCore (preuve d'existence, section 9) et les éléments nécessaires à sa portabilité entre services.

**Ce que le `.fk` n'est pas** : il ne remplace aucun standard existant (ERN, MEC, Avails). Il les **encapsule**, pour produire un objet culturel complet, portable et interopérable — un `Work` validé par FrekCore peut être exporté en `.fk` sans perte d'information, quel que soit le service ou l'outil d'origine.

### 5.1 Cas d'usage

- **Export d'un album** → `.fk`
- **Export d'un film** → `.fk`
- **Sauvegarde d'un projet** → `.fk`
- **Migration d'un catalogue** → `.fk`
- **Sauvegarde d'une playlist** → `.fk`
- **Synchronisation entre applications** → `.fk`

### 5.2 Position dans le flux

```
Creator
   │
   ▼
 Work
   ▼
FK Package
   ▼
FrekCore
   ▼
KORA · Spotify · Apple · Deezer · Archives
```

Le `.fk` est généré au moment où un `Work` est validé et signé par FrekCore (cf. `work.validated`, section 14.2) — c'est le format sous lequel une œuvre circule ensuite vers n'importe quelle destination, KORA y compris, sans que chaque destination n'ait à réinterpréter séparément ERN/EIDR/MEC à chaque fois.

**Conséquence pour le modèle de données (section 4)** : `Work.assets[]` peut inclure une représentation `.fk` complète du paquet, generée à la publication — pas uniquement les fichiers média bruts.

**Conséquence pour l'API (section 26)** : la bibliothèque `.fk` (lecture, écriture, validation, signature, conversion) — propriété de FrekCore — est exposée comme capability publique via KORA for Developers (section 21). KORA for Developers en est le point d'accès, pas le propriétaire ni le mainteneur du format.

---

## 6. STACK MUSIQUE (DDEX)

**Correction d'architecture (mise à jour, précision finale)** : la capacité DDEX (ERN/DSR) est portée par **FrekCore**, pas par LabelOS ni par KORA. LabelOS est **l'un des clients** de cette capacité — au même titre qu'un distributeur (JTV Digital, Jaiye, Wiseband), qu'un autre logiciel de gestion de catalogue tiers, ou qu'un portail self-serve. Ce que LabelOS a déjà construit en interne (`dsp_ops.py`, `ddex_generator.py`, `isrc_generator.py`, `audio_validator.py` — 195 releases, 275 artistes en base actuellement) reste un point d'entrée valide et déjà opérationnel, mais architecturalement c'est un **client émetteur** vers la capacité FrekCore, pas la source de vérité du pipeline DDEX pour l'écosystème. **KORA reçoit les œuvres validées par FrekCore, indépendamment de leur outil d'origine** — LabelOS, un distributeur, ou tout autre outil compatible ERN produisent le même résultat côté KORA : un `Work` validé et signé, sans distinction de provenance dans le modèle de données (section 4).

**Identifiants**
| Identifiant | Objet | Portée |
|---|---|---|
| ISRC | Un enregistrement précis (track) | Mondial, SNEP en France |
| ISWC | L'œuvre/composition | Mondial, CISAC/SACEM |
| IPI | Auteurs/compositeurs/éditeurs (répartition droits) | Mondial, CISAC |

**Protocoles**
- **ERN 4.3 (Electronic Release Notification)** : livraison d'une sortie de n'importe quel client (LabelOS, distributeur, autre outil) vers FrekCore.
- **DSR (Digital Sales Report)** : retour mensuel des données de streams généré par FrekCore, redistribué à chaque client émetteur (LabelOS, distributeurs) pour calcul royalties (cf. Rights Engine, section 8).

**Composants techniques requis (portés par FrekCore, cf. section 9)**
1. Endpoint de réception ERN (API ou SFTP/FTP), ouvert à tout client conforme — pas réservé à LabelOS.
2. Moteur de validation pré-ingestion, rejet explicite ligne par ligne, retourné au client émetteur d'origine.
3. Générateur DSR mensuel par client émetteur (LabelOS, chaque distributeur connecté).
4. Table de correspondance ISRC ↔ work_id KORA (ISRC = clé pivot, jamais l'inverse) — tenue par FrekCore, consultée par KORA.

---

## 7. STACK AUDIOVISUELLE (EIDR, MEC, EMA Avails, IMF)

**Correction d'architecture importante** : même logique que la section 6 — cette stack est portée par FrekCore, pas codée en dur dans KORA (cf. section 9).

**Directive impérative pour Emergent/Jacques** : SAYD/C'est Nous L'Avenir est le **premier titre de test**, pas la cible de conception. L'architecture d'ingestion (EIDR/MEC/Avails côté FrekCore, modèle `Work`/`Release` côté KORA) doit être générique dès le premier commit — capable de recevoir n'importe quel film/série tiers, avec SAYD comme simple première entrée en base. Si le pipeline est pensé "pour SAYD" plutôt que "pour tout contenu audiovisuel qui arrivera", il faudra tout refaire au deuxième titre. Ce point doit être explicitement communiqué à Emergent avant toute reprise de développement.

Suite MovieLabs/EMA — 4 briques complémentaires, pas de protocole unique.

- **EIDR** : identifiant universel par œuvre (basé sur DOI, ISO 26324). Accès via **Membership** (volume élevé) ou **Title Registrar** (à l'unité, sans engagement — recommandé au démarrage). Action immédiate : enregistrer SAYD/C'est Nous L'Avenir avant le tournage de septembre — comme premier enregistrement dans le pipeline générique, pas comme cas particulier.
- **MEC (Media Entertainment Core)** : métadonnées descriptives standardisées, générées automatiquement, localisables.
- **EMA Avails** : disponibilité par territoire/modèle économique (SVOD/TVOD/AVOD/FAST)/fenêtre temporelle. Windowing à traiter comme données paramétrables par titre (repères 2026 : ~45 jours salle→VOD payant, ~90-120 jours jusqu'à SVOD, évolutif par négociation).
- **IMF** : standard SMPTE de livraison technique des masters (composants séparés vidéo/audio/sous-titres). À valider techniquement avec Jacques — envisager un format de transit simplifié tant que le volume ne justifie pas la pleine conformité.

**Différence d'accès au catalogue** (rappel structurant) :

| | Musique | Audiovisuel |
|---|---|---|
| Accès | Self-serve (agrégateurs) | Curatorial (sales agents, festivals, marchés) |
| Rôle de la stack technique | Automatise l'accès | Automatise la logistique post-deal |
| Levier prioritaire | Intégration DDEX + Merlin | Représentation commerciale + marchés |

---

## 8. RIGHTS ENGINE & ROYALTIES

Moteur central, commun aux deux catalogues, qui calcule et distribue les revenus. Les entités canoniques sont définies en 8.4, après l'introduction du CVE ci-dessous — évite de poser un modèle naïf de royalties puis de le redéfinir en double.

**Point superseded — le placeholder "CulturalImpactScore" proposé précédemment dans ce document est remplacé.** Le vrai modèle existe déjà, formalisé et gelé sur la théorie v1.4 : le **KORA Cultural Value Engine (CVE)**. Ce qui suit est le résumé architectural à intégrer dans le Master Prompt ; la spécification mathématique complète (notation, démonstrations, tables d'hypothèses) reste le document de référence externe — à conserver tel quel, ne pas le dupliquer/paraphraser dans le code.

### 8.1 KORA Cultural Value Engine (CVE) — architecture à 4 couches

Le CVE remplace tout modèle naïf de royalties au comptage brut de streams. Il calcule une **part proportionnelle de la masse distribuable** (`MD_c`, budget fixe par cycle) selon un indice composite de valeur culturelle, pas selon le volume d'écoute seul.

**Couche 1 — Mesure** : signaux bruts horodatés et recalculables par un tiers (principe de fermeture, hypothèse H0 — condition d'auditabilité, cohérente avec la contrainte C6/section 14.3).
- **Trust Score (`TS_i(t)`)** : filtre anti-fraude en amont — un événement d'écoute n'est retenu dans le calcul que si `TS ≥ τ_fraude` (seuil publié par cycle, cf. Governance Protocol §7.4).
- **Composantes brutes** par œuvre/cycle : `S` (streams validés), `E` (engagement — durée écoutée, réécoute, ajout playlist), `F` (fidélité — présence hebdomadaire pondérée Premium), `C` (conversion — valeur € attribuée en fenêtre 14j), `L` (remplacé en couche 2 par la Cultural Half-Life, voir plus bas).

**Couche 2 — Compréhension** :
- **CVI (Cultural Value Index)** : agrégation CES (Constant Elasticity of Substitution) des composantes normalisées, `ρ_c` calibré par cycle — permet de passer en continu d'une simple somme pondérée à une forme Cobb-Douglas voire Leontief selon la substituabilité réelle observée entre composantes.
- **Nebula Score (`N`)** : mesure de circulation culturelle par entropie de Shannon sur 6 axes (langue, territoire, diaspora, génération, style, collaboration) — récompense la diffusion transversale, pas seulement le volume dans un seul segment. Directement pertinent pour la thèse diaspora du groupe : une œuvre qui circule entre territoires/générations obtient un score plus élevé qu'une œuvre à forte audience mais confinée.
- **Cultural Half-Life (CHL)** : détecte les pics de création de valeur et mesure leur temps de décroissance à 50% — distingue œuvre éphémère / slow-burn / classique / patrimoniale. Remplace la composante `L` brute.
- **VCF (Value Creation Factor)** : définition **causale**, pas corrélationnelle — écart entre résultat observé et un résultat contrefactuel estimé par groupe de contrôle synthétique (méthode Abadie). Corrigé par shrinkage bayésien pour les œuvres à faible historique (cold-start).
- **Poids des composantes (`w_a,c`)** : non fixés à la main — calculés par **décomposition de Shapley**, contribution marginale moyenne de chaque composante sur toutes les combinaisons possibles. Élimine l'arbitraire de pondération manuelle.

**Couche 3 — Prévision** : classification prospective (scène émergente, talent en croissance, diaspora en expansion) — **strictement séparée de l'allocation** par contrainte de gouvernance formelle (`Ŷ ∉ entrées(Allocation)`, cf. contrainte C8). Ce n'est pas qu'une règle de discours : le schéma de données du prototype doit rendre les tables de prévision non lisibles par le module d'allocation.

**Couche 4 — Allocation** :
```
UVC_i,c = (CVI_i,c / Σ_j CVI_j,c) · MD_c
```
Chaque œuvre reçoit une part de la masse distribuable proportionnelle à son CVI relatif au catalogue du cycle — c'est ce nombre, pas un comptage de streams brut, qui alimente le `RoyaltyStatement`.

### 8.2 Garde-fous de gouvernance (non négociables, contraintes C1-C8)

| Contrainte | Principe |
|---|---|
| C1 | Budget fixe : `Σ UVC_i,c = MD_c` |
| C2 | Résistance fraude : `TS_i(t) ≥ τ_fraude` pour tout événement retenu |
| C3 | Stabilité : variation des poids/ρ bornée d'un cycle à l'autre (`≤ 0.10`) — évite les à-coups de rémunération |
| C4 | Diversité culturelle : plancher de diversité imposé sur le catalogue |
| C5 | **Neutralité culturelle** : espérance d'allocation égale à CVI identique, quelle que soit la culture d'origine — condition explicite pour que le modèle serve la thèse diaspora sans biais structurel |
| C6 | Auditabilité : tout composant recalculable par un tiers depuis les logs bruts (= H0) |
| C7 | Gouvernance : tout changement de paramètres publié, justifié, archivé |
| C8 | Séparation prévision/allocation (cf. Couche 3) |

### 8.3 Statut et feuille de route (à respecter telle quelle)

Ce modèle est **gelé sur la théorie v1.4** — ce n'est pas une proposition à ajuster librement, c'est la référence figée pour la suite des travaux. Trois chantiers, dans l'ordre, non parallélisables sans perte de rigueur :
1. **Spécification** (ce document) — terminé.
2. **Simulation** — calibration empirique sur données historiques : choix de la transformation de saturation (H1), fenêtre de ré-estimation de `ρ` (H2), seuil `N_min` de détection de pic CHL (H3), forme et constante du shrinkage bayésien (H4), nombre d'échantillons Monte-Carlo pour l'approximation de Shapley (H5). Aucune valeur numérique de poids initial, de `τ_fraude` ou de plancher de diversité n'existe avant ce chantier — les fixer maintenant réintroduirait l'arbitraire que Shapley est censé éliminer.
3. **Prototype** — implémentation, y compris l'exécution de la séparation stricte prévision/allocation au niveau du schéma de données.

### 8.4 Entités canoniques

```
Entity: RoyaltySplit
 ├── rights_holder_ref, work_id
 ├── percentage, role: performer | writer | producer | label | sales_agent
 └── payout_method: fiat | JCC (cf. section 10)

Entity: CulturalValueRecord (remplace CulturalImpactScore)
 ├── work_id, cycle_id (c)
 ├── trust_score, composantes_brutes{S,E,F,C}, CHL_intégré
 ├── CVI (agrégation CES, ρ_c)
 ├── nebula_score (N, 6 axes)
 ├── VCF_corrige (post shrinkage bayésien)
 └── UVC → part de MD_c allouée à l'œuvre pour ce cycle

Entity: RoyaltyStatement
 ├── period (= cycle_id), rights_holder_ref
 ├── source: DSR (music) | Avails report (audiovisual)
 ├── cultural_value_ref → CulturalValueRecord (remplace le calcul brut standard)
 ├── gross_revenue, net_after_platform_fee
 └── frekcore_audit_ref (traçabilité, cf. section 9 — satisfait C6/C7)
```

**Fonctions requises (inchangé)** :
- Ingestion des DSR (musique) et des rapports de consommation Avails (audiovisuel) — deux formats sources, un seul moteur de calcul en sortie.
- Génération de relevés par ayant-droit, exportables et auditables via FrekCore.
- Gestion des splits multi-parties (featuring, co-écriture, co-production) — nécessaire dès le premier catalogue multi-artistes.
- Passerelle de paiement : virement fiat classique ou conversion en JCC (cf. section 10), au choix de l'ayant-droit.

**Point de vigilance — artiste IA (cf. section 4)** : le Trust Score (`TS`, composante `sig_id`) et le Nebula Score sont les deux leviers naturels pour traiter la question `ai_artist` posée en section 4 — un contenu généré sans processus de circulation culturelle organique aurait un `N` structurellement faible, et l'identité `sig_id` doit distinguer opérateur humain et système génératif. Le tranchage précis reste à faire au chantier 2 (simulation), pas ici.

---

## 9. INTÉGRATION FREKCORE

FrekCore est un **service transversal du groupe CVLN**, pas un module propre à KORA (cf. arbitrage section 2). KORA le consomme comme client.

**Périmètre étendu (mise à jour)** : FrekCore ne se limite pas à l'identité et à la preuve d'existence. Il porte aussi, en tant que capacité groupe, les **pipelines d'ingestion de contenu eux-mêmes** :
- Ingestion musique (ERN/DSR, section 6)
- Ingestion audiovisuelle (EIDR/MEC/Avails, section 7)

Logique : ces pipelines manipulent déjà des identifiants universels et génèrent une preuve d'existence à chaque œuvre reçue — c'est la même famille de responsabilité que la traçabilité, pas un sujet séparé. En les regroupant dans FrekCore, toute entité CVLN future (et tout partenaire externe, cf. LabelOS section 22) peut envoyer du contenu vers l'écosystème CVLN sans que chaque destinataire (KORA, une autre app média future) ne réimplémente sa propre logique DDEX/EIDR. KORA devient un simple **abonné** aux flux `Work` que FrekCore valide et signe.

**LabelOS est optionnel — précision structurante.** LabelOS est un produit optionnel de l'écosystème CVLN. Il fournit des fonctionnalités avancées de gestion de catalogue, de droits et de distribution multi-DSP (cf. section 22). Son utilisation n'est **jamais requise** pour publier sur KORA ou consommer les services de FrekCore. Tout acteur compatible avec les standards d'ingestion pris en charge par FrekCore — distributeur (JTV Digital, Jaiye, Wiseband), label tiers, artiste en self-serve, ou tout autre outil tiers respectant ERN/EIDR-MEC — peut alimenter KORA sans passer par LabelOS :

```
                LabelOS (optionnel)
                     │
                     ▼
Artiste ─────────► FREKCORE ◄──────── Distributeur (JTV, Wiseband, ...)
                     │
                     ▼
                   KORA
```

FrekCore reste le point d'entrée neutre et unique du contenu, quel que soit l'outil d'origine. LabelOS n'est qu'une des voies possibles vers FrekCore, pas un passage obligé — ce qui confirme le principe déjà posé : KORA reste un DSP générique, alimentable par n'importe quelle source conforme aux standards, pas un DSP exclusif à l'écosystème CVLN.

- **FREK-ID** : authentification unique, réutilisable au-delà de KORA (doctrine : adoption externe à terme).
- **Ingestion & preuve d'existence** : chaque `Work` reçu (ERN ou EIDR/MEC) est validé, signé et horodaté par FrekCore — empreinte de ~2,5 Ko/œuvre, pas stockage du fichier complet.
- **Journal des événements** : traçabilité de tout changement d'état d'un `Work` (ingestion, publication, modification de droits, retrait) — sert de base d'audit pour le Rights Engine (section 8).
- **Relation événementielle, pas un appel direct** : FrekCore publie un événement `work.validated` sur le bus (section 13) quand un `Work` est signé ; KORA s'y abonne et décide seul quand l'ingérer dans son catalogue. Symétriquement, KORA publie ses propres événements (`stream.recorded`, `work.published`, `rights.updated`) que FrekCore consomme pour tenir son journal — aucune des deux parties n'appelle l'autre en synchrone, aucune n'orchestre l'autre.
- **Conséquence pour Jacques** : le scoping technique des sections 6 et 7 doit être rattaché au périmètre FrekCore dans l'Agent Factory. LabelOS y figure comme client consommateur (au même titre que les distributeurs), pas comme périmètre de scoping de la capacité elle-même.
- **Format .fk** : FrekCore définit, versionne, valide et signe le format `.fk` (section 5), garantissant sa compatibilité et son interopérabilité avec les standards internationaux (ISRC, ISWC, EIDR, DDEX, etc.). KORA en est un consommateur/producteur, jamais le mainteneur — toute évolution du format passe par FrekCore, jamais par une implémentation KORA-spécifique.

---

## 10. INTÉGRATION WALLET CVLN / JCC

Wallet CVLN est une **API fintech transversale** (pas un système de stockage de billets) — KORA s'y connecte pour deux usages :

1. **Paiement utilisateur** : abonnement KORA payable en JCC ou en fiat classique. Taux à trancher : le doctrine JCC de référence est **1 JCC = 1,50€** pour les entités événementielles/écosystème — **[action humaine requise]** pour confirmer si ce taux s'applique tel quel à KORA ou si un taux spécifique est nécessaire (cf. distinction déjà actée pour CVLN Academy à 1 JCC = 1€ en Phase 1). Décision financière/stratégique, non délégable à Agent Factory.
2. **Paiement ayant-droit** : les relevés de royalties (section 8) peuvent être réglés en JCC, avec rollover indéfini du solde à travers l'écosystème CVLN — argument de rétention pour les artistes déjà actifs sur d'autres entités du groupe (Good Mood, CC).

**Divulgation progressive par rôle (cf. principe transversal, section 3)** : le Wallet est l'identité financière commune de l'écosystème, mais son interface ne s'expose que lorsque le rôle ou l'action de l'utilisateur le requiert.
- **Auditeur** : la couche Wallet reste entièrement invisible — paiement d'abonnement traité en arrière-plan, aucune UI bancaire dans l'expérience d'écoute.
- **Créateur** : KORA révèle progressivement les fonctions pertinentes (suivi de royalties, choix fiat/JCC, historique de paiement) à mesure qu'il en a l'usage — jamais l'intégralité du Wallet d'un coup.
- **Administrateur/partenaire (LabelOS)** : accès complet aux fonctions de reporting et de règlement, cohérent avec le rôle `LABEL_ADMIN`/`FINANCE_RESTRICT` déjà défini côté LabelOS (section 22).

**Ce que KORA ne doit pas faire** : réimplémenter une logique de wallet ou de token en interne — toute la couche monétaire passe par l'API Wallet CVLN.

---

## 11. INTÉGRATION LAURENTIA

Assistant conversationnel front-facing, positionné comme couche d'interaction naturelle au-dessus du catalogue et de la recommandation :

- **Recherche naturelle** : requêtes en langage libre ("trouve-moi du zouk des années 90" / "montre-moi les nouveautés diaspora ce mois-ci") traduites en requêtes structurées sur le modèle `Work`.
- **Recommandation conversationnelle** : complète (ne remplace pas) le moteur de recommandation algorithmique du module 9.
- **Aide utilisateur** : support de premier niveau (abonnement, lecture hors ligne, résolution de problèmes courants).
- **Position architecturale** : Laurentia consomme les mêmes APIs que le frontend (section 13) — elle n'a pas d'accès privilégié aux données, ce qui garantit que toute évolution du catalogue lui est immédiatement disponible sans développement spécifique.

---

## 12. INTÉGRATION CVLN AGENT FACTORY

**Principe d'abstraction (mise à jour)** : KORA ne dépend pas des agents eux-mêmes. KORA consomme des **Capabilities** exposées via API par CVLN Agent Factory — pas des catégories d'agents nommées. Les implémentations concrètes (quels agents, quels workflows, quelles orchestrations derrière une capability) relèvent exclusivement d'Agent Factory et peuvent évoluer, être refactorées ou réassignées sans le moindre impact sur le code KORA, tant que le contrat de la capability (entrée/sortie) reste stable.

**Capabilities consommées par KORA** (le nom de la capability est stable, son implémentation ne l'est pas) :
- `content.recommendation` — alimente le module 9 (Recommandation).
- `content.moderation` — alimente le module 13 (Administration).
- `metadata.generation` — génération assistée des fiches MEC/ERN (sections 6-7).
- `fraud.detection` — détection d'anomalies sur les écoutes, alimente le Rights Engine (section 8).
- `partner.relations` — support aux échanges avec distributeurs/sales agents.
- `campaign.orchestration` — lancement et promotion éditoriale (module 11).

**Rappel doctrine** : aucune affectation d'agent à une fonction précise sans **action humaine explicite** ou processus dédié géré par Agent Factory lui-même — cette liste décrit des capabilities côté contrat KORA↔Agent Factory, pas une allocation d'agents. Le mapping capability → agents/catégories reste un sujet interne à Agent Factory, hors du périmètre de ce document.

---

## 13. API GATEWAY / EVENT BUS / SERVICE MESH

- **API Gateway** : point d'entrée unique pour le frontend web/mobile et les partenaires externes (distributeurs musique, sales agents cinéma) — authentification, rate limiting, versioning.
- **Event Bus** : déjà existant côté Agent Factory (Entity Registry, ADL Editor, Event Bus, Audit, Supervision). **KORA n'orchestre pas les services transversaux de l'écosystème** — il publie des événements métier (nouvelle sortie, nouveau stream, changement de droits) sur ce bus. Les autres services (FrekCore, Wallet CVLN, Agent Factory, Laurentia, et tout composant futur) consomment ces événements selon leurs propres responsabilités, chacun décidant s'il traite un événement immédiatement, de manière différée, ou après agrégation. Ce découplage garantit qu'un nouveau service peut s'ajouter à l'écosystème sans modifier KORA.
- **Ce que le bus n'est pas** : ce n'est pas un moteur de calcul temps réel. C'est un système de diffusion d'événements — la logique de traitement reste entièrement du côté de chaque service consommateur, jamais dans le bus lui-même.
- **Service Mesh** : communication interne entre modules (ex. Rights Engine ↔ Wallet CVLN ↔ FrekCore) avec observabilité et retry automatique — reste distinct du bus d'événements métier, sert la mécanique interne, pas la sémantique métier.

---

## 14. CYCLE DE VIE, TAXONOMIE D'ÉVÉNEMENTS & CONTRATS D'API

**Pourquoi cette couche manquait** : les sections précédentes définissent les entités (section 4), les services (8-11) et le mécanisme de transport (section 13), mais rien ne fixait encore, de façon opposable à tous les services, ce qu'un `Work` traverse comme états, comment un événement s'appelle, et quelle forme prend un contrat d'API entre deux services. Sans cette couche, chaque service (FrekCore, LabelOS, KORA, Wallet, Agent Factory, Laurentia) risque d'inventer sa propre convention — ce qui recrée du couplage fort malgré le bus d'événements. Cette section est donc la référence commune, à respecter par tout composant présent ou futur de l'écosystème.

### 14.1 Cycle de vie des objets métier

**Work**
```
draft → ingested → validated → published → (updated) → retired
```
- `draft` : création côté source (LabelOS, upload self-serve, autre outil) avant envoi.
- `ingested` : reçu par FrekCore (ERN ou EIDR/MEC), pas encore validé.
- `validated` : signé par FrekCore, preuve d'existence générée.
- `published` : disponible sur au moins un DSP consommateur (KORA ou autre).
- `updated` : changement de métadonnées ou de droits post-publication — ne repart pas de `draft`, reste `published` avec un sous-état `dirty` tant que la mise à jour n'est pas propagée.
- `retired` : retiré (fin de licence, demande de l'ayant-droit, litige).

**Stream**
```
recorded → validated → aggregated → reported
```
- `recorded` : événement d'écoute/visionnage brut, horodaté.
- `validated` : passé par la détection de fraude (capability `fraud.detection`, section 12).
- `aggregated` : compilé par période (jour/mois) pour un `work_id` donné.
- `reported` : intégré à un DSR (musique) ou rapport de consommation Avails (audiovisuel) sortant.

**Royalty**
```
accrued → calculated → statemented → paid → reconciled
```
- `accrued` : droit généré par un `Stream` agrégé.
- `calculated` : passé par le Rights Engine (section 8) — allocation `UVC` via le CVE (Cultural Value Engine), puis application des `RoyaltySplit` par ayant-droit.
- `statemented` : intégré à un `RoyaltyStatement` daté, visible côté dashboard ayant-droit.
- `paid` : règlement initié (fiat ou JCC, section 10).
- `reconciled` : rapprochement confirmé entre le paiement émis et le relevé — état final de clôture comptable.

**Paiement**
```
initiated → processing → completed | failed → reconciled
```
- Suit un cycle classique de transaction, avec `failed` bouclant vers un nouvel `initiated` en cas de nouvelle tentative, jamais de modification en place d'une transaction déjà `completed`.

### 14.2 Taxonomie officielle des événements

Convention obligatoire : `domaine.entité.action`, à l'infinitif passé, un seul verbe par événement, aucune abréviation.

| Domaine | Événements canoniques |
|---|---|
| `work` | `work.ingested`, `work.validated`, `work.published`, `work.updated`, `work.retired` |
| `stream` | `stream.recorded`, `stream.validated`, `stream.aggregated`, `stream.reported` |
| `royalty` | `royalty.accrued`, `royalty.calculated`, `royalty.statemented`, `royalty.paid`, `royalty.reconciled` |
| `payment` | `payment.initiated`, `payment.completed`, `payment.failed`, `payment.reconciled` |
| `rights` | `rights.updated`, `rights.disputed` |
| `user` | `user.registered`, `user.role_changed` |

**Règles non négociables** :
1. Un événement ne décrit jamais une intention future (`work.will_publish` interdit) — uniquement un fait déjà survenu, au passé.
2. Un événement porte toujours `work_id`/`stream_id`/etc. + `occurred_at` (horodatage d'origine, distinct de l'horodatage de traitement par le consommateur) + `source_service`.
3. Aucun service ne republie un événement reçu sous un autre nom — s'il produit un effet métier nouveau, c'est un nouvel événement de son propre domaine (ex. FrekCore reçoit `work.ingested` d'une source externe, produit `work.validated` en retour — jamais un `work.ingested` dupliqué).

### 14.3 Contrats d'API de haut niveau

- **Versionnement obligatoire** dès le premier contrat (`/v1/...`) — aucun service de l'écosystème n'expose d'endpoint non versionné, y compris en interne.
- **Idempotence** : toute action de création (ingestion, paiement) accepte une clé d'idempotence — nécessaire vu le volume d'intégrations tierces (distributeurs, sales agents, DSP externes via LabelOS).
- **Rétrocompatibilité** : un contrat `v1` reste actif tant qu'un consommateur connu l'utilise ; dépréciation annoncée avec fenêtre de transition, jamais de rupture silencieuse — condition explicite pour que « KORA consomme des Capabilities sans dépendre des agents » (section 12) reste vraie dans la durée.
- **Forme du contrat** : chaque capability/service expose un schéma explicite (OpenAPI ou équivalent) versionné dans un registre central — à héberger côté Agent Factory (Entity Registry existant) plutôt que dispersé service par service.
- **Séparation lecture/écriture** : les capabilities de lecture (recommandation, recherche) et d'écriture (ingestion, paiement) suivent des règles de contrat différentes — les premières tolèrent une évolution plus souple, les secondes non, vu leur impact sur le cycle de vie (section 14.1).

---

## 15. SÉCURITÉ

- **Authentification** : déléguée à FREK-ID (pas de système de mots de passe propriétaire à KORA).
- **Protection des masters** : chiffrement au repos et en transit pour les fichiers audio/vidéo haute qualité, en particulier pour les contenus audiovisuels sous embargo territorial (fenêtres Avails, section 7).
- **DRM** : à évaluer pour le contenu premium (films/séries sous licence) — les studios/sales agents exigent généralement un niveau de protection contractuel (Widevine/FairPlay ou équivalent) avant d'accepter une diffusion.
- **Conformité territoriale** : géo-blocage aligné sur les données Avails, audit régulier de cohérence entre `territory_availability` et diffusion réelle.
- **Anti-fraude streams** : détection de faux streams (bot farms), critique pour la crédibilité des DSR renvoyés aux distributeurs et pour la fiabilité des royalties.

---

## 16. INFRASTRUCTURE

- **CDN** : diffusion mondiale à faible latence, priorité sur les zones diaspora (Caraïbes, Afrique francophone, Europe, Amérique du Nord).
- **Streaming** : adaptive bitrate pour audio et vidéo.
- **Transcodage** : pipeline automatisé à l'ingestion (masters → formats de diffusion multiples), lié au module Publication (section 3, module 6) et à la stack IMF (section 7).
- **Stockage** : séparation masters (haute qualité, coût élevé, accès rare) / variantes de diffusion (accès fréquent, CDN edge).
- **Monitoring** : santé technique + qualité d'expérience (temps de démarrage lecture, taux de buffering).
- **Sécurité infra** : cf. section 15.

---

## 17. FRONTEND WEB

- Basé sur le stack déjà utilisé côté Agent Factory (React 19/Next.js) pour cohérence technique groupe.
- Modules prioritaires phase 1 : Fondation, Catalogue, Lecteur, Bibliothèque, Recherche, Éditorial.
- Design déjà engagé (univers noir/or "Beyond Sound. Beyond Time.") — à conserver comme identité de marque premium diaspora, cohérente avec le positionnement infrastructure/qualité plutôt que volume.

---

## 18. FRONTEND MOBILE

- Version déjà en cours de build (prévisualisée via Emergent/Expo).
- Parité fonctionnelle progressive avec le web, priorité à la lecture offline (module 3) et aux notifications push (module 12) — usages mobiles dominants pour l'écoute musicale en mobilité.
- Point de vigilance déjà identifié : le contenu affiché doit provenir du vrai catalogue (via stacks sections 6-7) avant toute présentation externe — les placeholders génériques ("KORA Collective", photos stock) doivent disparaître avant démonstration à un partenaire ou investisseur.

---

## 19. BACK-OFFICE ADMINISTRATION

- **Modération** : contenu utilisateur (commentaires, profils publics).
- **Gestion catalogue** : deux files distinctes — validation musique (erreurs ERN) et validation audiovisuel (dossiers EIDR/Avails), cf. arbitrage section 2.
- **Validation artistes/labels** : onboarding, vérification d'identité liée à FREK-ID.
- **Signalements** : DMCA/droits d'auteur, contenu inapproprié.

---

## 20. KORA FOR CREATORS

Le document doit refléter la réalité du produit, pas rester au niveau d'un simple dashboard interne. **KORA for Creators est la plateforme professionnelle** permettant aux artistes, créateurs, producteurs, labels et studios de publier, gérer et analyser leurs contenus sur KORA — suivant le même principe que les espaces créateurs proposés par les principaux DSP internationaux, tout en étant conçu dès l'origine pour prendre en charge musique, audiovisuel et futurs formats culturels.

**Modules** :
- Dashboard
- Analytics (statistiques temps réel, module 8 de la section 3)
- Royalties (Rights Engine, section 8 — y compris relevés `RoyaltyStatement` détaillés par territoire pour le contenu audiovisuel)
- Wallet (section 10, divulgation progressive selon le rôle créateur)
- Upload (module 6, publication self-serve)
- Releases (gestion des sorties, `Release` — section 4)
- Playlists éditoriales (visibilité côté créateur sur les inclusions, module 11)
- Statistiques temps réel
- Gestion d'équipe (multi-utilisateurs pour un même compte artiste/label)
- IA Laurentia (section 11, assistance créateur)
- Publication (programmation de sorties)
- Gestion des droits (`RoyaltySplit`, `RightsHolder` — section 4)
- Vérification FREK-ID (section 9)
- Notifications (module 12)

**Choix du mode de paiement** : fiat ou JCC (section 10), au choix de l'ayant-droit.

---

## 21. KORA FOR DEVELOPERS

Plateforme destinée aux développeurs souhaitant construire des applications, intégrations et services sur l'infrastructure KORA et l'écosystème CVLN — le point d'entrée technique officiel, distinct de l'usage grand public (KORA) et de l'usage professionnel créateur (KORA for Creators, section 20).

**Documentation**
- REST, GraphQL, SDK (cohérent avec les standards API publiques, section 26)

**APIs exposées**
- Catalogue
- Recherche
- Streaming
- Analytics
- Royalties
- Wallet
- FrekCore
- Laurentia

**Event Bus**
- Webhooks
- Event Streams (cf. taxonomie d'événements, section 14.2)

**Outils**
- Sandbox
- Playground
- Monitoring
- Gestion des clés API (cf. sécurité avancée, section 32)
- Marketplace

**Bibliothèque FK** (section 5)
- Lecture
- Écriture
- Validation
- Signature
- Conversion

**Modèle économique** — toutes les APIs ne sont pas gratuites :

| Tier | Positionnement |
|---|---|
| Free | Découverte, sandbox, quotas limités |
| Developer | Intégration en développement, quotas étendus |
| Professional | Production, SLA de base, support standard |
| Enterprise | Volume élevé, SLA renforcé, accompagnement dédié |

Cohérent avec les scopes/quotas déjà posés en section 26 — KORA for Developers est l'interface qui expose ce modèle économique, pas une couche parallèle.

---

## 22. LABELOS — CLIENT DE KORA FOR DEVELOPERS

**Repositionnement structurant** : depuis que KORA for Developers (section 21) existe comme plateforme officielle, LabelOS n'est plus une brique centrale de l'écosystème — c'est **un client parmi d'autres** de la capacité FrekCore, exposée via KORA for Developers. Le centre devient la plateforme, pas LabelOS.

```
KORA for Developers
        ↓
     utilise
        ↓
    FrekCore API
        ↓
┌───────┼────────────────────────────┐
LabelOS  KORA  Applications tierces  Studios  Universités  Musées
```

**Fonctions de base (dashboard interne KORA, hérité)** :
- Vue consolidée multi-artistes (par opposition au dashboard artiste individuel de KORA for Creators, section 20).
- Gestion des droits et splits à l'échelle du label (RightsHolder de type `label`, section 4).
- Reporting agrégé pour négociation avec distributeurs/sales agents.
- Accès à la programmation de sorties sur plusieurs artistes simultanément.

**LabelOS comme produit B2B autonome**

Un simple "dashboard label" enfermerait la valeur dans KORA. LabelOS conçu comme produit B2B autonome — utilisable par un label **sans obligation d'être diffusé sur KORA** — change la nature de la brique :

- **Ce que ça devient** : un système de gestion de catalogue/droits pour labels indépendants, qui utilise la capacité d'ingestion FrekCore (section 9, exposée via KORA for Developers) comme moteur de distribution multi-DSP — pas seulement vers KORA, mais vers Spotify, Apple Music, Deezer, Boomplay, etc., puisque le pipeline ERN de FrekCore est DDEX-standard et donc nativement compatible avec n'importe quel DSP mondial une fois connecté aux mêmes distributeurs/agrégateurs (JTV Digital, Jaiye, Wiseband).
- **Pourquoi c'est stratégiquement fort** (cadre "groupe mondial") : ça positionne CVLN non plus comme un DSP de plus qui espère qu'on lui envoie du catalogue, mais comme une **infrastructure B2B** que des labels adoptent pour leur propre gestion — modèle proche de TuneCore/DistroKid/Believe côté outillage, avec un ancrage diaspora/Afrique-Caraïbes que ces acteurs n'ont pas nativement. Actif IP et flux de revenus indépendants du succès d'audience de KORA elle-même — réduit le risque du pari KORA plutôt que de l'alourdir.
- **Position dans le groupe** : LabelOS devient candidat naturel à une existence propre — potentiellement sa propre ligne dans le pôle Tech & Data, au même titre que l'Agent Factory est une brique transversale. **[action humaine requise]** : entité propre ou sous-produit de FMS EURL au démarrage, avant scission éventuelle si la traction le justifie.
- **Séquencement réaliste** : LabelOS ne doit pas être un chantier Phase 1 (cf. section 34) — c'est un produit qui a besoin que le pipeline FrekCore (sections 6-7-9) soit déjà stable et éprouvé sur KORA avant d'être ouvert à des labels tiers. Le proposer trop tôt disperserait l'effort de développement au moment où KORA a justement besoin de preuve de marché.
- **Autres clients potentiels de la même capability** (cf. schéma) : au-delà de LabelOS, la capacité FrekCore exposée via KORA for Developers ouvre la porte à des usages hors industrie musicale/audiovisuelle classique — studios de production, universités (archivage académique de fonds culturels), musées (provenance et authentification d'œuvres numériques). Ces cas d'usage restent volontairement hors périmètre de développement actuel, mais l'architecture ne les exclut pas.

**Modèle de données additionnel requis** :
```
Entity: LabelAccount
 ├── label_id, rights_holder_ref
 ├── connected_dsps[] : "kora" | "spotify" | "apple_music" | "deezer" | "boomplay" | ...
 ├── delivery_status_per_dsp{} (via pipeline FrekCore ERN, section 6)
 └── consolidated_royalty_view → agrège les RoyaltyStatement (section 8) tous DSP confondus, pas seulement KORA
```
C'est la vraie différence avec un simple dashboard : `connected_dsps[]` n'est pas limité à `"kora"`.

---

## 23. ARCHITECTURE PHYSIQUE (DÉPLOIEMENT)

Ce que les sections précédentes décrivent en responsabilités doit maintenant être formalisé en déploiement réel.

```
        Mobile · Web · TV
                │
          API Gateway (section 27)
                │
──────────────────────────────────────────
 Catalog Service      (module 2, section 4)
 Player Service       (module 3)
 Rights Service        (Rights Engine, section 8)
 Search Service        (module 5)
 Recommendation Service (module 9, alimentée par Data Platform, section 29)
 Social Service        (module 10)
 Notification Service  (module 12)
 Admin Service          (module 13)
──────────────────────────────────────────
                │
           Event Bus (Kafka, section 13/28)
                │
──────────────────────────────────────────
 FrekCore   ·   Wallet CVLN   ·   Laurentia   ·   Agent Factory
──────────────────────────────────────────
```

**Règles de communication** :
- **Client → services métier** : uniquement via l'API Gateway, jamais d'appel direct à un service interne.
- **Service métier → service métier** : jamais d'appel synchrone direct entre deux services métier du même niveau (ex. Catalog Service n'appelle pas Rights Service directement) — passage par événement (section 13/14) sauf lecture de référence ponctuelle via API interne versionnée.
- **Services métier → couche transversale** : chaque service métier consomme FrekCore/Wallet/Laurentia/Agent Factory comme des Capabilities externes (cf. principe section 12), jamais en dépendance de code partagée.
- **Chaque service métier possède sa propre base de données** (section 24) — pas de base partagée entre Catalog Service et Rights Service, même si les deux référencent le même `work_id`.

---

## 24. PERSISTANCE DES DONNÉES

Chaque type de donnée reçoit une destination officielle, pour éviter que Jacques ne tranche seul au fil du développement :

| Type de donnée | Destination | Justification |
|---|---|---|
| Catalogue (`Work`, `Release`, `RightsHolder`, splits) | **PostgreSQL** | Intégrité relationnelle requise (clés étrangères, transactions sur les splits de droits) |
| Recherche (catalogue indexé, facettes) | **Elasticsearch/OpenSearch** | Recherche full-text et facettée, module 5 |
| Cache (sessions, catalogue chaud, résultats recommandation) | **Redis** | Déjà en place côté LabelOS (Upstash Redis) — réutiliser le même choix pour cohérence groupe |
| Masters et assets audio/vidéo | **Object Storage** (Cloudflare R2, déjà utilisé côté LabelOS) | Cohérence avec l'existant, coût adapté au volume de fichiers lourds |
| Logs applicatifs à fort volume | **ClickHouse** | Optimisé pour l'écriture/lecture analytique haute fréquence |
| Analytics/BI (statistiques module 8, dashboards) | **Data Warehouse** (BigQuery ou équivalent) | Agrégations lourdes, requêtes multi-dimensionnelles |
| Embeddings (recherche sémantique, recommandation, Laurentia) | **Vector DB** (pgvector en démarrage, migration vers solution dédiée si volume le justifie) | Nécessaire pour la recherche naturelle (module 5/section 11) et la recommandation (module 9) |
| Flux d'événements métier | **Kafka** | Persistance et rejouabilité du bus d'événements (section 13), socle de la Data Platform (section 29) |
| Preuve d'existence / journal FrekCore | **Store append-only dédié**, distinct de PostgreSQL | Exigence d'immuabilité et d'auditabilité (contrainte C6/C7, section 8.2) — un store mutable ne satisfait pas cette exigence |

**Règle de base** : une base de données par service métier (section 23) — aucun service ne lit directement dans la base d'un autre, l'accès passe par l'API du service propriétaire.

---

## 25. MULTI-RÉGION

**Régions cibles** : Europe (siège Londres), Afrique francophone, Caraïbes, Amérique du Nord (USA) — correspond directement au marché diaspora visé par la thèse KORA (section 1). S'y ajoutent, en expansion territoriale : **Amérique latine** (diaspora afro-descendante hors monde francophone, marché musical propre en forte croissance), **Asie de l'Est** et **Inde** (marchés à volume massif, pertinents pour KORA moins comme cœur de thèse diaspora que comme relais de croissance et de partenariats DSP/distributeurs, cf. section 26).

- **Priorisation** : les 4 régions historiques restent prioritaires en déploiement (Phase 2-3, section 34) ; Amérique latine, Asie de l'Est et Inde relèvent d'une phase d'expansion ultérieure, à ne pas mélanger dans le séquencement avec le socle diaspora fondateur — **[action humaine requise]** pour fixer le déclencheur d'ouverture de ces marchés (traction organique constatée vs décision d'expansion planifiée).

- **Réplication des données** : catalogue en lecture répliqué activement dans chaque région (latence de lecture minimisée), écriture centralisée par région d'origine du contenu avec synchronisation asynchrone vers les autres régions.
- **CDN** : présence edge dans les 4 régions historiques dès le socle (déjà posé en section 16, précisé ici territorialement), extension vers Amérique latine/Asie de l'Est/Inde au rythme de l'ouverture de ces marchés — priorité de déploiement initial Caraïbes/Afrique francophone, zones structurellement sous-desservies par les CDN génériques.
- **Haute disponibilité** : bascule automatique région à région en cas d'incident, avec health checks continus sur chaque service métier (section 23).
- **Failover** : cibles RTO (temps de reprise) et RPO (perte de données maximale tolérée) à définir par service selon criticité — un incident sur Player Service n'a pas la même tolérance qu'un incident sur Rights Service.
- **Lien direct avec la stack audiovisuelle (section 7)** : le windowing Avails est déjà nativement multi-territoire — l'architecture multi-région doit garantir qu'un `Avail` bloqué dans un territoire ne fuite jamais vers une autre région par erreur de routage.

---

## 26. API PUBLIQUES — STANDARDS

- **Authentification** : OAuth2 (authorization code pour intégrations utilisateur, client credentials pour intégrations serveur-à-serveur type distributeurs) + API Keys pour les partenaires à faible complexité d'intégration.
- **Scopes** : granulaires par capability (`read:catalog`, `write:release`, `read:royalties`, `read:avails`...) — jamais de scope générique "admin" délivré à un partenaire externe.
- **Quotas** : par tier partenaire (distributeur volumineux vs label indépendant self-serve), alignés sur le rate limiting distribué (section 33).
- **Versionnement** : REST versionné `/v1/` en base (cf. section 14.3) ; évaluation d'une couche GraphQL en complément pour les requêtes agrégées complexes (dashboards labels/artistes, sections 20/22) — pas en remplacement du REST, en complément ciblé.
- **SDK officiels** : JS/TS et Python en priorité (profils techniques dominants côté distributeurs et labels tech-savvy), autres langages sur demande partenaire avérée.

---

## 27. OBSERVABILITÉ

Le monitoring seul (section 16) ne suffit pas à l'échelle visée. Trois piliers standards :

- **Logs** : structurés, centralisés (ClickHouse, section 24), corrélés par `request_id` traversant tous les services.
- **Traces distribuées** : format standard (type OpenTelemetry) pour suivre une requête à travers API Gateway → service métier → couche transversale (section 23) — indispensable dès que l'architecture orientée événements (section 13) introduit de l'asynchrone.
- **Metrics** : techniques (latence, taux d'erreur, saturation) et business (les mêmes événements métier de la section 14 alimentent aussi des metrics business, pas seulement l'observabilité technique).
- **Alerting basé sur SLO**, pas sur des seuils bruts arbitraires.
- **SLO/SLA/Error Budget** : à définir service par service — un incident sur Player Service (expérience utilisateur immédiate) n'a pas le même budget d'erreur tolérable qu'un incident sur Rights Service (peut tolérer un délai de traitement différé sans casser l'expérience, cf. cycle de vie asynchrone `royalty.accrued → calculated`, section 14.1).

---

## 28. DATA PLATFORM

Le CVE (section 8) ne doit pas apparaître comme un calcul isolé et "magique" — il repose sur une plateforme data explicite :

```
Events (section 14)
    ↓
Kafka (section 24)
    ↓
Data Lake (brut, toutes régions, section 25)
    ↓
Data Warehouse (structuré, agrégé — BigQuery ou équivalent, section 24)
    ↓
Feature Store (features réutilisables : composantes CVE, signaux recommandation)
    ↓
Machine Learning (modèles de recommandation, prévision Couche 3 du CVE — section 8.1)
    ↓
CVE (Couches 1-2-4, section 8) + Recommendation Service (module 9)
```

**Conséquence directe** : les composantes brutes du CVE (`S`, `E`, `F`, `C`) et le Nebula Score (`N`, section 8.1) ne sont pas calculés ad hoc dans le Rights Service — ils sont produits par cette plateforme data en amont, puis consommés par le CVE comme des features déjà matérialisées. Ça garantit la recalculabilité par un tiers exigée par l'hypothèse H0 (contrainte C6).

---

## 29. IA — GOUVERNANCE DES MODÈLES

Laurentia (section 11) et les Capabilities Agent Factory (section 12) sont définies fonctionnellement, mais pas encore gouvernées techniquement. À trancher avec Jacques avant mise en production, pas à la légère :

- **Choix des modèles** : critères de sélection à figer (coût, latence, capacité multilingue — pertinent vu le public diaspora — capacité de function calling) plutôt qu'un fournisseur figé dans ce document, pour ne pas geler une dépendance technologique dans un document destiné à durer.
- **Versionnement** : registre de modèles, chaque réponse produite en production traçable jusqu'à une version de modèle précise — nécessaire pour l'auditabilité (cohérent avec C6/C7, section 8.2).
- **Évaluation des réponses** : jeu de requêtes de référence ("golden set"), scoring combiné humain + automatique, avant toute mise à jour de modèle en production.
- **Prévention des hallucinations** : grounding obligatoire sur les données réelles de FrekCore/Catalogue (architecture RAG) pour toute réponse factuelle sur le catalogue — Laurentia ne doit jamais répondre sur un fait catalogue sans source vérifiable.
- **Accès aux données** : principe de moindre privilège — quelles capabilities et quelles tables un modèle peut consulter, explicitement listées, jamais un accès large par défaut (lien direct avec IAM, section 33).

---

## 30. GOUVERNANCE (ARCHITECTURE)

Le CVE a déjà sa propre gouvernance formelle (section 8.2, contraintes C1-C8). Il manque l'équivalent au niveau de l'architecture globale :

- **RFC** : tout changement structurant (nouveau service métier, changement de destination de persistance section 24, nouvelle région section 25) passe par une RFC écrite avant implémentation.
- **ADR (Architecture Decision Record)** : chaque décision d'architecture actée dans ce document — et toute décision future qui le complète — doit être archivée avec son contexte et les alternatives écartées, pas seulement le résultat final.
- **Versionnement des spécifications** : ce Master Prompt et la spécification CVE suivent un versionnement explicite (type semver) — un changement mineur ne casse pas la compatibilité des intégrations existantes, un changement majeur est annoncé avec fenêtre de transition (cohérent avec la politique de dépréciation API, section 14.3/24).
- **Comité d'architecture** : instance de validation pour les RFC/ADR structurants — **[action humaine requise]** : composition (a minima portage stratégique humain + Jacques côté technique), fréquence, seuil de décision nécessitant passage en comité vs décision d'équipe.
- **Politique de dépréciation** : annoncée, avec fenêtre de transition minimale, jamais de rupture silencieuse — déjà posé pour les contrats d'API (section 14.3), à généraliser à toute capability de l'écosystème.

---

## 31. RÉSILIENCE

Section absente jusqu'ici, nécessaire dès que l'architecture devient distribuée (section 23) :

- **Retry** : avec backoff exponentiel, borné (pas de retry infini), sur tout appel inter-service.
- **Circuit breaker** : par dépendance externe et inter-service — évite qu'une panne d'un service (ex. Wallet CVLN indisponible) ne cascade et bloque tout achat/écoute côté KORA.
- **Timeout explicite** : sur chaque appel synchrone (API Gateway, appels inter-services de référence) — jamais d'attente indéfinie.
- **Dead Letter Queue** : pour tout événement du bus (section 13/14) qui échoue au traitement après le nombre de tentatives autorisé — évite la perte silencieuse d'un événement métier critique (ex. `royalty.calculated` qui échouerait chez un consommateur).
- **Compensation (pattern saga)** : pour toute transaction distribuée multi-service (ex. paiement Wallet + mise à jour `RoyaltyStatement`) — si une étape échoue après qu'une autre a réussi, une action de compensation explicite annule/corrige plutôt que de laisser un état incohérent.
- **Disaster Recovery** : cibles RTO/RPO par service (cf. section 25), plan de bascule documenté et testé régulièrement, pas seulement écrit.
- **Sauvegardes** : fréquence et rétention définies par type de donnée (section 24), avec test de restauration périodique obligatoire — une sauvegarde jamais restaurée en test n'est pas une garantie.

---

## 32. SÉCURITÉ AVANCÉE

Vient compléter la section 15 (sécurité de base) pour les standards attendus d'une plateforme mondiale :

- **Zero Trust** : aucune confiance implicite, y compris entre services internes — chaque appel inter-service est authentifié et autorisé, pas seulement les appels externes.
- **Secret Management** : coffre-fort dédié (type Vault), aucun secret en clair dans le code ou les variables d'environnement en clair non chiffrées — point de vigilance direct vu que l'inventaire LabelOS actuel montre des clés API en configuration classique, à faire évoluer.
- **Rotation des clés** : automatisée, sans interruption de service, sur un calendrier défini.
- **IAM** : identités machine-à-machine (services entre eux) explicitement distinctes des identités utilisateur FREK-ID (section 9) — jamais de confusion entre les deux espaces d'identité.
- **RBAC** : à étendre au niveau de tout l'écosystème le modèle déjà existant côté LabelOS (`SYSTEM_ADMIN`/`LABEL_ADMIN`/`OPS_MANAGER`/`ARTIST_USER`/`FINANCE_RESTRICT`/`PARTNER_VIEW`) plutôt que d'en recréer un autre pour KORA — cohérence RBAC groupe.
- **Audit Trail** : consolidé avec le journal des événements FrekCore (section 9) — pas un système d'audit parallèle.
- **WAF** : en amont de l'API Gateway (section 23/26).
- **Protection DDoS** : au niveau CDN/edge (section 16/27), avant même l'API Gateway.
- **Rate limiting distribué** : cohérent avec les quotas API publiques (section 26), appliqué de façon homogène sur toutes les régions (section 25), pas région par région de façon isolée.

---

## 33. ÉVALUATION DU DOCUMENT (état au moment du gel)

Évaluation reçue, selon les standards d'architecture d'une grande plateforme, avant intégration des sections 23-32 ci-dessus :

| Domaine | Évaluation |
|---|---|
| Vision | 10/10 |
| Cohérence globale | 9.8/10 |
| Découplage | 10/10 |
| Modèle de données | 9.8/10 |
| Scalabilité | 9.6/10 |
| Gouvernance | 9.5/10 |
| API | 9.5/10 |
| Data Platform | 8.5/10 |
| Infrastructure Cloud | 8.5/10 |
| Observabilité | 8.5/10 |
| Résilience | 8.5/10 |
| Sécurité | 9.0/10 |

**Évaluation globale reçue : 9,4/10.** L'écart identifié portait sur l'ingénierie opérationnelle (architecture cloud, data platform, observabilité, résilience, exploitation) plutôt que sur la vision — c'est précisément ce que couvrent les sections 23 à 32 ajoutées ci-dessus. Cette table est conservée comme repère historique de l'état du document avant cette consolidation, pas comme note définitive.

---

## 34. ROADMAP DE DÉVELOPPEMENT (Phase 1 → Phase 4)

**Phase 1 — Fondation & preuve de catalogue**
- Modules 1 (Fondation), 2 (Catalogue musical), 3 (Lecteur), 4 (Bibliothèque), 5 (Recherche), 11 (Éditorial minimal).
- Modèle de données `Work`/`Asset`/`Release`/`RightsHolder` (section 4) posé dès le départ, y compris les champs audiovisuels même si non actifs.
- Intégration FREK-ID (authentification) — connexion à FrekCore, pas de réimplémentation.
- Enregistrement EIDR de SAYD/C'est Nous L'Avenir (action immédiate, indépendante du développement logiciel).

**Phase 2 — Ingestion musique & monétisation**
- Stack DDEX complète (section 6) : ERN, DSR, intégration JTV Digital / Jaiye / Wiseband.
- Module 7 (Monétisation) avec intégration Wallet CVLN/JCC (section 10).
- Module 6 (Publication artistes) en self-serve.
- Rights Engine v1 (section 8) limité à la musique, **calcul brut le temps du CVE chantier 2** — le comptage DSR classique sert de fallback tant que la simulation (calibration des hypothèses H1-H5, section 8.3) n'a pas produit de valeurs numériques exploitables.
- **CVE chantier 2 (simulation)** démarre en parallèle sur les données réelles générées par cette phase — condition pour disposer d'un historique à calibrer.

**Phase 3 — Audiovisuel & intelligence**
- Stack EIDR/MEC/Avails (section 7), module 18 scindé en deux sous-catalogues.
- Rights Engine v2 étendu à l'audiovisuel (multi-territoire, windowing) **et bascule effective sur le CVE** (allocation `UVC`, section 8.1) une fois le chantier 2 calibré et le chantier 3 (prototype, y compris séparation stricte prévision/allocation, contrainte C8) livré.
- Module 9 (Recommandation IA) et intégration Laurentia (section 11).
- Sécurité DRM pour contenu premium (section 15).

**Phase 4 — Écosystème & scale**
- Module 14 (API & écosystème) ouvert aux partenaires externes, via **KORA for Developers** (section 21).
- **KORA for Creators** (section 20) et back-office complet (section 19) en version complète.
- **LabelOS** (section 22) : lancement conditionné à un pipeline FrekCore stable et éprouvé sur KORA — pas avant que la Phase 2-3 ait produit un catalogue réel et un premier historique de royalties fiable.
- Intégration Agent Factory étendue (section 12) : automatisation modération, statistiques avancées, business support distributeurs.
- Ouverture territoriale élargie (Amérique latine, Asie de l'Est, Inde — section 25), montée en charge infrastructure (section 16).

---

*Master Prompt KORA — document vivant, à faire évoluer avec Jacques au fil du scoping Agent Factory. Les points marqués [action humaine requise] ne doivent pas être tranchés par défaut — ni automatisés, ni délégués à Agent Factory sans cadre validé.*

---

## 35. LA FAMILLE KORA — VUE GLOBALE

```
KORA Platform
│
├── KORA
│   Application grand public
│
├── KORA for Creators (section 20)
│   Publication • Analytics • Royalties
│
├── KORA for Developers (section 21)
│   APIs • SDK • .fk • Sandbox
│
└── Services transversaux
    ├── FrekCore (section 9)
    ├── LabelOS (section 22)
    ├── Wallet CVLN / JCC (section 10)
    ├── Laurentia (section 11)
    ├── CVLN Agent Factory (section 12)
    └── Format .fk (section 5)
```

Tous ces produits reposent sur les mêmes services transversaux :
- **FrekCore** — identité, preuves, standards d'ingestion (ERN, EIDR/MEC/Avails, section 9).
- **LabelOS** — gestion de catalogue, distribution multi-DSP, un client parmi d'autres de FrekCore (section 22).
- **Wallet CVLN / JCC** — paiements et économie (section 10).
- **Laurentia** — assistant et intelligence conversationnelle (section 11).
- **CVLN Agent Factory** — capabilities IA (section 12).
- **Format .fk** — conteneur culturel natif (section 5).

Cette vue d'ensemble est volontairement la dernière image du document : elle donne une vision de plateforme technologique complète — un socle transversal servant plusieurs produits distincts (grand public, professionnel, développeur) — plutôt que celle d'une simple application de streaming à laquelle on aurait ajouté des fonctionnalités. C'est la lecture à conserver pour tout arbitrage futur : une nouvelle idée se juge d'abord à sa place dans ce schéma, avant de se juger à son intérêt isolé.
