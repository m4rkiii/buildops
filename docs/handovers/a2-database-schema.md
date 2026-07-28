# Handover: Sprint A2 — Database Schema & Migrations

## Status
Done

## What was built
- Implemented PostgreSQL 15 SQL migration scripts in `db/migrations/`:
  - `001_create_users.sql`: `users` table with UUID primary key, `full_name`, `email`, `password_hash`, `role` enum constraint (`government_officer`, `contractor`, `site_supervisor`, `homeowner`, `nca_regulator`), and `phone_number`.
  - `002_create_projects.sql`: `projects` table with UUID primary key, `owner_user_id` FK -> `users(user_id)`, `project_name`, `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_start_date`, `planned_end_date`.
  - `003_create_milestones.sql`: `milestones` table with UUID primary key, `project_id` FK -> `projects(project_id)`, `milestone_name`, `planned_date`, `actual_date`, `status` enum constraint (`pending`, `in_progress`, `completed`, `delayed`).
  - `004_create_risk_scores.sql`: `risk_scores` table with UUID primary key, `project_id` FK -> `projects(project_id)`, `score_timestamp`, `delay_risk_prob`, `cost_overrun_pct`, `model_version`.
  - `005_create_notifications.sql`: `notifications` table with UUID primary key, `project_id` FK -> `projects(project_id)`, `channel` enum constraint (`SMS`, `EMAIL`, `IN_APP`), `message`, `sent_at`.
- Created migration runner script `db/migrate.js`.
- Created automated schema introspection test script `db/test_schema.js`.

## How to verify

1. **Install DB Dependencies**:
   ```bash
   cd db
   npm install
   ```

2. **Run Schema Introspection Tests**:
   ```bash
   npm test
   ```
   *Expected output*: `[PASS] [Sprint A2 Database Test] Schema migration introspection test passed successfully!`

3. **Run Migrations Against Local PostgreSQL**:
   ```bash
   npm run migrate
   ```

## Decisions made
- Used UUID `gen_random_uuid()` / `uuid_generate_v4()` for all primary keys to guarantee global uniqueness across microservices.
- Added explicit foreign key cascades (`ON DELETE CASCADE`) for project, milestone, risk score, and notification relations to enforce referential integrity.
- Indexed high-query columns (`users.email`, `projects.owner_user_id`, `projects.county`, `milestones.project_id`, `risk_scores.project_id`, `notifications.project_id`) for performance optimization (NFR01).

## Known gaps / deferred work
- Seed data generation logic is deferred to **Sprint D2** as per the build sequence.
- REST API integration for users/projects/milestones is built in **Phase B**.

## Interfaces for downstream sprints
- **`users` table**: `user_id` (UUID), `full_name`, `email`, `password_hash`, `role`, `phone_number`. Roles: `'government_officer'`, `'contractor'`, `'site_supervisor'`, `'homeowner'`, `'nca_regulator'`.
- **`projects` table**: `project_id` (UUID), `owner_user_id` (FK), `project_name`, `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_start_date`, `planned_end_date`.
- **`milestones` table**: `milestone_id` (UUID), `project_id` (FK), `milestone_name`, `planned_date`, `actual_date`, `status` (`'pending'`, `'in_progress'`, `'completed'`, `'delayed'`).
- **`risk_scores` table**: `score_id` (UUID), `project_id` (FK), `score_timestamp`, `delay_risk_prob`, `cost_overrun_pct`, `model_version`.
- **`notifications` table**: `notification_id` (UUID), `project_id` (FK), `channel` (`'SMS'`, `'EMAIL'`, `'IN_APP'`), `message`, `sent_at`.
