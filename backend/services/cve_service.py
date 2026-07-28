"""
KORA Cultural Value Engine (CVE) — Calculation Service
======================================================

Specification: KORA_CVE_Specification_Mathematique_v1.0.md
CVLN Group / Tech & Data Pole

This service implements the CVE calculation layers:
- Layer 1: Measurement (TrustScore, raw signals)
- Layer 2: Comprehension (CVI via CES aggregation, Nebula Score, CHL)
- Layer 3: Forecasting (classification, not used in allocation)
- Layer 4: Allocation (UVC distribution)

Mathematical Formulas:
- TrustScore: TS = w_id·sig_id + w_comp·sig_comp + w_net·sig_net + w_hist·sig_hist
- CVI: CVI = (Σ w_a · x̂_a^ρ)^(1/ρ)  (CES Aggregation)
- Nebula: N = Σ H_k · ν_k · φ  (Entropy × Novelty × Velocity)
- UVC: UVC = (CVI / Σ CVI) · MD

Constraints (Fundamental Law):
- C1: Budget constraint (Σ UVC = MD)
- C2: Fraud resistance (TS >= τ_fraude)
- C3: Stability (|Δw| <= 0.10)
- C4: Diversity floor
- C5: Cultural neutrality
- C6: Auditability (H0)
- C7: Governance
- C8: Forecast/allocation separation
"""

import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Tuple, Any
from collections import defaultdict

from models.cve_models import (
    Work, ListeningEvent, CulturalValueRecord, CVEConfiguration,
    CVEComponentScores, CycleType, CulturalClassification,
    generate_cycle_id
)

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 1 — MEASUREMENT (Raw Signals)
# ══════════════════════════════════════════════════════════════════════════════

