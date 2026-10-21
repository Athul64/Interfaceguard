import numpy as np
from typing import List, Dict, Any, Tuple

def classify_erosion_trend(scores: List[float]) -> str:
    """
    Classifies the erosion trend across commit history:
    - 'stable': slope is roughly flat (abs(slope) <= 1.5 points/commit) or score is healthy.
    - 'rising': consistent negative slope (health score deteriorating at steady pace).
    - 'accelerating': curvature / second derivative is negative (deterioration rate is getting worse).
    Note: higher score means healthier, so decreasing health score = rising/accelerating erosion!
    """
    if len(scores) < 3:
        return "stable"

    # Invert scores so that higher value = more erosion
    erosion_levels = [100.0 - s for s in scores]
    x = np.arange(len(erosion_levels))
    
    # Linear fit
    slope, intercept = np.polyfit(x, erosion_levels, 1)

    if slope <= 1.5:
        return "stable"

    # Check for acceleration using quadratic fit: y = a*x^2 + b*x + c
    if len(erosion_levels) >= 4:
        poly2 = np.polyfit(x, erosion_levels, 2)
        curvature = poly2[0]  # coefficient of x^2
        if curvature > 0.4:
            return "accelerating"

    return "rising"

def detect_change_points_cusum(
    commits: List[Dict[str, Any]],
    scores: List[float],
    threshold: float = 12.0,
) -> List[Dict[str, Any]]:
    """
    Detects significant change points in health score time series using CUSUM / cumulative deviation.
    Requires at least 3 commits. If history is too short, returns empty list with insufficient data status.
    """
    if len(scores) < 3:
        return []

    change_points = []
    
    # Calculate step differences between consecutive snapshots
    for i in range(1, len(scores)):
        score_before = scores[i - 1]
        score_after = scores[i]
        drop = score_before - score_after

        # Drop of >= threshold represents a significant deterioration change point
        if drop >= threshold:
            commit = commits[i]
            change_points.append({
                "commit_hash": commit.get("commit_hash", ""),
                "commit_date": commit.get("commit_date"),
                "author": commit.get("author", "unknown"),
                "metric_name": "health_score",
                "score_before": round(score_before, 1),
                "score_after": round(score_after, 1),
                "confidence": round(min(1.0, drop / 30.0), 2),
                "description": f"Health Score dropped by {drop:.1f} points (from {score_before:.1f} to {score_after:.1f}) in commit {commit.get('commit_hash', '')[:7]}.",
            })

    return change_points
