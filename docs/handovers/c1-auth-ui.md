# Handover: Sprint C1 — Auth UI

## Status
Done

## What was built
- Implemented `AuthContext` ([apps/web/src/context/AuthContext.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/context/AuthContext.jsx)):
  - Manages active user session and `localStorage` token persistence.
  - Implements `login`, `register`, and `logout` handlers connecting to `POST /auth/login` and `POST /auth/register` endpoints.
  - Validates active token via `GET /auth/me` on startup.
- Implemented `LoginForm` ([apps/web/src/components/Auth/LoginForm.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Auth/LoginForm.jsx)):
  - Modern responsive login form styled with Tailwind CSS (dark mode theme, sky blue buttons, SVG icons).
  - Displays inline validation and error messages.
- Implemented `RegisterForm` ([apps/web/src/components/Auth/RegisterForm.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Auth/RegisterForm.jsx)):
  - Registration form supporting full name, email, password, phone number, and interactive role selection cards.
  - Supports all 5 platform roles (`contractor`, `government_officer`, `site_supervisor`, `homeowner`, `nca_regulator`).
- Implemented `ProtectedRoute` ([apps/web/src/components/Auth/ProtectedRoute.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/components/Auth/ProtectedRoute.jsx)):
  - Route guard component redirecting unauthenticated users or unauthorized roles.
- Updated `App` component ([apps/web/src/App.jsx](file:///c:/Users/Mark/OneDrive/Desktop/BuildOps%20construction/apps/web/src/App.jsx)):
  - Integrated tabbed authentication card and user profile header widget with Sign Out functionality.

## How to verify

1. **Build Web Frontend**:
   ```bash
   cd apps/web
   npm run build
   ```
   *Expected output*: Production bundle builds cleanly with zero errors.

2. **Run Web Dev Server**:
   ```bash
   cd apps/web
   npm run dev
   ```
   Access `http://localhost:5173`.
   - Register a new user choosing a role (e.g. `contractor`).
   - Sign in with the registered credentials and verify the dashboard unlocks.
   - Click Sign Out to clear session and verify returning to login state.

## Decisions made
- JWT token is stored in `localStorage` under the key `buildops_token` for seamless session recovery across page refreshes.
- Used Tailwind CSS HSL/slate-950 dark mode styling matching proposal UI aesthetic guidelines.

## Known gaps / deferred work
- Project list and project detail frontend views are built in **Sprint C2**.
- Milestone forms and milestone timeline UI are built in **Sprint C3**.

## Interfaces for downstream sprints
- **`useAuth()` Hook**:
  - `user`: `{ user_id, full_name, email, role, phone_number, created_at }`
  - `token`: `string | null`
  - `isAuthenticated`: `boolean`
  - `login(email, password)`: `Promise<User>`
  - `register(userData)`: `Promise<User>`
  - `logout()`: `void`
- **`<ProtectedRoute>` Component**:
  - Props: `allowedRoles?: string[]`, `children: ReactNode`
