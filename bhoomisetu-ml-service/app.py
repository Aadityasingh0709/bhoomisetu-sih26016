import io
import logging
import pickle
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from scipy.sparse import hstack, csr_matrix

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("bhoomisetu-ml")
app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "cases.csv"
MODEL_PATH = BASE_DIR / "model" / "knn_model.pkl"
DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

# Global model state
STATE = {
    "knn": None,
    "df": None,
    "tfidf_issue": None,
    "tfidf_resolution": None,
    "le_task_group": None,
    "le_safety_classification": None,
    "le_urgency_level": None,
    "scaler": None,
    "trained_at": None,
    "total_cases": 0,
}

# ---------------------------------------------------------------------------
# Column Mapping (CSV → BhoomiSetu concepts)
# ---------------------------------------------------------------------------
# task_group            → Department   (Safety / Quality / Site Management)
# task_type             → Issue Severity / Category
# cause                 → Bottleneck sub-category  
# safety_classification → Resolution Classification (Behavioural / System Failure)
# task_type_original    → Resolution action taken (what we recommend)
# ---------------------------------------------------------------------------


def clean_df(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    text_cols = [
        "task_group", "task_type", "cause",
        "safety_classification", "urgency_level", "task_type_original"
    ]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].fillna("Not Specified").astype(str).str.strip()
    num_cols = [
        "description_length", "has_comments", "has_documents",
        "overdue_label", "days_since_dataset_start"
    ]
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def build_features(df: pd.DataFrame, fit: bool = True):
    issue_text = (
        df["task_type"].str.lower()
        + " " + df["cause"].str.lower()
        + " " + df["task_group"].str.lower()
    )
    res_text = df["task_type_original"].str.lower()

    if fit:
        STATE["tfidf_issue"] = TfidfVectorizer(
            max_features=500, ngram_range=(1, 2), sublinear_tf=True
        )
        STATE["tfidf_resolution"] = TfidfVectorizer(
            max_features=300, ngram_range=(1, 2), sublinear_tf=True
        )
        Xi = STATE["tfidf_issue"].fit_transform(issue_text)
        Xr = STATE["tfidf_resolution"].fit_transform(res_text)
    else:
        Xi = STATE["tfidf_issue"].transform(issue_text)
        Xr = STATE["tfidf_resolution"].transform(res_text)

    cat_parts = []
    for col in ["task_group", "safety_classification", "urgency_level"]:
        key = "le_" + col
        if fit:
            le = LabelEncoder()
            enc = le.fit_transform(df[col].astype(str))
            STATE[key] = le
        else:
            le = STATE[key]
            known = set(le.classes_)
            safe = df[col].astype(str).apply(
                lambda x: x if x in known else le.classes_[0]
            )
            enc = le.transform(safe)
        cat_parts.append(csr_matrix(enc.reshape(-1, 1)))

    num_cols = [
        "description_length", "has_comments", "has_documents",
        "overdue_label", "days_since_dataset_start"
    ]
    avail = [c for c in num_cols if c in df.columns]
    Xn = df[avail].values.astype(float)
    if fit:
        STATE["scaler"] = StandardScaler()
        Xn = STATE["scaler"].fit_transform(Xn)
    else:
        Xn = STATE["scaler"].transform(Xn)

    return hstack([Xi, Xr] + cat_parts + [csr_matrix(Xn)])


def train_model(df: pd.DataFrame) -> dict:
    df = clean_df(df)
    df = df.dropna(subset=["task_type", "cause", "task_type_original"])
    df = df[df["task_type_original"].str.len() > 2].reset_index(drop=True)
    logger.info("Training KNN on %d cases", len(df))

    X = build_features(df, fit=True)
    knn = NearestNeighbors(
        n_neighbors=min(10, len(df)),
        metric="cosine",
        algorithm="brute",
        n_jobs=-1,
    )
    knn.fit(X)

    now = datetime.utcnow().isoformat()
    STATE.update({
        "knn": knn,
        "df": df,
        "trained_at": now,
        "total_cases": len(df),
    })

    # Persist
    save_payload = {k: STATE[k] for k in STATE}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(save_payload, f)

    logger.info("Model saved: %d cases → %s", len(df), MODEL_PATH)
    return {"total_cases": len(df), "trained_at": now}


def load_model() -> bool:
    if not MODEL_PATH.exists():
        return False
    try:
        with open(MODEL_PATH, "rb") as f:
            saved = pickle.load(f)
        STATE.update(saved)
        logger.info("Model loaded: %s cases", saved.get("total_cases", "?"))
        return True
    except Exception as exc:
        logger.error("Load failed: %s", exc)
        return False


def auto_train():
    if STATE["knn"] or not DATA_PATH.exists():
        return
    try:
        logger.info("Auto-training from %s", DATA_PATH)
        train_model(pd.read_csv(DATA_PATH, low_memory=False))
    except Exception as exc:
        logger.error("Auto-train failed: %s", exc)


