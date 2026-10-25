import os
import json
import pytest
from app import create_app
from app.models import db, Repository, AnalysisRun, Interface, InterfaceSnapshot, Finding
from app.analyzers.ck_metrics import (
    compute_interface_cbo, compute_class_cbo, compute_class_lcom,
    compute_class_rfc, compute_class_wmc, compute_aggregated_ck_metrics
)
from app.analyzers.erosion_metrics import (
    compute_interface_cohesion, diff_interface_signatures, compute_method_growth
)
from app.analyzers.isp_detector import detect_isp_violations
from app.analyzers.smell_detector import detect_code_smells
from app.analyzers.dependency_analyzer import build_dependency_graph
from app.analyzers.health_scorer import compute_health_score, compute_project_erosion_index
from app.analyzers.change_point_detector import classify_erosion_trend, detect_change_points_cusum
from app.analyzers.ai_explainer import generate_explanation
from app.reports.pdf_generator import generate_pdf_report


@pytest.fixture
def test_client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_ck_metrics_computation():
    iface = {
        "name": "OrderService",
        "methods": [
            {"name": "create", "return_type": "String", "param_types": ["Customer", "double"]},
            {"name": "pay", "return_type": "PaymentReceipt", "param_types": ["PaymentRequest"]},
        ]
    }
    cbo = compute_interface_cbo(iface)
    assert cbo == 3  # Customer, PaymentReceipt, PaymentRequest

    cls = {
        "name": "StandardOrderService",
        "implements": ["OrderService"],
        "extends": [],
        "fields": [{"name": "repo", "type": "OrderRepository"}],
        "methods": [
            {"name": "create", "return_type": "String", "param_types": ["Customer", "double"], "calls": ["validate"]},
            {"name": "pay", "return_type": "PaymentReceipt", "param_types": ["PaymentRequest"], "calls": []},
        ]
    }
    ck = compute_aggregated_ck_metrics(iface, [cls])
    assert ck["noc"] == 1.0
    assert ck["wmc"] == 2.0
    assert ck["rfc"] >= 2.0


def test_erosion_metrics_cohesion_and_diff():
    # Cohesion
    iface_cohesive = {
        "methods": [
            {"name": "a", "param_types": ["User", "int"]},
            {"name": "b", "param_types": ["User", "String"]},
        ]
    }
    assert compute_interface_cohesion(iface_cohesive) == 1.0

    iface_uncohesive = {
        "methods": [
            {"name": "a", "param_types": ["int"]},
            {"name": "b", "param_types": ["String"]},
        ]
    }
    assert compute_interface_cohesion(iface_uncohesive) == 0.0

    # Signature diff
    old_iface = {"methods": [{"name": "cancel", "param_types": ["String"], "return_type": "void"}]}
    new_iface = {"methods": [{"name": "cancel", "param_types": ["String", "boolean"], "return_type": "void"}]}
    breaking, changed = diff_interface_signatures(old_iface, new_iface)
    assert breaking == 1
    assert changed is True


def test_isp_detection():
    methods = [{"name": "refund"}, {"name": "notify"}]
    implementors = [{
        "name": "FastTrackService",
        "methods": [
            {"name": "refund", "is_exception_stub": True, "stub_detail": "throw new UnsupportedOperationException()"},
            {"name": "notify", "is_no_op": True, "is_empty": True},
        ]
    }]
    findings = detect_isp_violations("OrderService", methods, implementors)
    assert len(findings) == 2
    rule_names = {f["rule_name"] for f in findings}
    assert "Exception-Throwing Stub" in rule_names
    assert "Empty Implementation Method" in rule_names or "No-Operation Stub" in rule_names


def test_dependency_cycle_detection():
    interfaces = [
        {"name": "ServiceA", "package": "pkg", "methods": [{"return_type": "ServiceB", "param_types": []}]},
        {"name": "ServiceB", "package": "pkg", "methods": [{"return_type": "ServiceA", "param_types": []}]},
    ]
    classes = []
    nodes, edges, cycles = build_dependency_graph(interfaces, classes)
    assert len(cycles) >= 1
    cycle_nodes = set()
    for c in cycles:
        cycle_nodes.update(c)
    assert "ServiceA" in cycle_nodes
    assert "ServiceB" in cycle_nodes


