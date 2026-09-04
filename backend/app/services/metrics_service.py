PRIMITIVE_TYPES = {
    "void", "int", "long", "double", "float", "boolean", "char", "byte",
    "short", "String", "Integer", "Long", "Double", "Float", "Boolean", "Object",
}


def compute_method_count(interface: dict) -> int:
    return len(interface["methods"])


def compute_dependency_count(interface: dict) -> int:
    """Distinct non-primitive types touched by this interface's methods."""
    types = set()
    for method in interface["methods"]:
        if method["return_type"] not in PRIMITIVE_TYPES:
            types.add(method["return_type"])
        for t in method["param_types"]:
            if t not in PRIMITIVE_TYPES:
                types.add(t)
    return len(types)


def compute_isp_violation_ratio(interface: dict) -> float:
    """
    Cohesion heuristic: for every pair of methods, do they share a parameter
    type? Pairs sharing nothing suggest unrelated responsibilities bundled
    into one interface -- an ISP violation. Ratio of unrelated pairs / all
    pairs. True implementer-based ISP detection is out of scope; this is a
    documented, explainable proxy.
    """
    methods = interface["methods"]
    n = len(methods)
    if n < 2:
        return 0.0
    total_pairs = 0
    unrelated_pairs = 0
    for i in range(n):
        for j in range(i + 1, n):
            total_pairs += 1
            if not (set(methods[i]["param_types"]) & set(methods[j]["param_types"])):
                unrelated_pairs += 1
    return round(unrelated_pairs / total_pairs, 3)


def diff_signatures(previous: dict | None, current: dict) -> tuple[int, bool]:
    """Compares current signature to the interface's prior snapshot.
    Returns (breaking_change_count_this_commit, signature_changed_at_all)."""
    if previous is None:
        return 0, False

    old_methods = {m["name"]: m for m in previous["methods"]}
    new_methods = {m["name"]: m for m in current["methods"]}

    breaking = 0
    for name, old_m in old_methods.items():
        if name not in new_methods:
            breaking += 1
        else:
            new_m = new_methods[name]
            if old_m["param_types"] != new_m["param_types"] or old_m["return_type"] != new_m["return_type"]:
                breaking += 1

    changed = breaking > 0 or set(old_methods) != set(new_methods)
    return breaking, changed