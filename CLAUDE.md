# BuildOps Sentinel — Agent Build Sequence

Source of truth for scope: `BUILDOPS_SENTINAL_PROPASAL.docx` (Chapters 1 and 3 — objectives, functional/non-functional requirements, architecture, ERD, schedule). This document translates that proposal into an execution plan for AI coding agents.

## 0. Purpose and How to Use This Document

This document defines the full build sequence for BuildOps Sentinel as a series of **phases** and **sprints**. It is the only document an agent should need to execute one sprint correctly.

Rules for any agent executing a sprint:

1. Read **Section 1 (Global Conventions)** and **only your assigned sprint's section**. Do not implement work described in other sprints, even if it looks related or convenient to bundle in.
2. If a sprint's prerequisites are not met (its dependency's handover file is missing or its acceptance criteria are not satisfiable), stop and report — do not silently expand scope to "fix" an earlier sprint.
3. A sprint is only complete when: code is committed, the test suite for that sprint's scope passes, and a handover file has been written per the template in Section 1.4.
4. Never mark a sprint done by disabling, skipping, or weakening a test to make it pass.
5. If a design decision is genuinely ambiguous and not resolved by the proposal or by an earlier handover file, make the smallest reasonable choice, record it in the handover file under "Decisions," and proceed. Do not block on it.
6. After every sprint is completed, push to GitHub. Do not proceed to any subsequent sprint or phase until the current sprint is fully functional and tested.

## 1. Global Conventions

### 1.1 Repository layout

```
buildops-sentinel/
  apps/
    web/            React 18 + Tailwind CSS dashboard
    api/             Node.js 20 + Express 4 backend (REST, auth, alert dispatch)
    ml-service/      Python 3.11 + FastAPI (XGBoost, LightGBM, Prophet, SBERT, RF)
  db/
    migrations/      SQL migrations (PostgreSQL 15)
    seed/            Synthetic data generator + seed scripts
  .github/workflows/ CI/CD (GitHub Actions)
  docs/
    handovers/       One file per completed sprint (see 1.4)
    api-contract.md
  render.yaml         Render deployment config
```

Every sprint's changes stay inside the folders relevant to its scope. Cross-cutting changes (e.g. touching `db/migrations` from a frontend sprint) are out of scope unless the sprint explicitly says otherwise.

### 1.2 Branching and commits

- One branch per sprint: `sprint/<phase-letter><number>-<short-name>` (e.g. `sprint/b2-project-crud`).
- Commit messages: `[<sprint-id>] <what changed>` (e.g. `[B2] add project CRUD endpoints and integration tests`).
- Merge to `main` only after the sprint's tests pass locally. CI (once it exists, from Sprint A3 onward) must also pass before merge.
- The final commit of a sprint must leave `main` (or the sprint branch, pre-merge) in a state that builds and tests cleanly from a fresh clone.
- Push commits to GitHub repository after every sprint handover.

### 1.3 Definition of Done (applies to every sprint)

A sprint is done only when all of the following hold:
- All deliverables listed in the sprint are implemented.
- All acceptance criteria listed in the sprint are met and demonstrated by an automated test, not just manual inspection.
- The relevant test command(s) pass with no skipped or commented-out assertions.
- Code is committed on the sprint branch and merged to `main`.
- A handover file exists at `docs/handovers/<sprint-id>.md` per the template below.
- Changes are pushed to GitHub repository.

### 1.4 Handover file template

Every sprint ends by writing `docs/handovers/<sprint-id>.md`:

```markdown
# Handover: <Sprint ID> — <Sprint Name>

## Status
Done | Blocked (explain)

## What was built
- Bullet list of concrete deliverables

## How to verify
- Exact commands to run tests / start services / hit an endpoint

## Decisions made
- Any ambiguity resolved and why (only if applicable)

## Known gaps / deferred work
- Anything explicitly out of scope that the next sprint needs to know about

## Interfaces for downstream sprints
- New endpoints, env vars, DB tables/columns, exported functions, config keys —
  anything a later sprint will need to call or depend on.
```

### 1.5 Baseline non-functional targets (NFR01–NFR05)

