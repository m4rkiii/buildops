# BuildOps Sentinel

BuildOps Sentinel is an AI-powered construction project monitoring, predictive risk intelligence, and decision support platform tailored for the Kenyan construction sector.

## Architecture & Monorepo Layout

```
buildops-sentinel/
├── CLAUDE.md             # Master Agent Build Sequence & Execution Rules
├── test_master_suite.js  # Master Monorepo Regression Suite Runner
├── render.yaml           # Render deployment configuration
├── apps/
│   ├── web/              # React 18 + Tailwind CSS + Lucide Icons Dashboard
│   ├── api/              # Node.js 20 + Express 4 REST API Service (Auth, Projects, Milestones, Alerts)
│   └── ml-service/       # Python 3.11 + FastAPI Machine Learning Microservice (XGBoost, LightGBM, Random Forest, Isolation Forest, Prophet)
├── db/
│   ├── migrations/       # PostgreSQL 15 Database Schema Migrations
│   └── seed/             # Synthetic Dataset Generator & 1,000 Record Construction CSV
└── docs/
    ├── handovers/        # Complete Sprint & Phase Handover Documentation (Phases A–K)
    ├── api-contract.md   # Master REST API Endpoint Contract Specification
    ├── eval_delay_model.md
    └── eval_cost_model.md
```

## AI & ML Model Capabilities

1. **XGBoost + Random Forest Delay Risk Ensemble** (`/predict/delay-risk`): Multi-model weighted classification estimating project delay probability (`delay-xgb-v1.0.0` & `ensemble-rf-v1.0.0`).
2. **LightGBM Cost Overrun Regressor** (`/predict/cost-overrun`): Continuous regression forecasting percentage financial cost overrun (`cost-lgbm-v1.0.0`).
3. **Isolation Forest Anomaly Detector** (`/predict/anomaly-check`): Parameter anomaly detection flagging irregular budget, schedule, or milestone metrics (`anomaly-iforest-v1.0.0`).
4. **Schedule Forecast & Trajectory Engine** (`/predict/schedule-forecast`): Milestone velocity and projected completion date calculation (`schedule-prophet-v1.0.0`).
5. **Generative AI Executive Digest Engine** (`/predict/ai-digest`): Generates executive summary, schedule variance analysis, financial overruns, risk drivers, and mitigations (`digest-nlp-v1.0.0`).

## Verification & Testing

To run the master automated regression pass across all 4 tiers of the monorepo:

```bash
node test_master_suite.js
```

Runs in sequence:
1. Python ML Service Pytest Suite (`apps/ml-service`)
2. Express API Integration Suite (`apps/api`)
3. NFR01 & NFR02 Latency Benchmark Suite (`apps/api/test/test_nfr_benchmarks.js`)
4. Vite Production Build Bundle (`apps/web`)

## Quick Start (Local Development)

### 1. Web Frontend (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```
Runs at `http://localhost:5173`.

### 2. Express Backend API (`apps/api`)
```bash
cd apps/api
npm install
npm test
npm run dev
```
Runs at `http://localhost:5000`.

### 3. FastAPI ML Service (`apps/ml-service`)
```bash
cd apps/ml-service
pip install -r requirements.txt
python train_ensemble_anomaly.py
python -m pytest
uvicorn main:app --reload --port 8000
```
Runs at `http://localhost:8000`.
