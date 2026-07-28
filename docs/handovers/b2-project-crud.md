# Handover: Sprint B2 — Project CRUD

## Status
Done

## What was built
- Implemented `POST /projects` (FR02):
  - Creates a new project owned by the requesting user (`req.user.user_id`).
  - Validates required parameters: `project_name`, `project_type`, `county`, `budget_ksh`, `planned_start_date`, `planned_end_date`.
  - Returns HTTP 201 with the created project record.
- Implemented `GET /projects`:
  - Fetches list of projects owned by `req.user.user_id`.
  - Returns HTTP 200 with JSON list.
- Implemented `GET /projects/:id`:
  - Fetches a single project by ID.
  - Enforces project ownership — returns HTTP 403 Forbidden if owned by a different user.
- Implemented `PUT /projects/:id`:
  - Updates details of an existing project owned by `req.user.user_id`.
  - Returns HTTP 200 with updated project object.
- Implemented `DELETE /projects/:id`:
  - Deletes a project owned by `req.user.user_id`.
  - Returns HTTP 200 with confirmation.
- Implemented Project Integration & Security Test Suite ([apps/api/test/project.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/project.test.js)):
  - Covers 9 automated integration test cases including cross-user access security checks (403 Forbidden).

## How to verify

1. **Run Full API Test Suite**:
   ```bash
   cd apps/api
   npm test
   ```
   *Expected output*: `[PASS] [Sprint B2 Project Test] All 9 Project CRUD integration tests passed successfully!`

## Decisions made
- Project queries strictly include `owner_user_id = req.user.user_id` to guarantee tenant isolation and prevent horizontal escalation.
- Cross-tenant access attempts return `HTTP 403 Forbidden` explicitly to differentiate from unauthenticated (401) or non-existent (404) requests.

## Known gaps / deferred work
- Milestone management for projects is implemented in **Sprint B3**.
- Delay risk probability scores for projects are calculated and attached in **Phase D**.

## Interfaces for downstream sprints
- **Project JSON Object**:
  ```json
  {
    "project_id": "UUID",
    "owner_user_id": "UUID",
    "project_name": "string",
    "project_type": "string",
    "county": "string",
    "nca_contractor_grade": "string | null",
    "budget_ksh": 500000000.00,
    "planned_start_date": "YYYY-MM-DD",
    "planned_end_date": "YYYY-MM-DD",
    "created_at": "ISO-TIMESTAMPTZ"
  }
  ```
- **Endpoints**:
  - `POST /projects` (Body: project fields, Auth: Bearer JWT)
  - `GET /projects` (Auth: Bearer JWT)
  - `GET /projects/:id` (Auth: Bearer JWT)
  - `PUT /projects/:id` (Body: fields to update, Auth: Bearer JWT)
  - `DELETE /projects/:id` (Auth: Bearer JWT)
