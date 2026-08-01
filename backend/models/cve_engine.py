"""
KORA Cultural Value Engine (CVE) — Section 8 Master Prompt
═══════════════════════════════════════════════════════════════════════════════

Architecture à 4 couches (Section 8.1):

Couche 1 — Trust Score (TS): Filtre anti-fraude
Couche 2 — Composantes brutes: S (streams), E (engagement), F (fidélité), C (conversion)
Couche 3 — CVI (Cultural Value Index): Agrégation CES
Couche 4 — Nebula Score (N): Circulation culturelle sur 6 axes

Le CVE remplace tout modèle naïf de royalties au comptage brut de streams.
Il calcule une part proportionnelle de la masse distribuable (MD_c) selon un
indice composite de valeur culturelle, pas selon le volume d'écoute seul.

@author CVLN Group
@version 1.4.0 — Horizon 2055
"""

from enum import Enum
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime
import math


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION CVE
# ═══════════════════════════════════════════════════════════════════════════════

class CVEConfig:
    """Configuration du Cultural Value Engine"""
    
    # Seuil Trust Score minimum pour validation d'un stream
    TRUST_SCORE_THRESHOLD = 0.6  # τ_fraude
    
    # Pondérations des composantes (calibrées par cycle)
    WEIGHT_STREAMS = 0.25       # w_S
    WEIGHT_ENGAGEMENT = 0.30    # w_E
    WEIGHT_FIDELITY = 0.20      # w_F
    WEIGHT_CONVERSION = 0.25    # w_C
    
    # Paramètre CES (Constant Elasticity of Substitution)
    # ρ = 1 → somme pondérée simple
    # ρ → 0 → Cobb-Douglas
    # ρ → -∞ → Leontief (min)
    RHO_CES = 0.5
    
    # Masse distribuable par cycle (exemple)
    DISTRIBUTABLE_MASS_PER_CYCLE = 100000.0  # MD_c en €
    
    # Axes Nebula Score
    NEBULA_AXES = ['langue', 'territoire', 'diaspora', 'generation', 'style', 'collaboration']


# ═══════════════════════════════════════════════════════════════════════════════
# MODÈLES DE DONNÉES CVE (Section 8.4)
# ═══════════════════════════════════════════════════════════════════════════════

class StreamEvent(BaseModel):
    """Événement d'écoute validé"""
    event_id: str
    work_id: str
    user_id: str
    timestamp: datetime
    duration_seconds: int
    completion_rate: float  # 0-1
    user_territory: str
    user_language: str
    user_generation: str  # 'gen_z', 'millennial', 'gen_x', 'boomer'
    is_premium: bool
    source: str  # 'organic', 'playlist', 'radio', 'search'
    trust_score: float  # TS calculé pour cet événement


class WorkCVEMetrics(BaseModel):
    """Métriques CVE pour une œuvre sur un cycle"""
    work_id: str
    cycle_id: str
    
    # Composantes brutes (Couche 2)
    streams_validated: int = 0          # S
    engagement_score: float = 0.0       # E
    fidelity_score: float = 0.0         # F
    conversion_value: float = 0.0       # C (€)
    
    # Cultural Half-Life (CHL)
    cultural_half_life_days: float = 30.0  # L
    
    # Scores calculés
    trust_score_avg: float = 0.0        # TS moyen
    cvi: float = 0.0                    # Cultural Value Index
    nebula_score: float = 0.0           # N
    
    # Allocation finale
    uvc: float = 0.0                    # Unit of Value Cultural (part du MD_c)


class NebulaDistribution(BaseModel):
    """Distribution sur les 6 axes Nebula"""
    langue: Dict[str, float] = {}       # ex: {'fr': 0.4, 'en': 0.3, 'cr': 0.3}
    territoire: Dict[str, float] = {}   # ex: {'MQ': 0.3, 'FR': 0.4, 'SN': 0.3}
    diaspora: Dict[str, float] = {}     # ex: {'caribbean': 0.5, 'african': 0.3, 'european': 0.2}
    generation: Dict[str, float] = {}   # ex: {'gen_z': 0.4, 'millennial': 0.4, 'gen_x': 0.2}
    style: Dict[str, float] = {}        # ex: {'zouk': 0.5, 'afrobeats': 0.3, 'hiphop': 0.2}
    collaboration: Dict[str, float] = {} # ex: {'solo': 0.6, 'collab_2': 0.3, 'collab_3+': 0.1}


class CulturalValueRecord(BaseModel):
    """Enregistrement complet de valeur culturelle (Section 8.4)"""
    record_id: str
    work_id: str
    cycle_id: str
    calculated_at: datetime
    
    # Composantes
    metrics: WorkCVEMetrics
    nebula_distribution: NebulaDistribution
    
    # Résultat final
    final_uvc: float
    payout_status: str = 'pending'  # 'pending', 'calculated', 'approved', 'paid'


