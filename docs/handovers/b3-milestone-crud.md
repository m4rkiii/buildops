# Handover: Sprint B3 — Milestone CRUD

## Status
Done

## What was built
- Implemented `POST /projects/:projectId/milestones` (FR03):
  - Adds a new milestone to a project after verifying project ownership.
  - Required fields: `milestone_name`, `planned_date`.
  - Validates `status` enum (`pending`, `in_progress`, `completed`, `delayed`). Default status: `pending`.
  - Returns HTTP 201 with created milestone record.
- Implemented `GET /projects/:projectId/milestones`:
  - Lists all milestones for a project ordered by `planned_date` ascending.
  - Guarded by project ownership authorization.
- Implemented `GET /projects/:projectId/milestones/:milestoneId`:
  - Fetches single milestone details.
- Implemented `PUT /projects/:projectId/milestones/:milestoneId`:
  - Updates milestone name, planned date, actual completion date, or status.
  - Returns HTTP 200 with updated milestone object.
- Implemented `DELETE /projects/:projectId/milestones/:milestoneId`:
  - Deletes milestone record.
  - Returns HTTP 200 with deletion confirmation.
- Implemented Milestone Integration Test Suite ([apps/api/test/milestone.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/milestone.test.js)):
  - Covers 11 automated integration test cases including project ownership security guards (403 Forbidden).

## How to verify

1. **Run Full API Test Suite**:
   ```bash
   cd apps/api
   npm test
   ```
   *Expected output*: `[PASS] [Sprint B3 Milestone Test] All 11 Milestone CRUD integration tests passed successfully!`

## Decisions made
- Milestone routes are nested under `/projects/:projectId/milestones` using Express `router = express.Router({ mergeParams: true })`.
- All milestone CRUD actions check `verifyProjectOwnership(projectId, req.user.user_id)` to ensure non-owners cannot mutate or read project milestones.
- Valid status string enums: `'pending'`, `'in_progress'`, `'completed'`, `'delayed'`.

## Known gaps / deferred work
- SMS-based milestone logging (e.g. `LOG <PROJECT_CODE> <MILESTONE_CODE> COMPLETE`) is built in **Sprint F1**.
- Automated delay risk probability calculation triggered on milestone updates is built in **Sprint D4**.

## Interfaces for downstream sprints
- **Milestone JSON Object**:
  ```json
  {
    "milestone_id": "UUID",
    "project_id": "UUID",
    "milestone_name": "string",
    "planned_date": "YYYY-MM-DD",
    "actual_date": "YYYY-MM-DD | null",
    "status": "pending | in_progress | completed | delayed",
    "created_at": "ISO-TIMESTAMPTZ"
  }
  ```
- **Endpoints**:
  - `POST /projects/:projectId/milestones` (Body: milestone fields, Auth: Bearer JWT)
  - `GET /projects/:projectId/milestones` (Auth: Bearer JWT)
  - `GET /projects/:projectId/milestones/:milestoneId` (Auth: Bearer JWT)
  - `PUT /projects/:projectId/milestones/:milestoneId` (Body: fields to update, Auth: Bearer JWT)
  - `DELETE /projects/:projectId/milestones/:milestoneId` (Auth: Bearer JWT)
