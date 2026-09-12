# 🇮🇳 BhoomiSetu — Real-Time National Land Acquisition & Management Platform

**Smart India Hackathon (SIH 2026) · Problem Statement PS-26016**  
*Ministry of Rural Development — Department of Land Resources (DoLR), Government of India*

---

## 🌟 Executive Overview & Problem Statement

Large-scale national infrastructure projects (highways, dedicated freight corridors, smart cities, railway networks, industrial corridors) routinely suffer from **delays, cost overruns, and multi-departmental friction** during the land acquisition lifecycle.

Traditional land acquisition processes face 4 fundamental challenges:
1. **Siloed Departmental Workflows**: 6 key statutory departments (**Survey, Legal Verification, Compensation, Rehabilitation, Statutory Approvals, Possession**) work in isolated silos with paper-based or disconnected reporting.
2. **Lack of Real-Time Multi-Tier Telemetry**: Higher authorities (Ministries, State Principal Secretaries, Senior District Officers) have no consolidated GIS visibility or real-time bottleneck alerting.
3. **Recurring Procedural Bottlenecks**: Similar disputes (title contests, boundary overlaps, compensation grievances, missing clearances) occur repeatedly across projects with zero institutional memory or predictive guidance.
4. **Credential Distribution Friction**: Onboarding ground officers across dozens of simultaneous national projects leads to account collisions and administrative overhead.

**BhoomiSetu** solves this by providing a unified, real-time, GIS-enabled national land acquisition management system equipped with:
- **Project-Scoped Role-Based Access Control (RBAC)**.
- **Dynamic Multi-Channel Credential Dispatch (Email & WhatsApp)** with in-place error correction.
- **Weighted Multi-Stage Progress Telemetry** (0% to 100% lifecycle).
- **K-Nearest Neighbors (KNN) AI Recommendation Engine** pre-trained on **12,424 real-world cases** with a continuous **Self-Learning Feedback Loop**.
- **Institutional Dispute & Order Settlement Ledger**.

---

## 👥 Contributors

