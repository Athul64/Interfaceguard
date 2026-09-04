from app.services.metrics_service import (
    compute_method_count,
    compute_dependency_count,
    compute_isp_violation_ratio,
    diff_signatures,
)

COHESIVE_INTERFACE = {
    "name": "PaymentProcessor",
    "methods": [
        {"name": "charge", "params": 1, "param_types": ["Card"], "return_type": "Receipt"},
        {"name": "refund", "params": 1, "param_types": ["Card"], "return_type": "Receipt"},
        {"name": "validate", "params": 1, "param_types": ["Card"], "return_type": "boolean"},
    ],
}

FAT_INTERFACE = {
    "name": "GodService",
    "methods": [
        {"name": "processPayment", "params": 1, "param_types": ["Card"], "return_type": "Receipt"},
        {"name": "sendEmail", "params": 1, "param_types": ["EmailMessage"], "return_type": "void"},
        {"name": "generateReport", "params": 1, "param_types": ["ReportConfig"], "return_type": "Report"},
        {"name": "shipOrder", "params": 1, "param_types": ["ShippingAddress"], "return_type": "void"},
    ],
}

EMPTY_INTERFACE = {"name": "Marker", "methods": []}
SINGLE_METHOD_INTERFACE = {"name": "Runnable2", "methods": [
    {"name": "run", "params": 0, "param_types": [], "return_type": "void"}
]}


def test_method_count():
    assert compute_method_count(COHESIVE_INTERFACE) == 3
    assert compute_method_count(EMPTY_INTERFACE) == 0


def test_dependency_count_excludes_primitives():
    result = COHESIVE_INTERFACE
    # Card, Receipt are non-primitive; boolean is primitive and excluded
    assert compute_dependency_count(result) == 2


def test_dependency_count_counts_distinct_types_once():
    # Card, Receipt, EmailMessage, ReportConfig, Report, ShippingAddress = 6 distinct types
    assert compute_dependency_count(FAT_INTERFACE) == 6


def test_isp_ratio_zero_for_cohesive_interface():
    # All 3 methods share the same param type (Card) -> every pair related -> 0.0
    assert compute_isp_violation_ratio(COHESIVE_INTERFACE) == 0.0


def test_isp_ratio_high_for_fat_interface():
    # No two methods share a param type -> every pair unrelated -> 1.0
    assert compute_isp_violation_ratio(FAT_INTERFACE) == 1.0


def test_isp_ratio_zero_for_fewer_than_two_methods():
    assert compute_isp_violation_ratio(EMPTY_INTERFACE) == 0.0
    assert compute_isp_violation_ratio(SINGLE_METHOD_INTERFACE) == 0.0


def test_diff_signatures_first_appearance_is_not_breaking():
    breaking, changed = diff_signatures(None, COHESIVE_INTERFACE)
    assert breaking == 0
    assert changed is False


def test_diff_signatures_detects_removed_method_as_breaking():
    old = COHESIVE_INTERFACE
    new = {"name": "PaymentProcessor", "methods": [old["methods"][0], old["methods"][1]]}  # dropped "validate"
    breaking, changed = diff_signatures(old, new)
    assert breaking == 1
    assert changed is True


def test_diff_signatures_detects_changed_param_type_as_breaking():
    old = COHESIVE_INTERFACE
    new_methods = [dict(m) for m in old["methods"]]
    new_methods[0] = {**new_methods[0], "param_types": ["CreditCard"]}  # changed from "Card"
    new = {"name": "PaymentProcessor", "methods": new_methods}
    breaking, changed = diff_signatures(old, new)
    assert breaking == 1
    assert changed is True


def test_diff_signatures_added_method_is_changed_but_not_breaking():
    old = COHESIVE_INTERFACE
    new_methods = old["methods"] + [
        {"name": "getHistory", "params": 0, "param_types": [], "return_type": "List"}
    ]
    new = {"name": "PaymentProcessor", "methods": new_methods}
    breaking, changed = diff_signatures(old, new)
    assert breaking == 0
    assert changed is True


def test_diff_signatures_identical_signature_is_unchanged():
    breaking, changed = diff_signatures(COHESIVE_INTERFACE, COHESIVE_INTERFACE)
    assert breaking == 0
    assert changed is False