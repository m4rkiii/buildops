# BuildOps Sentinel — Master API Contract (Phase B)

This document is the authoritative API contract for the BuildOps Sentinel Core API service (`apps/api`). All frontend components and external microservices integrate against the endpoints documented below.

Base URL (Local): `http://localhost:5000`  
Production Protocol: HTTPS (TLS 1.2+)

---

## 1. Authentication Endpoints (`/auth`)

### 1.1 Register User Account
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth Required**: None (Public)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "full_name": "Maina Kamau",
    "email": "maina.kamau@buildops.co.ke",
    "password": "SecurePassword123!",
    "role": "contractor",
    "phone_number": "+254712345678"
  }
  ```
- **Role Enums**: `'government_officer'`, `'contractor'`, `'site_supervisor'`, `'homeowner'`, `'nca_regulator'`
- **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "user_id": "8f3b2d10-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
      "full_name": "Maina Kamau",
      "email": "maina.kamau@buildops.co.ke",
      "role": "contractor",
      "phone_number": "+254712345678",
      "created_at": "2026-07-28T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields, invalid role enum, or email already registered.

---

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth Required**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "maina.kamau@buildops.co.ke",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "user_id": "8f3b2d10-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
      "full_name": "Maina Kamau",
      "email": "maina.kamau@buildops.co.ke",
      "role": "contractor",
      "phone_number": "+254712345678",
      "created_at": "2026-07-28T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password.

---

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Auth Required**: Bearer JWT (`Authorization: Bearer <token>`)
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "user_id": "8f3b2d10-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
      "full_name": "Maina Kamau",
      "email": "maina.kamau@buildops.co.ke",
      "role": "contractor",
      "phone_number": "+254712345678",
      "created_at": "2026-07-28T10:00:00.000Z"
    }
  }
  ```

---

## 2. Project Endpoints (`/projects`)

### 2.1 Create Project
- **Method**: `POST`
- **Path**: `/projects`
- **Auth Required**: Bearer JWT
- **Request Body**:
  ```json
  {
    "project_name": "Nairobi High-Rise Commercial Tower",
    "project_type": "Commercial",
    "county": "Nairobi",
    "nca_contractor_grade": "NCA 1",
    "budget_ksh": 850000000.00,
    "planned_start_date": "2026-08-01",
    "planned_end_date": "2028-06-30"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Project created successfully",
    "project": {
      "project_id": "d1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "owner_user_id": "8f3b2d10-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
      "project_name": "Nairobi High-Rise Commercial Tower",
      "project_type": "Commercial",
      "county": "Nairobi",
      "nca_contractor_grade": "NCA 1",
      "budget_ksh": 850000000.00,
      "planned_start_date": "2026-08-01",
      "planned_end_date": "2028-06-30",
      "created_at": "2026-07-28T10:05:00.000Z"
    }
  }
  ```

---

