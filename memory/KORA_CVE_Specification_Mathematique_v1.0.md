# KORA Cultural Value Engine — Mathematical Specification v1.0

## Formal Reference Document, Frozen on Theory v1.4
CVLN Group / Tech & Data Pole

**Status**: This document introduces no new concepts. It consolidates in unique notation everything established between CVE versions v1.0 and v1.4. This is chantier 1 of the proof roadmap — a prerequisite for simulation (chantier 2) and prototyping (chantier 3).

---

## 0. Conventions and Notation

| Symbol | Meaning |
|---|---|
| `i` | index of a work, `i ∈ {1, ..., n}` |
| `t` | continuous or discrete time (day) |
| `c` | calibration cycle index (month or quarter, fixed) |
| `a ∈ {S,E,F,C,L,N}` | index of a measurement component |
| `x̂` | normalized value of `x`, `x̂ ∈ [0,1]` unless otherwise stated |
| `MD_c` | distributable mass of cycle c |
| `θ` | set of system parameters for a given cycle (weights, ρ, thresholds, bounds) |

**Global Hypothesis H0**: All raw input signals are timestamped and identically reproducible by a third party from raw listening/transaction logs. Any quantity not satisfying H0 is excluded from the model (principle of closure, v1.1 §1.2).

---

## 1. LAYER 1 — MEASUREMENT (Raw Signals)

### 1.1 Trust Score

```
TS_i(t) = w_id · sig_id(t) + w_comp · sig_comp(t) + w_net · sig_net(t) + w_hist · sig_hist(t)
```
with `w_id + w_comp + w_net + w_hist = 1`, each `sig ∈ [0,1]`, indicative initial calibration values:
`w_id = 0.4`, `w_comp = 0.3`, `w_net = 0.2`, `w_hist = 0.1`.

**Validation Filter**: A listening event `e` is retained in the calculation if `TS_i(t_e) ≥ τ_fraude`, a threshold fixed per cycle and published (Governance Protocol, §6).

### 1.2 Normalized Raw Components

For each work `i` and cycle `c`:

```
S_i,c   = validated streams (TS ≥ τ_fraude), normalized by percentile across the cycle's catalog

E_i,c   = w1·(listened_duration/total_duration) + w2·1[re-listen ≤7d] + w3·(playlist_adds/active_user_playlists)

F_i,c   = Σ_{weeks s=1..12} 1[active_s] · (1.3 if Premium subscriber, else 1.0) / 12

C_i,c   = Σ (value_€ of attributed conversions, 14d window) / total_€ value of cycle conversions

L_i,c   = replaced by the integral of the CHL curve, see §3.3 (derived component, not raw)
```

Each raw component undergoes a saturation transformation before integration into Layer 2 calculation (§3.1).

---

## 2. NORMALIZATION AND SATURATION

### 2.1 Concave Transformation

```
x̂_i,c = log(1 + x_i,c)          or       x̂_i,c = x_i,c^0.5
```
The choice between the two forms is to be empirically decided during chantier 2 (simulation) by comparing their effect on the final catalog distribution. Hypothesis H1: The chosen form is identical for all components within the same cycle (no differentiated transformation per component, to preserve comparability).

---

## 3. LAYER 2 — COMPREHENSION

### 3.1 CES Aggregation

```
CVI_i,c = ( Σ_{a} w_a,c · x̂_i,c,a^ρ_c )^(1/ρ_c)
```
where `a ∈ {S, E, F, C, CHL_integrated, N}`, `Σ_a w_a,c = 1`, `w_a,c ≥ 0`.

`ρ_c ∈ (-∞, 1]`: substitution elasticity parameter, calibrated empirically per cycle (Hypothesis H2: ρ constant within a cycle, re-estimated between cycles within the same bounds as the weights, §5.3).

