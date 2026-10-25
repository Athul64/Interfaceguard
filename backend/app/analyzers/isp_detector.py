from typing import Dict, List, Any

def detect_isp_violations(
    interface_name: str,
    interface_methods: List[Dict[str, Any]],
    implementing_classes: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Detects Interface Segregation Principle (ISP) violation indicators in implementing classes:
    1. Exception-throwing stubs (throw new UnsupportedOperationException / NotImplementedException)
    2. Empty implementations ({})
    3. No-operation implementations (empty bodies with comments)
    4. Placeholder return stubs (returns null, 0, false, empty arrays when interface implies active operation)
    """
    findings = []
    iface_method_names = {m["name"] for m in interface_methods}

    for cls in implementing_classes:
        cls_name = cls.get("name", "UnknownClass")
        file_path = cls.get("file_path", "")

        for m in cls.get("methods", []):
            m_name = m.get("name", "")
            if m_name not in iface_method_names:
                continue

            start_line = m.get("start_line", 1)
            stub_detail = m.get("stub_detail", "")

            # 1. Exception stub
            if m.get("is_exception_stub", False):
                findings.append({
                    "category": "isp_violation",
                    "rule_name": "Exception-Throwing Stub",
                    "severity": "critical",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": file_path,
                    "line_number": start_line,
                    "description": f"Class '{cls_name}' implements interface '{interface_name}' but throws an exception in '{m_name}()'.",
                    "evidence": f"Throws {stub_detail or 'UnsupportedOperationException'} instead of providing required contract behavior.",
                })

            # 2. No-op implementation
            elif m.get("is_no_op", False) and not m.get("is_empty", False):
                findings.append({
                    "category": "isp_violation",
                    "rule_name": "No-Operation Stub",
                    "severity": "high",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": file_path,
                    "line_number": start_line,
                    "description": f"Class '{cls_name}' provides a no-op comment stub for '{m_name}()'.",
                    "evidence": f"Comment or empty logic indicates this class does not need this method ({stub_detail}).",
                })

            # 3. Empty implementation
            elif m.get("is_empty", False):
                findings.append({
                    "category": "isp_violation",
                    "rule_name": "Empty Implementation Method",
                    "severity": "warning",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": file_path,
                    "line_number": start_line,
                    "description": f"Class '{cls_name}' provides an empty method body for '{m_name}()'.",
                    "evidence": "Method body is completely empty, suggesting the class was forced to implement an unused method.",
                })

            # 4. Placeholder implementation
            elif m.get("is_placeholder", False):
                findings.append({
                    "category": "isp_violation",
                    "rule_name": "Placeholder Stub Return",
                    "severity": "warning",
                    "class_name": cls_name,
                    "method_name": m_name,
                    "file_path": file_path,
                    "line_number": start_line,
                    "description": f"Class '{cls_name}' returns a dummy value in '{m_name}()'.",
                    "evidence": f"Single return statement {stub_detail} suggests dummy implementation.",
                })

    return findings
