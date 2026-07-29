import pytest
from fastapi.testclient import TestClient
import time
from main import app

client = TestClient(app)

def test_cost_overrun_endpoint():
    payload = {
        "project_type": "Commercial",
        "county": "Nairobi",
        "nca_contractor_grade": "NCA 1",
        "budget_ksh": 500000000.0,
        "planned_duration_days": 365,
        "completed_milestones_count": 2,
        "total_milestones_count": 8,
        "current_delay_days": 15
    }

    start_time = time.time()
    response = client.post("/predict/cost-overrun", json=payload)
    elapsed_time = time.time() - start_time

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    assert "cost_overrun_pct" in data
    assert "estimated_overrun_ksh" in data
    assert "model_version" in data
    assert "timestamp" in data

    assert isinstance(data["cost_overrun_pct"], float)
    assert data["cost_overrun_pct"] >= 0.0
    assert isinstance(data["estimated_overrun_ksh"], float)
    assert data["estimated_overrun_ksh"] >= 0.0

    # NFR02 Latency assertion (< 2.0 seconds)
    assert elapsed_time < 2.0, f"[NFR02 Violation] Latency {elapsed_time:.3f}s exceeds 2.0s requirement!"

    print(f"\n[PASS] /predict/cost-overrun contract & NFR02 latency test passed ({elapsed_time * 1000:.2f}ms)")

if __name__ == '__main__':
    test_cost_overrun_endpoint()