### 2.2 Get User Projects
- **Method**: `GET`
- **Path**: `/projects`
- **Auth Required**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "projects": [
      {
        "project_id": "d1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "owner_user_id": "8f3b2d10-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
        "project_name": "Nairobi High-Rise Commercial Tower",
        "project_type": "Commercial",
        "county": "Nairobi",
        "budget_ksh": 850000000.00,
        "planned_start_date": "2026-08-01",
        "planned_end_date": "2028-06-30"
      }
    ]
  }
  ```

---

### 2.3 Get Project By ID
- **Method**: `GET`
- **Path**: `/projects/:id`
- **Auth Required**: Bearer JWT (Owner required)
- **Response (200 OK)**: Single project record.
- **Error Responses**:
  - `404 Not Found`: Project does not exist.
  - `403 Forbidden`: Project belongs to another user.

---

### 2.4 Update Project Details
- **Method**: `PUT`
- **Path**: `/projects/:id`
- **Auth Required**: Bearer JWT (Owner required)
- **Request Body**: Partial or full fields (`project_name`, `budget_ksh`, etc.)
- **Response (200 OK)**: Updated project record.

---

### 2.5 Delete Project
- **Method**: `DELETE`
- **Path**: `/projects/:id`
- **Auth Required**: Bearer JWT (Owner required)
- **Response (200 OK)**: `{ "message": "Project deleted successfully", "project_id": "..." }`

---

## 3. Milestone Endpoints (`/projects/:projectId/milestones`)

### 3.1 Create Milestone
- **Method**: `POST`
- **Path**: `/projects/:projectId/milestones`
- **Auth Required**: Bearer JWT (Project owner required)
- **Request Body**:
  ```json
  {
    "milestone_name": "Foundation Slab Pouring",
    "planned_date": "2026-11-15",
    "status": "pending"
  }
  ```
- **Status Enums**: `'pending'`, `'in_progress'`, `'completed'`, `'delayed'`
- **Response (201 Created)**:
  ```json
  {
    "message": "Milestone created successfully",
    "milestone": {
      "milestone_id": "f9e8d7c6-b5a4-3f2e-1d0c-9b8a7f6e5d4c",
      "project_id": "d1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "milestone_name": "Foundation Slab Pouring",
      "planned_date": "2026-11-15",
      "actual_date": null,
      "status": "pending",
      "created_at": "2026-07-28T10:10:00.000Z"
    }
  }
  ```

---

### 3.2 List Milestones
- **Method**: `GET`
- **Path**: `/projects/:projectId/milestones`
- **Auth Required**: Bearer JWT (Project owner required)
- **Response (200 OK)**: List of milestones ordered by `planned_date ASC`.

---

### 3.3 Update Milestone
- **Method**: `PUT`
- **Path**: `/projects/:projectId/milestones/:milestoneId`
- **Auth Required**: Bearer JWT (Project owner required)
- **Request Body**: Partial fields (`status`, `actual_date`, `milestone_name`, etc.)
- **Response (200 OK)**: Updated milestone record.

---

### 3.4 Delete Milestone
- **Method**: `DELETE`
- **Path**: `/projects/:projectId/milestones/:milestoneId`
- **Auth Required**: Bearer JWT (Project owner required)
- **Response (200 OK)**: `{ "message": "Milestone deleted successfully", "milestone_id": "..." }`

---

## 4. AI Intelligence & Predictive Endpoints (`/projects/:id/...`)

### 4.1 Get AI Executive Digest Report (FR08)
- **Method**: `GET`
- **Path**: `/projects/:projectId/digest`
- **Auth Required**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "digest": {
      "executive_summary": "...",
      "schedule_variance_analysis": "...",
      "financial_overrun_forecast": "...",
      "key_risk_drivers": ["..."],
      "recommended_mitigations": ["..."],
      "model_version": "digest-nlp-v1.0.0",
      "timestamp": "2026-08-01T10:00:00.000Z"
    }
  }
  ```

### 4.2 Get Schedule Forecast (FR10)
- **Method**: `GET`
- **Path**: `/projects/:id/schedule-forecast`
- **Auth Required**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "forecast": {
      "projected_completion_date": "2027-12-31",
      "estimated_schedule_drift_days": 14,
      "confidence_level": "HIGH",
      "velocity_rate_milestones_per_month": 0.85,
      "model_version": "schedule-prophet-v1.0.0",
      "timestamp": "2026-08-01T10:00:00.000Z"
    }
  }
  ```

### 4.3 Get Parameter Anomaly Check (FR10)
- **Method**: `GET`
- **Path**: `/projects/:id/anomaly-check`
- **Auth Required**: Bearer JWT
- **Response (200 OK)**:
  ```json
  {
    "anomaly": {
      "is_anomaly": false,
      "anomaly_score": 0.15,
      "detected_outliers": [],
      "model_version": "anomaly-iforest-v1.0.0",
      "timestamp": "2026-08-01T10:00:00.000Z"
    }
  }
  ```

---

## 5. Notifications & SMS Alerts (`/notifications`)

### 5.1 Get Notification Log (FR07)
- **Method**: `GET`
- **Path**: `/notifications`
- **Auth Required**: Bearer JWT
- **Response (200 OK)**: Array of notification objects.

### 5.2 Dispatch Manual SMS Alert (FR04)
- **Method**: `POST`
- **Path**: `/notifications/send-sms`
- **Auth Required**: Bearer JWT
- **Request Body**: `{ "project_id": "...", "message": "..." }`
- **Response (200 OK)**: `{ "status": "sent", "channel": "SMS", "message_id": "..." }`

