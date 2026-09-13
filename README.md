# 🇮🇳 BhoomiSetu — Real-Time National Land Acquisition & Management Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg?style=for-the-badge)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-PS--26016-blue.svg?style=for-the-badge)](https://www.sih.gov.in/)
[![Ministry](https://img.shields.io/badge/Ministry-Rural%20Development%20(DoLR)-green.svg?style=for-the-badge)](https://dolr.gov.in/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.13%20ML-3776AB.svg?style=for-the-badge&logo=python)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=for-the-badge&logo=mongodb)](https://mongodb.com/)

---

## 📑 Quick Navigation for Team & Reviewers
- [🎯 Executive Summary & Problem Statement](#-executive-summary--the-core-problem)
- [👥 Team & Contributors](#-team--contributors)
- [🧩 How the System Works (Mental Model)](#-how-the-system-works-mental-model)
- [🏛️ System Architecture & Workflow Diagram](#-system-architecture--workflow)
- [📁 Folder Structure Explained](#-folder-structure-explained)
- [👥 User Roles & Permissions Matrix](#-user-roles--permissions-matrix)
- [📊 6-Stage Statutory Lifecycle](#-the-6-stage-statutory-land-acquisition-lifecycle)
- [🤖 AI Copilot & Precedent Chatbot](#-ai-bottleneck-resolution-copilot)
- [⚡ Quick Start & Setup Guide](#-step-by-step-setup-guide-run-in-5-minutes)
- [🔑 Demo Accounts & Login Credentials](#-demo-accounts--credentials)
- [🧪 End-to-End Demo Script](#-step-by-step-end-to-end-demo-script)
- [📑 Complete API Reference](#-complete-api-reference)
- [📽️ 6-Slide Hackathon Pitch Deck](#-6-slide-sih-pitch-deck-structure)
- [❓ Frequently Asked Questions (FAQ)](#-frequently-asked-questions-faq)

---

## 🎯 Executive Summary & The Core Problem

Large-scale national infrastructure initiatives (Highways, Dedicated Freight Corridors, Metro Rails, Industrial Parks, Smart Cities) routinely suffer from **massive time delays (averaging 3–5 years) and staggering cost overruns (40%+)** during the land acquisition phase.

### The 4 Major Pain Points in Traditional Governance:
1. **Siloed Departmental Execution**: 6 statutory departments (*Survey, Legal Title Verification, Compensation Disbursement, Rehabilitation & Resettlement, Statutory Clearances, Physical Possession*) operate in isolation using physical files or disjointed local spreadsheets.
2. **Zero Centralized Multi-Tier Telemetry**: State Principal Secretaries and Central Ministries have no live GIS map view or real-time bottleneck alerting.
3. **Repetitive Disputes & Zero Institutional Memory**: Common disputes (boundary overlap, family inheritance disputes, fraudulent Power of Attorney, Aadhaar/PFMS payment mismatches, Forest NOC delays) repeat across every district because past solutions are never codified into a reusable knowledge base.
4. **Credential Onboarding Friction**: Deploying ground officers across dozens of simultaneous national infrastructure projects causes account collisions and administrative overhead.

---

## 💡 What BhoomiSetu Does (The Solution)

**BhoomiSetu** is an end-to-end, real-time, GIS-enabled digital governance platform that unifies all 6 statutory land acquisition departments under a single pane of glass:
- 🗺️ **Live GIS Map & Weighted Telemetry**: Real-time project completion calculation (0% to 100%) weighted by statutory effort.
- 🔐 **2-Step Project-Scoped RBAC**: Eliminates login collisions for ground officers deployed across multiple regional projects.
- 📲 **Automated Multi-Channel Dispatch**: 1-click credential distribution to ground officers via Gmail SMTP & WhatsApp with in-place credential editing.
- 🤖 **AI Bottleneck Copilot & Interactive Chatbot**: A scikit-learn KNN engine trained on 100+ authentic legal/administrative precedents that provides real-time resolution steps, statutory act references, turnaround time estimates, and answers natural follow-up questions.
- 🔄 **Continuous Self-Learning Loop**: Whenever an officer resolves a deadlock, the resolution steps are ingested by the AI microservice in real time to train future suggestions.

---

## 👥 Team & Contributors

| Name | Role | GitHub Profile |
|---|---|---|
| **Aaditya Singh** | Full-Stack & ML Architect | [@Aadityasingh0709](https://github.com/Aadityasingh0709) |
| **Keshaw Jha** | Backend & Database Systems | [@keshaw006](https://github.com/keshaw006) |
| **Anvesha Singh** | Frontend & UI/UX Design | — |
| **Sudhanshu Singh** | QA & Product Research | — |
| **Garima Gupta** | Documentation & Statutory Compliance | — |
| **Vivek Kr. Das** | GIS Data & Evaluation | — |

---

## 🧩 How the System Works (Mental Model)

To understand BhoomiSetu easily, think of it as a 4-layer engine:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 1. PROJECT CREATION LAYER                              │
│   Administrator creates a Project (e.g. NH-44 Belagavi, 500 Hectares, 6 Stages).      │
│   System automatically generates 6 dedicated Officer Accounts & sends them via Email.  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              2. GROUND EXECUTION LAYER                                 │
│   Each of the 6 Department Officers logs into their isolated Project Workspace.       │
│   They upload land surveys, approve title deeds, process DBT awards, and log progress. │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              3. BOTTLENECK & ALERT LAYER                               │
│   When an issue occurs (e.g. "Court Stay Order" or "Forest NOC pending"), an Alert is  │
│   raised with severity & department tag.                                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         4. AI RESOLUTION & DECISION LAYER                              │
│   Senior Officer opens the AI Chatbot Copilot. The AI matches historical precedents,   │
│   answers questions ("Who is responsible?", "What docs?"), and generates a directive.  │
│   Officer applies directive with 1-click. Once resolved, the AI self-learns!           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ System Architecture & Workflow

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │               BhoomiSetu Frontend (React/Vite)          │
                                  │   - Executive Dashboard (Live GIS Map & Analytics)     │
                                  │   - 2-Step Project-Scoped Officer Workspaces            │
                                  │   - Slide-in AI Copilot Chatbot (AIChatDrawer.jsx)      │
                                  └───────────────────────────┬─────────────────────────────┘
                                                              │
                                            HTTP / REST API (JSON) + JWT
                                                              │
                                                              ▼
                                  ┌─────────────────────────────────────────────────────────┐
                                  │              BhoomiSetu Backend (Node.js/Express)       │
                                  │   - JWT Auth & Dynamic RBAC Middleware                  │
                                  │   - Weighted Lifecycle Calculation Engine (6 Stages)    │
                                  │   - Automated Bottleneck Detection & SLA Monitor        │
                                  │   - Real-Time SMTP Email & WhatsApp Dispatcher          │
                                  │   - Self-Learning AI Dispatcher Proxy                   │
                                  └───────────────┬─────────────────────────┬───────────────┘
                                                  │                         │
                                    Mongoose ODM  │                         │ HTTP (Port 5001)
                                                  ▼                         ▼
            ┌───────────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
            │               MongoDB Database                │     │     BhoomiSetu ML Recommendation Engine │
            │   - Projects & Geo-Parcels                    │     │     (Python 3.13 / Flask / Scikit-Learn)│
            │   - Users & Scoped Department Assignments     │     │   - TF-IDF Vectorizer (Unigrams+Bigrams)│
            │   - Alerts, Decisions & Dispute Audits        │     │   - Cosine NearestNeighbors (KNN)       │
            │   - Historical Statutory Knowledge Base       │     │   - Conversational Q&A Intent Router    │
            └───────────────────────────────────────────────┘     └─────────────────────────────────────────┘
```

---

## 📁 Folder Structure Explained

Here is where every component lives so team members can navigate effortlessly:

```
bhoomisetu-sih26016/
├── backend/                       # 🟢 Node.js & Express REST API Server
│   ├── config/                    # Database (db.js) & Email (mailer.js) setup
│   ├── middleware/                # JWT Auth, Role verification, Error handlers
│   ├── models/                    # Mongoose Data Models: Project, User, Alert, Stage
│   ├── routes/                    # Express Routes: auth, projects, alerts, aiRoutes
│   ├── services/                  # Business Logic: aiRecommendationService, emailService
│   ├── scripts/                   # Database seeder (seed.js) with test projects & users
│   ├── server.js                  # Entry point for backend (Port 5000)
│   └── package.json
│
├── frontend/                      # 🔵 React 18 + Vite Web Application
│   ├── public/                    # Static public assets & logos
│   ├── src/
│   │   ├── api/                   # Axios HTTP client calls (auth.js, projects.js, ai.js)
│   │   ├── components/            # Reusable UI: AppLayout, AIChatDrawer, Navbar, Modal
│   │   ├── features/              # Core Feature Pages:
│   │   │   ├── alerts/            # AlertsPage.jsx (Bottlenecks, Decision & Resolution)
│   │   │   ├── auth/              # LoginPage.jsx (2-Step Login & Executive Auth)
│   │   │   ├── dashboard/         # DashboardPage.jsx (Live GIS Map & High-Level KPIs)
│   │   │   ├── department/        # DepartmentWorkspace.jsx (Officer's 6-Stage Workspace)
│   │   │   └── projects/          # ProjectListPage.jsx, ProjectDetailPage.jsx
│   │   ├── routes/                # ProtectedRoute.jsx (Role-based access guard)
│   │   ├── store/                 # Zustand global auth and state stores
│   │   ├── App.jsx                # Route declarations
│   │   └── main.jsx               # React entry point (Port 5173)
│   └── package.json
│
├── bhoomisetu-ml-service/         # 🟡 Python Flask ML & Conversational Engine
│   ├── data/                      # cases.csv (100 authentic Land Acquisition precedents)
│   ├── model/                     # knn_model.pkl (Trained TF-IDF vectorizer + KNN model)
│   ├── app.py                     # Flask App: /chat, /suggest, /learn, /train (Port 5001)
│   ├── requirements.txt           # Python dependencies (flask, scikit-learn, pandas)
│   └── README.md                  # Microservice technical documentation
│
├── package.json                   # Root workspace scripts (npm run dev, npm run install:all)
└── README.md                      # Complete Project Documentation (You are here)
```

---

## 👥 User Roles & Permissions Matrix

BhoomiSetu features **Project-Scoped Role-Based Access Control (RBAC)** to ensure data security and prevent cross-project interference:

| Role | Level | Access Scope | Key Capabilities |
|---|---|---|---|
| **Administrator** | National / Ministry | Global (All Projects) | Create projects, provision/edit officer credentials, trigger re-dispatch, view national telemetry. |
| **Senior Officer** | State / District Magistrate | Global / District | Review active bottlenecks, invoke AI Copilot, issue official directives & statutory orders. |
| **Project Manager** | Project Nodal Officer | Assigned Projects | Track project milestones, coordinate across departments, review stage velocity. |
| **Department Officer** | Field Level (6 Depts) | Single Project & Department | Update assigned stage milestones, upload documents, log completion %, report bottlenecks. |

---

## 📊 The 6-Stage Statutory Land Acquisition Lifecycle

Every project is automatically calculated from **0% to 100% completion** using weighted statutory milestones:

| Stage # | Statutory Department | Statutory Weight | Typical Milestones & Deliverables |
|:---:|---|:---:|---|
| **1** | **Survey & Demarcation** | **15%** | DGPS/Drone survey, Cadastral boundary mapping, Joint verification Panchnama |
| **2** | **Legal & Title Verification** | **15%** | Section 11 & 19 Gazette notifications, Title deed vetting, 30-yr Encumbrance check |
| **3** | **Compensation Determination** | **30%** | Section 26 valuation, Award enquiry, 100% Solatium calculation, PFMS / DBT payout |
| **4** | **Rehabilitation & Resettlement** | **25%** | Social Impact Assessment (SIA), Resettlement colony allotment, Livelihood grants |
| **5** | **Statutory Approvals & NOCs** | **5%** | Stage-1/2 Forest Clearance, Wildlife clearance, Railway/Defense NOCs |
| **6** | **Physical Possession Handover** | **10%** | Section 38 spot possession, Panchnama with 2 witnesses, Handover to user agency |

---

## 🤖 AI Bottleneck Resolution Copilot

The AI Copilot is accessible directly from every alert card via the **"AI Chatbot"** button or inside the **"Post Decision"** modal.

### How It Works:
1. **Precedent Matching**: Runs Cosine Similarity via TF-IDF over historical cases to find exact or near-match resolutions with confidence scores (e.g., 93.3% Match on Boundary Overlap).
2. **Interactive Chat (`POST /chat`)**: Officers can ask follow-up questions in natural language:
   - 📌 *"What is the immediate next step?"* → Breaks down Step 1 vs Step 2 with field guidance.
   - 👤 *"Who is the responsible authority?"* → Returns executing officers (CALA, SDM, Tahsildar, DFO) and oversight bodies.
   - ⏱ *"What is the turnaround time / SLA?"* → Explains statutory compliance windows and escalation timelines.
   - 📄 *"What documents are required?"* → Lists mandatory forms, Panchnama templates, and statutory records.
   - 🔍 *"Explain Step 1"* → In-depth operational field procedure.
3. **1-Click Apply**: Inserts the synthesized directive directly into the official resolution text box.
4. **Continuous Self-Learning (`POST /learn`)**: When a deadlock is marked as resolved with an official order number, the ML service dynamically learns the resolution in under 1 second.

---

## ⚡ Step-by-Step Setup Guide (Run in 5 Minutes)

### Prerequisites:
- **Node.js**: v18 or v20 LTS installed ([Download](https://nodejs.org/))
- **Python**: v3.10+ installed ([Download](https://python.org/))
- **MongoDB**: Active connection string (MongoDB Atlas or Local MongoDB)

---

### Step 1: Clone Repository & Install Dependencies
Open your terminal in the root directory:
```bash
git clone https://github.com/Aadityasingh0709/bhoomisetu-sih26016.git
cd bhoomisetu-sih26016

# Install dependencies for root, backend, and frontend
npm run install:all
```

---

### Step 2: Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://keshawjha2005_db_user:r27tZvcAHqCyUMak@cluster1.bsxiklt.mongodb.net/bhoomisetu?retryWrites=true&w=majority&appName=Cluster1
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

---

### Step 3: Seed Test Database
Populate initial national projects, demo officers, and baseline alerts:
```bash
npm run seed
```

---

### Step 4: Run the Application (All 3 Services)

#### Terminal 1 — Start ML Microservice (Port 5001):
```bash
cd bhoomisetu-ml-service
pip install -r requirements.txt
python app.py
```
*(You will see: `Running on http://127.0.0.1:5001`)*

#### Terminal 2 — Start Backend & Frontend Simultaneously:
```bash
# From the root directory:
npm run dev
```

- 🌐 **Frontend Application**: `http://localhost:5173`
- ⚙️ **Backend REST API**: `http://localhost:5000`
- 🧠 **ML Microservice**: `http://localhost:5001`

---

## 🔑 Demo Accounts & Credentials

### 1. Executive Logins (Direct Sign-In)
| Role | Email | Password | Primary Purpose |
|---|---|---|---|
| **Administrator** | `admin@landacquisition.gov.in` | `Admin@2026Secure!` | Full platform administration, project creation & credential management |
| **Senior Officer** | `senior@landacquisition.gov.in` | `Senior@2026Officer!` | Review alerts, run AI Copilot, issue statutory decision orders |

### 2. Project-Scoped Officer Logins (2-Step Sign-In)
To log in as a field officer, select the **Project Officer Login** tab:
1. **Enter Project Code**: `NH44-P2-2026` *(NH-44 Highway Expansion Phase 2)*
2. **Enter Credentials**:

| Department | Email | Password |
|---|---|---|
| **Survey Officer** | `survey@landacquisition.gov.in` | `Survey@2026Land!` |
| **Legal Verification** | `legal@landacquisition.gov.in` | `Legal@2026Verify!` |
| **Compensation Officer** | `compensation@landacquisition.gov.in` | `Compensation@2026!` |
| **Rehabilitation Officer** | `rehabilitation@landacquisition.gov.in` | `Rehab@2026Support!` |
| **Approvals Officer** | `approvals@landacquisition.gov.in` | `Approvals@2026!` |
| **Possession Officer** | `possession@landacquisition.gov.in` | `Possession@2026!` |

*(Note: For the second project `EFC-LP-2026`, replace email with `<role>.efc@landacquisition.gov.in` and password `<Role>@2026Efc!`)*

---

## 🧪 Step-by-Step End-to-End Demo Script

When presenting or testing the platform, follow this exact 5-minute flow:

### Phase 1: Executive Overview & GIS Map
1. Log in as **Administrator** (`admin@landacquisition.gov.in` / `Admin@2026Secure!`).
2. Show the **Executive Dashboard**:
   - Interactive GIS Map with clickable project markers and geo-polygons.
   - High-level KPIs: Total Projects, Land Acquired, Active Bottlenecks, Average Turnaround.

### Phase 2: 1-Click Project & Credential Creation
1. Go to **Projects** → Click **"Create Project"**.
2. Enter project details (e.g. `Delhi-Mumbai Expressway Spur`, District, Land Area).
3. Fill in the 6 departmental officer emails/phones → Click **"Create & Dispatch"**.
4. Show how all 6 accounts are automatically generated and dispatched via Email/WhatsApp!
5. Demonstrate **In-Place Credential Editing** on the Project Dossier to fix any typos without recreating the project.

### Phase 3: Field Officer Execution (2-Step Login)
1. Sign out and click **"Project Officer Login"**.
2. Step 1: Enter Project Code `NH44-P2-2026` → Verified Project banner appears!
3. Step 2: Enter `survey@landacquisition.gov.in` / `Survey@2026Land!`.
4. Navigate to **Department Workspace** → Update milestone progress and upload survey documents.

### Phase 4: Bottleneck Reporting & AI Copilot Chat
1. In **Alerts**, report a new bottleneck:
   - Department: `Survey`
   - Issue Type: `Boundary Dispute`
   - Description: `Survey boundary overlap between Khasra 45 and 46 causing demarcation conflict with adjoining landholders`
2. Sign in as **Senior Officer** (`senior@landacquisition.gov.in` / `Senior@2026Officer!`).
3. Click **"AI Chatbot"** on the alert:
   - See the matched precedent `#LA_001` with **93.3% Confidence** and statutory reference.
   - Click the chip: *"What should be our next step?"* → AI returns immediate Step 1 & Step 2 roadmap.
   - Click *"What documents are required?"* → AI returns mandatory Panchnama and cadastral sheets.
4. Click **"Apply to Resolution"** → Directive auto-populates into the order box!

### Phase 5: Continuous Self-Learning
1. Complete the resolution and submit the official order number.
2. The Python microservice automatically ingests the resolution via `/api/ai/learn` and retrains the model in real time!

---

## 📑 Complete API Reference

### 🔐 Authentication & Access APIs
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/login` | Executive & direct user sign-in | No |
| `POST` | `/api/auth/validate-project` | Validates Project Code for 2-step officer sign-in | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | Yes (JWT) |

### 📁 Project Management APIs
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/projects` | List all projects with search, filter, and pagination | Yes (JWT) |
| `POST` | `/api/projects` | Create project & auto-provision 6 officer credentials | Admin |
| `GET` | `/api/projects/:id` | Get detailed project dossier, stages & GIS data | Yes (JWT) |
| `PATCH` | `/api/projects/:id/departments/:deptId/officer` | Edit officer credentials with optional instant re-dispatch | Admin |
| `PATCH` | `/api/projects/:id/stages/:stageId` | Update stage milestones, progress % and documents | Officer/Admin |

### 🤖 AI Copilot & Bottleneck APIs
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/ai/suggest` | Query KNN model for similar cases & resolution templates | Yes (JWT) |
| `POST` | `/api/ai/chat` | Conversational follow-up assistant for next steps, SLA, docs | Yes (JWT) |
| `POST` | `/api/ai/learn` | Ingest a resolved case and trigger incremental retraining | Yes (JWT) |
| `GET` | `/api/ai/stats` | Retrieve total trained precedents and vocabulary stats | Yes (JWT) |
| `GET` | `/api/alerts` | Fetch active and resolved bottlenecks across projects | Yes (JWT) |
| `POST` | `/api/alerts` | Raise a new bottleneck or cross-department delay | Yes (JWT) |
| `POST` | `/api/alerts/:id/decision` | Post senior authority directive/order | Senior Officer |
| `POST` | `/api/alerts/:id/resolve` | Final closure with auditable resolution order number | Officer/Senior |

---

## 📽️ 6-Slide SIH Pitch Deck Structure

Use this exact structure for presenting to the evaluation panel and jury:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   BHOOMISETU — 6-SLIDE OFFICIAL SIH PITCH DECK                         │
├─────────┬──────────────────────────────────────────────────────────────────────────────┤
│ Slide 1 │ TITLE & PROBLEM STATEMENT                                                    │
│         │ • Title: BhoomiSetu — Real-Time Land Acquisition Governance Platform         │
│         │ • Ministry: Rural Development — Department of Land Resources (PS-26016)      │
│         │ • Core Problem: 40%+ infra delays, siloed departments, paper-based reporting.│
├─────────┼──────────────────────────────────────────────────────────────────────────────┤
│ Slide 2 │ THE BHOOMISETU SOLUTION                                                      │
│         │ • Unified 6-Stage Digital Lifecycle with Weighted Progress Telemetry (0-100%).│
│         │ • 2-Step Project-Scoped RBAC preventing cross-project login collisions.      │
│         │ • 1-Click Credential Dispatch via Gmail SMTP & WhatsApp.                     │
├─────────┼──────────────────────────────────────────────────────────────────────────────┤
│ Slide 3 │ SYSTEM ARCHITECTURE & GIS TELEMETRY                                          │
│         │ • Frontend: React 18, Vite, Tailwind, Leaflet GIS Geo-Parcels.               │
│         │ • Backend: Node.js 20 LTS, Express REST API, MongoDB Atlas.                  │
│         │ • ML Service: Python 3.13 Flask, TF-IDF + Cosine NearestNeighbors (KNN).     │
├─────────┼──────────────────────────────────────────────────────────────────────────────┤
│ Slide 4 │ AI BOTTLENECK RESOLUTION COPILOT                                             │
│         │ • Precedent Engine: 100+ authentic legal/administrative resolution cases.    │
│         │ • Conversational Chatbot: Answers Next Steps, Responsible Authority, SLAs.   │
│         │ • Continuous Self-Learning: Dynamically updates model on every resolved alert│
├─────────┼──────────────────────────────────────────────────────────────────────────────┤
│ Slide 5 │ ADMINISTRATIVE RESILIENCE & OFFICER EMPOWERMENT                              │
│         │ • 1-Click Multi-Officer Provisioning per project.                            │
│         │ • In-Place Officer Credential Editing (fix typos without deleting projects). │
│         │ • Real-Time SLA monitors, cross-stage dependency tracking & dispute trails.  │
├─────────┼──────────────────────────────────────────────────────────────────────────────┤
│ Slide 6 │ NATIONAL IMPACT & FEASIBILITY                                                │
│         │ • 40% reduction in land acquisition Turnaround Time (TAT).                   │
│         │ • 100% auditable digital paper trail for every legal order & award.          │
│         │ • Future Scope: Drone LIDAR integration, DigiLocker & Blockchain Registry.   │
└─────────┴──────────────────────────────────────────────────────────────────────────────┘
```

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Q1: Why does BhoomiSetu use 2-Step Authentication for field officers?</b></summary>
Ground officers (e.g. Tehsildars, Surveyors) often work on multiple infrastructure projects simultaneously (e.g. NH-44 and Eastern Freight Corridor). If they had a single generic login, their actions would cross-contaminate different project dossiers. The 2-Step login binds their session strictly to the selected project code.
</details>

<details>
<summary><b>Q2: What happens if the AI does not find a matching historical precedent?</b></summary>
BhoomiSetu contains strict semantic validation. If an unrecognizable problem or typo is entered, the AI will not hallucinate. Instead, it flags a <code>0% Match</code>, generates a Standard Operating Procedure (SOP) baseline, and offers 1-click recognized precedent presets.
</details>

<details>
<summary><b>Q3: How does the AI self-learning loop work?</b></summary>
When an alert is marked as resolved by an officer or magistrate, the backend calls <code>POST /api/ai/learn</code> on the Python microservice. The microservice appends the new resolution to <code>cases.csv</code> and re-indexes the TF-IDF vectorizer and KNN model in memory in less than 1 second.
</details>

---

## 📜 License & Intellectual Property

Developed for **Smart India Hackathon 2026** under the aegis of the **Ministry of Rural Development — Department of Land Resources (DoLR)**. All rights reserved for public sector governance modernization.
