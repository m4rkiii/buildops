# Handover: Sprint D4 — Live Inference Integration & Risk Score Display (FR05)

## Status
Done

## What was built
- Implemented ML Service HTTP Client ([apps/api/src/services/mlClient.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/mlClient.js)):
  - Calls `POST /predict/delay-risk` on the FastAPI ML microservice.
  - Implements fallback estimation handling offline microservices gracefully.
- Implemented Risk Service ([apps/api/src/services/riskService.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/riskService.js)):
  - Calculates project duration and milestone progress stats (`completed_count`, `total_count`, `delay_days`).
  - Persists prediction results into the `risk_scores` database table (`score_id`, `project_id`, `delay_risk_score`, `risk_level`, `model_version`, `calculated_at`).
- Integrated API Controllers ([apps/api/src/controllers/projectController.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/controllers/projectController.js) and [milestoneController.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/controllers/milestoneController.js)):
  - Triggers automated ML delay risk re-computation whenever projects or milestones are created, updated, or deleted.
  - Enriches project queries (`GET /projects`, `GET /projects/:id`) with real-time `risk_score` objects.
- Updated Frontend UI ([apps/web/src/components/Projects/ProjectList.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectList.jsx) and [ProjectDetail.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectDetail.jsx)):
  - Displays live color-encoded AI delay risk badges (`data-testid="risk-score-badge"`):
    - **`LOW`** (< 35%): Emerald green badge
    - **`MEDIUM`** (35%–65%): Amber yellow badge
    - **`HIGH`** (>= 65%): Red alert badge
- Implemented Integration Test ([apps/api/test/risk_integration.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/risk_integration.test.js)).

## How to verify

1. **Run Integration Test**:
   ```bash
   cd apps/api
   node test/risk_integration.test.js
   ```
   *Expected output*: `[PASS] All Sprint D4 Integration Tests Passed!`.

2. **Build Web App**:
   ```bash
   cd apps/web
   npm run build
   ```
   *Expected output*: Production bundle builds cleanly in under 5 seconds.

## Decisions made
- Used asynchronous re-computation triggered directly inside controller handlers so frontend views receive updated risk scores immediately upon milestone status updates.

## Known gaps / deferred work
- Cost overrun forecast ML regression model (LightGBM) is trained in **Phase E (Sprint E1–E4)**.

## Interfaces for downstream sprints
- **`risk_scores` DB Schema**: `score_id`, `project_id`, `delay_risk_score`, `risk_level`, `model_version`, `calculated_at`
- **DOM Test ID**: `data-testid="risk-score-badge"`
