# BhoomiSetu — Real-Time National Land Acquisition & Management System

SIH 2026 · PS 26016 · Ministry of Rural Development, Dept. of Land Resources (DoLR)

A MERN-stack platform that digitizes the land acquisition lifecycle (Survey → Legal
Verification → Compensation → Rehabilitation → Approvals → Possession), gives each
department its own update workspace, and rolls those updates up into a weighted
progress score, GIS-mapped dashboard, and automatic bottleneck/dependency alerts for
senior officers.

## Contributor

Aaditya Singh ([Aadityasingh0709](https://github.com/Aadityasingh0709))

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
             risk/delay/bottleneck detection, dependency alerts)
frontend/    Vite + React app (dashboard, project list/detail, department update
             form, alerts, GIS map)
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

Open http://localhost:5173. Confirm the API and database are ready at
http://localhost:5000/api/health.

## Running components separately

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates departments + demo users + 2 demo projects
npm run dev                 # http://localhost:5000
```

Seeded logins (password for all demo accounts: `password123`):
- `admin@landacquisition.gov.in` — Administrator
- `senior@landacquisition.gov.in` — Senior Officer (dashboard, alerts, all projects)
- `survey@landacquisition.gov.in` — Survey Officer
- `legal@landacquisition.gov.in` — Legal Verification Officer
- `compensation@landacquisition.gov.in` — Compensation Officer
- `rehabilitation@landacquisition.gov.in` — Rehabilitation Officer
- `approvals@landacquisition.gov.in` — Approvals Officer
- `possession@landacquisition.gov.in` — Possession Officer

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

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

## API reference

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/projects` | Authenticated (filters: `state`, `department`, `status`, `search`) |
| GET | `/api/projects/:id` | Authenticated |
| POST | `/api/projects` | Administrator, ProjectManager |
| PATCH | `/api/projects/:id/departments/:deptId` | DepartmentOfficer, Administrator |
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