# ═══════════════════════════════════════════════════════════════════════════════
# COUCHE 1 — TRUST SCORE
# ═══════════════════════════════════════════════════════════════════════════════

class TrustScoreCalculator:
    """
    Filtre anti-fraude en amont.
    Un événement d'écoute n'est retenu que si TS ≥ τ_fraude.
    """
    
    @staticmethod
    def calculate(event: dict) -> float:
        """
        Calcule le Trust Score pour un événement d'écoute.
        
        Facteurs:
        - Durée d'écoute (completion > 30s et > 50% = plus fiable)
        - Source (organic > playlist > radio)
        - Historique utilisateur (user_age, previous_activity)
        - Patterns de comportement (pas de bot)
        """
        score = 1.0
        
        # Factor 1: Completion rate
        completion = event.get('completion_rate', 0)
        if completion < 0.3:
            score *= 0.5
        elif completion < 0.5:
            score *= 0.7
        elif completion < 0.8:
            score *= 0.9
        
        # Factor 2: Duration (minimum 30s pour compter)
        duration = event.get('duration_seconds', 0)
        if duration < 30:
            score *= 0.3
        elif duration < 60:
            score *= 0.8
        
        # Factor 3: Source quality
        source = event.get('source', 'unknown')
        source_weights = {
            'organic': 1.0,
            'search': 0.95,
            'playlist': 0.85,
            'radio': 0.8,
            'recommendation': 0.85,
            'unknown': 0.6
        }
        score *= source_weights.get(source, 0.6)
        
        # Factor 4: Premium users slightly more trusted
        if event.get('is_premium', False):
            score *= 1.1
        
        # Clamp to [0, 1]
        return min(max(score, 0.0), 1.0)
    
    @staticmethod
    def is_valid(trust_score: float) -> bool:
        """Vérifie si l'événement passe le seuil anti-fraude"""
        return trust_score >= CVEConfig.TRUST_SCORE_THRESHOLD


# ═══════════════════════════════════════════════════════════════════════════════
# COUCHE 2 — COMPOSANTES BRUTES
# ═══════════════════════════════════════════════════════════════════════════════

class ComponentsCalculator:
    """
    Calcul des composantes brutes par œuvre/cycle:
    S (streams validés), E (engagement), F (fidélité), C (conversion)
    """
    
    @staticmethod
    def calculate_streams(events: List[StreamEvent]) -> int:
        """S: Nombre de streams validés (TS ≥ τ_fraude)"""
        return sum(1 for e in events if TrustScoreCalculator.is_valid(e.trust_score))
    
    @staticmethod
    def calculate_engagement(events: List[StreamEvent]) -> float:
        """
        E: Score d'engagement
        - Durée écoutée pondérée
        - Taux de réécoute
        - Ajouts playlist
        """
        if not events:
            return 0.0
        
        valid_events = [e for e in events if TrustScoreCalculator.is_valid(e.trust_score)]
        if not valid_events:
            return 0.0
        
        # Engagement = moyenne pondérée de completion * duration
        total_engagement = sum(
            e.completion_rate * min(e.duration_seconds / 180, 1.0)  # Cap à 3min
            for e in valid_events
        )
        
        return total_engagement / len(valid_events)
    
    @staticmethod
    def calculate_fidelity(events: List[StreamEvent], cycle_weeks: int = 4) -> float:
        """
        F: Score de fidélité
        - Présence hebdomadaire pondérée
        - Bonus Premium
        """
        if not events:
            return 0.0
        
        valid_events = [e for e in events if TrustScoreCalculator.is_valid(e.trust_score)]
        if not valid_events:
            return 0.0
        
        # Grouper par semaine
        weeks_with_plays = set()
        premium_plays = 0
        
        for e in valid_events:
            week_num = e.timestamp.isocalendar()[1]
            weeks_with_plays.add(week_num)
            if e.is_premium:
                premium_plays += 1
        
        # Présence hebdomadaire (0-1)
        presence = len(weeks_with_plays) / cycle_weeks
        
        # Bonus Premium (jusqu'à +20%)
        premium_ratio = premium_plays / len(valid_events) if valid_events else 0
        premium_bonus = 1 + (premium_ratio * 0.2)
        
        return min(presence * premium_bonus, 1.0)
    
    @staticmethod
    def calculate_conversion(events: List[StreamEvent]) -> float:
        """
        C: Valeur de conversion (€)
        - Valeur attribuée en fenêtre 14j
        - Basé sur Premium vs Free
        """
        if not events:
            return 0.0
        
        valid_events = [e for e in events if TrustScoreCalculator.is_valid(e.trust_score)]
        
        # Valeur par stream selon type d'utilisateur
        VALUE_PER_STREAM_PREMIUM = 0.004  # €0.004 par stream Premium
        VALUE_PER_STREAM_FREE = 0.001     # €0.001 par stream Free (pub)
        
        total_value = sum(
            VALUE_PER_STREAM_PREMIUM if e.is_premium else VALUE_PER_STREAM_FREE
            for e in valid_events
        )
        
        return total_value


