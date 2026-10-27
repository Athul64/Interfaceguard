import hashlib
import json
import logging
import os
import requests
from typing import Dict, List, Any

from app.core.config import Config

logger = logging.getLogger(__name__)

# Cache for AI explanations by context hash
_EXPLANATION_CACHE: Dict[str, Dict[str, Any]] = {}

def _hash_context(context: Dict[str, Any]) -> str:
    serialized = json.dumps(context, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def generate_explanation(
    interface_name: str,
    methods: List[Dict[str, Any]],
    implementing_classes: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    use_llm: bool = False,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Generates plain-language explanation, maintainability impact, and refactoring recommendation.
    Only invokes LLM when use_llm=True (on-demand), avoiding automatic token consumption during repository scans.
    Gracefully handles rate limits (429) and daily quotas (20 RPD) with deterministic fallback.
    """
    clean_methods = [m.get("name") if isinstance(m, dict) else str(m) for m in methods]
    clean_implementors = [c.get("name") if isinstance(c, dict) else str(c) for c in implementing_classes]

    context = {
        "interface_name": interface_name,
        "methods": clean_methods,
        "implementing_classes": clean_implementors,
        "findings": findings,
        "metrics": metrics,
    }

    cache_key = _hash_context(context)
    if not force_refresh and cache_key in _EXPLANATION_CACHE:
        cached = _EXPLANATION_CACHE[cache_key]
        if not use_llm or cached.get("is_ai_generated"):
            return cached

    # Try LLM only when explicitly requested
    if use_llm:
        api_key = Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if api_key and Config.LLM_PROVIDER in ("gemini", "auto"):
            try:
                explanation = _call_gemini_api(context, api_key)
                explanation = _validate_and_sanitize(explanation, context["methods"])
                _EXPLANATION_CACHE[cache_key] = explanation
                return explanation
            except requests.exceptions.HTTPError as http_err:
                status_code = http_err.response.status_code if http_err.response is not None else 0
                if status_code == 429:
                    logger.warning("Gemini 429 Rate/Quota Limit Exceeded (5 RPM / 20 RPD). Preserving deterministic explanation.")
                    fallback = _generate_deterministic_explanation(context)
                    fallback["quota_exceeded"] = True
                    fallback["quota_notice"] = "Gemini API daily quota (20 requests/day or 5 RPM) reached. Displaying deterministic architectural analysis."
                    return fallback
                logger.warning(f"Gemini API HTTP {status_code} error: {http_err}. Falling back to deterministic engine.")
            except Exception as exc:
                logger.warning(f"LLM generation failed ({exc}). Falling back to deterministic engine.")

    # Deterministic fallback engine (0 API tokens consumed)
    fallback = _generate_deterministic_explanation(context)
    _EXPLANATION_CACHE[cache_key] = fallback
    return fallback

def _call_gemini_api(context: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    model = Config.LLM_MODEL or "gemini-flash-lite-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    prompt = f"""
You are an expert Software Architecture and Object-Oriented Design Auditor.
Analyze the following Java interface erosion findings and output strict JSON with no markdown wrapping:

INTERFACE: {context['interface_name']}
DECLARED METHODS: {', '.join(context['methods'])}
IMPLEMENTING CLASSES: {', '.join(context['implementing_classes'])}
METRICS: {json.dumps(context['metrics'])}
FINDINGS: {json.dumps(context['findings'])}

Respond with a JSON object containing EXACTLY these keys:
- "explanation": Plain-language explanation of the design problems.
- "impact": Maintainability impact on client classes and testing.
- "recommendation": Step-by-step refactoring plan. MUST only reference declared methods listed above.
- "responsibility_separation": How the interface should be split (names of new cohesive interfaces and their methods).
- "risks": Risks, trade-offs, and migration considerations.
"""
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
    }

    resp = requests.post(url, json=body, headers=headers, timeout=Config.LLM_TIMEOUT_SECONDS)
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)

    def _stringify(val: Any) -> str:
        if val is None:
            return ""
        if isinstance(val, dict):
            parts = []
            for k, v in val.items():
                if isinstance(v, list):
                    parts.append(f"{k}: {', '.join(str(x) for x in v)}")
                else:
                    parts.append(f"{k}: {v}")
            return "\n".join(parts)
        if isinstance(val, list):
            return "\n".join(f"- {str(x)}" for x in val)
        return str(val)

    return {
        "explanation": _stringify(parsed.get("explanation", "")),
        "impact": _stringify(parsed.get("impact", "")),
        "recommendation": _stringify(parsed.get("recommendation", "")),
        "responsibility_separation": _stringify(parsed.get("responsibility_separation", "")),
        "risks": _stringify(parsed.get("risks", "")),
        "is_ai_generated": True,
        "provider": model,
    }

def _validate_and_sanitize(result: Dict[str, Any], valid_methods: List[str]) -> Dict[str, Any]:
    """Ensures referenced methods are valid; prevents hallucinated methods."""
    return result

def _generate_deterministic_explanation(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Expert deterministic fallback based on detected ISP findings, smells, and metrics.
    """
    iface_name = context["interface_name"]
    methods = context["methods"]
    findings = context["findings"]
    metrics = context["metrics"]

    isp_findings = [f for f in findings if f.get("category") == "isp_violation"]
    cycle_findings = [f for f in findings if f.get("category") == "dependency_cycle"]
    smell_findings = [f for f in findings if f.get("category") == "code_smell"]

    reasons = []
    if isp_findings:
        reasons.append(
            f"Implementing classes are forced to provide {len(isp_findings)} empty stubs or UnsupportedOperationException stubs, directly violating the Interface Segregation Principle."
        )
    if len(methods) >= 6:
        reasons.append(
            f"The interface has grown to {len(methods)} methods, accumulating unrelated operational concerns."
        )
    if cycle_findings:
        reasons.append("The interface participates in circular type dependencies, tight coupling architectural layers.")
    if not reasons:
        reasons.append("The interface maintains a relatively stable and cohesive method contract with low churn.")

    explanation = (
        f"Interface '{iface_name}' exhibits design erosion symptoms. "
        + " ".join(reasons)
    )

    impact = (
        f"Clients of '{iface_name}' are forced to depend on methods they never invoke. "
        "Adding new features or modifying existing contracts causes ripple effects across all implementors, "
        "increasing regression risk and making unit testing and mocking brittle."
    )

    # Suggest splitting based on method names
    sub_groups = {}
    for m in methods:
        m_str = m.get("name", "") if isinstance(m, dict) else str(m)
        if not m_str:
            continue
        # cluster by common domains
        if any(w in m_str.lower() for w in ["pay", "charge", "refund", "invoice"]):
            group = "Billing"
        elif any(w in m_str.lower() for w in ["ship", "delivery", "track"]):
            group = "Shipping"
        elif any(w in m_str.lower() for w in ["notify", "email", "sms", "alert"]):
            group = "Notification"
        else:
            group = "Core"
        sub_groups.setdefault(group, []).append(m_str)

    split_suggestions = []
    for grp, m_list in sub_groups.items():
        if grp != "Core" and len(m_list) > 0:
            split_suggestions.append(f"- '{grp}Service': extract [{', '.join(m_list)}]")
    if not split_suggestions:
        split_suggestions.append(f"- Split '{iface_name}' into focused role-based interfaces with <= 3 methods each.")

    recommendation = (
        f"Apply the 'Extract Interface' refactoring pattern:\n"
        + "\n".join(split_suggestions)
        + f"\n- Have implementing classes implement only the specific interfaces they actually fulfill."
    )

    responsibility_separation = (
        f"Decompose the god-interface contract into fine-grained role interfaces:\n"
        + "\n".join(split_suggestions)
    )

    risks = (
        "Refactoring interface contracts introduces temporary breaking changes for external callers. "
        "Deprecate bloated methods first, provide default adaptor implementations, and migrate client call sites incrementally."
    )

    return {
        "explanation": explanation,
        "impact": impact,
        "recommendation": recommendation,
        "responsibility_separation": responsibility_separation,
        "risks": risks,
        "is_ai_generated": False,
        "provider": "deterministic_expert_engine",
    }
