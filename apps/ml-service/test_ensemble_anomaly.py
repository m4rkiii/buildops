import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_anomaly_check_endpoint():
    client.get("/health")
    payload = {
        "project_type": "Infrastructure",
        "county": "Nairobi",
        "nca_contractor_grade": "NCA 1",
        "budget_ksh": 15000000000.0,  # Extreme budget triggering outlier
        "planned_duration_days": 365,
        "completed_milestones_count": 2,
        "total_milestones_count": 5,
        "current_delay_days": 400
    }

    start_time = time.time()
    response = client.post("/predict/anomaly-check", json=payload)
    elapsed_time = time.time() - start_time

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    assert "is_anomaly" in data
    assert "anomaly_score" in data
    assert "detected_outliers" in data
    assert "model_version" in data
    assert data["is_anomaly"] is True
    assert len(data["detected_outliers"]) >= 1
    assert elapsed_time < 2.0, f"Latency {elapsed_time:.3f}s exceeds 2.0s requirement!"
    print(f"\n[PASS] /predict/anomaly-check contract & latency test passed ({elapsed_time*1000:.2f}ms)")

def test_schedule_forecast_endpoint():
    client.get("/health")
    payload = {
        "planned_start_date": "2026-01-01",
        "planned_end_date": "2026-12-31",
        "completed_milestones_count": 3,
        "total_milestones_count": 10,
        "current_delay_days": 15
    }

    start_time = time.time()
    response = client.post("/predict/schedule-forecast", json=payload)
    elapsed_time = time.time() - start_time

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    assert "projected_completion_date" in data
    assert "estimated_schedule_drift_days" in data
    assert "confidence_level" in data
    assert "velocity_rate_milestones_per_month" in data
    assert "model_version" in data
    assert data["estimated_schedule_drift_days"] >= 15
    assert elapsed_time < 2.0, f"Latency {elapsed_time:.3f}s exceeds 2.0s requirement!"
    print(f"[PASS] /predict/schedule-forecast contract & latency test passed ({elapsed_time*1000:.2f}ms)")

if __name__ == '__main__':
    test_anomaly_check_endpoint()
    test_schedule_forecast_endpoint()
