# BhoomiSetu — Real-Time National Land Acquisition & Management System

SIH 2026 · PS 26016 · Ministry of Rural Development, Dept. of Land Resources (DoLR)

A MERN-stack platform that digitizes the land acquisition lifecycle (Survey → Legal
Verification → Compensation → Rehabilitation → Approvals → Possession), gives each
department its own update workspace, and rolls those updates up into a weighted
progress score, GIS-mapped dashboard, automatic bottleneck/dependency alerts, and a
formal bottleneck & dispute resolution audit trail for senior officers.

## Contributor

Aaditya Singh ([Aadityasingh0709](https://github.com/Aadityasingh0709))
Kehsaw Jha   ([keshaw006](https://github.com/keshaw006))

## Stack

- **MongoDB** + Mongoose
- **Express** REST API, JWT auth, role-based access control
- **React 18** (Vite) + Tailwind CSS + React Router v6
- **Node.js** 20 LTS

Frontend libraries: `axios`, `zustand` (state), `react-hook-form` + `zod` (forms),
`recharts` (charts), `react-leaflet` + `leaflet` (GIS map, OpenStreetMap tiles — no API
key needed), `react-hot-toast`, `lucide-react`.

## Project structure

```
backend/     Express API, Mongoose models, JWT auth, business rules (progress %,
             risk/delay/bottleneck detection, dependency alerts, resolution tracking)
frontend/    Vite + React app (dashboard, project list/detail, department update
             form, dispute & bottleneck resolution center, alerts, GIS map)
```

## Quick start

Prerequisites: Node.js 20 LTS, npm, Git, and either MongoDB Atlas or a local
MongoDB instance. Use MongoDB Atlas when the team needs one shared demo database.

```bash
git clone https://github.com/Aadityasingh0709/bhoomisetu-sih26016.git
cd bhoomisetu-sih26016
npm run install:all
```

Create `backend/.env` from `backend/.env.example`, set `MONGO_URI` and a strong
`JWT_SECRET`, then prepare demo data and start both apps:

```bash
npm run seed
npm run dev
```

## Access the Dashboard Now

**Frontend:** http://localhost:5174/ 
**Backend API:** http://localhost:5000
**Health Check:** http://localhost:5000/api/health

### Demo Accounts

Each role has a unique, secure password for testing:

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@landacquisition.gov.in` | `Admin@2026Secure!` |
| Senior Officer | `senior@landacquisition.gov.in` | `Senior@2026Officer!` |
| Survey Officer | `survey@landacquisition.gov.in` | `Survey@2026Land!` |
| Legal Verification | `legal@landacquisition.gov.in` | `Legal@2026Verify!` |
| Compensation Officer | `compensation@landacquisition.gov.in` | `Compensation@2026!` |
| Rehabilitation Officer | `rehabilitation@landacquisition.gov.in` | `Rehab@2026Support!` |
| Approvals Officer | `approvals@landacquisition.gov.in` | `Approvals@2026!` |
| Possession Officer | `possession@landacquisition.gov.in` | `Possession@2026!` |

## Running components separately

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates departments + demo users + resolutions + 2 demo projects
npm run dev                 # http://localhost:5000
```

**Demo accounts created:** See "Access the Dashboard Now" section above for login credentials.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (or next available port like 5174)
```

**Note:** If port 5173 is already in use, Vite automatically uses the next available port (5174, 5175, etc.).

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS config is
needed in development.

## Business rules implemented (backend/controllers/projectController.js)

- **Overall progress** = Σ(department actual progress × department weight) — weights
  default to Survey 15 / Legal 15 / Compensation 30 / Rehabilitation 25 / Approvals 5 /
  Possession 10, editable per-department in MongoDB.
- **At Risk**: a department is flagged when actual progress trails planned progress by
  10 points or more.
- **Bottleneck alert**: raised when a department has >20 pending cases and <60% actual
  progress.
- **Dependency alert**: raised when an upstream stage (per the fixed lifecycle order) is
  At Risk/Delayed and the downstream stage isn't yet complete — mirrors "compensation
  delay may affect rehabilitation" from the problem statement.
- **Delayed** (project-level): any department Delayed, or the planned completion date
  has passed without full completion.

## ⚖️ Bottleneck & Dispute Resolution Center

The **Bottleneck & Dispute Resolution Center** provides an auditable institutional record for how land disputes, court orders, inter-agency deadlocks, and procedural bottlenecks are formally resolved:

- **Resolution Taxonomy**: Categorization across *Land Title Dispute*, *Bottleneck*, *Compensation Grievance*, *Boundary Demarcation*, *Clearance & NOC*, and *Inter-Agency Obstacle*.
- **Corrective Action Tracking**: Records the exact steps taken to unblock progress (e.g. Lok Adalat mediation, Tahsildar joint inspection, DGPS re-survey, Section 28 consent award, bulk PFMS DBT verification).
- **Executive Audit Trail**: Tracks the presiding officer, resolving user, date/timestamp, legal case or gazette order reference numbers (e.g. `REV/BLG-2026/894-LOKADALAT`).
- **Two-Way Alert Synchronization**: Resolving a telemetry alert automatically prompts for resolution remarks, marks the alert as resolved, and creates an audit record linked to the project's permanent dossier.

## 🔐 Role-Based Access Control (RBAC)

BhoomiSetu implements comprehensive **RBAC with 5 permission levels**:

### Roles & Permissions

1. **Administrator** - Full system access, user management, system settings
2. **Senior Officer** - Executive analytics, progress tracking, alert management
3. **Department Officer** - Stage-specific permissions (Survey, Legal, Compensation, etc.)
4. **Project Manager** - Project creation, team management, progress tracking
5. **District Officer** - District-level data access and reporting

### RBAC Features

- **Permission-based authorization** - Fine-grained control beyond roles
- **Stage-specific permissions** - Different access for each workflow stage
- **Department-level isolation** - DepartmentOfficers access only their department
- **Ownership-based access** - Resource protection and accountability
- **Audit trail support** - Track all permission-based access

See [RBAC_PASSWORD_RECOVERY_GUIDE.md](RBAC_PASSWORD_RECOVERY_GUIDE.md) for detailed configuration.

## 🔑 Password Recovery & Security

- **Forgot Password** - Request password reset with email link (token expires in 10 minutes)
- **Reset Password** - Secure password reset with token validation
- **Change Password** - Authenticated users can change their password anytime
- **Password Requirements** - Minimum 8 characters, mixed case, numbers, special characters recommended
- **Password Reset Tokens** - Hashed, one-time use, with expiration for security

### Password Recovery Flow

1. Click "Forgot password?" on login page
2. Enter registered email address
3. Receive password reset link (demo mode shows token)
4. Click link or paste token to reset
5. Create new secure password
6. Auto-login after successful reset

## API reference

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password/:token` | Public |
| POST | `/api/auth/change-password` | Authenticated |
| GET | `/api/projects` | Authenticated (filters: `state`, `department`, `status`, `search`) |
| GET | `/api/projects/:id` | Authenticated |
| POST | `/api/projects` | Administrator, ProjectManager |
| PATCH | `/api/projects/:id/departments/:deptId` | DepartmentOfficer, Administrator |
| POST | `/api/projects/:id/resolutions` | DepartmentOfficer, Administrator, SeniorOfficer, ProjectManager |
| DELETE | `/api/projects/:id/resolutions/:resolutionId` | Administrator, ProjectManager |
| GET | `/api/resolutions` | Authenticated (filters: `projectId`, `departmentId`, `category`, `status`) |
| GET | `/api/resolutions/:id` | Authenticated |
| POST | `/api/resolutions` | DepartmentOfficer, Administrator, SeniorOfficer, ProjectManager |
| DELETE | `/api/resolutions/:id` | Administrator, ProjectManager |
| GET | `/api/dashboard/summary` | Authenticated |
| GET | `/api/dashboard/map` | Authenticated |
| GET | `/api/alerts` | Authenticated |
| PATCH | `/api/alerts/:id/resolve` | Administrator, Senior Officer, Project Manager |
| GET | `/api/health` | Public — API and database status |

## Notes for the demo

- Map tiles come from the public OpenStreetMap tile server — fine for a hackathon demo,
  swap for a paid tile provider before any production use.
- File uploads for the document repository are stubbed as `fileUrl` strings in the
  `Project.documents` schema — wire up `multer` + S3/local disk storage if the judges
  ask for it live.
- The seeded accounts are demo-only. Change all credentials and set a strong
  `JWT_SECRET` before deploying anywhere beyond a local presentation.
