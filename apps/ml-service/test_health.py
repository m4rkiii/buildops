from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "buildops-ml-service"
    print("[PASS] [Sprint A1 ML Service Test] /health check passed successfully!")

if __name__ == "__main__":
    test_health_check()
