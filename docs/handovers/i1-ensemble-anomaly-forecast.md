# Handover: Sprint I1–I3 — Secondary & Stretch ML Objectives (FR10)

## Status
Done

## What was built
- **Multi-Model Risk Ensemble**: Combined XGBoost delay risk classifier with Random Forest classifier pipeline (`ensemble_rf_v1.joblib`) for weighted delay probability estimation.
- **Isolation Forest Anomaly Detector**: Trained Isolation Forest model (`anomaly_iforest_v1.joblib`) & domain rule evaluator exposed via `POST /predict/anomaly-check` in FastAPI and proxied via `GET /projects/:id/anomaly-check` in Node.js API.
- **Milestone Schedule Forecast**: Implemented Prophet-style completion trajectory engine calculating projected end dates, milestone velocity, and estimated schedule drift.
- **Frontend Dashboard Integration**: Created `ScheduleForecastCard.jsx` and `AnomalyBadge.jsx` embedded inside `ProjectDetail.jsx`.
- **Automated Test Suite**: Added 7 Pytest cases in `apps/ml-service` and integration test suite `apps/api/test/phase_i_ml.test.js`.

## How to verify

1. **Run ML Service Pytest Suite**:
   ```bash
   cd apps/ml-service
   python train_ensemble_anomaly.py
   python -m pytest
   ```

2. **Run Express API Integration Test Suite**:
   ```bash
   cd apps/api
   npm test
   ```

## Decisions made
- Random Forest model trained with max depth of 6 and 100 estimators to provide complementary probability bounds alongside XGBoost logloss output.
- Isolation Forest anomaly contamination factor set to 5% with score normalization mapped into [0.0, 1.0] for intuitive UX representation.

## Known gaps / deferred work
- Production deployment hardening and NFR performance optimization follow in **Phase J**.

## Interfaces for downstream sprints
- **FastAPI Endpoints**: `POST /predict/anomaly-check`, `POST /predict/schedule-forecast`.
- **Core API Endpoints**: `GET /projects/:id/schedule-forecast`, `GET /projects/:id/anomaly-check`.
