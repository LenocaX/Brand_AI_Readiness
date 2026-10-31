from core.scoring import (
    calculate_readiness_score,
    calculate_severity_summary,
    get_readiness_label,
)

def test_no_findings_current_penalty_model():
    assert calculate_readiness_score([]) == 100

def test_high_finding_penalty():
    findings = [{"severity": "high"}]
    assert calculate_readiness_score(findings) == 90

def test_score_never_below_zero():
    findings = [{"severity": "critical"} for _ in range(10)]
    assert calculate_readiness_score(findings) == 0

def test_severity_summary():
    findings = [
        {"severity": "high"},
        {"severity": "low"},
        {"severity": "high"},
    ]
    result = calculate_severity_summary(findings)
    assert result["high"] == 2
    assert result["low"] == 1

def test_label():
    assert get_readiness_label(95) == "Excellent"
    assert get_readiness_label(50) == "Poor"