# BhoomiSetu — Real-Time National Land Acquisition & Management System

SIH 2026 · PS 26016 · Ministry of Rural Development, Dept. of Land Resources (DoLR)

A full-stack enterprise governance platform that digitizes the multi-stage land acquisition lifecycle (**Survey → Legal Verification → Compensation → Rehabilitation → Approvals → Possession**), equips the **System Administrator** with granular powers to generate per-project departmental credentials, enforces a **2-step project-scoped authentication flow** for departmental officers, and aggregates live field telemetry into a weighted progress score, GIS-mapped dashboard, real-time bottleneck/dependency alerts, and an auditable dispute resolution trail.

---

## Contributors

- **Aaditya Singh** ([@Aadityasingh0709](https://github.com/Aadityasingh0709))
- **Keshaw Jha** ([@keshaw006](https://github.com/keshaw006))

---

## Core System Architecture & Features

### 1. 🛡️ System Administrator Power & Department Credentials Management
- **Per-Project Department Credential Generation**: When creating a project in the system, the Administrator can configure or 1-click auto-generate login accounts and secure passwords for all 6 statutory departments specifically for that project:
  1. **Survey** (15% Weight)
  2. **Legal Verification** (15% Weight)
  3. **Compensation** (30% Weight)
  4. **Rehabilitation** (25% Weight)
  5. **Approvals** (5% Weight)
  6. **Possession** (10% Weight)
- **Instant Credentials Dossier Export**: Upon project creation, the Administrator receives a complete Project Credentials Dossier with a **"Copy All Credentials"** button to immediately distribute access keys to ground officers.
- **Assigned Officers Registry**: The project detail dossier displays the assigned officer, email, and Project ID for each stage.

### 2. 🔐 2-Step Project-Scoped Authentication
Because a System Administrator oversees multiple national projects (e.g. Officer A manages Survey for *Project X*, while Officer B manages Survey for *Project Y*), the platform enforces strict project scoping:
- **Departmental Officers (2-Step Login)**:
  - **Step 1 — Project Verification**: The officer enters their assigned **Project ID / Project Code** (e.g. `NH44-P2-2026` or `EFC-LP-2026`). Live validation displays verified project metadata (name, state, district, agency).
  - **Step 2 — Officer Sign-In**: The officer enters their official email and password. The system verifies that the officer is assigned to that specific project and department.
- **System Administrators & Senior Officers (Direct Executive Access)**:
  - Administrators and Senior Executives toggle to the **"Executive / Admin"** tab and sign in directly without needing a Project ID, granting them cross-project mission control oversight.

### 3. 🔍 Administrator Dashboard: Project ID / Code Search
- A dedicated **Project ID Search Bar** at the top of the Administrator Dashboard enables instant lookup by Project ID (e.g. `NH44`, `EFC-LP-2026`), Project Name, or District.
- Live dropdown previews show status badges, weighted progress meters, and direct links to open any project dossier.

### 4. ⚖️ Bottleneck & Dispute Resolution Center
- Auditable institutional records for resolving land disputes, court orders, inter-agency deadlocks, and procedural bottlenecks.
- Captures category (*Land Title Dispute*, *Compensation Grievance*, *Boundary Demarcation*, *Clearance & NOC*, etc.), corrective action narrative, resolving officer, and gazette/case order numbers (e.g. `REV/BLG-2026/894-LOKADALAT`).

---

## Tech Stack

- **Backend**: Node.js 20 LTS, Express REST API, MongoDB + Mongoose, JWT Authentication, bcryptjs password hashing.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Zustand (session persistence), React Hook Form + Zod (schema validation), Recharts (stage telemetry), React Leaflet + Leaflet (OpenStreetMap GIS layer), Lucide React.

---

## Quick Start

### Prerequisites
- Node.js 20 LTS & npm
- Git
- MongoDB (local instance on `mongodb://127.0.0.1:27017/land_acquisition` or MongoDB Atlas URI)

### Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/Aadityasingh0709/bhoomisetu-sih26016.git
cd bhoomisetu-sih26016

# 2. Install backend and frontend dependencies
npm run install:all

# 3. Configure backend environment
cd backend
cp .env.example .env    # Verify MONGO_URI and JWT_SECRET

# 4. Seed sample projects and project-scoped department accounts
npm run seed

# 5. Start development servers
cd ..
npm run dev
```

- **Frontend Portal**: http://localhost:5173/
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## Demo Accounts & Project Credentials

### 1. Sample Project IDs for Departmental Officers

| Project Code / ID | Project Name | Jurisdiction | Implementing Agency |
|---|---|---|---|
| **`NH44-P2-2026`** | NH-44 Highway Expansion — Phase 2 | Belagavi, Karnataka | NHAI |
| **`EFC-LP-2026`** | Eastern Freight Corridor — Land Parcel Acquisition | Patna, Bihar | DFCCIL |

---

### 2. Login Credentials Reference

#### Executive & Administrative Accounts (Direct Sign-In — No Project ID Required)

| Role | Portal Tab | Email | Password | Access Scope |
|---|---|---|---|---|
| **System Administrator** | Executive / Admin | `admin@landacquisition.gov.in` | `Admin@2026Secure!` | Full platform control, project creation & credentials issuance, deletion |
| **Senior Officer** | Executive / Admin | `senior@landacquisition.gov.in` | `Senior@2026Officer!` | National GIS telemetry, executive analytics & directives |

#### Departmental Officer Accounts (Requires 2-Step Login with Project ID)

| Role / Department | Project ID (Step 1) | Email (Step 2) | Password | Stage & Weight |
|---|---|---|---|---|
| **Survey Officer** | `NH44-P2-2026` | `survey@landacquisition.gov.in` | `Survey@2026Land!` | Stage 1 (15%) |
| **Legal Verification** | `NH44-P2-2026` | `legal@landacquisition.gov.in` | `Legal@2026Verify!` | Stage 2 (15%) |
| **Compensation Officer** | `NH44-P2-2026` | `compensation@landacquisition.gov.in` | `Compensation@2026!` | Stage 3 (30%) |
| **Rehabilitation Officer** | `NH44-P2-2026` | `rehabilitation@landacquisition.gov.in` | `Rehab@2026Support!` | Stage 4 (25%) |
| **Approvals Officer** | `NH44-P2-2026` | `approvals@landacquisition.gov.in` | `Approvals@2026!` | Stage 5 (5%) |
| **Possession Officer** | `NH44-P2-2026` | `possession@landacquisition.gov.in` | `Possession@2026!` | Stage 6 (10%) |
| **EFC Survey Lead** | `EFC-LP-2026` | `survey.efc@landacquisition.gov.in` | `Survey@2026Efc!` | Stage 1 (15%) |

---

## Step-by-Step User Workflow Examples

### Example 1: System Administrator Creates a Project & Issues IDs
1. Log in as **System Administrator** (`admin@landacquisition.gov.in` / `Admin@2026Secure!`).
2. Navigate to **Projects** → Click **"Create Project"**.
3. Fill in Project Name (`e.g. Pune-Nashik Industrial Expressway`), Project ID (`PNIE-2026`), District, State, Agency, Dates, and GIS Coordinates.
4. In Section 2 (**Department Officer Accounts & Passwords**), review the auto-generated emails (e.g. `survey.pnie2026@landacquisition.gov.in`) and click **"Generate Passwords"** to create unique passwords for all 6 departments.
5. Click **"Create Project & Generate IDs"**.
6. The **Credentials Dossier Card** appears. Click **"Copy All Credentials"** to export the access details for the 6 departmental leads.

### Example 2: Department Officer 2-Step Login & Updating Progress
1. Open the login portal at `http://localhost:5173/login`.
2. On the **Department Officer** tab:
   - **Step 1**: Enter Project ID `NH44-P2-2026` (or click the sample project badge) → Click **"Validate Project & Proceed"**.
   - Verified project metadata for *NH-44 Highway Expansion* is confirmed.
   - **Step 2**: Enter `survey@landacquisition.gov.in` and password `Survey@2026Land!` → Click **"Sign In to Project Workspace"**.
3. The officer is directed straight to their **Survey Workspace** scoped to `NH44-P2-2026`.
4. The officer can update boundary demarcation, pending/completed cases, upload drone coordinates, or report bottlenecks.

### Example 3: Searching Projects by ID in Admin Dashboard
1. Log in as **System Administrator** or **Senior Officer**.
2. At the top of the **National Land Acquisition Overview**, type `NH44` or `EFC` into the **Project ID / Code Search** bar.
3. The live search displays matching projects with their weighted progress bars, current SLA statuses, and direct links to open the dossiers.

---

## API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/auth/validate-project/:code` | Public | Validate Project ID / Code before credential entry in Step 1 |
| `POST` | `/api/auth/login` | Public | Authenticate user (requires `projectCode` for DepartmentOfficers) |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile & active project scope |
| `POST` | `/api/auth/forgot-password` | Public | Initiate password reset token |
| `POST` | `/api/auth/reset-password/:token` | Public | Reset password with token |
| `POST` | `/api/auth/change-password` | Authenticated | Change current user password |
| `GET` | `/api/projects` | Authenticated | Search & list projects (supports `search` by ID/code/name, `state`, `status`) |
| `GET` | `/api/projects/:id` | Authenticated | Fetch project dossier with assigned officers & resolutions |
| `POST` | `/api/projects` | Administrator, ProjectManager | Create project & generate department officer accounts |
| `PATCH` | `/api/projects/:id/departments/:deptId` | DepartmentOfficer, Administrator | Submit progress update for assigned department |
| `POST` | `/api/projects/:id/resolutions` | DepartmentOfficer, Administrator, SeniorOfficer | Record dispute or bottleneck resolution order |
| `GET` | `/api/dashboard/summary` | Authenticated | Overall KPI totals, bottlenecks, and active alerts |
| `GET` | `/api/dashboard/map` | Authenticated | National GIS geo-tagged parcels |
| `GET` | `/api/health` | Public | Telemetry and database connectivity check |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
