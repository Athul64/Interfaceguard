from app.services.interface_extractor import extract_interfaces

SIMPLE_INTERFACE = """
public interface PaymentGateway {
    void processPayment(PaymentRequest req);
    RefundResponse refund(String txId);
    boolean validate(Card card);
}
"""

NO_INTERFACE = """
public class Helper {
    public static int add(int a, int b) { return a + b; }
}
"""

MULTIPLE_INTERFACES = """
interface A { void foo(); }
interface B { void bar(int x); void baz(); }
"""

BROKEN_SYNTAX = """
public interface Broken {
    void missingSemicolon()
}
"""


def test_extracts_single_interface_with_methods():
    result = extract_interfaces(SIMPLE_INTERFACE, "PaymentGateway.java")
    assert len(result) == 1
    assert result[0]["name"] == "PaymentGateway"
    assert len(result[0]["methods"]) == 3


def test_returns_empty_list_when_no_interface_present():
    assert extract_interfaces(NO_INTERFACE, "Helper.java") == []


def test_extracts_multiple_interfaces_from_one_file():
    result = extract_interfaces(MULTIPLE_INTERFACES, "Multi.java")
    assert {i["name"] for i in result} == {"A", "B"}


def test_method_param_count_is_captured():
    result = extract_interfaces(SIMPLE_INTERFACE, "PaymentGateway.java")
    methods = {m["name"]: m["params"] for m in result[0]["methods"]}
    assert methods["processPayment"] == 1


def test_malformed_java_does_not_raise():
    assert extract_interfaces(BROKEN_SYNTAX, "Broken.java") == []