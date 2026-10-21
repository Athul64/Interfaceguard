from typing import Dict, List, Any

PRIMITIVE_TYPES = {
    "void", "int", "long", "double", "float", "boolean", "char", "byte",
    "short", "String", "Integer", "Long", "Double", "Float", "Boolean",
    "Object", "byte[]", "char[]", "int[]", "List", "Map", "Set",
}

def compute_interface_cbo(interface: Dict[str, Any]) -> int:
    """Coupling Between Objects: distinct non-primitive types in method signatures."""
    types = set()
    for m in interface.get("methods", []):
        ret = m.get("return_type", "")
        if ret and ret not in PRIMITIVE_TYPES:
            types.add(ret)
        for p in m.get("param_types", []):
            if p and p not in PRIMITIVE_TYPES:
                types.add(p)
    return len(types)

def compute_class_cbo(cls: Dict[str, Any]) -> int:
    """Coupling for implementing class: fields + params + return types + implemented interfaces."""
    types = set(cls.get("implements", []))
    types.update(cls.get("extends", []))
    for f in cls.get("fields", []):
        t = f.get("type", "")
        if t and t not in PRIMITIVE_TYPES:
            types.add(t)
    for m in cls.get("methods", []):
        ret = m.get("return_type", "")
        if ret and ret not in PRIMITIVE_TYPES:
            types.add(ret)
        for p in m.get("param_types", []):
            if p and p not in PRIMITIVE_TYPES:
                types.add(p)
    return len(types)

def compute_class_lcom(cls: Dict[str, Any]) -> float:
    """
    Lack of Cohesion in Methods (LCOM) normalized to [0.0, 1.0].
    Based on shared field accesses across methods. If field accesses are not tracked,
    uses parameter type overlap ratio proxy (higher value = less cohesive).
    """
    methods = cls.get("methods", [])
    n = len(methods)
    if n <= 1:
        return 0.0

    unshared_pairs = 0
    total_pairs = 0
    for i in range(n):
        for j in range(i + 1, n):
            total_pairs += 1
            params_i = set(methods[i].get("param_types", []))
            params_j = set(methods[j].get("param_types", []))
            if not (params_i & params_j):
                unshared_pairs += 1

    return round(unshared_pairs / total_pairs, 2) if total_pairs > 0 else 0.0

def compute_class_rfc(cls: Dict[str, Any]) -> int:
    """Response For a Class: declared methods + distinct external method invocations."""
    methods = cls.get("methods", [])
    method_names = {m.get("name") for m in methods}
    calls = set()
    for m in methods:
        for c in m.get("calls", []):
            calls.add(c)
    return len(method_names.union(calls))

def compute_class_wmc(cls: Dict[str, Any]) -> int:
    """Weighted Methods per Class: sum of method complexities (weights defaulted to 1 per method)."""
    return len(cls.get("methods", []))

def compute_class_dit(cls: Dict[str, Any]) -> int:
    """Depth of Inheritance Tree: base hierarchy depth."""
    extends_list = cls.get("extends", [])
    # In Java, any class inherits Object (depth 1), extending a base class makes it depth >= 2
    return 1 + len(extends_list)

def compute_aggregated_ck_metrics(
    interface: Dict[str, Any],
    implementing_classes: List[Dict[str, Any]],
) -> Dict[str, float]:
    """
    Computes CK metrics aggregated over all implementing classes for this interface.
    Aggregation method: Mean across implementing classes for CBO, LCOM, RFC, WMC, DIT;
    NOC is the total count of implementing classes.
    If no implementing classes exist, calculates direct interface estimates.
    """
    noc = float(len(implementing_classes))
    if not implementing_classes:
        methods = interface.get("methods", [])
        return {
            "cbo": float(compute_interface_cbo(interface)),
            "lcom": 0.0,
            "rfc": float(len(methods)),
            "wmc": float(len(methods)),
            "dit": 1.0,
            "noc": 0.0,
        }

    cbos = [compute_class_cbo(c) for c in implementing_classes]
    lcoms = [compute_class_lcom(c) for c in implementing_classes]
    rfcs = [compute_class_rfc(c) for c in implementing_classes]
    wmcs = [compute_class_wmc(c) for c in implementing_classes]
    dits = [compute_class_dit(c) for c in implementing_classes]

    return {
        "cbo": round(sum(cbos) / len(cbos), 1),
        "lcom": round(sum(lcoms) / len(lcoms), 2),
        "rfc": round(sum(rfcs) / len(rfcs), 1),
        "wmc": round(sum(wmcs) / len(wmcs), 1),
        "dit": round(sum(dits) / len(dits), 1),
        "noc": noc,
    }