**Special Cases** (formal reminder, v1.2 §1.2):
- `ρ_c → 1`: weighted sum (perfect substitutability)
- `ρ_c → 0`: Cobb-Douglas form, `CVI_i,c = Π_a x̂_i,c,a^{w_a,c}`
- `ρ_c → -∞`: `CVI_i,c = min_a(x̂_i,c,a)` (total complementarity, Leontief)

### 3.2 Nebula Score — Cultural Circulation

For each axis `k ∈ {language, territory, diaspora, generation, style, collaboration}`:

```
H_k(i,c) = − Σ_j p_{i,j,k} · log(p_{i,j,k})
```
where `p_{i,j,k}` = proportion of validated listens for work `i` within category `j` of axis `k`, over cycle `c`.

```
N_i,c = Σ_k H_k(i,c) · ν_k(i,c) · φ(i,c)
```
- `ν_k(i,c) ∈ [0.3, 1]`: novelty coefficient on axis `k` (1 = first-time penetration of category `j` for work `i`, 0.3 = category already reached in previous cycles)
- `φ(i,c)`: velocity factor, `φ(i,c) = 1 + (Δ_axis_coverage / Δt)` normalized to [1, φ_max]

### 3.3 Cultural Half-Life (CHL)

Let `v_i(t) = dVCF_i/dt` be the instantaneous rate of incremental value creation for work `i` (VCF defined in §3.5).

For each local peak `p` detected in `v_i(t)` (local maximum over a rolling window):
```
CHL_i,p = min{ τ ≥ 0 : v_i(t_p + τ) ≤ 0.5 · v_i(t_p) }
```

**Derived Legacy Component (replaces raw L, v1.3 §2.4)**:
```
L_i,c = Σ_p [ ∫_{t_p}^{t_p + CHL_i,p} v_i(t) dt ] · classification(CHL_i,p)
```
where `classification()` categorizes the peak (ephemeral / slow-burn / classic / heritage) according to duration thresholds fixed per cycle and published in the Governance Protocol.

**Hypothesis H3**: Peak detection requires a minimum of `N_min` post-peak observations to be validated (avoids premature detection on noise) — `N_min` to be determined during chantier 2 on real data.

---

## 4. LAYER 3 — FORECASTING (Minimal Formalization)

```
Ŷ_i(t+Δ) = g(v_i(t' ≤ t), N_i(t' ≤ t), similar_historical_trajectory)
```
Output `Ŷ` = prospective classification (emerging scene / growing talent / expanding diaspora), function `g` = early growth model.

**Formal Governance Constraint (reminder v1.3 §3.2)**:
```
Ŷ_i(t+Δ) ∉ inputs(Allocation)
```
`Ŷ` does not appear in any Layer 4 equations.

---

## 5. LAYER 4 — ALLOCATION

```
UVC_i,c = ( CVI_i,c / Σ_j CVI_j,c ) · MD_c
```

Value of a UVC in cycle `c`:
```
value_UVC,c = MD_c / Σ_i CVI_i,c
```

---

## 6. FUNDAMENTAL LAW — COMPLETE OPTIMIZATION PROGRAM

```
Maximize:     Σ_i VCF_i^{corrected}(t)

Subject to:
  (C1)  Σ_i UVC_i,c = MD_c                                          — fixed budget
  (C2)  TS_i(t) ≥ τ_fraude  ∀ retained event                      — fraud resistance
  (C3)  |w_a,c − w_a,c-1| ≤ 0.10 , |ρ_c − ρ_c-1| ≤ bound_ρ           — stability
  (C4)  H_diversity(catalog, c) ≥ diversity_floor                — cultural diversity
  (C5)  E[UVC_i | CVI_i = v, culture_i = A] = E[UVC_i | CVI_i = v, culture_i = B]  ∀A,B   — cultural neutrality
  (C6)  ∀ component, reproducible by a third party from raw logs            — auditability (H0)
  (C7)  ∀ change in θ, published + justified + archived                            — governance
  (C8)  Ŷ_i(t+Δ) ∉ inputs(UVC)                                                    — forecast/allocation separation
```
