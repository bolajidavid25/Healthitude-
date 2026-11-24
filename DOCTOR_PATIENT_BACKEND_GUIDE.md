# Healthitude — Doctor/Professional Backend & Patient Connection Guide

This document records the architecture, API endpoints, security/governance rules, frontend wiring, database seeding, and Render deployment instructions for the **Healthcare Professional (Doctor) Backend** and **Doctor–Patient Connection** layer in Healthitude.

---

## 1. Overview of What Was Built

Previously, Healthitude had a complete Patient backend and a Professional authentication/verification foundation, while provider discovery returned static mock records and the Doctor Dashboard ran on hardcoded mock arrays.

This implementation completes the end-to-end clinical connection between **Patients** and **Verified Healthcare Professionals**:

1. **Live Provider Discovery & Appointment Binding**
   - `server/src/services/providerService.ts` now queries real `VERIFIED` and `VERIFIED_WITH_RESTRICTIONS` active professionals from PostgreSQL (`Professional` table) and merges them with fallback directory records. Unverified (`PENDING`, `REJECTED`, `SUSPENDED`, `EXPIRED`) professionals are never exposed to patients.
   - `server/src/services/appointmentService.ts` automatically resolves and binds `doctorId`, `doctorName`, and `department` to the verified `Professional` record in PostgreSQL whenever a patient books an appointment.

2. **Verified Professional Clinical API (`/api/professional/...`)**
   - All clinical routes are strictly protected by:
     - `authenticateProfessional` (independent `healthitude_prof_session` cookie + SHA-256 `ProfessionalSession` lookup)
     - `requireVerifiedProfessional` (allows only `VERIFIED` and `VERIFIED_WITH_RESTRICTIONS`; returns `403 Forbidden` for `PENDING`, `UNDER_REVIEW`, `REJECTED`, `EXPIRED`, `SUSPENDED`, `REVOKED`)
     - `profCsrfProtection` (Rule L double-submit CSRF check against `healthitude_prof_csrf` cookie + `x-csrf-token` header on all state-changing `POST`/`PATCH`/`PUT`/`DELETE` routes)
     - Strict Zod request validation (`server/src/validation/professionalClinical.ts`)

3. **Frontend Wiring (`src/utils/api.ts`, `src/components/DoctorDashboard.tsx`, `src/context/AuthContext.tsx`)**
   - Added fully typed `api.professional.*` clinical methods to `src/utils/api.ts`.
   - Replaced static mock arrays in `src/components/DoctorDashboard.tsx` with live API data across Appointments, Consultation Notes, Complaint Queue, Clinical Records, Prescriptions, Emergency Break-Glass, and Verification Status.
   - Added UI-level verification gating so unverified professionals see only their Verification Status view until approved by an Administrator.
   - Updated `src/context/AuthContext.tsx` to map `ProfessionalCategory` (`DOCTOR`, `NURSE`, `PHARMACIST`) accurately instead of hardcoding `"doctor"`.

4. **Database Seeding & Render Deployment Readiness**
   - Added idempotent seed script `server/src/seed.ts` (`npm run seed`) to provision a default Administrator and 4 Verified Doctors on fresh databases.
   - Configured `app.set("trust proxy", 1)` and comma-separated `CORS_ORIGIN` support in `server/src/app.ts` for Render reverse-proxy hosting.

---

## 2. Backend API Reference (`/api/professional`)

All clinical endpoints below require an authenticated, verified professional session. State-changing endpoints (`POST`, `PATCH`) also require the `x-csrf-token` header matching the `healthitude_prof_csrf` cookie.

