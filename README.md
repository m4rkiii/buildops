# BuildOps Sentinel

BuildOps Sentinel is an AI-powered construction project monitoring, predictive risk intelligence, and decision platform.

## Repository Layout

```
buildops-sentinel/
├── CLAUDE.md             # Master Agent Build Sequence & Project Rules
├── apps/
│   ├── web/              # React 18 + Tailwind CSS frontend dashboard
│   ├── api/              # Node.js 20 + Express 4 REST API server
│   └── ml-service/       # Python 3.11 + FastAPI Machine Learning service
├── db/
│   ├── migrations/       # PostgreSQL database migrations
│   └── seed/             # Synthetic dataset generator and seed scripts
├── docs/
│   └── handovers/        # Sprint handover documentation
└── README.md             # Monorepo setup and developer guide
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+ and `npm`
- Python 3.11+ and `pip`
- PostgreSQL 15+ (for Phase A2 onward)

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
npm run dev
```
Runs at `http://localhost:5000`. Health check: `http://localhost:5000/health`.

### 3. FastAPI ML Service (`apps/ml-service`)
```bash
cd apps/ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Runs at `http://localhost:8000`. Health check: `http://localhost:8000/health`.
