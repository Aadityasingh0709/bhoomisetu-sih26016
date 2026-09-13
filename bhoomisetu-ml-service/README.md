# BhoomiSetu AI Recommendation Microservice

A dedicated **Flask + KNN** microservice that helps departmental officers, senior officers, and system administrators resolve land acquisition bottlenecks by finding similar historical precedent cases and prescribing actionable, statutory resolution directives.

## Architecture

```
BhoomiSetu Backend (Node.js:5000)
    └── aiRecommendationService.js
            ├── POST http://localhost:5001/suggest   ← get precedent recommendations & action checklists
            ├── POST http://localhost:5001/learn     ← self-learning (auto-called when an alert is resolved)
            └── GET  http://localhost:5001/stats     ← model health & dataset metrics
```

## How the Semantic KNN Engine Works

| Pipeline Step | Description |
|---|---|
| **Problem Feature Vector** | Unigrams + Bigrams TF-IDF vectorization with English stop-words filtering and sublinear term frequency over department + issue type + problem description (`cause`). |
| **Domain Alignment** | Maps queries across the 6 existing statutory departments: `Survey`, `Legal Verification`, `Compensation`, `Rehabilitation`, `Approvals`, `Possession`. |
| **Distance Metric** | Cosine distance across the TF-IDF feature space (`scikit-learn NearestNeighbors`). |
| **Strict Out-of-Vocabulary / Gibberish Detection** | If an unrecognized problem (e.g. `jguigubuguj`) is submitted, the model identifies zero vocabulary overlap (`nnz == 0`) and returns `0% Match` (`is_low_confidence: true`) with helpful guidance instead of hallucinating. |
| **Directive Synthesis** | Automatically extracts actionable steps directly from the highest-matching precedent resolution, attaches the governing statutory reference (RFCTLARR Act, Forest Conservation Act), and estimates turnaround duration. |

## Start the Server

```bat
cd bhoomisetu-ml-service
start.bat
```

Or run directly with Python 3.13:
```bat
C:\Users\HP\AppData\Local\Programs\Python\Python313\python.exe app.py
```

Server runs on **http://localhost:5001**

## API Reference

### `POST /suggest`
Get top-K similar precedent cases and synthesized resolution directives.
```json
{
  "department": "Survey",
  "issue_type": "Boundary Dispute",
  "issue_description": "Survey boundary overlap between Khasra 45 and 46 causing demarcation conflict with adjoining landholders",
  "severity": "System Failure",
  "urgency": "High",
  "is_overdue": false,
  "k": 5
}
```

**Response:**
```json
{
  "recommendation": {
    "headline": "Directive: Resolution Protocol for Boundary Dispute",
    "confidence_score": 93.3,
    "is_low_confidence": false,
    "statutory_precedent": "RFCTLARR Act 2013 & State Survey and Land Records Demarcation Manual",
    "estimated_turnaround_days": "7-11 Days",
    "steps": [
      "Conducted joint DGPS survey with Revenue Inspector and Village Patwari",
      "Erected permanent RCC boundary pillars at verified coordinates",
      "Updated digitized Khasra map in state GIS portal",
      "Issue resolved in 12 days"
    ],
    "resolution_template": "DIRECTIVE: Directive: Resolution Protocol for Boundary Dispute..."
  },
  "suggestions": [
    {
      "case_id": "LA_001",
      "similarity": 93.3,
      "department": "Survey & Land Records",
      "issue_type": "Boundary Dispute",
      "cause": "Survey boundary overlap between Khasra 45 and 46...",
      "resolution_action": "Conducted joint DGPS survey with Revenue Inspector and Village Patwari..."
    }
  ]
}
```

### `POST /chat`
Conversational follow-up assistant answering next steps, responsible authorities, statutory turnaround SLAs, and required documentation.
```json
{
  "message": "what should be our next step",
  "department": "Compensation & Award",
  "issue_type": "Bottleneck",
  "issue_description": "Compensation stage backlog: 32 pending cases with actual progress at 43%...",
  "current_recommendation": {
    "headline": "Directive: Resolution Protocol for Payment Disbursement Failure",
    "steps": [
      "Conduct initial joint inter-departmental site verification and record Panchnama.",
      "Verify land parcel demarcation against Cadastral/GIS maps and official Revenue records."
    ],
    "estimated_turnaround_days": "5-7 Days",
    "statutory_precedent": "RFCTLARR Act 2013 Section 26-30 & PFMS Guidelines"
  }
}
```

**Response:**
```json
{
  "reply": "**Immediate Action Protocol for Compensation & Award:**\n\n👉 **Step 1 (Immediate Next Step):**\nConduct initial joint inter-departmental site verification and record Panchnama.\n\n👉 **Step 2 (Sequential Milestone):**\nVerify land parcel demarcation against Cadastral/GIS maps and official Revenue records.\n\n⏱ **Target Turnaround:** 5-7 Days\n📜 **Statutory Mandate:** RFCTLARR Act 2013 Section 26-30 & PFMS Guidelines",
  "is_conversational": true,
  "recommendation": { ... }
}
```

### `POST /learn`
Add a single newly resolved case (called automatically by the backend when an officer or admin marks an alert resolved).
```json
{
  "task_group": "Survey",
  "task_type": "Boundary Demarcation",
  "cause": "Overlap in boundary coordinates during joint DGPS survey",
  "task_type_original": "Demarcated boundaries using DGPS rover with Village Patwari and signed Panchnama",
  "urgency_level": "High",
  "safety_classification": "System Failure"
}
```

### `GET /health`
Returns model loading status and total precedent count.

### `GET /stats`
Returns department distribution, issue categories, and training timestamp.
