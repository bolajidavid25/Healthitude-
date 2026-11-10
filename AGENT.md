# AGENT.md — Healthitude Development & Architecture Guide

Welcome to **Healthitude** (`Healthitude-`). This document serves as the canonical guidelines, domain specification, and operating manual for AI coding agents and developers working on this repository.

---

## 1. Project Overview & Vision

Healthitude is an end-to-end digital health platform designed to bridge patients, verified healthcare professionals, and system administrators. It combines clinical records management, category-based healthcare pricing, specialist referrals, medication adherence tracking, and a break-glass emergency response system.

### Core Portals
1. **Patient Portal**: Self-registration, health profile management, category verification (e.g., Student, NHIS, Elderly), provider discovery, appointment intake, complaint submission, prescriptions & medication tracking, and emergency break-glass requests.
2. **Healthcare Professional Portal**: Dedicated onboarding for Doctors, Nurses, and Pharmacists with credential upload, administrative verification gating, clinical records authoring, prescription issuance, and emergency response.
3. **Administrator Portal**: Identity & credential verification for healthcare professionals, patient category verification, pricing plan management, and system-wide security/audit log reviews.

---

## 2. Technical Stack & Monorepo Layout

```
Healthitude/
├── src/                  # Frontend (React 19, TypeScript, Vite 8, Tailwind CSS v4)
│   ├── components/       # UI panels (PatientDashboard, DoctorDashboard, AdminPanel, etc.)
│   ├── context/          # State providers (AuthContext, etc.)
│   ├── imports/          # Design specifications, requirements, and reference assets
│   ├── pages/            # Page-level routes (LandingPage, TelemedicinePage, Auth)
│   ├── routes.tsx        # React Router 8 router definition
│   └── utils/            # API client (api.ts), validation, and helper utilities
├── server/               # Backend (Express 5, Node.js ESM, TypeScript, Prisma 7)
│   ├── prisma/           # PostgreSQL schema (schema.prisma) & SQL migrations
│   ├── src/
│   │   ├── config/       # Environment & Prisma client setup
│   │   ├── controllers/  # Route handler controllers
│   │   ├── middleware/   # Authentication, CSRF, rate-limiting, uploads, error handling
│   │   ├── routes/       # Express route definitions (auth, patient, professional, admin)
│   │   ├── services/     # Business logic & database operations
│   │   ├── utils/        # Cryptography, sessions, file validations, log sanitization
│   │   └── validation/   # Zod validation schemas
│   └── package.json      # Server scripts and dependencies
├── public/               # Static web assets and brand logos
├── .gitignore            # Git exclusion rules (node_modules, .env, dist, etc.)
├── package.json          # Frontend dependencies & workspace scripts
└── tsconfig.json         # Frontend TypeScript configuration
```

