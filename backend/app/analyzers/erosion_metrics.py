from typing import Dict, Any, Tuple

def compute_method_growth(initial_count: int, current_count: int) -> int:
    """Number of new methods added since initial interface snapshot."""
    return max(0, current_count - initial_count)

def compute_interface_cohesion(interface: Dict[str, Any]) -> float:
    """
    Interface Cohesion based on parameter type sharing between method pairs.
    Returns 1.0 for interfaces with <= 1 method or where all pairs share types.
    Returns lower score as unshared method pairs increase.
    Scale: 0.0 (zero cohesion) to 1.0 (perfect cohesion).
    """
    methods = interface.get("methods", [])
    n = len(methods)
    if n <= 1:
        return 1.0

    total_pairs = 0
    shared_pairs = 0
    for i in range(n):
        for j in range(i + 1, n):
            total_pairs += 1
            types_i = set(methods[i].get("param_types", []))
            types_j = set(methods[j].get("param_types", []))
            if types_i & types_j:
                shared_pairs += 1

    return round(shared_pairs / total_pairs, 2) if total_pairs > 0 else 1.0

def diff_interface_signatures(previous: Dict[str, Any] | None, current: Dict[str, Any]) -> Tuple[int, bool]:
    """
    Compares current signature to prior snapshot.
    Returns (breaking_change_count_this_commit, is_changed).
    Breaking changes include:
    - Removed methods
    - Changed parameter types or parameter count
    - Changed return type
    """
    if previous is None:
        return 0, False

    old_methods = {m["name"]: m for m in previous.get("methods", [])}
    new_methods = {m["name"]: m for m in current.get("methods", [])}

    breaking = 0
    for name, old_m in old_methods.items():
        if name not in new_methods:
            breaking += 1
        else:
            new_m = new_methods[name]
            if (
                old_m.get("param_types") != new_m.get("param_types")
                or old_m.get("return_type") != new_m.get("return_type")
            ):
                breaking += 1

    changed = breaking > 0 or set(old_methods.keys()) != set(new_methods.keys())
    return breaking, changed
