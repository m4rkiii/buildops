# Handover: Sprint D2 — Synthetic Dataset Generator

## Status
Done

## What was built
- Implemented Synthetic Dataset Generator Script ([db/seed/generate_synthetic.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/db/seed/generate_synthetic.py)):
  - Generates 1,000 synthetic construction project records with fixed random seed (`np.random.seed(42)`).
  - Features calibrated to Kenyan statistics (16 counties, 5 project types, NCA contractor grades 1–8, log-normal budget distribution KSh 5M – 2.5B).
  - Target labels calibrated to Auditor-General published figures (~42% delay rate) and IMF cost-overrun estimates.
- Generated Dataset CSV ([db/seed/synthetic_projects.csv](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/db/seed/synthetic_projects.csv)):
  - 1,000 clean records with zero null values.
- Implemented Dataset Integrity Test ([db/seed/test_dataset.py](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/db/seed/test_dataset.py)):
  - Verifies record count >= 1000, zero missing values, and delay label calibration within [35%, 50%] range.

## How to verify

1. **Generate Dataset**:
   ```bash
   python db/seed/generate_synthetic.py
   ```

2. **Run Integrity & Calibration Tests**:
   ```bash
   python db/seed/test_dataset.py
   ```
   *Expected output*: `[PASS] Synthetic dataset integrity and calibration test passed successfully!`

## Decisions made
- Used log-normal distribution for budget values to match real-world Kenyan public and commercial construction tender distributions.
- Added both binary `delayed` target (for Sprint D3 XGBoost Classifier) and continuous `cost_overrun_pct` target (for Sprint E1 LightGBM Regression Model).

## Known gaps / deferred work
- XGBoost classification model training on this dataset is performed in **Sprint D3**.
- LightGBM cost overrun model training on this dataset is performed in **Sprint E1**.

## Interfaces for downstream sprints
- **Dataset File**: [synthetic_projects.csv](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/db/seed/synthetic_projects.csv)
- **Columns**:
  `project_id`, `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_duration_days`, `completed_milestones_count`, `total_milestones_count`, `current_delay_days`, `delayed`, `cost_overrun_pct`