# ═══════════════════════════════════════════════════════════════════════════════
# COUCHE 3 — CVI (Cultural Value Index)
# ═══════════════════════════════════════════════════════════════════════════════

class CVICalculator:
    """
    Agrégation CES (Constant Elasticity of Substitution) des composantes normalisées.
    
    CVI = [Σ w_i * x_i^ρ]^(1/ρ)
    
    où:
    - w_i = poids de chaque composante
    - x_i = composante normalisée
    - ρ = paramètre CES (calibré par cycle)
    """
    
    @staticmethod
    def normalize(value: float, max_value: float) -> float:
        """Normalise une valeur entre 0 et 1"""
        if max_value <= 0:
            return 0.0
        return min(value / max_value, 1.0)
    
    @staticmethod
    def calculate_cvi(
        streams: int,
        engagement: float,
        fidelity: float,
        conversion: float,
        max_streams: int = 1000000,
        max_conversion: float = 10000.0
    ) -> float:
        """
        Calcule le Cultural Value Index via agrégation CES.
        """
        # Normalisation
        s_norm = CVICalculator.normalize(streams, max_streams)
        e_norm = engagement  # Déjà entre 0-1
        f_norm = fidelity    # Déjà entre 0-1
        c_norm = CVICalculator.normalize(conversion, max_conversion)
        
        # Poids
        w_s = CVEConfig.WEIGHT_STREAMS
        w_e = CVEConfig.WEIGHT_ENGAGEMENT
        w_f = CVEConfig.WEIGHT_FIDELITY
        w_c = CVEConfig.WEIGHT_CONVERSION
        
        # Paramètre CES
        rho = CVEConfig.RHO_CES
        
        # Éviter division par zéro si rho = 0 (cas Cobb-Douglas)
        if abs(rho) < 0.001:
            # Cobb-Douglas: CVI = Π(x_i^w_i)
            cvi = (
                (s_norm ** w_s) *
                (e_norm ** w_e) *
                (f_norm ** w_f) *
                (c_norm ** w_c)
            )
        else:
            # CES standard
            sum_weighted = (
                w_s * (s_norm ** rho) +
                w_e * (e_norm ** rho) +
                w_f * (f_norm ** rho) +
                w_c * (c_norm ** rho)
            )
            cvi = sum_weighted ** (1 / rho) if sum_weighted > 0 else 0.0
        
        return cvi


# ═══════════════════════════════════════════════════════════════════════════════
# COUCHE 4 — NEBULA SCORE
# ═══════════════════════════════════════════════════════════════════════════════

class NebulaCalculator:
    """
    Mesure de circulation culturelle par entropie de Shannon sur 6 axes.
    
    Récompense la diffusion transversale, pas seulement le volume dans un seul segment.
    Une œuvre qui circule entre territoires/générations obtient un score plus élevé
    qu'une œuvre à forte audience mais confinée.
    """
    
    @staticmethod
    def calculate_entropy(distribution: Dict[str, float]) -> float:
        """
        Calcule l'entropie de Shannon normalisée pour une distribution.
        
        H = -Σ p_i * log2(p_i)
        H_norm = H / log2(n)  # Normalisé entre 0 et 1
        """
        if not distribution:
            return 0.0
        
        # Normaliser les valeurs pour qu'elles somment à 1
        total = sum(distribution.values())
        if total <= 0:
            return 0.0
        
        probs = [v / total for v in distribution.values() if v > 0]
        
        if len(probs) <= 1:
            return 0.0
        
        # Entropie de Shannon
        entropy = -sum(p * math.log2(p) for p in probs if p > 0)
        
        # Normalisation par l'entropie maximale (distribution uniforme)
        max_entropy = math.log2(len(probs))
        
        return entropy / max_entropy if max_entropy > 0 else 0.0
    
    @staticmethod
    def calculate_nebula_score(distribution: NebulaDistribution) -> float:
        """
        Calcule le Nebula Score global (moyenne des entropies sur 6 axes).
        """
        entropies = [
            NebulaCalculator.calculate_entropy(distribution.langue),
            NebulaCalculator.calculate_entropy(distribution.territoire),
            NebulaCalculator.calculate_entropy(distribution.diaspora),
            NebulaCalculator.calculate_entropy(distribution.generation),
            NebulaCalculator.calculate_entropy(distribution.style),
            NebulaCalculator.calculate_entropy(distribution.collaboration),
        ]
        
        # Moyenne des entropies (toutes pondérées également)
        return sum(entropies) / len(entropies) if entropies else 0.0
    
    @staticmethod
    def build_distribution_from_events(events: List[StreamEvent]) -> NebulaDistribution:
        """
        Construit la distribution Nebula à partir des événements d'écoute.
        """
        if not events:
            return NebulaDistribution()
        
        valid_events = [e for e in events if TrustScoreCalculator.is_valid(e.trust_score)]
        if not valid_events:
            return NebulaDistribution()
        
        # Compter les occurrences par axe
        langue_counts: Dict[str, int] = {}
        territoire_counts: Dict[str, int] = {}
        generation_counts: Dict[str, int] = {}
        
        for e in valid_events:
            langue_counts[e.user_language] = langue_counts.get(e.user_language, 0) + 1
            territoire_counts[e.user_territory] = territoire_counts.get(e.user_territory, 0) + 1
            generation_counts[e.user_generation] = generation_counts.get(e.user_generation, 0) + 1
        
        # Convertir en proportions
        total = len(valid_events)
        
        return NebulaDistribution(
            langue={k: v/total for k, v in langue_counts.items()},
            territoire={k: v/total for k, v in territoire_counts.items()},
            generation={k: v/total for k, v in generation_counts.items()},
            # diaspora, style, collaboration seraient calculés avec plus de métadonnées
            diaspora={},
            style={},
            collaboration={},
        )


