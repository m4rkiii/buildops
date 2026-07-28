# Handover: Sprint C2 — Project List & Detail Views

## Status
Done

## What was built
- Implemented API Client Module ([apps/web/src/services/api.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/services/api.js)):
  - Central HTTP fetch wrapper for Projects (`GET`, `POST`, `PUT`, `DELETE`) and Milestones (`GET`, `POST`, `PUT`, `DELETE`).
  - Automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- Implemented Project Modal Component ([apps/web/src/components/Projects/ProjectModal.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectModal.jsx)):
  - Modal form for creating and editing projects.
  - Inputs for `project_name`, `project_type`, `county`, `nca_contractor_grade`, `budget_ksh`, `planned_start_date`, `planned_end_date`.
- Implemented Project List View ([apps/web/src/components/Projects/ProjectList.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectList.jsx)):
  - Responsive project grid matching proposal wireframe (Figure 3.4).
  - Displays project card with county, type, formatted KSh budget, dates, risk score badge placeholder, edit button, and delete confirmation button.
  - Includes empty state UI when no projects exist.
- Implemented Project Detail View ([apps/web/src/components/Projects/ProjectDetail.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Projects/ProjectDetail.jsx)):
  - Detailed hero card with metadata summary (County, Grade, Budget Health, Delay Risk, Cost Overrun Forecast).
  - Back button returning to dashboard grid.
- Updated Main Dashboard ([apps/web/src/App.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/App.jsx)):
  - Manages view state between `ProjectList` and `ProjectDetail`.

## How to verify

1. **Build Web Frontend**:
   ```bash
   cd apps/web
   npm run build
   ```
   *Expected output*: Production bundle builds cleanly with zero errors.

2. **Test Project Flow**:
   - Log in to the web dashboard (`http://localhost:5173`).
   - Click "New Project" to open the creation modal.
   - Enter project details and save. Verify the project card appears in the grid.
   - Click "View Details" to open the project detail view.

## Decisions made
- Used KES (`en-KE`) locale formatting for currency display.
- Added quick action edit/delete icons directly on the project cards for high usability.

## Known gaps / deferred work
- Milestone timeline and CRUD forms within `ProjectDetail` are built in **Sprint C3**.
- Real machine learning risk score calculation is wired in **Phase D**.

## Interfaces for downstream sprints
- **`ProjectList` Component**: `<ProjectList onSelectProject={(project) => ...} />`
- **`ProjectDetail` Component**: `<ProjectDetail project={selectedProject} onBack={() => ...}>{children}</ProjectDetail>`