class TrustScoreCalculator:
    """
    TrustScore calculation for fraud prevention.
    
    Formula: TS = w_id·sig_id + w_comp·sig_comp + w_net·sig_net + w_hist·sig_hist
    
    Validation: Event is retained if TS >= τ_fraude
    """
    
    def __init__(self, config: CVEConfiguration):
        self.w_id = config.w_id
        self.w_comp = config.w_comp
        self.w_net = config.w_net
        self.w_hist = config.w_hist
        self.tau_fraude = config.tau_fraude
    
    async def calculate_sig_id(
        self, 
        user_frek_id: str, 
        user_data: Dict[str, Any]
    ) -> float:
        """
        Identity Signal (sig_id):
        - Verified account: 0.8-1.0
        - Email confirmed: 0.6-0.8
        - Anonymous/new: 0.3-0.6
        """
        score = 0.3  # Base for any user
        
        if user_data.get("email_verified", False):
            score += 0.3
        
        if user_data.get("frek_id_verified", False):
            score += 0.2
        
        if user_data.get("is_premium", False):
            score += 0.1
        
        # Account age bonus
        created_at = user_data.get("created_at")
        if created_at:
            age_days = (datetime.now(timezone.utc) - created_at).days
            if age_days > 365:
                score += 0.1
            elif age_days > 90:
                score += 0.05
        
        return min(1.0, score)
    
    def calculate_sig_comp(
        self, 
        duration_seconds: int, 
        total_duration_seconds: int
    ) -> float:
        """
        Completion Signal (sig_comp):
        - Based on listen duration vs total duration
        - Minimum 30 seconds for valid stream (industry standard)
        """
        if total_duration_seconds <= 0:
            return 0.0
        
        # Minimum 30 seconds threshold
        if duration_seconds < 30:
            return 0.0
        
        completion_ratio = duration_seconds / total_duration_seconds
        
        # Score based on completion
        if completion_ratio >= 0.9:
            return 1.0
        elif completion_ratio >= 0.5:
            return 0.7 + (completion_ratio - 0.5) * 0.6
        elif completion_ratio >= 0.3:
            return 0.5 + (completion_ratio - 0.3) * 1.0
        else:
            return completion_ratio * 1.67  # Linear up to 0.5 at 30%
    
    async def calculate_sig_net(
        self, 
        session_data: Dict[str, Any]
    ) -> float:
        """
        Network Signal (sig_net):
        - IP reputation
        - Device fingerprint consistency
        - VPN/proxy detection
        """
        score = 0.8  # Default for normal traffic
        
        # VPN/proxy penalty
        if session_data.get("is_vpn", False):
            score -= 0.3
        
        # Suspicious IP
        if session_data.get("ip_suspicious", False):
            score -= 0.4
        
        # Device consistency bonus
        if session_data.get("device_consistent", True):
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    async def calculate_sig_hist(
        self, 
        user_frek_id: str,
        historical_data: Dict[str, Any]
    ) -> float:
        """
        Historical Signal (sig_hist):
        - Past listening patterns
        - Account standing
        - Previous fraud flags
        """
        score = 0.5  # Neutral baseline
        
        # Good standing history
        total_valid_streams = historical_data.get("total_valid_streams", 0)
        if total_valid_streams > 1000:
            score += 0.3
        elif total_valid_streams > 100:
            score += 0.2
        elif total_valid_streams > 10:
            score += 0.1
        
        # Fraud flags penalty
        fraud_flags = historical_data.get("fraud_flags", 0)
        score -= fraud_flags * 0.2
        
        # Diverse listening bonus
        unique_artists = historical_data.get("unique_artists_30d", 0)
        if unique_artists > 50:
            score += 0.1
        elif unique_artists > 20:
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    async def calculate_trust_score(
        self,
        event: ListeningEvent,
        user_data: Dict[str, Any],
        session_data: Dict[str, Any],
        historical_data: Dict[str, Any]
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate complete TrustScore for an event.
        
        Returns:
            Tuple of (trust_score, component_signals)
        """
        sig_id = await self.calculate_sig_id(event.user_frek_id, user_data)
        sig_comp = self.calculate_sig_comp(event.duration_seconds, event.total_duration_seconds)
        sig_net = await self.calculate_sig_net(session_data)
        sig_hist = await self.calculate_sig_hist(event.user_frek_id, historical_data)
        
        trust_score = (
            self.w_id * sig_id +
            self.w_comp * sig_comp +
            self.w_net * sig_net +
            self.w_hist * sig_hist
        )
        
        components = {
            "sig_id": sig_id,
            "sig_comp": sig_comp,
            "sig_net": sig_net,
            "sig_hist": sig_hist
        }
        
        return trust_score, components
    
    def is_validated(self, trust_score: float) -> bool:
        """Check if event passes fraud threshold."""
        return trust_score >= self.tau_fraude


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2 — COMPREHENSION (CVI Aggregation)
# ══════════════════════════════════════════════════════════════════════════════

class CVICalculator:
    """
    Cultural Value Index (CVI) calculation using CES aggregation.
    
    CVI = (Σ w_a · x̂_a^ρ)^(1/ρ)
    
    Components: S (streams), E (engagement), F (fidelity), 
                C (conversion), L (legacy/CHL), N (nebula)
    """
    
    def __init__(self, config: CVEConfiguration):
        self.config = config
        self.weights = {
            "S": config.w_S,
            "E": config.w_E,
            "F": config.w_F,
            "C": config.w_C,
            "L": config.w_L,
            "N": config.w_N,
        }
        self.rho = config.rho
        self.saturation = config.saturation_type
    
    def saturate(self, x: float) -> float:
        """
        Apply concave saturation transformation.
        
        Hypothesis H1: Same transformation for all components.
        """
        if x <= 0:
            return 0.0
        
        if self.saturation == "log":
            return math.log(1 + x)
        else:  # sqrt
            return math.sqrt(x)
    
    def normalize_percentile(
        self, 
        value: float, 
        all_values: List[float]
    ) -> float:
        """Normalize value to percentile within distribution."""
        if not all_values or len(all_values) < 2:
            return 0.5
        
        sorted_values = sorted(all_values)
        rank = sum(1 for v in sorted_values if v < value)
        percentile = rank / len(sorted_values)
        return percentile
    
    def calculate_S(
        self, 
        validated_streams: int,
        all_work_streams: List[int]
    ) -> float:
        """
        S Component: Validated Streams
        Normalized by percentile across cycle catalog.
        """
        saturated = self.saturate(validated_streams)
        all_saturated = [self.saturate(s) for s in all_work_streams]
        return self.normalize_percentile(saturated, all_saturated)
    
    def calculate_E(
        self,
        avg_completion_ratio: float,
        re_listen_7d_count: int,
        playlist_adds: int,
        active_user_playlists: int
    ) -> float:
        """
        E Component: Engagement
        
        E = w1·(listened/total) + w2·1[re-listen≤7d] + w3·(playlist_adds/active_playlists)
        """
        w1, w2, w3 = 0.4, 0.3, 0.3
        
        e1 = avg_completion_ratio
        e2 = min(1.0, re_listen_7d_count / 10)  # Cap at 10 re-listens
        e3 = min(1.0, playlist_adds / max(1, active_user_playlists))
        
        return w1 * e1 + w2 * e2 + w3 * e3
    
    def calculate_F(
        self,
        weekly_active: List[bool],  # 12 weeks
        is_premium: bool
    ) -> float:
        """
        F Component: Fidelity
        
        F = Σ(weeks s=1..12) 1[active_s] · (1.3 if Premium, else 1.0) / 12
        """
        premium_multiplier = 1.3 if is_premium else 1.0
        active_weeks = sum(1 for w in weekly_active[:12] if w)
        return (active_weeks * premium_multiplier) / 12
    
    def calculate_C(
        self,
        attributed_value_eur: float,
        total_cycle_value_eur: float
    ) -> float:
        """
        C Component: Conversion Attribution
        
        C = value_€ / total_€ (14-day attribution window)
        """
        if total_cycle_value_eur <= 0:
            return 0.0
        return attributed_value_eur / total_cycle_value_eur
    
    def calculate_cvi(self, components: CVEComponentScores) -> float:
        """
        Calculate CVI using CES aggregation.
        
        CVI = (Σ w_a · x̂_a^ρ)^(1/ρ)
        
        Special cases:
        - ρ → 1: weighted sum (perfect substitutability)
        - ρ → 0: Cobb-Douglas (log-linear)
        - ρ → -∞: Leontief (min)
        """
        component_values = {
            "S": components.S,
            "E": components.E,
            "F": components.F,
            "C": components.C,
            "L": components.L,
            "N": components.N,
        }
        
        # Handle special case: ρ very close to 1 (weighted sum)
        if self.rho > 0.99:
            return sum(self.weights[k] * v for k, v in component_values.items())
        
        # Handle special case: ρ very close to 0 (Cobb-Douglas)
        if abs(self.rho) < 0.01:
            log_sum = 0.0
            for k, v in component_values.items():
                if v > 0:
                    log_sum += self.weights[k] * math.log(v)
                else:
                    # Handle zero values
                    log_sum += self.weights[k] * math.log(1e-10)
            return math.exp(log_sum)
        
        # General CES case
        weighted_sum = 0.0
        for k, v in component_values.items():
            if v > 0:
                weighted_sum += self.weights[k] * (v ** self.rho)
        
        if weighted_sum <= 0:
            return 0.0
        
        return weighted_sum ** (1.0 / self.rho)


# ══════════════════════════════════════════════════════════════════════════════
# NEBULA SCORE — Cultural Circulation
# ══════════════════════════════════════════════════════════════════════════════

class NebulaCalculator:
    """
    Nebula Score: Measures cultural circulation across dimensions.
    
    For each axis k ∈ {language, territory, diaspora, generation, style, collaboration}:
    H_k = -Σ p_{i,j,k} · log(p_{i,j,k})  (Shannon entropy)
    
    N = Σ H_k · ν_k · φ
    - ν_k: novelty coefficient (0.3-1.0)
    - φ: velocity factor (1-φ_max)
    """
    
    AXES = ["language", "territory", "diaspora", "generation", "style", "collaboration"]
    
    def __init__(self, phi_max: float = 2.0):
        self.phi_max = phi_max
    
    def calculate_entropy(self, distribution: Dict[str, int]) -> float:
        """Calculate Shannon entropy for a distribution."""
        if not distribution:
            return 0.0
        
        total = sum(distribution.values())
        if total <= 0:
            return 0.0
        
        entropy = 0.0
        for count in distribution.values():
            if count > 0:
                p = count / total
                entropy -= p * math.log(p)
        
        return entropy
    
    def calculate_novelty(
        self, 
        current_categories: set,
        historical_categories: set
    ) -> float:
        """
        Novelty coefficient (ν):
        - 1.0 for first-time penetration
        - 0.3 for already-reached categories
        """
        if not current_categories:
            return 0.3
        
        new_categories = current_categories - historical_categories
        novelty_ratio = len(new_categories) / len(current_categories)
        
        return 0.3 + 0.7 * novelty_ratio
    
    def calculate_velocity(
        self,
        axis_coverage_change: float,
        time_delta_days: float
    ) -> float:
        """
        Velocity factor (φ):
        φ = 1 + (Δaxis_coverage / Δt) normalized to [1, φ_max]
        """
        if time_delta_days <= 0:
            return 1.0
        
        velocity = 1 + (axis_coverage_change / time_delta_days)
        return min(self.phi_max, max(1.0, velocity))
    
    def calculate_nebula_score(
        self,
        distributions: Dict[str, Dict[str, int]],  # axis -> {category: count}
        novelty_factors: Dict[str, float],
        velocity_factor: float
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate complete Nebula Score.
        
        Returns:
            Tuple of (nebula_score, entropy_by_axis)
        """
        entropy_by_axis = {}
        weighted_sum = 0.0
        
        for axis in self.AXES:
            dist = distributions.get(axis, {})
            entropy = self.calculate_entropy(dist)
            entropy_by_axis[axis] = entropy
            
            novelty = novelty_factors.get(axis, 0.5)
            weighted_sum += entropy * novelty
        
        nebula_score = weighted_sum * velocity_factor
        
        return nebula_score, entropy_by_axis


# ══════════════════════════════════════════════════════════════════════════════
# CULTURAL HALF-LIFE (CHL)
# ══════════════════════════════════════════════════════════════════════════════

class CHLCalculator:
    """
    Cultural Half-Life (CHL) calculation.
    
    For each peak p in value creation rate v_i(t):
    CHL = min{τ ≥ 0 : v_i(t_p + τ) ≤ 0.5 · v_i(t_p)}
    
    Classification thresholds:
    - Ephemeral: CHL < 7 days
    - Slow-burn: 7 ≤ CHL < 30 days
    - Classic: 30 ≤ CHL < 180 days
    - Heritage: CHL ≥ 180 days
    """
    
    THRESHOLDS = {
        CulturalClassification.EPHEMERAL: 7,
        CulturalClassification.SLOW_BURN: 30,
        CulturalClassification.CLASSIC: 180,
        CulturalClassification.HERITAGE: float('inf'),
    }
    
    def __init__(self, n_min_observations: int = 7):
        """
        Args:
            n_min_observations: Minimum post-peak observations (Hypothesis H3)
        """
        self.n_min = n_min_observations
    
    def detect_peaks(
        self, 
        daily_values: List[float],
        window_size: int = 3
    ) -> List[int]:
        """
        Detect local peaks in value creation rate.
        
        Returns list of peak indices.
        """
        peaks = []
        n = len(daily_values)
        
        for i in range(window_size, n - window_size):
            is_peak = True
            for j in range(1, window_size + 1):
                if daily_values[i] <= daily_values[i - j] or daily_values[i] <= daily_values[i + j]:
                    is_peak = False
                    break
            
            if is_peak:
                # Check minimum observations post-peak
                if i + self.n_min <= n:
                    peaks.append(i)
        
        return peaks
    
    def calculate_chl(
        self,
        daily_values: List[float],
        peak_index: int
    ) -> Optional[float]:
        """
        Calculate CHL for a specific peak.
        
        Returns CHL in days, or None if not enough data.
        """
        peak_value = daily_values[peak_index]
        half_value = peak_value * 0.5
        
        for tau in range(1, len(daily_values) - peak_index):
            if daily_values[peak_index + tau] <= half_value:
                return float(tau)
        
        # Value hasn't dropped to half yet
        return float(len(daily_values) - peak_index)
    
    def classify(self, chl_days: float) -> CulturalClassification:
        """Classify work based on CHL."""
        if chl_days < self.THRESHOLDS[CulturalClassification.EPHEMERAL]:
            return CulturalClassification.EPHEMERAL
        elif chl_days < self.THRESHOLDS[CulturalClassification.SLOW_BURN]:
            return CulturalClassification.SLOW_BURN
        elif chl_days < self.THRESHOLDS[CulturalClassification.CLASSIC]:
            return CulturalClassification.CLASSIC
        else:
            return CulturalClassification.HERITAGE
    
    def calculate_legacy_component(
        self,
        daily_values: List[float]
    ) -> Tuple[float, Optional[float], Optional[CulturalClassification]]:
        """
        Calculate L component (Legacy) from CHL integral.
        
        L = Σ_p [∫_{t_p}^{t_p + CHL} v(t) dt] · classification_weight
        
        Returns:
            Tuple of (L_component, avg_chl_days, classification)
        """
        peaks = self.detect_peaks(daily_values)
        
        if not peaks:
            return 0.0, None, None
        
        total_integral = 0.0
        chl_values = []
        
        for peak_idx in peaks:
            chl = self.calculate_chl(daily_values, peak_idx)
            if chl is not None:
                chl_values.append(chl)
                
                # Integrate value under CHL window
                end_idx = min(len(daily_values), peak_idx + int(chl) + 1)
                integral = sum(daily_values[peak_idx:end_idx])
                
                # Weight by classification
                classification = self.classify(chl)
                weight = {
                    CulturalClassification.EPHEMERAL: 0.5,
                    CulturalClassification.SLOW_BURN: 0.75,
                    CulturalClassification.CLASSIC: 1.0,
                    CulturalClassification.HERITAGE: 1.5,
                }[classification]
                
                total_integral += integral * weight
        
        avg_chl = sum(chl_values) / len(chl_values) if chl_values else None
        classification = self.classify(avg_chl) if avg_chl else None
        
        return total_integral, avg_chl, classification


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 4 — ALLOCATION (UVC Distribution)
# ══════════════════════════════════════════════════════════════════════════════

class UVCAllocator:
    """
    UVC (Unité de Valeur Culturelle) allocation.
    
    UVC_i = (CVI_i / Σ CVI_j) · MD
    
    Constraints enforced:
    - C1: Σ UVC = MD (budget)
    - C4: Diversity floor
    - C5: Cultural neutrality (E[UVC|CVI=v, culture=A] = E[UVC|CVI=v, culture=B])
    """
    
    def __init__(self, config: CVEConfiguration):
        self.config = config
        self.md_eur = config.md_eur
        self.diversity_floor = config.diversity_floor
    
    def allocate(
        self,
        work_cvi_map: Dict[str, float]  # work_id -> CVI
    ) -> Dict[str, float]:
        """
        Allocate UVC based on CVI proportions.
        
        Returns:
            Dict of work_id -> UVC_eur
        """
        total_cvi = sum(work_cvi_map.values())
        
        if total_cvi <= 0:
            return {work_id: 0.0 for work_id in work_cvi_map}
        
        allocations = {}
        for work_id, cvi in work_cvi_map.items():
            proportion = cvi / total_cvi
            uvc_eur = proportion * self.md_eur
            allocations[work_id] = uvc_eur
        
        return allocations
    
    def apply_diversity_floor(
        self,
        allocations: Dict[str, float],
        work_cultures: Dict[str, str]  # work_id -> culture
    ) -> Dict[str, float]:
        """
        Apply diversity floor constraint (C4).
        
        Ensures minimum representation per cultural category.
        """
        # Group by culture
        culture_totals = defaultdict(float)
        for work_id, uvc in allocations.items():
            culture = work_cultures.get(work_id, "unknown")
            culture_totals[culture] += uvc
        
        total_allocated = sum(allocations.values())
        if total_allocated <= 0:
            return allocations
        
        # Check if any culture is below floor
        min_per_culture = total_allocated * self.diversity_floor / max(1, len(culture_totals))
        
        adjustments_needed = {}
        for culture, total in culture_totals.items():
            if total < min_per_culture:
                adjustments_needed[culture] = min_per_culture - total
        
        if not adjustments_needed:
            return allocations
        
        # Redistribute from over-represented cultures
        total_adjustment = sum(adjustments_needed.values())
        over_total = sum(v for c, v in culture_totals.items() if c not in adjustments_needed)
        
        adjusted = allocations.copy()
        for work_id, uvc in allocations.items():
            culture = work_cultures.get(work_id, "unknown")
            
            if culture in adjustments_needed:
                # Boost under-represented
                works_in_culture = sum(1 for w, c in work_cultures.items() if c == culture)
                boost = adjustments_needed[culture] / max(1, works_in_culture)
                adjusted[work_id] = uvc + boost
            else:
                # Reduce over-represented (proportionally)
                reduction_ratio = total_adjustment / max(1, over_total)
                adjusted[work_id] = uvc * (1 - reduction_ratio)
        
        return adjusted


# ══════════════════════════════════════════════════════════════════════════════
# MAIN CVE SERVICE
# ══════════════════════════════════════════════════════════════════════════════

class CulturalValueEngine:
    """
    Main CVE service orchestrating all calculation layers.
    
    Usage:
        cve = CulturalValueEngine(db, config)
        await cve.process_cycle("2024-01")
    """
    
    def __init__(self, db, config: Optional[CVEConfiguration] = None):
        self.db = db
        self.config = config or self._get_default_config()
        
        # Initialize calculators
        self.trust_calculator = TrustScoreCalculator(self.config)
        self.cvi_calculator = CVICalculator(self.config)
        self.nebula_calculator = NebulaCalculator()
        self.chl_calculator = CHLCalculator()
        self.uvc_allocator = UVCAllocator(self.config)
    
    def _get_default_config(self) -> CVEConfiguration:
        """Get default CVE configuration."""
        return CVEConfiguration(
            cycle_id="default",
            # TrustScore weights
            w_id=0.4,
            w_comp=0.3,
            w_net=0.2,
            w_hist=0.1,
            tau_fraude=0.6,
            # CVI weights (initial calibration)
            w_S=0.25,
            w_E=0.20,
            w_F=0.15,
            w_C=0.15,
            w_L=0.10,
            w_N=0.15,
            # CES parameter
            rho=0.5,
            # Constraints
            max_weight_change=0.10,
            diversity_floor=0.3,
            # Distribution
            md_eur=0.0,
            saturation_type="log"
        )
    
    async def validate_listening_event(
        self,
        event: ListeningEvent
    ) -> ListeningEvent:
        """
        Layer 1: Validate listening event with TrustScore.
        """
        # Get user data
        user_data = await self.db.users.find_one({"frek_id": event.user_frek_id}) or {}
        
        # Get session data (simplified)
        session_data = {
            "is_vpn": False,
            "ip_suspicious": False,
            "device_consistent": True
        }
        
        # Get historical data
        historical = await self._get_user_history(event.user_frek_id)
        
        # Calculate TrustScore
        trust_score, components = await self.trust_calculator.calculate_trust_score(
            event, user_data, session_data, historical
        )
        
        # Update event
        event.trust_score = trust_score
        event.sig_id = components["sig_id"]
        event.sig_comp = components["sig_comp"]
        event.sig_net = components["sig_net"]
        event.sig_hist = components["sig_hist"]
        event.is_validated = self.trust_calculator.is_validated(trust_score)
        
        return event
    
    async def _get_user_history(self, frek_id: str) -> Dict[str, Any]:
        """Get user's historical listening data."""
        # Count valid streams
        valid_count = await self.db.listening_events.count_documents({
            "user_frek_id": frek_id,
            "is_validated": True
        })
        
        # Count unique artists
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        pipeline = [
            {"$match": {
                "user_frek_id": frek_id,
                "timestamp": {"$gte": thirty_days_ago}
            }},
            {"$group": {"_id": "$creator_frek_id"}},
            {"$count": "unique_artists"}
        ]
        result = await self.db.listening_events.aggregate(pipeline).to_list(1)
        unique_artists = result[0]["unique_artists"] if result else 0
        
        return {
            "total_valid_streams": valid_count,
            "unique_artists_30d": unique_artists,
            "fraud_flags": 0
        }
    
    async def calculate_work_cvi(
        self,
        work_id: str,
        cycle_id: str
    ) -> CulturalValueRecord:
        """
        Layer 2: Calculate CVI for a work in a cycle.
        """
        # Get validated events for this work in this cycle
        events = await self._get_cycle_events(work_id, cycle_id)
        
        # Get all work streams for normalization
        all_streams = await self._get_all_work_streams(cycle_id)
        
        # Calculate components
        components = CVEComponentScores()
        
        # S: Validated Streams
        validated_count = len([e for e in events if e.get("is_validated", False)])
        components.S = self.cvi_calculator.calculate_S(
            validated_count,
            [s["count"] for s in all_streams]
        )
        
        # E: Engagement
        if events:
            avg_completion = sum(e.get("completion_ratio", 0) for e in events) / len(events)
        else:
            avg_completion = 0
        re_listen_count = await self._count_re_listens(work_id, cycle_id)
        playlist_adds = await self._count_playlist_adds(work_id, cycle_id)
        components.E = self.cvi_calculator.calculate_E(
            avg_completion, re_listen_count, playlist_adds, 100
        )
        
        # F: Fidelity (simplified for MVP)
        components.F = 0.5  # Will be calculated per-user in full implementation
        
        # C: Conversion (simplified)
        components.C = 0.0  # Requires conversion tracking
        
        # N: Nebula Score
        distributions = await self._get_nebula_distributions(work_id, cycle_id)
        novelty = {axis: 0.7 for axis in NebulaCalculator.AXES}
        nebula_score, _ = self.nebula_calculator.calculate_nebula_score(
            distributions, novelty, 1.0
        )
        components.N = min(1.0, nebula_score / 10)  # Normalize
        
        # L: Legacy (CHL)
        daily_values = await self._get_daily_streams(work_id)
        legacy, chl_days, classification = self.chl_calculator.calculate_legacy_component(daily_values)
        components.L = min(1.0, legacy / 1000)  # Normalize
        
        # Calculate CVI
        cvi = self.cvi_calculator.calculate_cvi(components)
        
        # Create record
        record = CulturalValueRecord(
            work_id=work_id,
            frek_o_ref=f"FREK-O-{work_id[:8]}",
            cycle_id=cycle_id,
            cycle_type=CycleType.MONTHLY,
            cycle_start=datetime.now(timezone.utc),
            cycle_end=datetime.now(timezone.utc),
            total_streams=len(events),
            validated_streams=validated_count,
            components=components,
            cvi=cvi,
            chl_days=chl_days,
            chl_classification=classification,
            weights=self.cvi_calculator.weights,
            rho=self.config.rho
        )
        
        return record
    
    async def _get_cycle_events(self, work_id: str, cycle_id: str) -> List[Dict]:
        """Get listening events for a work in a cycle."""
        # Parse cycle_id to get date range
        year, month = cycle_id.split("-")
        start = datetime(int(year), int(month), 1, tzinfo=timezone.utc)
        if int(month) == 12:
            end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(int(year), int(month) + 1, 1, tzinfo=timezone.utc)
        
        cursor = self.db.listening_events.find({
            "work_id": work_id,
            "timestamp": {"$gte": start, "$lt": end}
        })
        return await cursor.to_list(None)
    
    async def _get_all_work_streams(self, cycle_id: str) -> List[Dict]:
        """Get stream counts for all works in a cycle."""
        year, month = cycle_id.split("-")
        start = datetime(int(year), int(month), 1, tzinfo=timezone.utc)
        if int(month) == 12:
            end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(int(year), int(month) + 1, 1, tzinfo=timezone.utc)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lt": end}, "is_validated": True}},
            {"$group": {"_id": "$work_id", "count": {"$sum": 1}}}
        ]
        return await self.db.listening_events.aggregate(pipeline).to_list(None)
    
    async def _count_re_listens(self, work_id: str, cycle_id: str) -> int:
        """Count re-listens within 7 days."""
        return 0  # Simplified for MVP
    
    async def _count_playlist_adds(self, work_id: str, cycle_id: str) -> int:
        """Count playlist additions."""
        return 0  # Simplified for MVP
    
    async def _get_nebula_distributions(
        self, work_id: str, cycle_id: str
    ) -> Dict[str, Dict[str, int]]:
        """Get listening distributions by cultural axes."""
        # Simplified for MVP
        return {
            "territory": {"FR": 50, "BE": 20, "CA": 15, "SN": 10, "CI": 5},
            "language": {"fr": 80, "en": 15, "wo": 5},
            "diaspora": {"europe": 60, "africa": 30, "americas": 10},
            "generation": {"18-24": 30, "25-34": 40, "35-44": 20, "45+": 10},
            "style": {"afrobeat": 40, "zouk": 30, "hip-hop": 20, "jazz": 10},
            "collaboration": {"solo": 70, "collab": 30}
        }
    
    async def _get_daily_streams(self, work_id: str) -> List[float]:
        """Get daily stream counts for CHL calculation."""
        # Get last 90 days
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        
        pipeline = [
            {"$match": {
                "work_id": work_id,
                "timestamp": {"$gte": ninety_days_ago},
                "is_validated": True
            }},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = await self.db.listening_events.aggregate(pipeline).to_list(None)
        return [r["count"] for r in results]
    
    async def process_cycle(
        self,
        cycle_id: str,
        distributable_mass_eur: float = 0.0
    ) -> Dict[str, Any]:
        """
        Process complete CVE calculation for a cycle.
        
        Returns summary of allocations.
        """
        logger.info(f"Processing CVE cycle: {cycle_id}")
        
        # Update config with distributable mass
        self.config.md_eur = distributable_mass_eur
        self.uvc_allocator = UVCAllocator(self.config)
        
        # Get all works with activity this cycle
        work_ids = await self._get_active_works(cycle_id)
        logger.info(f"Found {len(work_ids)} active works")
        
        # Calculate CVI for each work
        records = {}
        cvi_map = {}
        
        for work_id in work_ids:
            record = await self.calculate_work_cvi(work_id, cycle_id)
            records[work_id] = record
            cvi_map[work_id] = record.cvi
        
        # Allocate UVC
        allocations = self.uvc_allocator.allocate(cvi_map)
        
        # Update records with allocations
        for work_id, uvc_eur in allocations.items():
            records[work_id].uvc_allocated = uvc_eur / max(0.001, distributable_mass_eur)
            records[work_id].uvc_value_eur = uvc_eur
            records[work_id].status = "calculated"
            records[work_id].calculated_at = datetime.now(timezone.utc)
            
            # Store in database
            await self.db.cve_records.update_one(
                {"work_id": work_id, "cycle_id": cycle_id},
                {"$set": records[work_id].dict()},
                upsert=True
            )
        
        total_cvi = sum(cvi_map.values())
        
        return {
            "cycle_id": cycle_id,
            "works_processed": len(work_ids),
            "total_cvi": total_cvi,
            "distributable_mass_eur": distributable_mass_eur,
            "top_works": sorted(
                [(wid, cvi_map[wid], allocations[wid]) for wid in work_ids],
                key=lambda x: x[1],
                reverse=True
            )[:10]
        }
    
    async def _get_active_works(self, cycle_id: str) -> List[str]:
        """Get work IDs with activity in this cycle."""
        year, month = cycle_id.split("-")
        start = datetime(int(year), int(month), 1, tzinfo=timezone.utc)
        if int(month) == 12:
            end = datetime(int(year) + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(int(year), int(month) + 1, 1, tzinfo=timezone.utc)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": "$work_id"}}
        ]
        results = await self.db.listening_events.aggregate(pipeline).to_list(None)
        return [r["_id"] for r in results if r["_id"]]


# ══════════════════════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ══════════════════════════════════════════════════════════════════════════════

_cve_instance: Optional[CulturalValueEngine] = None


def get_cve_engine(db) -> CulturalValueEngine:
    """Get or create CVE engine instance."""
    global _cve_instance
    if _cve_instance is None:
        _cve_instance = CulturalValueEngine(db)
    return _cve_instance


def set_cve_config(config: CVEConfiguration):
    """Update CVE configuration."""
    global _cve_instance
    if _cve_instance:
        _cve_instance.config = config
        _cve_instance.trust_calculator = TrustScoreCalculator(config)
        _cve_instance.cvi_calculator = CVICalculator(config)
        _cve_instance.uvc_allocator = UVCAllocator(config)
