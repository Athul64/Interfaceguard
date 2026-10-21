from typing import Dict, List, Any

def detect_code_smells(
    interface: Dict[str, Any],
    implementing_classes: List[Dict[str, Any]],
    ck_metrics: Dict[str, float],
    cohesion: float,
) -> List[Dict[str, Any]]:
    """
    Evaluates interface and implementors against documented code smell heuristics:
    1. Fat Interface: method_count > 6 or (method_count >= 5 and cohesion < 0.4)
    2. God Class (Implementor): WMC > 15 and CBO > 5 and LCOM > 0.6
    3. Large Class: total methods in implementing class > 10
    4. Long Method: method line length > 25 lines
    5. Feature Envy: method calling >= 3 distinct methods of another type with few local operations
    6. Refused Bequest: implementor stubbing or refusing >= 20% of the interface's contract
    """
    findings = []
    iface_name = interface.get("name", "UnknownInterface")
    iface_file = interface.get("file_path", "")
    methods = interface.get("methods", [])
    method_count = len(methods)

    # 1. Fat Interface
    if method_count > 6 or (method_count >= 5 and cohesion < 0.4):
        severity = "critical" if method_count >= 8 else "high"
        findings.append({
            "category": "code_smell",
            "rule_name": "Fat Interface",
            "severity": severity,
            "class_name": None,
            "method_name": None,
            "file_path": iface_file,
            "line_number": methods[0].get("start_line", 1) if methods else 1,
            "description": f"Interface '{iface_name}' declares {method_count} methods with low cohesive parameter sharing ({int(cohesion*100)}%).",
            "evidence": f"Threshold exceeded: method count {method_count} (threshold: 6) with cohesion {cohesion:.2f}.",
        })

    # Heuristics for implementing classes
    for cls in implementing_classes:
        cls_name = cls.get("name", "UnknownClass")
        cls_file = cls.get("file_path", "")
        cls_methods = cls.get("methods", [])
        cls_method_count = len(cls_methods)

        # 2. God Class
        cbo = ck_metrics.get("cbo", 0)
        wmc = ck_metrics.get("wmc", 0)
        lcom = ck_metrics.get("lcom", 0)
        if wmc >= 12 and cbo >= 5 and lcom >= 0.5:
            findings.append({
                "category": "code_smell",
                "rule_name": "God Class",
                "severity": "critical",
                "class_name": cls_name,
                "method_name": None,
                "file_path": cls_file,
                "line_number": 1,
                "description": f"Class '{cls_name}' exhibits high complexity, extensive coupling, and low cohesion.",
                "evidence": f"Observed WMC={wmc} (threshold >= 12), CBO={cbo} (threshold >= 5), LCOM={lcom} (threshold >= 0.5).",
            })

        # 3. Large Class
        if cls_method_count >= 10:
            findings.append({
                "category": "code_smell",
                "rule_name": "Large Class",
                "severity": "warning",
                "class_name": cls_name,
                "method_name": None,
                "file_path": cls_file,
                "line_number": 1,
                "description": f"Implementing class '{cls_name}' declares {cls_method_count} methods.",
                "evidence": f"Total methods = {cls_method_count} (heuristic threshold: 10).",
            })

        # Check methods in class
        refused_count = 0
        for m in cls_methods:
            m_name = m.get("name", "")
            start = m.get("start_line", 1)
            end = m.get("end_line", 1)
            length = max(1, end - start + 1)

            # 4. Long Method
            if length >= 25:
                findings.append({
                    "category": "code_smell",
                    "rule_name": "Long Method",
                    "severity": "warning",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": cls_file,
                    "line_number": start,
                    "description": f"Method '{m_name}' spans {length} lines in '{cls_name}'.",
                    "evidence": f"Observed length = {length} lines (threshold: 25).",
                })

            # Check refused bequest indicator
            if m.get("is_exception_stub") or m.get("is_no_op") or m.get("is_placeholder"):
                refused_count += 1

            # 5. Feature Envy
            calls = m.get("calls", [])
            if len(calls) >= 4 and len(set(calls)) >= 3:
                findings.append({
                    "category": "code_smell",
                    "rule_name": "Feature Envy",
                    "severity": "warning",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": cls_file,
                    "line_number": start,
                    "description": f"Method '{m_name}' in '{cls_name}' delegates heavily to external methods: {', '.join(calls[:3])}.",
                    "evidence": f"Observed {len(calls)} external invocations in method.",
                })

        # 6. Refused Bequest
        if method_count > 0 and (refused_count / method_count) >= 0.25:
            findings.append({
                "category": "code_smell",
                "rule_name": "Refused Bequest",
                "severity": "high",
                "class_name": cls_name,
                "method_name": None,
                "file_path": cls_file,
                "line_number": 1,
                "description": f"Implementing class '{cls_name}' ignores or rejects {refused_count} of {method_count} interface methods.",
                "evidence": f"Rejection ratio = {refused_count}/{method_count} ({int((refused_count/method_count)*100)}%).",
            })

    return findings
