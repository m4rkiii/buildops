# Handover: Sprint D1 — ML Service Scaffold & Inference Contract

## Status
Done

## What was built
- Implemented Model Registry Pattern ([apps/ml-service/app/registry.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/app/registry.py)):
  - Defines versioned model artifact loader structure (`apps/ml-service/models/`).
  - Standardizes model version metadata (`delay-xgb-v1.0.0-stub`).
- Implemented Pydantic Request & Response Schemas ([apps/ml-service/app/schemas.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/app/schemas.py)):
  - `DelayRiskRequest`: `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_duration_days`, `completed_milestones_count`, `total_milestones_count`, `current_delay_days`.
  - `DelayRiskResponse`: `delay_risk_prob` (float 0.0 to 1.0), `risk_level` (`LOW`, `MEDIUM`, `HIGH`), `model_version`, `timestamp`.
- Implemented Inference Endpoint ([apps/ml-service/main.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/main.py)):
  - `POST /predict/delay-risk` handling Pydantic payload validation and returning predictions.
- Implemented Inference & Latency Contract Test ([apps/ml-service/test_prediction.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/test_prediction.py)):
  - Validates schema structure, probability bounds [0.0, 1.0], risk levels, and NFR02 latency target (< 2.0 seconds).

## How to verify

1. **Install Dependencies**:
   ```bash
   cd apps/ml-service
   pip install -r requirements.txt
   ```

2. **Run Contract & Latency Tests**:
   ```bash
   python test_prediction.py
   ```
   *Expected output*: `[PASS] [Sprint D1 ML Test] All FastAPI inference contract tests passed successfully!`

## Decisions made
- Defined explicit Pydantic schema validation for all inference parameters to guarantee contract type safety between Node.js Express API and FastAPI ML service.
- Implemented initial heuristic prediction algorithm in `registry.py` for stub contract testing; replaced by trained XGBoost classifier artifact in **Sprint D3**.

## Known gaps / deferred work
- Synthetic dataset generation is built in **Sprint D2**.
- Model training (XGBoost classifier) is built in **Sprint D3**.
- End-to-end integration (Node API calling `/predict/delay-risk` on milestone update) is built in **Sprint D4**.

## Interfaces for downstream sprints
- **`POST /predict/delay-risk`**:
  - Request:
    ```json
    {
      "project_type": "Commercial",
      "county": "Nairobi",
      "nca_contractor_grade": "NCA 1",
      "budget_ksh": 450000000.0,
      "planned_duration_days": 365,
      "completed_milestones_count": 2,
      "total_milestones_count": 5,
      "current_delay_days": 10
    }
    ```
  - Response:
    ```json
    {
      "delay_risk_prob": 0.18,
      "risk_level": "LOW",
      "model_version": "delay-xgb-v1.0.0-stub",
      "timestamp": "2026-07-28T10:00:00.000Z"
    }
    ```
