# Handover: Sprint F2 — Notification API & In-App Alert Center UI (FR04, FR07)

## Status
Done

## What was built
- Implemented Notification API Routes & Controller ([apps/api/src/routes/notificationRoutes.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/routes/notificationRoutes.js) & [notificationController.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/controllers/notificationController.js)):
  - Exposes `GET /notifications` to list user alerts.
  - Exposes `GET /notifications/project/:projectId` for project alert history.
- Implemented Notification Center UI Component ([apps/web/src/components/Notifications/NotificationCenter.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Notifications/NotificationCenter.jsx)):
  - Top header bell button (`data-testid="notification-bell"`) with animated alert counter.
  - Slide-out dropdown displaying sent SMS alert history, timestamps, channel badges, and formatted alert message text.
- Integrated Web API Client ([apps/web/src/services/api.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/services/api.js)):
  - Added `getNotifications` and `getProjectNotifications` endpoints.
- Updated Dashboard Shell ([apps/web/src/App.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/App.jsx)):
  - Mounted `NotificationCenter` in top header bar.

## How to verify

1. **Run Integration Test Suite**:
   ```bash
   cd apps/api
   node test/sms_notification.test.js
   ```

2. **Build Web App**:
   ```bash
   cd apps/web
   npm run build
   ```
   *Expected output*: `✓ built in ~5.55s`.

## Decisions made
- Configured 15-second polling in `NotificationCenter` so users receive real-time alert updates automatically whenever milestone delays or risk scores change.

## Known gaps / deferred work
- AI Summaries and Digest Reports are implemented in **Phase G (Sprint G1–G2)**.

## Interfaces for downstream sprints
- **`GET /notifications`**: Returns `{ notifications: [...] }`
- **`GET /notifications/project/:projectId`**: Returns `{ notifications: [...] }`
- **DOM Test ID**: `data-testid="notification-bell"`
