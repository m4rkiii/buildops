# Handover: Sprint B1 — Authentication System

## Status
Done

## What was built
- Implemented `POST /auth/register`:
  - Validates user input (`full_name`, `email`, `password`, `role`, `phone_number`).
  - Restricts roles to 5 valid role types: `'government_officer'`, `'contractor'`, `'site_supervisor'`, `'homeowner'`, `'nca_regulator'`.
  - Hashes passwords using `bcryptjs` with cost factor 12 (NFR04).
  - Prevents duplicate registration for the same email address.
  - Returns HTTP 201 with created user profile and a 24h JWT token.
- Implemented `POST /auth/login`:
  - Validates credentials using `bcrypt.compare`.
  - Returns HTTP 200 with user profile and JWT token.
  - Rejects invalid credentials with HTTP 401.
- Implemented `GET /auth/me`:
  - Protected profile route requiring valid Bearer JWT token.
- Implemented Authentication & RBAC Middleware ([apps/api/src/middleware/auth.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/src/middleware/auth.js)):
  - `authenticateToken`: Extracts and verifies Bearer JWT token from `Authorization` header, attaching `req.user` payload (`{ user_id, email, role }`).
  - `requireRole(...roles)`: Route guard enforcing role-based permissions.
- Implemented Integration Test Suite ([apps/api/test/auth.test.js](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/api/test/auth.test.js)):
  - Covers 8 automated test cases for register, login, duplicate check, bad password, missing/invalid JWT, valid JWT, and role-based guards.

## How to verify

1. **Install API Dependencies**:
   ```bash
   cd apps/api
   npm install
   ```

2. **Run Auth Integration Tests**:
   ```bash
   npm test
   ```
   *Expected output*: `[PASS] [Sprint B1 Auth Test] All 8 integration test cases passed successfully!`

## Decisions made
- Password hashing cost factor set to `12` per NFR04 requirement.
- JWT tokens configured with a 24-hour expiration duration.
- Allowed role string constants: `'government_officer'`, `'contractor'`, `'site_supervisor'`, `'homeowner'`, `'nca_regulator'`.

## Known gaps / deferred work
- Project CRUD endpoints gated by user authentication are built in **Sprint B2**.
- Frontend authentication login/register pages are built in **Sprint C1**.

## Interfaces for downstream sprints
- **`POST /auth/register`**:
  - Request: `{ full_name: string, email: string, password: string, role: string, phone_number?: string }`
  - Response (201): `{ message: string, user: { user_id, full_name, email, role, phone_number, created_at }, token: string }`
- **`POST /auth/login`**:
  - Request: `{ email: string, password: string }`
  - Response (200): `{ message: string, user: { user_id, full_name, email, role, phone_number, created_at }, token: string }`
- **`Authorization` Header**: `Bearer <JWT_TOKEN>`
- **JWT Payload Shape**: `{ user_id: string (UUID), email: string, role: string, iat: number, exp: number }`
- **Role String Enums**:
  - `'government_officer'`
  - `'contractor'`
  - `'site_supervisor'`
  - `'homeowner'`
  - `'nca_regulator'`
