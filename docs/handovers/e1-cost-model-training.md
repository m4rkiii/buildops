# Handover: Sprint E1 — Cost Overrun Model Training & Evaluation (FR06)

## Status
Done

## What was built
- Implemented LightGBM Model Training Pipeline ([apps/ml-service/train_cost_model.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/train_cost_model.py)):
  - Loads 1,000 synthetic project records from `db/seed/synthetic_projects.csv`.
  - Engineers `delay_ratio`, `progress_ratio`, and `is_delayed_signal` features.
  - Configures `ColumnTransformer` with `OneHotEncoder` and `StandardScaler`.
  - Fits `LGBMRegressor` with 80/20 train/test split.
  - Achieves **$R^2$: 0.4439** and **MAE: 7.90%**.
- Serialized Model Artifact ([apps/ml-service/models/cost_lgbm_v1.joblib](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/models/cost_lgbm_v1.joblib)):
  - Production binary `.joblib` model artifact containing full preprocessor and regressor pipeline.
- Created Model Evaluation Report ([docs/eval_cost_model.md](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/docs/eval_cost_model.md)).

## How to verify

1. **Train & Evaluate Model**:
   ```bash
   cd apps/ml-service
   python train_cost_model.py
   ```
   *Expected output*: `R^2 Score: 0.4439`, `MAE: 7.90%` and `[PASS] Successfully saved trained LightGBM cost overrun artifact`.

## Decisions made
- Engineered explicit non-linear ratio features (`delay_ratio`, `progress_ratio`) to capture cost overrun risk signals directly from schedule variance.

## Known gaps / deferred work
- Exposing live FastAPI microservice endpoint `/predict/cost-overrun` and Express API integration is completed in **Sprint E2**.

## Interfaces for downstream sprints
- **Model Artifact**: `apps/ml-service/models/cost_lgbm_v1.joblib`
- **Evaluation Report**: `docs/eval_cost_model.md`