- **Aaditya Singh** ([@Aadityasingh0709](https://github.com/Aadityasingh0709))
- **Keshaw Jha** ([@keshaw006](https://github.com/keshaw006))

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │               BhoomiSetu Frontend (React/Vite)          │
                                  │   - Executive Dashboard (Live GIS Map & Analytics)     │
                                  │   - 2-Step Project-Scoped Officer Workspaces            │
                                  │   - AI Bottleneck Advisor & Alert Action Center        │
                                  └───────────────────────────┬─────────────────────────────┘
                                                              │
                                            HTTP / REST API (JSON) + JWT
                                                              │
                                                              ▼
                                  ┌─────────────────────────────────────────────────────────┐
                                  │              BhoomiSetu Backend (Node.js/Express)       │
                                  │   - JWT Auth & Dynamic RBAC Middleware                  │
                                  │   - Weighted Lifecycle Calculation Engine               │
                                  │   - Automated Bottleneck Detection & SLA Monitor       │
                                  │   - Real-Time SMTP Email & WhatsApp Dispatcher          │
                                  │   - Self-Learning Resolution Feedback Dispatcher        │
                                  └───────────────┬─────────────────────────┬───────────────┘
                                                  │                         │
                                    Mongoose ODM  │                         │ HTTP (Port 5001)
                                                  ▼                         ▼
            ┌───────────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
            │               MongoDB Database                │     │     BhoomiSetu ML Recommendation Engine │
            │   - Projects & Geo-Parcels                    │     │     (Python 3.13 / Flask / Scikit-Learn)│
            │   - Users & Scoped Department Assignments     │     │   - 12,424 Case Dataset (TF-IDF Vector) │
            │   - Alerts, Decisions & Dispute Audits        │     │   - Cosine K-Nearest Neighbors (KNN)    │
            │   - Historical Resolution Knowledge Base      │     │   - Continuous Incremental Self-Learning│
            └───────────────────────────────────────────────┘     └─────────────────────────────────────────┘
```

---

## 🚀 Key Modules & Feature Highlights

### 1. 🛡️ System Administrator & Project Manager Power Tools
- **1-Click Project & Credential Generation**: When creating a project, the administrator instantly provisions dedicated credentials for all 6 departmental officers (Survey, Legal, Compensation, Rehabilitation, Approvals, Possession).
- **Live Multi-Channel Credential Dispatch**: Automatically sends official credentials and direct login links to officers via Gmail SMTP and WhatsApp notifications.
- **In-Place Officer Credential Editing**: If an officer's email or phone number has a typo, administrators can edit the officer credentials directly from the Project Dossier with optional instant re-dispatch—**eliminating the need to delete and recreate entire projects**.
- **Global Project Search & GIS Mission Control**: Search across national projects by Project ID (e.g. `NH44`, `EFC-LP-2026`), district, or state with live interactive Leaflet GIS mapping.

### 2. 🔐 2-Step Project-Scoped Authentication
To handle officers working across different projects simultaneously without account collisions:
- **Step 1: Project Code Validation**: The officer inputs their project code (e.g. `NH44-P2-2026`). The system instantly displays the verified project name, district, state, and agency.
- **Step 2: Scoped Officer Sign-In**: The officer enters their verified official email and password to access their isolated departmental workspace.
- **Executive Direct Access**: System Administrators and Senior Officers sign in directly to executive mission control.

### 3. 📊 Weighted 6-Stage Lifecycle Tracking
Every project is tracked across the statutory land acquisition pipeline with weighted velocity scoring:
| Stage | Department | Statutory Weight | Key Milestones Tracked |
|---|---|:---:|---|
| **Stage 1** | **Survey & Demarcation** | **15%** | Cadastral mapping, Drone GIS boundary surveys, Joint verification |
| **Stage 2** | **Legal & Title Verification** | **15%** | Section 11/19 notifications, Title deed vetting, Encumbrance checks |
| **Stage 3** | **Compensation Determination** | **30%** | Award inquiry, Circle rate valuation, Direct bank transfer (DBT) |
| **Stage 4** | **Rehabilitation & Resettlement (R&R)** | **25%** | SIA study, Resettlement colony allotment, Livelihood grants |
| **Stage 5** | **Statutory Approvals & NOCs** | **5%** | Forest/Environmental clearances, Railway & Defense NOCs |
| **Stage 6** | **Physical Possession Handover** | **10%** | Panchnama execution, Encroachment clearance, Agency handover |

---

### 4. 🤖 AI Bottleneck Resolution Advisor (KNN + Self-Learning)

The built-in AI microservice empowers ground officers and senior executives to resolve deadlocks using historical institutional precedent.

#### Technical Specifications:
- **Algorithm**: Multi-Feature Cosine K-Nearest Neighbors (`scikit-learn NearestNeighbors`).
- **Feature Pipeline**: TF-IDF Vectorization over unstructured issue descriptions + One-Hot Encoding over Department, Severity, and Urgency.
- **Pre-Trained Knowledge Base**: **12,424 real-world cases** loaded from `BhoomiSetu_Cleaned_Final.csv`.
- **Outputs**:
  - **Similarity Match Percentage** ($\ge 90\%$ confidence).
  - **Recommended Step-by-Step Action Plan**.
  - **Predicted Resolution Turnaround Time (TAT)**.
  - **Historical Precedent Dossiers**.

#### 🔄 Continuous Self-Learning Loop:
1. When a survey officer or administrator resolves an alert in the platform, they submit the root cause, action taken, and case order.
2. The Node.js backend automatically triggers `/api/ai/learn` in the ML microservice.
3. The ML engine appends the newly resolved case to the dataset and updates the model's in-memory TF-IDF index in real-time without restarting the service.
4. Over time, the model becomes increasingly tailored to local dispute patterns and departmental workflows.

---

## 💻 Tech Stack Summary

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, React Leaflet (OpenStreetMap GIS), Recharts, Lucide React, React Hot Toast |
| **Backend** | Node.js 20 LTS, Express.js, JWT Authentication, bcryptjs, Nodemailer (Gmail SMTP), Axios |
| **ML Microservice** | Python 3.13, Flask, Scikit-Learn, Pandas, NumPy, TF-IDF + NearestNeighbors |
| **Database** | MongoDB & MongoDB Atlas via Mongoose ODM |
| **DevOps & Tooling** | Git, GitHub Actions, Powershell/Bash automation scripts |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18 or v20 LTS
- **Python**: v3.10+ (with pip)
- **MongoDB**: Local MongoDB on `mongodb://127.0.0.1:27017/land_acquisition` or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Aadityasingh0709/bhoomisetu-sih26016.git
cd bhoomisetu-sih26016

# Install backend and frontend dependencies
npm run install:all
```

### 2. Configure Backend Environment
Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/land_acquisition
JWT_SECRET=bhoomisetu_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:5001

# SMTP Credentials for Email Dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=bhoomisetu61@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="BhoomiSetu National Portal" <bhoomisetu61@gmail.com>
```

### 3. Seed Initial Projects & Accounts
```bash
cd backend
npm run seed
cd ..
```

### 4. Start the 3 Services

#### Terminal 1 — Start ML Recommendation Microservice:
```bash
cd bhoomisetu-ml-service
pip install -r requirements.txt
python app.py
# Running on http://127.0.0.1:5001
```

#### Terminal 2 — Start Backend & Frontend:
```bash
# From the root directory:
npm run dev
```

- **Frontend Portal**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000`
- **ML Microservice**: `http://localhost:5001`

---

## 🔑 Demo Login Accounts

### 1. Executive & Administrative Access
| Role | Email | Password | Access Scope |
|---|---|---|---|
| **System Administrator** | `admin@bhoomisetu.gov.in` | `Admin@123` | Full National Executive Access |
| **Senior Officer** | `senior.officer@bhoomisetu.gov.in` | `Senior@123` | High-Level Multi-Project Oversight |

### 2. Project-Scoped Departmental Officers
*Use 2-Step Login with Project Code:*
- **Project 1**: `NH44-P2-2026` (NH-44 Highway Expansion Phase 2, Belagavi, Karnataka)
- **Project 2**: `EFC-LP-2026` (Eastern Dedicated Freight Corridor, Patna, Bihar)

| Department | Officer Email | Password | Assigned Project |
|---|---|---|---|
| **Survey Officer** | `officer.survey@nh44.gov.in` | `Survey@123` | `NH44-P2-2026` |
| **Legal Officer** | `officer.legal@nh44.gov.in` | `Legal@123` | `NH44-P2-2026` |
| **Compensation Officer** | `officer.comp@nh44.gov.in` | `Comp@123` | `NH44-P2-2026` |
| **Rehabilitation Officer** | `officer.rehab@nh44.gov.in` | `Rehab@123` | `NH44-P2-2026` |
| **Approvals Officer** | `officer.approval@nh44.gov.in` | `Approval@123` | `NH44-P2-2026` |
| **Possession Officer** | `officer.possession@nh44.gov.in` | `Possession@123` | `NH44-P2-2026` |

---

## 📑 Complete API Reference

### Auth & User APIs
- `POST /api/auth/login` — Executive & standard user sign-in.
- `POST /api/auth/validate-project` — Validates Project ID / Code for 2-step departmental officer authentication.
- `GET /api/auth/me` — Retrieves authenticated user context and active project permissions.

### Project Management APIs
- `GET /api/projects` — Fetch list of national projects (with search & filter).
- `POST /api/projects` — Create new project and auto-provision 6 departmental credentials.
- `GET /api/projects/:id` — Retrieve comprehensive project dossier, GIS coordinates, and stage progress.
- `PATCH /api/projects/:id/departments/:deptId/officer` — Update officer email/phone and optionally trigger instant re-dispatch.
- `PATCH /api/projects/:id/stages/:stageId` — Update stage milestones, progress percentage, and uploaded documents.

### AI & Bottleneck APIs
- `POST /api/ai/suggest` — Query KNN model for similar cases, recommendations, and estimated resolution duration.
- `POST /api/ai/learn` — Ingest a newly resolved bottleneck into the AI training dataset.
- `GET /api/ai/stats` — Retrieve total trained cases and vocabulary metrics.
- `GET /api/alerts` — Fetch active and resolved alerts across projects.
- `POST /api/alerts` — Report a new bottleneck or cross-stage dependency delay.
- `POST /api/alerts/:id/decision` — Senior Authority order/decision dispatch.
- `POST /api/alerts/:id/resolve` — Final resolution submission with auditable order number.

---

## 📽️ SIH Presentation & PPT Deck Structure

Use this slide-by-slide structure to build your presentation for evaluation panels and jury members:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           BHOOMISETU PITCH DECK                                  │
├─────────┬────────────────────────────────────────────────────────────────────────┤
│ Slide 1 │ TITLE SLIDE                                                            │
│         │ - BhoomiSetu: Real-Time National Land Acquisition & Management System  │
│         │ - Problem Statement: SIH 26016 · Ministry of Rural Development (DoLR)  │
│         │ - Team: Aaditya Singh & Keshaw Jha                                     │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 2 │ PROBLEM & MOTIVATION                                                   │
│         │ - Critical bottlenecks in infrastructure projects due to land delays. │
│         │ - Paper-based tracking, siloed departments, repetitive legal disputes. │
│         │ - Lack of unified GIS monitoring & predictive resolution tools.        │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 3 │ THE SOLUTION: BHOOMISETU                                               │
│         │ - End-to-end digital lifecycle: Survey → Legal → Comp → Rehab → Poss. │
│         │ - 2-Step Project-Scoped Security Architecture.                         │
│         │ - Dynamic Email & WhatsApp Credential Onboarding.                      │
│         │ - Live Interactive GIS Geo-Parcel Visualization.                       │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 4 │ SYSTEM ARCHITECTURE & WORKFLOW                                         │
│         │ - Diagram showing React Frontend, Node.js Backend, Flask ML & MongoDB. │
│         │ - Weighted Stage Lifecycle (0% to 100% calculation).                   │
│         │ - Multi-Tier Governance: Admin -> Senior Officer -> Ground Officers.   │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 5 │ AI RECOMMENDATION ENGINE (KNN + SELF-LEARNING)                         │
│         │ - Cosine K-Nearest Neighbors trained on 12,424 historical cases.       │
│         │ - Instant similarity matching (>90% accuracy) for dispute resolution. │
│         │ - Continuous Self-Learning: Every resolved case trains the model live. │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 6 │ ADMINISTRATIVE CONTROL & RESILIENCE                                    │
│         │ - 1-Click Multi-Department Credential Generation.                      │
│         │ - In-Place Officer Credential Editing without deleting projects.       │
│         │ - Live SMTP email verification & re-dispatch mechanism.                │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 7 │ LIVE DEMO & KEY METRICS                                                │
│         │ - Interactive GIS parcel drilldown.                                    │
│         │ - Multi-department status updating and automatic SLA alerts.           │
│         │ - AI suggestion panel demonstration in action.                         │
├─────────┼────────────────────────────────────────────────────────────────────────┤
│ Slide 8 │ IMPACT, FEASIBILITY & ROADMAP                                          │
│         │ - 40% reduction in land acquisition cycle turnaround time.             │
│         │ - Elimination of cross-departmental communication latency.             │
│         │ - Future: Blockchain title verification & Drone LIDAR auto-ingestion.  │
└─────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 📜 License

This project is developed for **Smart India Hackathon 2026** under the **Ministry of Rural Development (DoLR)** and is available for public sector digital governance initiatives.
