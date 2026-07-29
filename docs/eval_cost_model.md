# Model Evaluation Report: LightGBM Cost Overrun Regressor (Sprint E1 / FR06)

## 1. Overview
The **LightGBM Cost Overrun Forecasting Model** predicts continuous estimated project cost overrun percentages (`cost_overrun_pct`) based on project metadata, financial budget size, duration, milestone progress, and current delay days.

- **Model Type**: `LGBMRegressor` (LightGBM gradient boosting machine)
- **Artifact Path**: `apps/ml-service/models/cost_lgbm_v1.joblib`
- **Training Data**: 1,000 synthetic construction project records (`db/seed/synthetic_projects.csv`)
- **Evaluation Split**: 80/20 train/test split (random seed 42)

---

## 2. Evaluation Metrics

| Metric | Score | Target | Status |
|---|---|---|---|
| **$R^2$ Score** | **0.4439** | > 0.40 | PASS |
| **Mean Absolute Error (MAE)** | **7.90%** | < 9.0% | PASS |
| **Root Mean Squared Error (RMSE)** | **10.42%** | < 12.0% | PASS |

---

## 3. Input Features
- Categorical: `project_type`, `county`, `nca_contractor_grade` (OneHotEncoded)
- Numeric: `budget_ksh`, `planned_duration_days`, `completed_milestones_count`, `total_milestones_count`, `current_delay_days`, `delay_ratio`, `progress_ratio`, `is_delayed_signal` (StandardScaled)

---

## 4. Downstream Integration
Exposed via FastAPI endpoint `POST /predict/cost-overrun` in Sprint E2.
