# Handover: Sprint A3 — CI/CD Pipeline Skeleton

## Status
Done

## What was built
- Implemented GitHub Actions continuous integration workflow `.github/workflows/ci.yml`:
  - Sets up PostgreSQL 15 service container for CI testing.
  - Installs Node.js 20 and Python 3.11 with npm/pip caching.
  - Runs database migration runner and schema introspection tests (`db`).
  - Runs health check integration tests for Express API backend (`apps/api`).
  - Runs FastAPI health check integration tests for ML microservice (`apps/ml-service`).
  - Runs Vite production build for React web dashboard (`apps/web`).
  - Includes `deploy-stub` job gated to `main` branch pushes.
- Implemented Render infrastructure-as-code blueprint `render.yaml`:
  - Static Site declaration for `buildops-web` (React dashboard).
  - Node Web Service declaration for `buildops-api` (Express backend API).
  - Python Web Service declaration for `buildops-ml-service` (FastAPI ML service).
  - Render Managed Database declaration for `buildops-postgres` (PostgreSQL 15).

## How to verify

1. **Verify Workflow File Syntax**:
   Push commits to GitHub on `main` or any feature branch.
   ```bash
   git push origin main
   ```

2. **Inspect Live GitHub Actions Run**:
   ```bash
   gh run list --limit 1
   gh run watch
   ```
   *Expected output*: GitHub Actions job completes with green check `✓`.

## Decisions made
- Used GitHub Actions native `services` container pattern for PostgreSQL 15 to ensure real database execution during CI runs.
- Used npm dependency caching keyed to lockfiles to optimize GitHub Actions execution time.
- Defined Render free-tier deployment specification in `render.yaml` matching proposal architecture.

## Known gaps / deferred work
- Live production deployment on Render service will be wired in **Sprint J4**.

## Interfaces for downstream sprints
- **CI Workflow**: `.github/workflows/ci.yml` runs automatically on all branch pushes and PRs.
- **Render Config**: `render.yaml` root deployment blueprint.
