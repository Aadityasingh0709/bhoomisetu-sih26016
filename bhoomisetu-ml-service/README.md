# BhoomiSetu AI Recommendation Microservice

A lightweight **Flask + KNN** microservice that helps survey officers and admins resolve bottlenecks by finding similar historical cases and suggesting resolution actions.

## Architecture

```
BhoomiSetu Backend (Node.js:5000)
    └── aiRecommendationService.js
            ├── POST http://localhost:5001/suggest   ← get recommendations
            ├── POST http://localhost:5001/learn     ← self-learning (auto-called on new resolution)
            └── GET  http://localhost:5001/stats     ← model health
```

## How the KNN Model Works

| Feature | Role |
|---------|------|
| `task_type` + `cause` + `task_group` | TF-IDF vectorized issue text |
| `task_type_original` | TF-IDF vectorized resolution text |
| `safety_classification`, `urgency_level` | Label-encoded categorical features |
| `description_length`, `overdue_label` | Scaled numerical features |

Similarity is computed using **cosine distance** so it's invariant to text length.

## Start the Server

```bat
cd bhoomisetu-ml-service
start.bat
```

Or directly:
```bat
C:\Users\HP\AppData\Local\Programs\Python\Python313\python.exe app.py
```

Server starts on **http://localhost:5001**

## API Reference

### `POST /suggest`
Get top-K similar past cases for a bottleneck.
```json
{
  "department": "Safety",
  "issue_type": "PPE Violation",
  "issue_description": "Workers not wearing helmets near scaffolding zone",
  "severity": "Behavioural Failure",
  "urgency": "High",
  "is_overdue": false,
  "k": 5
}
```

### `POST /train`
Retrain the model with a new CSV file (self-learning).
```
multipart/form-data  →  file: <csv>
```

### `POST /learn`
Add a single newly resolved case (called automatically by backend).
```json
{
  "task_group": "Safety",
  "task_type": "General Issue",
  "cause": "PPE non-compliance",
  "task_type_original": "PPE audit conducted + warning notices issued",
  ...
}
```

### `GET /health`
Returns model status and case count.

### `GET /stats`
Returns department/issue type distribution of training data.

## Self-Learning Loop

Every time an officer saves a resolution in BhoomiSetu:
1. Backend calls `learnFromResolution(resolution)` 
2. This POSTs the resolved case to `/learn`
3. The model retrains in-place (takes ~2–5 seconds for 12K+ cases)
4. Future `/suggest` calls are smarter with each new resolution