| Method | Endpoint | Description | Cross-Portal Effect on Patient |
|--------|----------|-------------|--------------------------------|
| `GET` | `/api/professional/dashboard` | Real-time metrics (upcoming/today appointments, urgent complaints, completed today, pending reviews, active emergencies, connected patients) + verification & licence expiry alert | — |
| `GET` | `/api/professional/patients?search=` | Lists registered patients (prioritizing patients connected to this clinician). Excludes `passwordHash` (Rule D). | — |
| `GET` | `/api/professional/patients/:patientId` | Full clinical dossier: demographics, emergency contact, health profile, appointments, complaints, clinical records, prescriptions. | — |
| `POST` | `/api/professional/patients/:patientId/verify-health-profile` | Marks patient's `HealthProfile` as `clinicallyVerified: true` with `verifiedAt` timestamp (Rule A). | Patient profile badge upgrades to Clinically Verified + Notification sent. |
| `GET` | `/api/professional/appointments?tab=&status=&date=` | Lists doctor's appointments with full patient pre-consultation intake (symptoms, allergies, conditions, active meds, uploaded docs). | Reflects live bookings from Patient Portal. |
| `PATCH` | `/api/professional/appointments/:id/status` | Updates appointment status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`). | Updates patient's appointment list + sends Notification. |
| `POST` | `/api/professional/appointments/:id/complete` | Completes a consultation: saves `TREATMENT_NOTE`, `DIAGNOSIS` record(s), optional `VITAL_SIGNS`, issues `Prescription`(s), marks appointment `COMPLETED`. | All verified records and prescriptions immediately appear in Patient Portal + adherence tracker + Notification sent. |
| `GET` | `/api/professional/complaints?status=&severity=&assignedToMe=` | Clinical complaint queue with patient info and urgency (`SEVERE` → `URGENT`). | Reflects live complaints submitted by patients. |
| `PATCH` | `/api/professional/complaints/:id` | Claims/updates complaint (`UNDER_REVIEW`, `REFERRED_TO_SPECIALIST`, `RESOLVED`) with clinical notes. | Updates patient's complaint status + sends Notification. |
| `GET` | `/api/professional/clinical-records?patientId=` | Lists verified clinical records authored by this professional (or for a specific patient). | — |
| `POST` | `/api/professional/clinical-records` | Authors a verified `ClinicalRecord` (`DIAGNOSIS`, `VITAL_SIGNS`, `LAB_RESULT`, `TREATMENT_NOTE`, `REFERRAL`). Author credentials are derived strictly from the session. | Immediately visible (read-only/immutable) in Patient Portal + Notification sent. |
| `GET` | `/api/professional/prescriptions?patientId=` | Lists prescriptions issued by this professional (or for a specific patient). | — |
| `POST` | `/api/professional/prescriptions` | Issues an `ACTIVE` prescription stamped with the verified clinician's identity. | Immediately visible in Patient Portal with 7-day adherence tracking + Notification sent. |
| `PATCH` | `/api/professional/prescriptions/:id/status` | Updates prescription status (`ACTIVE`, `COMPLETED`, `DISCONTINUED`). | Updates patient medication status + Notification sent. |
| `GET` | `/api/professional/emergencies` | Lists `ACTIVE` and `RESPONDED` Break-Glass emergency cases (Rule C: relationship bypass). | Reflects live patient Break-Glass triggers. |
| `POST` | `/api/professional/emergencies/:caseNumber/respond` | Clinician accepts response (`RESPONDED`) + writes immutable `EmergencyAuditLog`. | Patient sees responding clinician + Notification sent. |
| `POST` | `/api/professional/emergencies/:caseNumber/access` | Retrieves emergency-focused patient clinical record; requires `justification` (min 5 chars) logged to immutable `EmergencyAuditLog`. | Audit trail recorded on patient's emergency history. |
| `POST` | `/api/professional/emergencies/:caseNumber/resolve` | Marks emergency case `RESOLVED` with `resolutionNotes` + writes immutable `EmergencyAuditLog`. | Closes patient's active emergency + Notification sent. |

---

## 3. Files Created & Modified

### Backend (`server/`)
- **Created** `server/src/validation/professionalClinical.ts` — Zod schemas for all doctor clinical routes.
- **Created** `server/src/services/professionalClinicalService.ts` — Core doctor–patient business logic, metrics, consultation completion, complaint triage, clinical record authoring, prescription issuance, and Break-Glass emergency response.
- **Created** `server/src/controllers/professionalClinicalController.ts` — Express request handlers.
- **Created** `server/src/seed.ts` — Idempotent seed script for default Admin & 4 Verified Doctors.
- **Created** `server/src/doctor-patient-connection.test.ts` — End-to-end 9-check integration & security test suite (`npm run test:doctor-patient`).
- **Modified** `server/src/routes/professional.ts` — Mounted all verified clinical routes with `authenticateProfessional`, `requireVerifiedProfessional`, and `profCsrfProtection`.
- **Modified** `server/src/middleware/csrf.ts` — Added `profCsrfProtection` for professional portal double-submit CSRF validation.
- **Modified** `server/src/services/providerService.ts` — Connected provider discovery to live `VERIFIED` PostgreSQL `Professional` records.
- **Modified** `server/src/services/appointmentService.ts` — Auto-binds patient appointments to verified `Professional.id`.
- **Modified** `server/src/app.ts` — Enabled `trust proxy` and multi-origin `CORS_ORIGIN` support for Render.
- **Modified** `server/package.json` — Updated `build` script (`prisma generate && tsc --noEmit`), added `seed` and `test:doctor-patient` scripts.

### Frontend (`src/`)
- **Modified** `src/utils/api.ts` — Expanded `ProfessionalVerificationStatusType`, aligned `AdminReviewPayload` with backend Zod schema, and added all `api.professional.*` clinical API methods.
- **Modified** `src/components/DoctorDashboard.tsx` — Fully wired Appointments, Consultation Notes, Complaint Queue, Clinical Records, Prescriptions, Emergencies (Break-Glass), and Verification Status to the live backend.
- **Modified** `src/components/AdminPanel.tsx` — Wired Verification Review queue (`Verify`, `Restrict`, `Reject`, `Suspend`), Professionals Directory, and Admin Audit Log to live `/api/admin/*` endpoints.
- **Modified** `src/context/AuthContext.tsx` — Mapped `ProfessionalCategory` (`DOCTOR` / `NURSE` / `PHARMACIST`) dynamically and fixed `admin.me()` session restoration.

---

## 4. Security & Medical Governance Checklist

- **Rule A (Patient-Reported vs. Clinically Verified)**: Clinical records authored by doctors are marked `verified: true`; patients cannot edit/delete them. Only verified doctors can flip `HealthProfile.clinicallyVerified` to `true`.
- **Rule B (Professional Verification Gating)**: `PENDING`, `UNDER_REVIEW`, `REJECTED`, `EXPIRED`, `SUSPENDED`, and `REVOKED` professionals are blocked with `403 Forbidden` on all clinical routes and hidden from patient provider discovery.
- **Rule C (Emergency Break-Glass)**: Active emergencies bypass prior doctor–patient relationships while writing compulsory immutable `EmergencyAuditLog` records for every access, response, and resolution.
- **Rule D (No Credential Leaks)**: Patient and professional queries explicitly exclude `passwordHash`.
- **Rule L (CSRF Protection)**: All mutating clinical routes enforce `profCsrfProtection` (constant-time double-submit cookie verification).

---

## 5. Local Setup, Seeding & Testing

```bash
# 1. Configure server/.env (copy from server/.env.example and set your PostgreSQL DATABASE_URL)
cp server/.env.example server/.env

# 2. Apply Prisma migrations & generate client
cd server
npm run prisma:migrate:deploy
npm run prisma:generate

# 3. Seed default Admin & Verified Doctors
npm run seed

# 4. Run typecheck and Doctor–Patient integration tests
npm run typecheck
npm run test:doctor-patient

# 5. Start backend dev server (http://localhost:5000)
npm run dev
```

### Seeded Default Accounts (Development / Initial Render Setup)
> Change these passwords immediately after deploying to production.

| Portal | Email | Password | Status |
|--------|-------|----------|--------|
| Admin | `admin@healthitude.com` | `Admin@Healthitude2026!` | `ACTIVE` (`SUPER_ADMIN`) |
| Doctor (GP) | `doctor@healthitude.com` | `Doctor@Healthitude2026!` | `VERIFIED` (Dr. Kofi Boateng) |
| Doctor (Cardiology) | `efua.asante@healthitude.com` | `Doctor@Healthitude2026!` | `VERIFIED` (Dr. Efua Asante) |
| Doctor (GP) | `ama.bentil@healthitude.com` | `Doctor@Healthitude2026!` | `VERIFIED` (Dr. Ama Bentil) |
| Doctor (Cardiology) | `michael.ade@healthitude.com` | `Doctor@Healthitude2026!` | `VERIFIED` (Dr. Michael Ade) |

---

## 6. Deploying to Render

### Backend Web Service (`server/` root directory)
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run prisma:generate && npm run prisma:migrate:deploy`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Required Environment Variables**:
  - `NODE_ENV=production`
  - `DATABASE_URL=<Render PostgreSQL Internal/External Connection String>`
  - `CORS_ORIGIN=https://<your-frontend-render-domain>` (supports comma-separated origins)
  - `PORT=5000` (Render sets `PORT` automatically)
- **First-Time Seed (Render Shell)**:
  ```bash
  npm run seed
  ```

### Frontend Static Site (repository root)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**:
  - `VITE_API_BASE_URL=https://<your-backend-render-domain>`

> **Cross-Domain Cookie Note for Render**: If the frontend and backend are hosted on different Render subdomains (e.g. `healthitude-web.onrender.com` and `healthitude-api.onrender.com`), configure a custom domain with shared parent site (e.g. `app.yourdomain.com` & `api.yourdomain.com`) or proxy `/api/*` through Render Rewrite Rules on the Static Site so `SameSite=Lax` cookies work seamlessly in all browsers.

---

## 7. Firebase Google Sign-In & Sign-Up Integration (Patient Portal Only)

Healthitude supports **Continue with Google** exclusively on the **Patient Portal** (Doctors/Professionals and Admins use email/password authentication).

### How It Works
1. **Frontend (`src/utils/firebase.ts`, `src/components/GoogleAuthButton.tsx`, `src/pages/patient/PatientAuthPage.tsx`)**:
   - Uses Firebase Web SDK (`signInWithPopup` + `GoogleAuthProvider`) to obtain a verified Firebase ID Token.
2. **Backend (`server/src/config/firebase.ts`, `server/src/services/googleAuthService.ts`, `server/src/controllers/googleAuthController.ts`)**:
   - Cryptographically verifies the Firebase ID Token via `firebase-admin` (or Google's official RS256 public SecureToken certificates fallback) — never trusting raw client email.
   - **Patient Endpoints**:
     - `POST /api/auth/google` — Signs in existing patients (issuing standard `HttpOnly` session + CSRF cookies), or returns `needsOnboarding: true` with verified Google profile (`email`, `firstName`, `lastName`, `picture`) for new users.
     - `POST /api/auth/google/register` — Completes registration with all 7 mandatory consents + health profile without requiring a user-typed password, then signs the patient in immediately.

### Required Render Environment Variables for Firebase
- **Backend Web Service (`server/`)**:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (from Firebase Service Account JSON; escaped `\n` newlines are automatically handled)
- **Frontend Static Site**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- **Firebase Console**: Add your Render frontend domain under **Authentication → Settings → Authorized domains**.