- NFR01: dashboard loads a project risk score in under 3 seconds on a standard connection.
- NFR02: ML inference endpoints respond in under 2 seconds.
- NFR03: public URL reachable, targeting 99% uptime once deployed (Render free tier).
- NFR04: all passwords hashed with bcrypt, cost factor 12.
- NFR05: all client-server traffic over HTTPS (TLS 1.2+).

### 1.6 Data privacy baseline

Per the Kenya Data Protection Act 2019 commitments in the proposal: training data is synthetic/public only (no real personal construction data), role-based access is enforced at the API layer, and passwords/PII follow NFR04/NFR05.

---

## 2. Phase Map

| Phase | Focus | Sprints |
|---|---|---|
| A | Foundation & scaffolding | A1–A3 |
| B | Core backend: auth, project & milestone CRUD (FR01–FR03) | B1–B4 |
| C | Frontend dashboard shell | C1–C3 |
| D | ML service foundation + delay risk model (FR05) | D1–D4 |
| E | Cost overrun forecasting (FR06) | E1–E2 |
| F | SMS integration (FR04, FR07) | F1–F2 |
| G | AI digest & reporting (FR08) | G1–G2 |
| H | Role-based NCA read-only view (FR09) | H1 |
| I | Secondary/stretch ML objectives (FR10 + architecture extras) | I1–I3 |
| J | Hardening, testing, deployment (NFRs) | J1–J4 |
| K | Documentation & final handover (closes academic MVP) | K1–K2 |
| L | AI decision intelligence | L1–L3 |
| M | Predictive operations | M1–M3 |
| N | Decision engine | N1–N3 |
| O | Forecast monitoring | O1–O3 |
| P | Enterprise intelligence | P1, P3 |
| Q | Executive analytics | Q1 |
| R | Advanced reporting | R1 |
| S | Collaboration | S1 |
| T | Knowledge intelligence | T1 |
| U | Flagship integration | U1 |

---

## Phase A — Foundation & Scaffolding

### Sprint A1 — Monorepo scaffold
**Depends on:** nothing (first sprint).
**In scope:**
- Create repo layout: `apps/web`, `apps/api`, `apps/ml-service`, `db/`, `docs/`.
- Initialize `apps/web` with React 18 + Tailwind (Vite).
- Initialize `apps/api` with Node.js 20 + Express 4, minimal `/health` endpoint.
- Initialize `apps/ml-service` with Python 3.11 + FastAPI, minimal `/health` endpoint.
- Master `CLAUDE.md` and root `README.md` with local run instructions for all three apps.
**Out of scope:** any business logic, DB, auth, CI, deployment config.
**Deliverables:** three runnable skeleton apps, each returning 200 on `/health` (or web app rendering placeholder page).
**Acceptance criteria:** `npm run dev` in `apps/web` and `apps/api` starts without error; `uvicorn` starts `apps/ml-service` without error; each health check returns successfully.
**Handover:** `docs/handovers/a1-monorepo-scaffold.md`.

### Sprint A2 — Database schema & migrations
**Depends on:** A1.
**In scope:** implement the ERD from proposal §3.7 (Figure 3.5) as PostgreSQL migrations in `db/migrations/`:
- `users` (user_id PK, full_name, email, password_hash, role, phone_number)
- `projects` (project_id PK, owner_user_id FK→users, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date)
- `milestones` (milestone_id PK, project_id FK→projects, milestone_name, planned_date, actual_date, status)
- `risk_scores` (score_id PK, project_id FK→projects, score_timestamp, delay_risk_prob, cost_overrun_pct, model_version)
- `notifications` (notification_id PK, project_id FK→projects, channel, message, sent_at)
- Migration runner script (`db/migrate.sh` or node runner) and `db/seed/` folder placeholder.
**Handover:** `docs/handovers/a2-database-schema.md`.

### Sprint A3 — CI/CD pipeline skeleton
**Depends on:** A1, A2.
**In scope:** GitHub Actions workflow in `.github/workflows/ci.yml` and `render.yaml` skeleton.
**Handover:** `docs/handovers/a3-cicd-skeleton.md`.
