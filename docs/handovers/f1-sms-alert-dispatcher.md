# Handover: Sprint F1 — SMS Service Integration & Alert Dispatcher (FR04, FR07)

## Status
Done

## What was built
- Implemented SMS Service Dispatcher ([apps/api/src/services/smsService.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/smsService.js)):
  - Integrates AfricasTalking SMS SDK with Sandbox Mock Gateway fallback.
  - Formats Kenyan telephone numbers to international format (`+254...`).
  - Logs structured SMS alert dispatches with timestamps and message bodies.
- Implemented Notification Service ([apps/api/src/services/notificationService.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/notificationService.js)):
  - Evaluates project risk scores upon recalculation.
  - Triggers automated SMS alert when delay risk >= 65% or cost overrun >= 10.0%.
  - Persists audit logs into `notifications` database table (`notification_id`, `project_id`, `channel`='SMS', `message`, `sent_at`).
- Integrated Risk Service ([apps/api/src/services/riskService.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/services/riskService.js)):
  - Automatically invokes `notificationService.checkAndDispatchAlerts` after risk score calculation.

## How to verify

1. **Run Automated SMS Notification Test Suite**:
   ```bash
   cd apps/api
   node test/sms_notification.test.js
   ```
   *Expected output*: `[PASS] All Sprint F1/F2 Tests Passed!`.

## Decisions made
- Set high-risk alert triggers at **65% delay probability** and **+10.0% cost overrun** to prevent notification fatigue while surfacing critical risk signals immediately to project managers.

## Known gaps / deferred work
- User-facing Notification Center UI drawer is built in **Sprint F2**.

## Interfaces for downstream sprints
- **`notifications` DB Schema**: `notification_id`, `project_id`, `channel` (`'SMS'`, `'EMAIL'`, `'IN_APP'`), `message`, `sent_at`.
