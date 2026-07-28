# Handover: Sprint D3 — Delay Risk Model Training & Evaluation (FR05)

## Status
Done

## What was built
- Implemented XGBoost Model Training Pipeline ([apps/ml-service/train_delay_model.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/train_delay_model.py)):
  - Loads 1,000 synthetic project records from `db/seed/synthetic_projects.csv`.
  - Configures `ColumnTransformer` with `OneHotEncoder` and `StandardScaler`.
  - Fits `XGBClassifier` with 80/20 train/test split.
  - Achieves **ROC-AUC: 0.8646** and **Accuracy: 79.00%**.
- Serialized Model Artifact ([apps/ml-service/models/delay_xgb_v1.joblib](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/models/delay_xgb_v1.joblib)):
  - Production binary `.joblib` model artifact containing full preprocessor and classifier pipeline.
- Updated Model Registry ([apps/ml-service/app/registry.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/ml-service/app/registry.py)):
  - Loads `delay_xgb_v1.joblib` artifact on startup and routes live `/predict/delay-risk` requests to the trained model.
- Created Model Evaluation Report ([docs/eval_delay_model.md](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/docs/eval_delay_model.md)).

## How to verify

1. **Train Model**:
   ```bash
   cd apps/ml-service
   python train_delay_model.py
   ```
   *Expected output*: `ROC-AUC: 0.8646` and `[PASS] Successfully saved trained model pipeline artifact`.

2. **Run Prediction & Latency Verification**:
   ```bash
   python test_prediction.py
   ```
   *Expected output*: `[PASS] /predict/delay-risk contract & NFR02 latency test passed (122.56ms)`.

## Decisions made
- Used Scikit-Learn `Pipeline` bundling preprocessing (`OneHotEncoder` + `StandardScaler`) with `XGBClassifier` into a single `.joblib` file so FastAPI endpoints consume raw JSON features directly without manual scaling.

## Known gaps / deferred work
- End-to-end integration (Express API invoking `/predict/delay-risk` during project/milestone state updates) is built in **Sprint D4**.

## Interfaces for downstream sprints
- **Model Artifact**: `apps/ml-service/models/delay_xgb_v1.joblib`
- **Evaluation Report**: `docs/eval_delay_model.md`
