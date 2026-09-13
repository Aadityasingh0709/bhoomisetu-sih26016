import api from "./axios.js";

/**
 * Get AI-powered KNN suggestions for a bottleneck
 * @param {Object} query - { department, issue_type, issue_description, severity, urgency, k }
 */
export const getAISuggestions = (query) =>
  api.post("/ai/suggest", query).then((r) => r.data);

/**
 * Fetch model health + dataset statistics
 */
export const getAIStats = () => api.get("/ai/stats").then((r) => r.data);

/**
 * Conversational follow-up assistant
 * @param {Object} chatPayload - { message, department, issue_type, issue_description, current_recommendation }
 */
export const chatWithAI = (chatPayload) =>
  api.post("/ai/chat", chatPayload).then((r) => r.data);