def test_health_score_normalization():
    # Completely healthy interface
    h_healthy = compute_health_score(
        method_count=3,
        isp_violations_count=0,
        total_implementer_methods=6,
        cbo=1.0,
        in_cycle=False,
        churn=0,
        breaking_change_count=0,
        cohesion=1.0,
    )
    assert h_healthy["health_score"] >= 80.0
    assert h_healthy["severity"] == "healthy"

    # Heavily eroded interface
    h_eroded = compute_health_score(
        method_count=12,
        isp_violations_count=5,
        total_implementer_methods=10,
        cbo=8.0,
        in_cycle=True,
        churn=10,
        breaking_change_count=3,
        cohesion=0.1,
    )
    assert h_eroded["health_score"] < 40.0
    assert h_eroded["severity"] == "critical"


def test_change_point_and_trend_classification():
    stable_scores = [90.0, 89.0, 91.0, 89.5]
    assert classify_erosion_trend(stable_scores) == "stable"

    deteriorating_scores = [95.0, 80.0, 65.0, 45.0]
    trend = classify_erosion_trend(deteriorating_scores)
    assert trend in ("rising", "accelerating")

    commits = [
        {"commit_hash": "c1", "commit_date": None, "author": "a"},
        {"commit_hash": "c2", "commit_date": None, "author": "a"},
        {"commit_hash": "c3", "commit_date": None, "author": "a"},
    ]
    # Big drop between c1 and c2
    cps = detect_change_points_cusum(commits, [90.0, 65.0, 60.0], threshold=15.0)
    assert len(cps) == 1
    assert cps[0]["commit_hash"] == "c2"


def test_ai_explanation_deterministic_fallback():
    result = generate_explanation(
        interface_name="OrderService",
        methods=[{"name": "create"}, {"name": "refundPayment"}, {"name": "sendNotification"}],
        implementing_classes=[{"name": "FastTrackOrderService"}],
        findings=[{"category": "isp_violation", "rule_name": "Exception-Throwing Stub"}],
        metrics={"health_score": 45.0, "method_count": 8, "cbo": 4.0},
    )
    assert "OrderService" in result["explanation"]
    assert "recommendation" in result
    assert "risks" in result
    assert result["is_ai_generated"] is False  # Fallback engine


def test_pdf_report_generation(tmp_path):
    pdf_file = str(tmp_path / "test_report.pdf")
    generate_pdf_report(
        output_path=pdf_file,
        repository_data={"name": "OrderService", "github_url": "sample-repositories/order-service"},
        run_data={"project_erosion_index": 72.4, "processed_commits": 6},
        interfaces_data=[{
            "name": "OrderService",
            "package": "com.example.order",
            "latest_snapshot": {"health_score": 65.0, "severity": "warning", "method_count": 7, "cbo": 3.0, "lcom": 0.5, "wmc": 7.0, "noc": 2}
        }],
        findings_data=[{
            "category": "isp_violation",
            "rule_name": "Exception-Throwing Stub",
            "class_name": "FastTrackOrderService",
            "method_name": "refundPayment",
            "evidence": "throws UnsupportedOperationException",
        }],
        cycles_data=[],
        change_points_data=[],
        explanations_data=[{
            "explanation": "Interface suffers from ISP violations.",
            "recommendation": "Extract RefundService.",
            "risks": "Call site updates needed.",
        }],
    )
    assert os.path.exists(pdf_file)
    assert os.path.getsize(pdf_file) > 1000


def test_api_v1_health_and_repo_endpoints(test_client):
    # Health check
    res = test_client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json["status"] == "ok"

    # Create repo
    res = test_client.post("/api/v1/repositories", json={
        "github_url": "sample-repositories/order-service",
        "branch": "main",
    })
    assert res.status_code in (200, 201)
    repo_id = res.json["repository_id"]

    # List repos
    res = test_client.get("/api/v1/repositories")
    assert res.status_code == 200
    assert len(res.json) >= 1