def get_suggestions(query: dict, k: int = 5) -> list:
    if not STATE["knn"]:
        return []
    desc = query.get("issue_description", "Not Specified")
    qdf = pd.DataFrame([{
        "task_group": query.get("department", "Safety"),
        "task_type": query.get("issue_type", "General Issue"),
        "cause": desc,
        "safety_classification": query.get("severity", "Not Applicable"),
        "urgency_level": query.get("urgency", "Not Specified"),
        "task_type_original": desc,
        "description_length": len(desc),
        "has_comments": 0,
        "has_documents": 0,
        "overdue_label": 1 if query.get("is_overdue") else 0,
        "days_since_dataset_start": query.get("days_elapsed", 0),
    }])
    qdf = clean_df(qdf)
    Xq = build_features(qdf, fit=False)
    n = min(k, STATE["total_cases"])
    dists, idxs = STATE["knn"].kneighbors(Xq, n_neighbors=n)
    df = STATE["df"]
    results = []
    for d, i in zip(dists[0], idxs[0]):
        row = df.iloc[i]
        results.append({
            "case_id": str(row.get("unique_task_id", i)),
            "similarity": round(float(1 - d) * 100, 1),
            "department": str(row.get("task_group", "")),
            "issue_type": str(row.get("task_type", "")),
            "cause": str(row.get("cause", "")),
            "classification": str(row.get("safety_classification", "")),
            "resolution_action": str(row.get("task_type_original", "")),
            "urgency": str(row.get("urgency_level", "")),
            "was_overdue": bool(int(row.get("overdue_label", 0))),
            "had_comments": bool(int(row.get("has_comments", 0))),
        })
    return sorted(results, key=lambda x: x["similarity"], reverse=True)


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": STATE["knn"] is not None,
        "total_cases": STATE["total_cases"],
        "trained_at": STATE["trained_at"],
    })


@app.route("/suggest", methods=["POST"])
def suggest():
    """
    POST /suggest
    {
      "department": "Safety",
      "issue_type": "General Issue",
      "issue_description": "Workers not wearing PPE near scaffolding",
      "severity": "Behavioural Failure",
      "urgency": "High",
      "is_overdue": false,
      "days_elapsed": 45,
      "k": 5
    }
    """
    if not STATE["knn"]:
        return jsonify({"error": "Model not trained yet. POST CSV to /train first."}), 503
    body = request.get_json(force=True, silent=True) or {}
    k = min(int(body.get("k", 5)), 10)
    suggestions = get_suggestions(body, k=k)
    return jsonify({
        "query": body,
        "total_cases_in_model": STATE["total_cases"],
        "k": k,
        "suggestions": suggestions,
    })


@app.route("/train", methods=["POST"])
def train_endpoint():
    """
    POST /train  — Upload CSV file or JSON records to retrain.
    Self-learning: merges with existing data before retraining.
    """
    df_new = None
    if "file" in request.files:
        try:
            df_new = pd.read_csv(
                io.BytesIO(request.files["file"].read()), low_memory=False
            )
        except Exception as exc:
            return jsonify({"error": str(exc)}), 400
    elif request.is_json:
        recs = (request.get_json(force=True, silent=True) or {}).get("records", [])
        if not recs:
            return jsonify({"error": "No records provided"}), 400
        df_new = pd.DataFrame(recs)
    else:
        return jsonify({"error": "Send a CSV file or JSON records"}), 400

    existing = STATE["df"]
    df_merged = (
        pd.concat([existing, df_new], ignore_index=True)
        if existing is not None
        else df_new
    )
    if "unique_task_id" in df_merged.columns:
        df_merged = df_merged.drop_duplicates(subset=["unique_task_id"])

    try:
        df_merged.to_csv(DATA_PATH, index=False)
    except Exception:
        pass

    r = train_model(df_merged)
    return jsonify({
        "success": True,
        "total_cases": r["total_cases"],
        "trained_at": r["trained_at"],
    })


@app.route("/learn", methods=["POST"])
def learn():
    """
    POST /learn — Add a single resolved bottleneck case.
    Called by BhoomiSetu backend when a resolution is saved.
    {
      "task_group": "Safety",
      "task_type": "General Issue",
      "cause": "PPE non-compliance near scaffold zone",
      "safety_classification": "Behavioural Failure",
      "urgency_level": "High",
      "task_type_original": "Mandatory PPE audit + site warning notices issued",
      "description_length": 55,
      "has_comments": 1,
      "has_documents": 1,
      "overdue_label": 0,
      "days_since_dataset_start": 500
    }
    """
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("task_type_original"):
        return jsonify({"error": "task_type_original (resolution) is required"}), 400

    df_new = pd.DataFrame([body])
    df_merged = (
        pd.concat([STATE["df"], df_new], ignore_index=True)
        if STATE["df"] is not None
        else df_new
    )
    try:
        df_merged.to_csv(DATA_PATH, index=False)
    except Exception:
        pass

    r = train_model(df_merged)
    return jsonify({
        "success": True,
        "message": "Case learned. Model updated.",
        "total_cases": r["total_cases"],
    })


@app.route("/stats")
def stats():
    if STATE["df"] is None:
        return jsonify({"error": "No model loaded"}), 503
    df = STATE["df"]
    return jsonify({
        "total_cases": STATE["total_cases"],
        "trained_at": STATE["trained_at"],
        "departments": (
            df["task_group"].value_counts().to_dict()
            if "task_group" in df else {}
        ),
        "issue_types": (
            df["task_type"].value_counts().head(20).to_dict()
            if "task_type" in df else {}
        ),
        "classifications": (
            df["safety_classification"].value_counts().to_dict()
            if "safety_classification" in df else {}
        ),
    })


if __name__ == "__main__":
    logger.info("Starting BhoomiSetu AI Recommender on port 5001")
    if not load_model():
        auto_train()
    app.run(host="0.0.0.0", port=5001, debug=False)