# ═══════════════════════════════════════════════════════════════════════════════
# CVE ENGINE — Orchestration Complète
# ═══════════════════════════════════════════════════════════════════════════════

class CulturalValueEngine:
    """
    Moteur principal du Cultural Value Engine.
    
    Calcule l'allocation UVC (Unit of Value Cultural) pour chaque œuvre
    basée sur le CVI et le Nebula Score.
    """
    
    @staticmethod
    def calculate_work_metrics(
        work_id: str,
        events: List[StreamEvent],
        cycle_id: str
    ) -> WorkCVEMetrics:
        """
        Calcule toutes les métriques CVE pour une œuvre sur un cycle.
        """
        # Couche 1: Filtrage Trust Score
        valid_events = [e for e in events if TrustScoreCalculator.is_valid(e.trust_score)]
        
        # Couche 2: Composantes brutes
        streams = ComponentsCalculator.calculate_streams(events)
        engagement = ComponentsCalculator.calculate_engagement(events)
        fidelity = ComponentsCalculator.calculate_fidelity(events)
        conversion = ComponentsCalculator.calculate_conversion(events)
        
        # Trust Score moyen
        ts_avg = sum(e.trust_score for e in valid_events) / len(valid_events) if valid_events else 0.0
        
        # Couche 3: CVI
        cvi = CVICalculator.calculate_cvi(streams, engagement, fidelity, conversion)
        
        # Couche 4: Nebula Score
        nebula_dist = NebulaCalculator.build_distribution_from_events(events)
        nebula = NebulaCalculator.calculate_nebula_score(nebula_dist)
        
        return WorkCVEMetrics(
            work_id=work_id,
            cycle_id=cycle_id,
            streams_validated=streams,
            engagement_score=engagement,
            fidelity_score=fidelity,
            conversion_value=conversion,
            trust_score_avg=ts_avg,
            cvi=cvi,
            nebula_score=nebula,
        )
    
    @staticmethod
    def calculate_allocation(
        works_metrics: List[WorkCVEMetrics],
        distributable_mass: float = CVEConfig.DISTRIBUTABLE_MASS_PER_CYCLE
    ) -> List[WorkCVEMetrics]:
        """
        Calcule l'allocation UVC pour chaque œuvre.
        
        UVC_i = (CVI_i * N_i) / Σ(CVI_j * N_j) * MD_c
        
        où MD_c est la masse distribuable du cycle.
        """
        # Score composite pour chaque œuvre
        composite_scores = []
        for m in works_metrics:
            # Score composite = CVI * (1 + Nebula bonus)
            # Nebula ajoute jusqu'à 50% de bonus
            composite = m.cvi * (1 + m.nebula_score * 0.5)
            composite_scores.append((m, composite))
        
        # Somme totale des scores
        total_score = sum(score for _, score in composite_scores)
        
        # Allocation proportionnelle
        for metrics, score in composite_scores:
            if total_score > 0:
                metrics.uvc = (score / total_score) * distributable_mass
            else:
                metrics.uvc = 0.0
        
        return works_metrics


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

__all__ = [
    'CVEConfig',
    'StreamEvent',
    'WorkCVEMetrics',
    'NebulaDistribution',
    'CulturalValueRecord',
    'TrustScoreCalculator',
    'ComponentsCalculator',
    'CVICalculator',
    'NebulaCalculator',
    'CulturalValueEngine',
]