### Technology Matrix
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React icons, React Router 8.
- **Backend**: Express 5 (ESM), TypeScript, Tsx runner, Zod validation schemas.
- **Database & ORM**: PostgreSQL with Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`).
- **Security & Storage**: `bcryptjs` password hashing, `cookie-parser`, `multer` file uploads with MIME/extension verification, custom double-submit CSRF and in-memory rate-limiting.

---

## 3. Core Domain Rules & Medical Governance

Agents working on Healthitude must uphold these non-negotiable medical data and governance principles:

### A. Patient-Reported vs. Clinically Verified Data
- **Patient-Reported Information**: When patients input medical history, allergies, or vitals (e.g. "My blood pressure was 150/90"), the records are flagged with `patientReported: true` and `clinicallyVerified: false`.
- **Clinically Verified Information**: Only a verified healthcare professional who measures, diagnoses, or treats the patient can mark clinical records as verified (`clinicallyVerified: true`).
- **Immutable Clinical Records**: Patients can **never** modify or delete clinically verified records, diagnoses, or prescriptions written by medical providers.

### B. Professional Verification Lifecycle & Privileges
Healthcare professionals cannot practice or access patient clinical records until vetted by an administrator.
- **Verification States**: `PENDING` → `UNDER_REVIEW` → `VERIFIED` (or `VERIFIED_WITH_RESTRICTIONS`, `REJECTED`, `EXPIRED`, `SUSPENDED`, `REVOKED`).
- **Clinical Gating**:
  - `VERIFIED` and `VERIFIED_WITH_RESTRICTIONS` grant access to patient discovery, consultation booking, prescription issuance, and clinical record authoring.
  - Any status of `PENDING`, `REJECTED`, `SUSPENDED`, or `EXPIRED` blocks clinical features and restricts the professional to their profile/credential upload screen.
- **Verification Audit Trail**: Every change of verification status is recorded in `ProfessionalVerificationLog` with administrator ID, rationale, timestamp, and IP address.

### C. Emergency Break-Glass Protocol
- When a patient triggers **Break-Glass**, an active `EmergencyCase` is generated immediately.
- Responding doctors are presented with an **Emergency Snapshot**: critical vitals, blood group, genotype, known allergies, active medications, severe conditions, and emergency contacts.
- **Relationship Bypass**: Emergency assistance is never blocked by the lack of an existing doctor-patient relationship.
- **Compulsory Audit**: Every emergency access event writes an immutable entry into `EmergencyAuditLog` (recording actor, action, timestamp, IP, and clinical justification).

### D. Patient Categories & Pricing Engine
Patients select one primary category during onboarding, which must be backed by evidence where applicable:
1. `STUDENT` (Student ID)
2. `NHIS_USER` (NHIS Number & Scheme)
3. `CIVIL_SERVANT` (Work ID/Verification)
4. `CORPORATE_COMPANY_MEMBER` (Corporate ID/Affiliation)
5. `INSURANCE_MEMBER` (HMO/Insurance Policy)
6. `ELDERLY` (Age verification from Date of Birth)
7. `NURSING_BREASTFEEDING_MOTHER` (Self-declaration/documentation)
8. `GENERAL_PATIENT` (Standard tier, default)

*Rule*: The verified patient category controls dynamic pricing and discount structures across consultations, diagnostics, and procedures.

### E. Mandatory Patient Consents
During registration, patients must accept all 7 canonical consent types (`ConsentRecord`):
- `TERMS_AND_PRIVACY`
- `HEALTH_DATA_PROCESSING`
- `PROFESSIONAL_ACCESS`
- `PATIENT_DATA_ACKNOWLEDGEMENT`
- `AI_LIMITATIONS`
- `BREAK_GLASS_DISCLOSURE`
- `INFORMATION_ACCURACY`

### F. AI Health Assistant Guardrails
If AI features or assistants are extended:
- **Permitted**: Explaining medical terminology, clarifying patient-reported logs, navigating platform features, preparing appointment discussion questions.
- **Strictly Prohibited**: Clinical diagnosis, issuing or modifying prescriptions, altering medication dosages, recommending treatment discontinuation, or triaging emergency cases.

---

## 4. Architectural & Security Rules (Rules A through R)

The backend follows codified security and architectural rules enforced across unit, integration, and security tests:

| Rule | Area | Description |
|------|------|-------------|
| **Rule D** | Authentication | Never expose `passwordHash` in API responses, logs, or client-facing objects. |
| **Rule F** | Session Storage | Store `tokenHash` (SHA-256), never plaintext session tokens in the database. |
| **Rule G/H/I** | Cookie Security | Session cookies must use `HttpOnly`, `SameSite=Lax`, and `Secure` (in production). |
| **Rule J/K** | CORS Policy | Restrict CORS to explicitly configured frontend origins (`env.CORS_ORIGIN`) with `credentials: true`. Never use wildcard `*`. |
| **Rule L** | CSRF Protection | Enforce CSRF token verification (double-submit cookie pattern) on all state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`). |
| **Rule N/P** | Session Expiry | Reject expired, revoked, or non-existent sessions at the middleware layer. |
| **Rule O** | Session Revocation | Server-side revocation of session records upon user logout. |
| **Rule Q** | Rate Limiting | Enforce rate limiting on sensitive routes (e.g., maximum 5 failed login attempts before cooldown). |
| **Rule R** | Anti-Enumeration | Use identical generic error messages (`"Invalid email or password"`) for non-existent users and wrong passwords. |
| **Rule S** | Auditability | Immutable audit logs for clinical records, admin modifications, and break-glass operations. |

---

## 5. Development Workflows & Useful Commands

### Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL running locally or accessible via `DATABASE_URL`

### Environment Configuration
- Root frontend: `.env.example` → copy to `.env` if custom `VITE_API_BASE_URL` is needed.
- Backend server: `server/.env.example` → copy to `server/.env` with your PostgreSQL credentials.

### Frontend Commands (from project root)
```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Build production bundle
npm run preview    # Preview built bundle
npm run format     # Format code with oxfmt
```

### Backend Commands (from `server/` directory)
```bash
cd server
npm run dev                    # Run backend with tsx watcher on http://localhost:5000
npm run typecheck              # Run TypeScript compiler checks (noEmit)
npm run prisma:generate        # Generate Prisma Client models
npm run prisma:migrate:dev     # Apply Prisma migrations to the development database
npm run db:verify              # Verify database connectivity and migration status
```

### Running Backend Test Suites
Healthitude maintains a comprehensive test suite in `server/src/`:
```bash
cd server
npm test                       # Run full test suite across all modules
npm run test:auth              # Authentication, session tokens, and cookie tests
npm run test:registration      # Patient registration & consent tests
npm run test:professional      # Professional onboarding & verification tests
npm run test:emergency         # Break-glass emergency response tests
npm run test:pricing           # Patient category pricing calculation tests
npm run test:clinicalRecord    # Clinical records authoring & permissions tests
npm run test:security          # Security regression tests (anti-enumeration, CSRF, CORS)
```

---

## 6. Guidelines for AI Agents Operating on this Codebase

1. **Safety & Secrets**:
   - Never commit or log `.env` files, plaintext secrets, database passwords, or private encryption keys.
   - Respect `.gitignore` at all times (especially `node_modules/`, `dist/`, `.env`).
2. **Database Migrations**:
   - Always modify `server/prisma/schema.prisma` first, then run `npm run prisma:migrate:dev` or `prisma generate`.
   - Never edit generated files in `server/src/generated/prisma/` directly.
3. **Preserve Code & Doc Integrity**:
   - Retain existing code comments, rule annotations (`Rule A`, `Rule R`, etc.), and medical explanations.
   - Maintain strict TypeScript type-checking across frontend and backend.
4. **Testing Verification**:
   - When modifying authentication, patient categories, clinical records, or permissions, execute the respective test scripts (`npm run test:...`) to ensure no regressions occur.
