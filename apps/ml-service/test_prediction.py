import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "buildops-ml-service"
    print("[PASS] /health endpoint test passed.")

def test_predict_delay_risk_schema_and_latency():
    payload = {
        "project_type": "Commercial",
        "county": "Nairobi",
        "nca_contractor_grade": "NCA 1",
        "budget_ksh": 450000000.0,
        "planned_duration_days": 365,
        "completed_milestones_count": 2,
        "total_milestones_count": 5,
        "current_delay_days": 10
    }

    start_time = time.time()
    response = client.post("/predict/delay-risk", json=payload)
    elapsed_time = time.time() - start_time

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()

    # Schema assertions
    assert "delay_risk_prob" in data, "Response must include delay_risk_prob"
    assert 0.0 <= data["delay_risk_prob"] <= 1.0, "Probability must be between 0.0 and 1.0"
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"], "Risk level must be LOW, MEDIUM, or HIGH"
    assert "model_version" in data, "Response must include model_version"

    # NFR02 Latency assertion (< 2 seconds)
    assert elapsed_time < 2.0, f"[NFR02 Violation] Latency was {elapsed_time:.4f}s (target < 2.0s)"

    print(f"[PASS] /predict/delay-risk contract & NFR02 latency test passed ({elapsed_time * 1000:.2f}ms).")

if __name__ == "__main__":
    test_health_endpoint()
    test_predict_delay_risk_schema_and_latency()
    print("[PASS] [Sprint D1 ML Test] All FastAPI inference contract tests passed successfully!")
