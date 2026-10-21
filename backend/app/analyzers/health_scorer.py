from typing import Dict, Any

DEFAULT_WEIGHTS = {
    "isp_violations": 0.30,
    "method_bloat": 0.20,
    "coupling": 0.15,
    "dependency_cycles": 0.15,
    "churn": 0.10,
    "cohesion": 0.10,
}

def compute_health_score(
    method_count: int,
    isp_violations_count: int,
    total_implementer_methods: int,
    cbo: float,
    in_cycle: bool,
    churn: int,
    breaking_change_count: int,
    cohesion: float,
    weights: Dict[str, float] | None = None,
) -> Dict[str, Any]:
    """
    Computes a transparent, normalized Health Score in the range [0.0, 100.0].
    Higher scores consistently represent healthier design.

    Normalization formulas:
    - isp_penalty: isp_violations_count / max(1, total_implementer_methods) (capped at 1.0)
    - bloat_penalty: min(1.0, max(0, method_count - 4) / 8.0)  # >4 methods starts penalizing
    - coupling_penalty: min(1.0, cbo / 8.0)
    - cycle_penalty: 1.0 if in_cycle else 0.0
    - churn_penalty: min(1.0, (churn + breaking_change_count * 2) / 10.0)
    - cohesion_penalty: max(0.0, min(1.0, 1.0 - cohesion))
    """
    w = weights or DEFAULT_WEIGHTS

    # Penalties in [0.0, 1.0]
    denom = max(1, total_implementer_methods) if total_implementer_methods > 0 else max(1, method_count)
    isp_penalty = min(1.0, isp_violations_count / float(denom))
    bloat_penalty = min(1.0, max(0, method_count - 4) / 8.0)
    coupling_penalty = min(1.0, float(cbo) / 8.0)
    cycle_penalty = 1.0 if in_cycle else 0.0
    churn_penalty = min(1.0, (float(churn) + float(breaking_change_count) * 2.0) / 10.0)
    cohesion_penalty = max(0.0, min(1.0, 1.0 - float(cohesion)))

    total_penalty = (
        w["isp_violations"] * isp_penalty
        + w["method_bloat"] * bloat_penalty
        + w["coupling"] * coupling_penalty
        + w["dependency_cycles"] * cycle_penalty
        + w["churn"] * churn_penalty
        + w["cohesion"] * cohesion_penalty
    )

    raw_score = 100.0 * (1.0 - total_penalty)
    health_score = max(0.0, min(100.0, round(raw_score, 1)))

    # Classify severity
    if health_score >= 80.0:
        severity = "healthy"
    elif health_score >= 60.0:
        severity = "warning"
    elif health_score >= 40.0:
        severity = "high"
    else:
        severity = "critical"

    return {
        "health_score": health_score,
        "severity": severity,
        "penalties": {
            "isp_violations": round(isp_penalty, 2),
            "method_bloat": round(bloat_penalty, 2),
            "coupling": round(coupling_penalty, 2),
            "dependency_cycles": round(cycle_penalty, 2),
            "churn": round(churn_penalty, 2),
            "cohesion": round(cohesion_penalty, 2),
        },
    }

def compute_project_erosion_index(health_scores: list[float]) -> float:
    """Project-level erosion index: mean of all interface health scores."""
    if not health_scores:
        return 100.0
    return round(sum(health_scores) / len(health_scores), 1)
