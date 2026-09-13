/**
 * BhoomiSetu AI Recommendation Service
 * Calls the Python KNN microservice (port 5001).
 *
 * getSuggestions(query)        — find similar past cases
 * learnFromResolution(res)     — self-learning when a resolution is saved
 * getModelStats()              — health + distribution info
 */

import axios from "axios";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

/**
 * Get AI suggestions for a bottleneck/issue.
 * @param {Object} query
 * @param {string} query.department         e.g. "Safety"
 * @param {string} query.issue_type         e.g. "General Issue"
 * @param {string} query.issue_description  Free-text description
 * @param {string} [query.severity]         "Behavioural Failure" | "System Failure"
 * @param {string} [query.urgency]          Priority level
 * @param {boolean} [query.is_overdue]
 * @param {number}  [query.k=5]            Number of results
 */
export async function getSuggestions(query) {
  try {
    const { data } = await axios.post(`${ML_URL}/suggest`, query, {
      timeout: 12000,
    });
    return {
      suggestions: data.suggestions || [],
      recommendation: data.recommendation || null,
      total_cases: data.total_cases_in_model || 0,
    };
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.warn("[AI] ML service offline — returning empty suggestions.");
      return { suggestions: [], recommendation: null, total_cases: 0 };
    }
    console.error("[AI] getSuggestions:", err.message);
    return { suggestions: [], recommendation: null, total_cases: 0 };
  }
}

/**
 * Conversational follow-up assistant
 */
export async function chatWithAssistant(payload) {
  try {
    const { data } = await axios.post(`${ML_URL}/chat`, payload, {
      timeout: 15000,
    });
    return data;
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return {
        reply:
          "The Python ML service on port 5001 is currently offline. Please run `python app.py` in `bhoomisetu-ml-service` to re-enable AI guidance.",
        is_conversational: true,
      };
    }
    console.error("[AI] chatWithAssistant:", err.message);
    return {
      reply: "Could not retrieve AI resolution guidance. Please verify the ML service.",
      is_conversational: true,
    };
  }
}

/**
 * Teach the model a newly resolved case (self-learning loop).
 * Call this after an officer saves a resolution.
 * @param {Object} resolution  Mongoose document or plain object
 */
export async function learnFromResolution(resolution) {
  try {
    const payload = {
      task_group: resolution.department || "General",
      task_type:
        resolution.issueType || resolution.IssueDescription || "General Issue",
      cause:
        resolution.IssueDescription ||
        resolution.issueDescription ||
        "Not Specified",
      safety_classification: resolution.severity || "Not Applicable",
      urgency_level: resolution.urgency || "Not Specified",
      task_type_original:
        resolution.ResolutionDetails || resolution.resolutionDetails || "",
      description_length: (
        resolution.IssueDescription ||
        resolution.issueDescription ||
        ""
      ).length,
      has_comments: resolution.comments ? 1 : 0,
      has_documents: resolution.documents ? 1 : 0,
      overdue_label: resolution.isOverdue ? 1 : 0,
      days_since_dataset_start: 0,
    };

    if (!payload.task_type_original) return; // nothing to learn

    await axios.post(`${ML_URL}/learn`, payload, { timeout: 30000 });
    console.log(
      "[AI] Model learned from resolution:",
      payload.task_type.slice(0, 60)
    );
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      console.warn("[AI] ML service offline — skipping self-learning.");
      return;
    }
    console.error("[AI] learnFromResolution:", err.message);
  }
}

/**
 * Get model health + dataset stats
 */
export async function getModelStats() {
  try {
    const [healthRes, statsRes] = await Promise.all([
      axios.get(`${ML_URL}/health`, { timeout: 5000 }),
      axios.get(`${ML_URL}/stats`, { timeout: 5000 }),
    ]);
    return { health: healthRes.data, stats: statsRes.data };
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return { health: { status: "offline", model_loaded: false }, stats: null };
    }
    console.error("[AI] getModelStats:", err.message);
    return { health: { status: "error" }, stats: null };
  }
}
