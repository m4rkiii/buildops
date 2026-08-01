# Handover: Sprint H1 — Role-Based NCA Read-Only View (FR09)

## Status
Done

## What was built
- **Backend Role Access Control** ([apps/api/src/controllers/projectController.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/controllers/projectController.js) & [milestoneController.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/controllers/milestoneController.js)):
  - Granted `nca_regulator` and `government_officer` roles platform-wide inspection rights to list and view details of all projects and milestones across all contractors.
  - Enforced strict 403 Forbidden mutation blocks preventing `nca_regulator` users from creating, updating, or deleting projects and milestones.
- **Frontend Role Adaptation** ([apps/web/src/components/Projects/ProjectList.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectList.jsx) & [MilestoneList.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Milestones/MilestoneList.jsx)):
  - Conditionally rendered UI controls based on user role (`nca_regulator` vs `contractor`/`supervisor`).
  - Read-only users view platform projects with action buttons (create/edit/delete) hidden.
- **Automated Integration Test Suite** ([apps/api/test/nca_role.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/nca_role.test.js)):
  - 6-step integration test verifying registration of NCA Regulator users, platform-wide project inspection, and 403 Forbidden responses on POST/PUT/DELETE calls.

## How to verify

1. **Run Integration Test**:
   ```bash
   cd apps/api
   node test/nca_role.test.js
   ```
   *Expected output*: `[PASS] All Sprint H1 NCA Role Tests Passed!`.

2. **Run Full API Test Suite**:
   ```bash
   cd apps/api
   npm test
   ```
   *Expected output*: `✅ All API test suites passed cleanly!`.

## Decisions made
- Regulators (`nca_regulator` and `government_officer`) require platform-wide transparency for compliance auditing, so authorization checks on `GET /projects` and `GET /projects/:id` bypass single-owner filtering.
- Mutation endpoints explicitly check `req.user.role === 'nca_regulator'` and return HTTP 403 with clear descriptive error messages.

## Known gaps / deferred work
- Secondary / stretch ML objectives follow in **Phase I**.

## Interfaces for downstream sprints
- **Roles**: `'nca_regulator'`, `'government_officer'`, `'contractor'`, `'supervisor'`.
- **API Guard**: Read-only endpoints return 200 OK with full project/milestone telemetry; write endpoints return 403 Forbidden for regulator accounts.
