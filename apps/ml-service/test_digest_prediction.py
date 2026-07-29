import pytest
from fastapi.testclient import TestClient
import time
from main import app

client = TestClient(app)

def test_ai_digest_endpoint():
    payload = {
        "project_name": "Nairobi High-Rise Tower",
        "project_type": "Commercial",
        "county": "Nairobi",
        "nca_contractor_grade": "NCA 1",
        "budget_ksh": 850000000.0,
        "planned_duration_days": 365,
        "completed_milestones_count": 2,
        "total_milestones_count": 8,
        "current_delay_days": 15,
        "delay_risk_score": 0.45,
        "cost_overrun_pct": 8.5
    }

    start_time = time.time()
    response = client.post("/predict/ai-digest", json=payload)
    elapsed_time = time.time() - start_time

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    assert "executive_summary" in data
    assert "schedule_variance_analysis" in data
    assert "financial_overrun_forecast" in data
    assert "key_risk_drivers" in data
    assert "recommended_mitigations" in data
    assert "model_version" in data
    assert "timestamp" in data

    assert len(data["key_risk_drivers"]) > 0
    assert len(data["recommended_mitigations"]) > 0
    assert elapsed_time < 2.0, f"[NFR02 Violation] Digest latency {elapsed_time:.3f}s exceeds 2.0s!"

    print(f"\n[PASS] /predict/ai-digest contract & NFR02 latency test passed ({elapsed_time * 1000:.2f}ms)")

if __name__ == '__main__':
    test_ai_digest_endpoint()
