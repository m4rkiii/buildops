# Handover: Sprint E2 — Cost Overrun Inference Endpoint & Integration (FR06)

## Status
Done

## What was built
- Implemented ML Microservice Endpoint ([apps/ml-service/main.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/main.py)):
  - Exposed `POST /predict/cost-overrun` microservice endpoint.
  - Returns `cost_overrun_pct`, `estimated_overrun_ksh`, `model_version`, and `timestamp`.
  - Asserts NFR02 latency (< 2.0s).
- Updated Model Registry ([apps/ml-service/app/registry.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/app/registry.py)):
  - Loads `cost_lgbm_v1.joblib` trained LightGBM artifact on startup.
  - Provides fallback mathematical cost overrun estimator when un-trained.
- Implemented Express ML Client ([apps/api/src/services/mlClient.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/mlClient.js)):
  - Added `predictCostOverrun(payload)` with fallback handling offline microservices.
- Updated API Risk Service & Controllers ([apps/api/src/services/riskService.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/riskService.js)):
  - Computes cost overrun estimates simultaneously with delay risk re-computations.
  - Persists `cost_overrun_pct` into the `risk_scores` database table.
- Updated Frontend UI ([apps/web/src/components/Projects/ProjectList.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectList.jsx) & [ProjectDetail.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectDetail.jsx)):
  - Displays color-coded live cost overrun badges (`data-testid="cost-overrun-badge"`).
  - Displays financial overrun projections in KSh alongside total budget and timeline.
- Integration Test Suite ([apps/api/test/cost_integration.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/cost_integration.test.js)):
  - 100% automated test suite passing for live cost overrun inference and DB persistence.

## How to verify

1. **Run ML Microservice Test**:
   ```bash
   cd apps/ml-service
   python test_cost_prediction.py
   ```
   *Expected output*: `[PASS] /predict/cost-overrun contract & NFR02 latency test passed`.

2. **Run Express API Cost Integration Test**:
   ```bash
   cd apps/api
   node test/cost_integration.test.js
   ```
   *Expected output*: `[PASS] All Sprint E2 Integration Tests Passed!`.

3. **Build Frontend**:
   ```bash
   cd apps/web
   npm run build
   ```
   *Expected output*: `✓ built in ~6.38s`.

## Decisions made
- Bundled delay risk and cost overrun inference calls into parallel HTTP requests (`Promise.all`) inside `riskService.js` to minimize backend latency impact.

## Known gaps / deferred work
- SMS alert notifications for high cost overrun / high delay risks are implemented in **Phase F (Sprint F1–F2)**.

## Interfaces for downstream sprints
- **`POST /predict/cost-overrun` API contract**:
  - Request: `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_duration_days`, `completed_milestones_count`, `total_milestones_count`, `current_delay_days`.
  - Response: `cost_overrun_pct`, `estimated_overrun_ksh`, `model_version`, `timestamp`.
- **DOM Test ID**: `data-testid="cost-overrun-badge"`
